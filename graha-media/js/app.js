/* =========================================================
   app.js — titik mulai aplikasi
   Dimuat paling akhir: menyiapkan data contoh, sinkron antar tab,
   lalu menampilkan halaman pertama.
   ========================================================= */
Store.seed();

/* Sinkron data bila admin dan mahasiswa dibuka di dua tab berbeda */
window.addEventListener('storage', e => {
  if(!e.key || !e.key.startsWith('gm_')) return;
  db.forget(e.key);
  if(/^(pesanan|admin)/.test(S.route) && !S.editing) render(true);
});

window.addEventListener('hashchange', () => render());
document.addEventListener('keydown', e => { if(e.key === 'Escape' && S.editing) App.closeModal(); });

render();
