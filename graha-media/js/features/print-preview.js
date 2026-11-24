/* =========================================================
   features/print-preview.js — M-13 Print Preview Simulator
   Menampilkan halaman di atas kertas virtual sesuai pengaturan:
   ukuran kertas, orientasi, skala, sisi cetak, layout, posisi jilid.
   Pratinjau bersifat ilustratif, bukan rendering mesin cetak.
   ========================================================= */
function sheetSize(c){
  const P = PAPERS[c.paper]; let w = P.w, h = P.h;
  if(c.orient === 'landscape') [w, h] = [h, w];
  return { w, h };
}

function sheetHTML(f){
  const c = f.config, { w, h } = sheetSize(c), ss = sides(f), side = ss[f.sheet] || [];
  const row = w > h;                                  // kertas mendatar → 2 halaman berdampingan
  const pxW = row ? 330 : Math.round(330 * w / h * 1.05);
  const usableW = w * .92;                            // area cetak (margin 4% kiri-kanan)
  const slots = side.map(p => {
    const img = (c.scale === 'actual' && c.layout === 1)
      ? `<img class="actual" src="${p.img}" alt="Halaman ${p.n}" style="width:${(p.wPt*25.4/72)/usableW*100}%">`
      : `<img class="fit" src="${p.img}" alt="Halaman ${p.n}">`;
    return `<div class="slot">${img}<span class="pno">hal. ${p.n}</span></div>`;
  }).join('') + (c.layout === 2 && side.length === 1 ? '<div class="slot"></div>' : '');
  const bind = f.jilid !== 'none' ? `<span class="bind ${c.bind}"></span>` : '';
  return `<div class="sheet ${row ? '' : 'col'}" style="width:${pxW}px;aspect-ratio:${w}/${h}">${bind}${slots || '<div class="slot"><div class="ph"></div></div>'}</div>`;
}

/* Peringatan untuk muka yang sedang ditampilkan */
function simWarnings(f){
  const c = f.config, P = PAPERS[c.paper], { w, h } = sheetSize(c), side = sides(f)[f.sheet] || [], out = [];
  side.forEach(p => {
    const pw = p.wPt*25.4/72, ph = p.hPt*25.4/72;
    if(c.scale === 'actual' && c.layout === 1 && (pw > w*.92+1 || ph > h*.92+1))
      out.push(`Hal. ${p.n} lebih besar dari area cetak ${c.paper}; sebagian konten akan terpotong. Pilih “Sesuaikan halaman”.`);
    else if(p.size !== c.paper && c.scale === 'fit')
      out.push(`Hal. ${p.n} berukuran ${p.size}, akan ${pw*ph > P.w*P.h ? 'diperkecil' : 'diperbesar'} agar pas di ${c.paper}.`);
    if(p.orient !== c.orient && c.layout === 1) out.push(`Hal. ${p.n} ${p.orient}, kertas ${c.orient}. Hasilnya akan mengecil; pertimbangkan ganti orientasi.`);
    if(p.blank) out.push(`Hal. ${p.n} terindikasi kosong.`);
    if(p.edge) out.push(`Hal. ${p.n}: konten mepet tepi, berpotensi terpotong mesin.`);
  });
  if(f.jilid !== 'none' && side.some(p => p.edge)) out.push(`Area jilid (${c.bind === 'left' ? 'kiri' : 'atas'}) bisa menutupi konten yang mepet tepi.`);
  return out;
}

