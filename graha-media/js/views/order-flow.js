/* =========================================================
   views/order-flow.js — alur pemesanan 5 langkah (M-06 s.d. M-08)
   1 Unggah → 2 Smart Print Check → 3 Print Preview Simulator
   → 4 Peta Warna & Nota Jahit → 5 Konfirmasi & kirim
   Tampilan langkah 2–4 ada di folder js/features/.
   ========================================================= */
function newFlow(slug, fromOrder){
  const p = slug ? Store.productBySlug(slug) : null;
  const f = {
    step:1, product:p ? p.sku : null, file:null, pages:[], checks:null, error:'', loading:null,
    config:{ paper:'A4', orient:'portrait', scale:'fit', duplex:false, layout:1, bind:'left' }, sheet:0,
    bw:{}, allBW:false, skipBlank:false, copies:1, jilid:'none', laminasi:false, potong:false,
    note:'', agreed:false, done:null, reorderOf:null
  };
  if(p){ // pilihan awal mengikuti produk yang dipesan
    if(p.size === 'A3' || p.size === 'F4'){ f.config.paper = p.size; f.paperSet = true; }
    if(p.sku === 'PRT-001' || p.sku === 'PRT-004') f.allBW = true;
    if(p.sku === 'JLD-001') f.jilid = 'soft';
    if(p.sku === 'JLD-002') f.jilid = 'spiral';
    if(p.sku === 'FIN-001') f.laminasi = true;
    if(p.sku === 'FIN-002') f.potong = true;
  }
  if(fromOrder){ // M-11 Pesan lagi: salin pengaturan dari pesanan lama
    Object.assign(f.config, fromOrder.config);
    Object.assign(f, { copies:fromOrder.copies, jilid:fromOrder.finishing.jilid, laminasi:fromOrder.finishing.laminasi,
      potong:fromOrder.finishing.potong, note:fromOrder.note, reorderOf:fromOrder.code, paperSet:true, orientSet:true });
  }
  return f;
}

function stepper(step){
  const L = ['Unggah','Periksa','Simulasi','Harga','Kirim'], k = (Math.min(step,5) - 1) / 4;
  return `<div class="stepper" role="list" aria-label="Langkah pemesanan"><span class="prog" style="width:calc(${k*100}% - ${k*24}px)"></span>
    ${L.map((l, i) => `<div class="node ${i+1 < step ? 'done' : i+1 === step ? 'cur' : ''}" role="listitem" ${i+1 === step ? 'aria-current="step"' : ''}><i>${i+1 < step ? '✓' : i+1}</i><span>${l}</span></div>`).join('')}</div>`;
}

function viewFlow(){
  const f = S.flow;
  let body;
  if(f.done) body = flowDone();
  else if(f.loading) body = flowLoading();
  else body = [flowUpload, viewCheckStep, viewSimStep, viewPriceStep, flowConfirm][f.step - 1]();
  const waMsg = f.done ? `Halo Graha Media, saya mau tanya pesanan ${f.done.code}.` : 'Halo Graha Media, saya mau tanya tentang pesanan cetak.';
  return phone(`${f.done ? '' : stepper(f.step)}${body}`, 'pesan', waMsg);
}

/* ---------- Langkah 1: Unggah ---------- */
function flowUpload(){
  const f = S.flow, p = f.product ? Store.product(f.product) : null;
  return `<section class="sec"><p class="eyebrow reveal">Langkah 1</p><h1 class="h1 reveal">Unggah <em>dokumenmu</em></h1>
    <p class="muted reveal" style="margin-top:6px">Format PDF, maksimal ${CONFIG.MAX_MB} MB dan ${CONFIG.MAX_PAGES} halaman. File hanya dipakai untuk pesanan ini.</p></section>
  <div class="sec" style="padding-top:0">
    ${f.reorderOf ? `<p class="alert info reveal" style="margin-bottom:12px">Mengulang pesanan <b>${f.reorderOf}</b>. Pengaturan cetak sudah diisi, tinggal unggah ulang file-nya.</p>` : ''}
    ${p ? `<div class="card reveal" style="display:flex;gap:12px;align-items:center;margin-bottom:14px;padding:12px"><div style="width:64px;border-radius:10px;overflow:hidden">${art(p)}</div><div><p class="small muted">Layanan dipilih</p><b>${esc(p.name)}</b></div></div>` : ''}
    ${f.error ? `<p class="alert reveal" style="margin-bottom:12px">${esc(f.error)}</p>` : ''}
    <label class="drop reveal" id="drop" ondragover="event.preventDefault();this.classList.add('over')" ondragleave="this.classList.remove('over')" ondrop="event.preventDefault();this.classList.remove('over');App.pick(event.dataTransfer.files[0])">
      ${I.upload}<b>Pilih file PDF</b><span class="small muted">Ketuk untuk membuka file, atau seret ke sini</span>
      <input type="file" accept="application/pdf,.pdf" onchange="App.pick(this.files[0])"></label>
    <div class="or">atau</div>
    <button class="btn btn-ghost btn-block reveal" onclick="App.sample()">${I.file} Coba dengan file contoh (8 halaman)</button>
    <p class="note mt reveal">File contoh sengaja berisi halaman kosong, halaman landscape, dan teks mepet tepi agar semua pemeriksaan terlihat.</p>
  </div>`;
}

