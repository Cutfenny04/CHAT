/* =========================================================
   views/orders.js — Status pesanan mahasiswa (M-09) + Pesan lagi (M-11)
   Status diperbarui otomatis saat admin mengubahnya (tab lain).
   ========================================================= */
function stitchTrack(o){
  const done = o.status === 'Selesai';
  return `<div class="track3"><span class="n on">${I.check}</span><span class="ln on"><i></i></span><span class="n on">${done ? I.check : ''}</span><span class="ln ${done ? 'on' : ''}"><i></i></span><span class="n ${done ? 'on' : ''}">${done ? I.check : ''}</span></div>
  <div class="tlabels"><span>Terkirim</span><span>Diproses toko</span><span>Selesai</span></div>`;
}

function myOrders(){
  const me = Store.session();
  return Store.orders().filter(o => me && o.email === me.email).sort((a, b) => b.createdAt - a.createdAt);
}

function viewOrders(){
  const list = myOrders();
  return phone(`
  <section class="sec"><p class="eyebrow reveal">Pesanan saya</p><h1 class="h1 reveal">Status <em>pesananmu</em></h1></section>
  <div class="sec stack" style="padding-top:0" data-stagger>
  ${list.length ? list.map(o => `<article class="ocardS">
    <div class="row between"><b class="serif" style="font-size:20px">${o.code}</b>${statusBadge(o.status)}</div>
    <p class="small muted">${esc(o.file.name)} · ${fdate(o.createdAt)}</p>
    <p class="small muted">${o.sidesN} muka · ${o.config.paper} · ${o.copies} salinan · ${finishingText(o.finishing)}</p>
    ${stitchTrack(o)}
    <div class="row between mt" style="flex-wrap:wrap"><span class="price">${rp(o.est.total)} <small class="muted" style="font-weight:500">estimasi</small></span>
      <div class="row" style="gap:8px">
        <button class="btn btn-ghost btn-sm" onclick="App.reorder('${o.code}')">${I.repeat} Pesan lagi</button>
        <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${wa(CONFIG.WA_TOKO, `Halo Graha Media, saya mau tanya pesanan ${o.code} (${o.file.name}).`)}">${I.chat} Tanya</a>
      </div></div>
    ${o.status === 'Selesai' ? `<p class="small mt" style="display:flex;gap:8px;align-items:center">${patch(30, 'done-heart')} Pesanan selesai, bisa diambil di toko.</p>` : ''}
  </article>`).join('') : `<div class="empty">${patch(70)}<h2 class="h2" style="font-size:22px">Belum ada pesanan</h2>
    <p class="muted small" style="margin:6px 0 16px">Pesanan yang kamu kirim akan muncul di sini.</p><a class="btn btn-berry" href="#/pesan">${I.upload} Cetak PDF sekarang</a></div>`}
  </div><p class="note" style="padding:0 18px">Status diperbarui otomatis. Coba ubah status dari panel admin di tab lain.</p>`,
  'pesanan', 'Halo Graha Media, saya mau tanya status pesanan saya.');
}

Object.assign(App, {
  reorder(code){
    const o = Store.order(code); if(!o) return;
    const p = o.product ? Store.product(o.product) : null;
    S.flow = newFlow(p ? p.slug : '', o);
    location.hash = '#/pesan' + (p ? '/' + p.slug : '');
    toast('Pengaturan pesanan disalin');
  }
});

/* Sinkron status: cek tiap 3 detik saat halaman status terbuka */
let ordersSig;
setInterval(() => {
  if(S.route !== 'pesanan' || document.visibilityState !== 'visible') return;
  db.forget('gm_orders');
  const sig = JSON.stringify(myOrders().map(o => o.status));
  if(ordersSig !== undefined && sig !== ordersSig) render(true);
  ordersSig = sig;
}, 3000);