/* Tampilan langkah 3 */
function viewSimStep(){
  const f = S.flow, c = f.config, n = sides(f).length, sh = sheetsPerCopy(f);
  const sideNo = f.sheet + 1, sheetNo = c.duplex ? Math.floor(f.sheet/2) + 1 : sideNo;
  const warns = simWarnings(f);
  const confirmBadge = '<span class="badge b-sim">perlu konfirmasi toko</span>';
  return `<section class="sec" style="padding-bottom:10px">${backBtn(2)}<p class="eyebrow reveal">Langkah 3 · Print Preview Simulator</p><h1 class="h1 reveal">Lihat <em>hasil cetaknya</em></h1></section>
  <div style="padding:0 14px"><div class="simstage pat-gingham reveal">
    ${sheetHTML(f)}
    <div class="simnav"><button onclick="App.sheet(-1)" ${f.sheet <= 0 ? 'disabled' : ''} aria-label="Muka sebelumnya">${I.left}</button>
      <span>Muka ${sideNo}/${n} · Lembar ${sheetNo}${c.duplex ? (f.sheet % 2 ? ' (belakang)' : ' (depan)') : ''}</span>
      <button onclick="App.sheet(1)" ${f.sheet >= n-1 ? 'disabled' : ''} aria-label="Muka berikutnya">${I.right}</button></div>
  </div>
  <p class="note" style="text-align:center;margin-top:8px">Pratinjau ilustratif, bukan rendering mesin cetak.</p></div>
  <div class="sec" style="padding-top:8px">
    ${warns.length ? `<div class="stack" style="gap:8px">${warns.map(w => `<p class="alert">${esc(w)}</p>`).join('')}</div>` : ''}
    <div class="field"><span class="lbl">Ukuran kertas</span>${seg('paper', [['A4','A4'],['F4','F4'],['A3','A3']], c.paper)}</div>
    <div class="field"><span class="lbl">Orientasi</span>${seg('orient', [['portrait','Portrait'],['landscape','Landscape']], c.orient)}</div>
    <div class="field"><span class="lbl">Skala cetak</span>${seg('scale', [['fit','Sesuaikan halaman'],['actual','Ukuran asli']], c.scale)}</div>
    <div class="field"><span class="lbl">Sisi cetak ${confirmBadge}</span>${seg('duplex', [['false','Satu sisi'],['true','Bolak-balik']], c.duplex)}</div>
    <div class="field"><span class="lbl">Layout ${confirmBadge}</span>${seg('layout', [['1','1 hal / lembar'],['2','2 hal / lembar']], c.layout)}</div>
    <div class="field"><span class="lbl">Jilid</span>${seg('jilid', [['none','Tanpa'],['soft','Soft cover'],['spiral','Spiral']], f.jilid)}</div>
    ${f.jilid !== 'none' ? `<div class="field"><span class="lbl">Posisi jilid ${confirmBadge}</span>${seg('bind', [['left','Kiri'],['top','Atas']], c.bind)}</div>` : ''}

    <div class="card mt reveal"><p class="eyebrow">Pengaturan simulasi</p><div class="summary">
      <div><small>Kertas</small><b>${c.paper}</b></div><div><small>Orientasi</small><b>${c.orient === 'portrait' ? 'Portrait' : 'Landscape'}</b></div>
      <div><small>Skala</small><b>${c.scale === 'fit' ? 'Sesuaikan' : 'Ukuran asli'}</b></div><div><small>Sisi</small><b>${c.duplex ? 'Bolak-balik' : 'Satu sisi'}</b></div>
      <div><small>Layout</small><b>${c.layout} hal / lembar</b></div><div><small>Kertas terpakai</small><b>${sh} lembar / salinan</b></div></div></div>

    <div class="field"><span class="lbl">Jumlah salinan</span><div class="qty"><button onclick="App.copies(-1)" aria-label="Kurangi">−</button><output>${f.copies}</output><button onclick="App.copies(1)" aria-label="Tambah">+</button></div></div>
    <div class="field"><span class="lbl">Finishing</span>
      <label class="toggle"><input type="checkbox" ${f.laminasi ? 'checked' : ''} onchange="App.fin('laminasi',this.checked)"> Laminasi (${rp(Store.product('FIN-001').base_price)}/lembar)</label><br>
      <label class="toggle"><input type="checkbox" ${f.potong ? 'checked' : ''} onchange="App.fin('potong',this.checked)"> Potong kertas (${rp(Store.product('FIN-002').base_price)})</label></div>
    <div class="field"><label for="note">Catatan custom</label><textarea id="note" rows="3" placeholder="Mis. warna sampul biru, potong sesuai garis…" oninput="S.flow.note=this.value">${esc(f.note)}</textarea></div>
    <button class="btn btn-berry btn-block mt" onclick="App.step(4)">Lihat Peta Warna & harga ${I.right}</button>
  </div>`;
}

Object.assign(App, {
  /* Ubah satu pengaturan cetak lalu render ulang tanpa animasi masuk */
  cfg(k, v){
    const f = S.flow;
    if(k === 'allBW'){ f.allBW = v === 'true'; return render(true); }
    if(k === 'jilid'){ f.jilid = v; return render(true); }
    if(k === 'duplex') v = v === 'true';
    if(k === 'layout'){ v = +v; f.sheet = 0; }
    if(k === 'paper') f.paperSet = true;
    if(k === 'orient') f.orientSet = true;
    f.config[k] = v; render(true);
  },
  sheet(d){ const f = S.flow, n = sides(f).length; f.sheet = Math.max(0, Math.min(n-1, f.sheet + d)); render(true); },
  copies(d){ const f = S.flow; f.copies = Math.max(1, Math.min(99, f.copies + d)); render(true); },
  fin(k, v){ S.flow[k] = v; }
});