function flowLoading(){
  const l = S.flow.loading;
  return `<section class="sec"><div class="card loader">
    <div class="needle">${I.needle}</div>
    <p class="eyebrow">Smart Print Check</p><h2 class="h2" style="font-size:22px">Sedang memeriksa <em>dokumenmu</em></h2>
    <div class="bar"><i id="ldbar" style="width:${l.total ? l.done/l.total*100 : 8}%"></i></div>
    <p class="small muted" id="ldtxt">${esc(l.label)}</p></div></section>`;
}

function setProgress(done, total, label){
  S.flow.loading = { done, total, label };
  const b = $('#ldbar'), t = $('#ldtxt');
  if(b){ b.style.width = (total ? done/total*100 : 8) + '%'; t.textContent = label; } else render(true);
}

/* Setelah analisis selesai: jalankan Smart Print Check lalu ke langkah 2 */
function finishAnalysis(result, t0){
  const f = S.flow, { meta, pages, fileState } = result;
  if(fileState === 'toolong'){ f.loading = null; f.error = `Dokumen ${meta.pages} halaman melebihi batas ${CONFIG.MAX_PAGES} halaman. Pisahkan file, atau tanyakan ke toko lewat WhatsApp.`; return render(true); }
  f.file = meta; f.pages = pages; f.checks = runChecks(pages, fileState);
  f.analysisMs = performance.now() - t0; f.loading = null; f.sheet = 0; f.bw = {};
  if(pages.length && !f.orientSet) f.config.orient = f.checks.orient || 'portrait';
  if(pages.length && !f.paperSet && PAPERS[f.checks.size]) f.config.paper = f.checks.size;
  f.step = 2; render();
}

/* ---------- Langkah 5: Konfirmasi ---------- */
function flowConfirm(){
  const f = S.flow, est = estimate(f), me = Store.session(), c = f.config;
  return `<section class="sec" style="padding-bottom:8px">${backBtn(4)}<p class="eyebrow reveal">Langkah 5</p><h1 class="h1 reveal">Periksa & <em>kirim</em></h1></section>
  <div class="sec" style="padding-top:0"><div class="card reveal">
    <div class="filebox">${I.file}<div><b>${esc(f.file.name)}</b><span class="small muted">${est.sidesN} muka · ${est.sheets} lembar × ${f.copies} salinan</span></div></div>
    <div class="summary mt">
      <div><small>Kertas</small><b>${c.paper} · ${c.orient === 'portrait' ? 'Portrait' : 'Landscape'}</b></div>
      <div><small>Cetak</small><b>${c.duplex ? 'Bolak-balik' : 'Satu sisi'} · ${c.layout} hal/lbr</b></div>
      <div><small>Warna</small><b>${est.colN} warna · ${est.bwN} H/P</b></div>
      <div><small>Finishing</small><b>${finishingText(f)}${f.jilid !== 'none' ? ` (${c.bind === 'left' ? 'kiri' : 'atas'})` : ''}</b></div>
    </div>
    ${f.note ? `<p class="small mt"><b>Catatan:</b> ${esc(f.note)}</p>` : ''}
    <div class="ntotal"><span style="font-weight:700">Estimasi total</span><b>${rp(est.total)}</b></div>
  </div>
  <div class="field"><label for="nm">Nama</label><input class="inp" id="nm" maxlength="60" value="${esc(me.name)}"></div>
  <div class="field"><label for="wn">No. WhatsApp</label><input class="inp" id="wn" maxlength="16" inputmode="tel" value="${esc(me.wa)}"></div>
  <label class="toggle mt"><input type="checkbox" id="agree" ${f.agreed ? 'checked' : ''} onchange="App.agree(this.checked)"> Saya paham harga ini estimasi dan bisa berbeda dari harga akhir di toko.</label>
  <button class="btn btn-berry btn-block mt" id="sendbtn" ${f.agreed ? '' : 'disabled'} onclick="App.submit()">Kirim Pesanan</button>
  </div>`;
}

/* ---------- Selesai: Kartu Pesanan berperangko ---------- */
function flowDone(){
  const o = S.flow.done;
  return `<section class="sec" style="text-align:center"><p class="eyebrow reveal">Pesanan terkirim</p><h1 class="h1 reveal">Terima kasih, <em>${esc(o.customer.name.split(' ')[0])}</em></h1>
    <p class="muted small reveal" style="margin-top:6px">Tunjukkan kartu ini di toko, atau simpan sebagai screenshot.</p></section>
  <div style="padding:0 22px"><div class="stamp"><div class="inner">
    <span class="cap">GRAHA<br>MEDIA<br>· ${new Date(o.createdAt).toLocaleDateString('id-ID',{day:'2-digit',month:'short'}).toUpperCase()} ·</span>
    <p class="eyebrow">Kartu pesanan</p>
    <p class="code">${o.code}</p>
    <p class="small">${esc(o.file.name)}<br>${o.sidesN} muka · ${o.config.paper} · ${o.copies} salinan</p>
    <div class="ntotal"><span class="small" style="font-weight:700">Estimasi</span><b style="font-size:24px">${rp(o.est.total)}</b></div>
    <div style="margin-top:12px;text-align:center">${patch(48, 'done-heart')}</div>
  </div></div></div>
  <div class="sec stack">
    <a class="btn btn-berry btn-block" href="#/pesanan">Lihat status pesanan</a>
    <a class="btn btn-ghost btn-block" target="_blank" rel="noopener" href="${wa(CONFIG.WA_TOKO, `Halo Graha Media, saya baru mengirim pesanan ${o.code} (${o.file.name}).`)}">${I.chat} Kabari toko via WhatsApp</a>
    <button class="btn btn-ghost btn-block" onclick="App.resetFlow()">Cetak dokumen lain</button>
  </div>`;
}

