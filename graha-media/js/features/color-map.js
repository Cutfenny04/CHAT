/* =========================================================
   features/color-map.js — Peta Warna Halaman + Nota Jahit
   Menampilkan proporsi warna & biaya tiap muka, opsi "jadikan
   hitam putih", lalu rincian estimasi harga.
   ========================================================= */
function viewPriceStep(){
  const f = S.flow, ss = sides(f), est = estimate(f), T = Store.tariff();
  const bwTotal = estimate({ ...f, allBW:true }).total, save = est.total - bwTotal;
  const topPrice = Math.max(...T.tiers.map(t => t.price)) * (T.paperFactor[f.config.paper] || 1);
  const colorLine = est.lines.find(l => l.label.startsWith('Cetak warna'));
  return `<section class="sec" style="padding-bottom:8px">${backBtn(3)}<p class="eyebrow reveal">Langkah 4 · Peta Warna Halaman</p><h1 class="h1 reveal">Tahu <em>kenapa</em> harganya segini</h1></section>
  <div class="sec" style="padding-top:0">
    <div class="field" style="margin-top:0"><span class="lbl">Mode warna</span>${seg('allBW', [['false','Otomatis'],['true','Semua hitam putih']], f.allBW)}</div>
    <div class="cmap" data-stagger>${ss.map(side => {
      const r = sideCost(f, side), blank = side.every(p => p.blank), colorAble = side.some(p => p.colorPct >= 1), forced = side.some(p => f.bw[p.n]);
      return `<div class="cside ${blank ? 'k' : r.bw ? '' : 'c'}">
        <span class="tagj">${blank ? 'kosong' : r.bw ? 'H/P' : 'Warna ' + pct(r.pct) + '%'}</span>
        ${!r.bw && r.cost >= topPrice*.74 ? `<span class="hrt" title="Halaman termahal">${heart}</span>` : ''}
        <div class="thumbs">${side.map(p => `<img src="${p.thumb}" alt="Halaman ${p.n}">`).join('')}</div>
        <div class="cost"><span class="pn">hal. ${side.map(p => p.n).join('+')}</span><span>${rp(r.cost)}</span></div>
        ${colorAble && !f.allBW ? `<button class="bwbtn" onclick="App.bwSide('${side.map(p => p.n).join(',')}')">${forced ? 'Kembalikan warna' : 'Jadikan H/P'}</button>` : ''}
      </div>`; }).join('')}</div>
    ${save > 0 && colorLine ? `<div class="insight reveal">${I.spark}<span>${est.colN} muka berwarna menyumbang ${Math.round(colorLine.amount/est.total*100)}% biaya. Jadikan hitam putih untuk hemat hingga <b>${rp(save)}</b>.</span></div>` : ''}
    ${notaHTML(f, est)}
    <button class="btn btn-berry btn-block mt" onclick="App.step(5)">Lanjut ke konfirmasi ${I.right}</button>
  </div>`;
}

function notaHTML(f, est){
  return `<div class="nota" id="nota">
    <h3>Nota Jahit</h3>
    <p class="meta">Estimasi · ${fdate(Date.now())}<br>${esc(f.file.name)} · ${est.sidesN} muka · ${est.sheets} lembar/salinan</p>
    ${est.lines.map(l => `<div class="nline"><span>${esc(l.label)} ${l.status === 'simulasi' ? '<span class="badge b-sim">simulasi</span>' : ''}</span><b>${rp(l.amount)}</b></div><div class="nsub"><span>${esc(l.sub)}</span></div>`).join('')}
    <div class="ntotal"><span style="font-weight:700">Estimasi total</span><b id="total" data-to="${est.total}">${rp(est.total)}</b></div>
    <p class="note" style="margin-top:12px">Estimasi, bukan harga final. Harga akhir dikonfirmasi admin di toko.${est.anySim ? ' Tarif bertanda “simulasi” belum dikonfirmasi toko.' : ''}</p>
  </div>`;
}

Object.assign(App, {
  /* Tandai halaman dalam satu muka sebagai hitam putih (atau kembalikan) */
  bwSide(list){
    const f = S.flow, ns = list.split(',').map(Number), on = !ns.some(n => f.bw[n]);
    ns.forEach(n => { if(on) f.bw[n] = true; else delete f.bw[n]; });
    render(true);
  }
});
