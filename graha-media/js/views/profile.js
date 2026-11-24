/* =========================================================
   views/profile.js — Profil mahasiswa (M-01)
   ========================================================= */
function viewProfile(){
  const me = Store.session(), n = myOrders().length;
  return phone(`<section class="sec"><p class="eyebrow reveal">Profil</p><h1 class="h1 reveal">Halo, <em>${esc(me.name.split(' ')[0])}</em></h1>
    <p class="muted small reveal">${esc(me.email)} · ${n} pesanan</p></section>
  <div class="sec" style="padding-top:0"><div class="card reveal">
    <div class="field" style="margin-top:0"><label for="pn">Nama</label><input class="inp" id="pn" maxlength="60" value="${esc(me.name)}"></div>
    <div class="field"><label for="pwa">No. WhatsApp</label><input class="inp" id="pwa" maxlength="16" inputmode="tel" value="${esc(me.wa)}"></div>
    <button class="btn btn-pine btn-block mt" onclick="App.saveProfile()">Simpan</button></div>
    <button class="btn btn-ghost btn-block mt reveal" onclick="App.logout()">${I.logout} Keluar</button>
    <p class="note mt">Prototype menyimpan akun di browser. Versi backend memakai autentikasi Express + Supabase.</p></div>`, '');
}

Object.assign(App, {
  saveProfile(){
    const c = Security.check({
      name:{ value:$('#pn').value, rule:'name', label:'Nama' },
      wa:{ value:$('#pwa').value.replace(/[\s-]/g, ''), rule:'wa', label:'No. WhatsApp' }
    }, 'profil');
    if(!c.ok){ toast(Object.values(c.errors)[0]); return; }
    Store.updateProfile(c.values);
    toast('Profil disimpan'); render(true);
  }
});
