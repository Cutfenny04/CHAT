/* =========================================================
   core/router.js — routing berbasis hash (#/...) + penjaga login
   Daftar rute:
     #/                beranda          #/katalog        katalog
     #/produk/<slug>   detail produk    #/pesan[/<slug>] alur pesan *
     #/pesanan         status pesanan * #/profil         profil *
     #/masuk           masuk/daftar     #/admin[/katalog|/tarif|/keamanan] panel admin **
   *  butuh login mahasiswa   ** butuh login admin
   ========================================================= */
function resolveView(){
  const h = location.hash.replace(/^#\/?/, ''), [a, b] = h.split('/');
  const changed = h !== S.route; S.route = h;
  const me = Store.session();

  if(a === 'admin'){
    if(!me || me.role !== 'admin') return { admin:true, changed, html:viewAdminLogin() };
    S.editing = changed ? null : S.editing;
    return { admin:true, changed, html: b === 'katalog' ? viewAdminCatalog() : b === 'tarif' ? viewAdminTariff() : b === 'keamanan' ? viewAdminSecurity() : viewAdminOrders() };
  }

  const needLogin = ['pesan','pesanan','profil'].includes(a);
  if(needLogin && (!me || me.role !== 'mahasiswa')){ S.next = h; return { changed, html:viewStudentLogin() }; }
  if(a === 'masuk') return { changed, html: me && me.role === 'mahasiswa' ? viewHome() : viewStudentLogin() };
  if(a === 'katalog') return { changed, html:viewCatalog() };
  if(a === 'produk')  return { changed, html:viewProduct(b) };
  if(a === 'pesanan') return { changed, html:viewOrders() };
  if(a === 'profil')  return { changed, html:viewProfile() };
  if(a === 'pesan'){
    const f = S.flow;
    // Buat alur baru bila belum ada, bila kembali ke #/pesan setelah selesai,
    // atau bila memilih produk lain saat masih di langkah 1
    if(!f || (changed && f.done) || (changed && b && f.step === 1 && !f.loading && !f.reorderOf)) S.flow = newFlow(b);
    return { changed, html:viewFlow() };
  }
  return { changed, html:viewHome() };
}

/* render(true) = perbarui tampilan tanpa mengulang animasi masuk */
function render(instant){
  const { admin, changed, html } = resolveView();
  document.body.className = admin ? 'admin' : 'student';
  $('#dm-s').classList.toggle('on', !admin);
  $('#dm-a').classList.toggle('on', !!admin);
  $('#app').innerHTML = html;
  if(changed) window.scrollTo(0, 0);
  initFx(instant && !changed);
  document.title = admin ? 'Admin · Graha Media' : 'Graha Media — Studio Cetak';
}
