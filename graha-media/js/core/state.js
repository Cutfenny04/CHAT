/* =========================================================
   core/state.js — state tampilan yang sedang aktif
   (bukan data permanen; data permanen ada di store.js)
   ========================================================= */
const S = {
  route: '',          // hash saat ini, mis. "katalog"
  next: '',           // tujuan setelah login
  /* katalog */
  q: '', cat: 'all', sort: 'rel',
  /* alur pesan (lihat views/order-flow.js) */
  flow: null,
  /* admin */
  admView: 'list',            // list | board | busy
  admFilter: 'Belum selesai', // Belum selesai | Selesai | Semua
  admQ: '', admSel: null,
  editing: null               // produk yang sedang diedit di modal
};
window.S = S;
