/* =========================================================
   features/smart-print-check.js — M-12 Smart Print Check
   Memeriksa kelayakan PDF sebelum harga dihitung.
   Hasil berupa indikasi, bukan jaminan.
   ========================================================= */
function majority(arr){ const m = {}; arr.forEach(v => m[v] = (m[v]||0) + 1); return Object.entries(m).sort((a,b) => b[1]-a[1])[0][0]; }

function runChecks(pages, fileState){
  const blockedRow = text => ({ blocked:true, score:0, total:0, rows:[{ key:'file', st:'warn', title:'Kondisi file', text }] });
  if(fileState === 'locked')  return blockedRow('PDF terkunci kata sandi. Simpan ulang tanpa sandi, lalu unggah lagi.');
  if(fileState === 'corrupt') return blockedRow('PDF rusak atau tidak bisa dibaca. Coba ekspor ulang dokumen ke PDF.');

  const size = majority(pages.map(p => p.size)), orient = majority(pages.map(p => p.orient));
  const diffSize = pages.filter(p => p.size !== size), diffOr = pages.filter(p => p.orient !== orient);
  const blank = pages.filter(p => p.blank), edge = pages.filter(p => p.edge && !p.blank);
  const flagged = new Set([...diffSize, ...diffOr, ...blank, ...edge].map(p => p.n));
  const ori = o => o === 'portrait' ? 'portrait (tegak)' : 'landscape (mendatar)';
  const row = (ok, key, title, okText, warnText, list, action) => ok
    ? { key, st:'ok', title, text:okText }
    : { key, st:'warn', title, text:warnText, pages:list, action };

  return {
    blocked:false, size, orient, total:pages.length, score:pages.length - flagged.size,
    rows: [
      { key:'file', st:'ok', title:'Kondisi file', text:'File terbaca normal dan tidak terkunci.' },
      row(!diffSize.length, 'size', 'Ukuran & konsistensi halaman', `Seluruh halaman berukuran ${size}.`, `Mayoritas ${size}; ${diffSize.length} halaman berukuran berbeda.`, diffSize),
      row(!diffOr.length, 'orient', 'Orientasi halaman', `Orientasi konsisten, semua ${ori(orient)}.`, `Sebagian besar ${ori(orient)}; halaman berikut berbeda.`, diffOr),
      row(!blank.length, 'blank', 'Halaman kosong', 'Tidak ada halaman kosong.', `${blank.length} halaman terindikasi kosong.`, blank, 'skip'),
      row(!edge.length, 'edge', 'Margin halaman', 'Tidak ada indikasi konten terlalu dekat tepi.', 'Konten terindikasi terlalu dekat tepi kertas dan berpotensi terpotong.', edge),
      { key:'res', st:'soon', title:'Resolusi gambar', text:'Pemeriksaan gambar pecah hadir di tahap 2.' }
    ]
  };
}

/* Ringkasan untuk disimpan di pesanan (dibaca admin, A-10) */
function checkIssues(f){
  const issues = f.checks.rows.filter(r => r.st === 'warn').map(r => `${r.title}: ${r.pages ? 'hal. ' + r.pages.map(p => p.n).join(', ') + ' — ' : ''}${r.text}`);
  if(f.skipBlank && f.pages.some(p => p.blank)) issues.push('Pelanggan memilih melewati halaman kosong');
  return issues;
}

function scoreRing(score, total){
  const r = 30, c = 2*Math.PI*r, p = total ? score/total : 0;
  return `<svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="${r}" fill="none" stroke="#DCE0E8" stroke-width="7"/><circle cx="36" cy="36" r="${r}" fill="none" stroke="${p === 1 ? '#27363F' : '#6B212C'}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${c*p} ${c}" transform="rotate(-90 36 36)"/></svg>`;
}

/* Tampilan langkah 2 */
function viewCheckStep(){
  const f = S.flow, ch = f.checks, warns = ch.rows.filter(r => r.st === 'warn').length;
  const icon = { ok:I.check, warn:I.alert, soon:I.clock }, lab = { ok:'OK', warn:'Periksa', soon:'Tahap 2' };
  return `<section class="sec"><p class="eyebrow reveal">Langkah 2 · Smart Print Check</p>
    <h1 class="h1 reveal">${ch.blocked ? 'File <em>belum bisa</em> diproses' : 'Pemeriksaan <em>selesai</em>'}</h1>
    <p class="small muted reveal" style="margin-top:4px">Selesai dalam ${(f.analysisMs/1000).toFixed(1).replace('.',',')} detik · target ≤ ${CONFIG.TARGET_SECONDS} detik</p></section>
  <div class="sec" style="padding-top:0"><div class="card reveal">
    <div class="filebox">${I.file}<div><b>${esc(f.file.name)}</b><span class="small muted">${f.file.pages || '?'} halaman · PDF · ${esc(f.file.mb)}</span></div></div>
    ${ch.blocked ? '' : `<div class="score">${scoreRing(ch.score, ch.total)}<div><b>${ch.score}/${ch.total}</b><span class="small muted">halaman tanpa catatan${warns ? ` · ${warns} hal perlu ditinjau` : ''}</span></div></div>`}
    <div data-stagger>${ch.rows.map(r => `<div class="crow ${r.st}"><span class="ic">${icon[r.st]}</span><div style="flex:1">
      <h4>${r.title}</h4><p>${esc(r.text)}</p>
      ${r.pages ? `<div>${r.pages.map(p => `<button class="pl" onclick="App.gotoPage(${p.n})" aria-label="Lihat halaman ${p.n}">hal. ${p.n}</button>`).join('')}</div>` : ''}
      ${r.action === 'skip' ? `<label class="toggle"><input type="checkbox" ${f.skipBlank ? 'checked' : ''} onchange="App.skipBlank(this.checked)"> Lewati halaman kosong saat mencetak</label>` : ''}
    </div><span class="st">${lab[r.st]}</span></div>`).join('')}</div>
    <p class="note mt">Hasil berupa indikasi, bukan jaminan dokumen sempurna.</p>
  </div>
  <div class="row mt reveal" style="gap:10px">
    <button class="btn btn-ghost" style="flex:1" onclick="App.resetFlow()">Ganti file</button>
    <button class="btn btn-berry" style="flex:1.4" ${ch.blocked ? 'disabled' : ''} onclick="App.step(3)">Lanjutkan ${I.right}</button>
  </div></div>`;
}

Object.assign(App, {
  /* Lompat ke halaman tertentu di simulator */
  gotoPage(n){ const f = S.flow; const idx = sides(f).findIndex(s => s.some(p => p.n === n)); f.sheet = Math.max(0, idx); f.step = 3; render(); window.scrollTo(0, 0); },
  skipBlank(v){ S.flow.skipBlank = v; S.flow.sheet = 0; toast(v ? 'Halaman kosong akan dilewati' : 'Halaman kosong tetap dicetak'); }
});
