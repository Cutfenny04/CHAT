/* =========================================================
   admin/admin-shell.js — kerangka panel admin (sidebar + konten)
   ========================================================= */
function adminShell(active, content){
  const me = Store.session();
  const nav = [['', 'Pesanan', I.receipt], ['katalog', 'Katalog', I.tag], ['tarif', 'Tarif', I.coins], ['keamanan', 'Keamanan', I.shield]];
  return `<div class="adm"><aside class="side denim"><div class="lace" aria-hidden="true"></div>
    <div class="brand">Graha Media<small>panel admin</small></div>
    <nav aria-label="Menu admin">${nav.map(([h, l, i]) => `<a href="#/admin${h ? '/' + h : ''}" class="${active === h ? 'on' : ''}" ${active === h ? 'aria-current="page"' : ''}>${i}<span>${l}</span></a>`).join('')}</nav>
    <button class="lo" onclick="App.logout()">${I.logout}<span>Keluar</span></button>
    <p class="who">Masuk sebagai ${esc(me.name)}<br>Optimal untuk iPad & web</p></aside>
    <main class="main">${content}</main></div>`;
}
const greeting = () => { const h = new Date().getHours(); return h < 11 ? 'pagi' : h < 15 ? 'siang' : h < 18 ? 'sore' : 'malam'; };