Object.assign(App, {
  async pick(file){
    const f = S.flow; if(!file) return;
    f.error = '';
    if(!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf'){ f.error = 'File harus berformat PDF.'; return render(true); }
    if(file.size > CONFIG.MAX_MB*1024*1024){ f.error = `Ukuran file ${(file.size/1048576).toFixed(1).replace('.',',')} MB melebihi batas ${CONFIG.MAX_MB} MB.`; return render(true); }
    // Keamanan: cek isi file benar-benar PDF (bukan hanya ekstensi .pdf)
    if(!(await Security.isRealPdf(file))){ Security.log('File bukan PDF asli ditolak', Security.safeFileName(file.name)); f.error = 'Isi file bukan PDF yang valid. Ekspor ulang dokumen ke PDF.'; return render(true); }
    const t0 = performance.now();
    f.loading = { done:0, total:0, label:'Menyiapkan pembaca PDF…' }; render(true);
    try{ finishAnalysis(await readPdf(file, setProgress), t0); }
    catch(e){
      console.error(e); f.loading = null;
      f.error = e.message === 'cdn' ? 'Pembaca PDF gagal dimuat (butuh koneksi internet). Coba dengan file contoh.' : 'Terjadi kesalahan saat membaca file. Coba lagi.';
      render(true);
    }
  },
  async sample(){
    const t0 = performance.now();
    S.flow.error = ''; S.flow.loading = { done:0, total:8, label:'Memeriksa halaman 1…' }; render(true);
    const result = await makeSamplePdf(setProgress);
    setProgress(8, 8, 'Menyusun hasil pemeriksaan…'); await sleep(RM ? 0 : 200);
    finishAnalysis(result, t0);
  },
  resetFlow(){
    const p = S.flow && S.flow.product ? Store.product(S.flow.product) : null;
    S.flow = newFlow(p ? p.slug : '');
    const target = '#/pesan' + (p ? '/' + p.slug : '');
    if(location.hash !== target) location.hash = target; else render();
  },
  step(n){
    const f = S.flow;
    if(n < 1 || n > 5 || (n > 1 && !f.pages.length)) return;
    if(n === 3 && f.sheet >= sides(f).length) f.sheet = 0;
    f.step = n; render(); window.scrollTo({ top:0, behavior: RM ? 'auto' : 'smooth' });
  },
  agree(v){ S.flow.agreed = v; $('#sendbtn').disabled = !v; },
  submit(){
    if(!requireRole('mahasiswa')) return;
    const f = S.flow, est = estimate(f), me = Store.session();
    const c = Security.check({
      name:{ value:$('#nm').value, rule:'name', label:'Nama' },
      wa:{ value:$('#wn').value.replace(/[\s-]/g, ''), rule:'wa', label:'No. WhatsApp' },
      note:{ value:f.note, max:Security.LIMITS.note, required:false, label:'Catatan' }
    }, 'pesanan');
    if(!c.ok){ toast(Object.values(c.errors)[0]); return; }
    const { name, wa:waNum, note } = c.values;
    Store.updateProfile({ name, wa:waNum });
    const now = Date.now();
    const order = {
      code:Store.nextCode(), createdAt:now, email:me.email, customer:{ name, wa:waNum },
      product:f.product, file:{ name:Security.safeFileName(f.file.name), pages:f.file.pages, mb:f.file.mb },
      config:{ ...f.config }, copies:f.copies, sheets:est.sheets, sidesN:est.sidesN,
      finishing:{ jilid:f.jilid, laminasi:f.laminasi, potong:f.potong }, note,
      est:{ total:est.total, lines:est.lines.map(l => ({ label:l.label, sub:l.sub, amount:l.amount })) },
      color:{ colN:est.colN, bwN:est.bwN, maxPct:est.maxPct },
      check:{ score:f.checks.score, total:f.checks.total, issues:checkIssues(f) },
      thumbs:f.pages.slice(0, 8).map(p => p.thumb), reorderOf:f.reorderOf,
      status:'Belum selesai', history:[{ at:now, status:'Belum selesai', by:'Sistem' }]
    };
    if(!Store.addOrder(order)) return;
    f.done = order; render(); window.scrollTo(0, 0);
  }
});
