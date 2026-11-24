/* =========================================================
   features/pdf-analyzer.js — membaca PDF & menganalisis tiap halaman
   - Memakai PDF.js (CDN) untuk me-render halaman ke canvas
   - Menghitung: % tinta, % warna, halaman kosong, konten mepet tepi,
     ukuran & orientasi halaman
   Versi backend: logika yang sama dipindah ke layanan Python
   (PyMuPDF + Pillow/OpenCV).
   ========================================================= */

/* Tebak nama ukuran kertas dari ukuran halaman (point) */
function classifySize(w, h){
  const a = Math.min(w, h), b = Math.max(w, h);
  for(const [name, rw, rh] of SIZE_REF) if(Math.abs(a-rw)/rw < .03 && Math.abs(b-rh)/rh < .03) return name;
  return `${Math.round(a*25.4/72)}×${Math.round(b*25.4/72)} mm`;
}

/* Analisis satu halaman yang sudah di-render ke canvas */
function analyzeCanvas(c, wPt, hPt, n){
  const img = c.toDataURL('image/jpeg', .82);
  // Perkecil ke lebar 100 px agar hitungan piksel cepat
  const sw = 100, sh = Math.max(1, Math.round(c.height * sw / c.width));
  const s = document.createElement('canvas'); s.width = sw; s.height = sh;
  const x = s.getContext('2d', { willReadFrequently:true }); x.drawImage(c, 0, 0, sw, sh);
  const d = x.getImageData(0, 0, sw, sh).data;
  const bx = Math.max(2, Math.round(sw*.035)), by = Math.max(2, Math.round(sh*.035)); // pita tepi 3,5%
  let ink = 0, col = 0, edge = 0, edgeTot = 0;
  for(let y = 0; y < sh; y++) for(let xx = 0; xx < sw; xx++){
    const k = (y*sw + xx) * 4, r = d[k], g = d[k+1], b = d[k+2];
    const mx = Math.max(r,g,b), mn = Math.min(r,g,b);
    const isInk = (r+g+b)/3 < 232 || mx - mn > 30;   // bukan putih
    const isCol = mx - mn > 38 && mx > 40;           // saturasi cukup = berwarna
    const inEdge = xx < bx || xx >= sw-bx || y < by || y >= sh-by;
    if(inEdge) edgeTot++;
    if(isInk){ ink++; if(inEdge) edge++; }
    if(isCol) col++;
  }
  const t = document.createElement('canvas'); t.width = 90; t.height = Math.round(c.height * 90 / c.width);
  t.getContext('2d').drawImage(c, 0, 0, t.width, t.height);
  const tot = sw * sh;
  return {
    n, wPt, hPt, img, thumb: t.toDataURL('image/jpeg', .6),
    inkPct: ink/tot*100, colorPct: col/tot*100,
    blank: ink/tot < .004,               // < 0,4% tinta = terindikasi kosong
    edge: edge/edgeTot > .02,            // > 2% pita tepi bertinta = mepet tepi
    size: classifySize(wPt, hPt), orient: wPt > hPt ? 'landscape' : 'portrait'
  };
}

async function loadPdfJs(){
  if(window.pdfjsLib) return window.pdfjsLib;
  await new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = CONFIG.PDFJS_CDN + 'pdf.min.js';
    s.onload = res; s.onerror = () => rej(new Error('cdn')); document.head.appendChild(s);
  });
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = CONFIG.PDFJS_CDN + 'pdf.worker.min.js';
  return window.pdfjsLib;
}

/* Membaca file PDF. onProgress(done, total, label). Hasil: {meta, pages, fileState} */
async function readPdf(file, onProgress){
  const meta = { name:Security.safeFileName(file.name), mb:(file.size/1048576).toFixed(1).replace('.',',') + ' MB', pages:0 };
  const lib = await loadPdfJs();   // melempar error bila CDN gagal
  let doc;
  try{ doc = await lib.getDocument({ data:new Uint8Array(await file.arrayBuffer()) }).promise; }
  catch(e){ return { meta, pages:[], fileState: e && e.name === 'PasswordException' ? 'locked' : 'corrupt' }; }
  if(doc.numPages > CONFIG.MAX_PAGES) return { meta:{...meta, pages:doc.numPages}, pages:[], fileState:'toolong' };
  meta.pages = doc.numPages;
  const pages = [];
  for(let i = 1; i <= doc.numPages; i++){
    onProgress(i-1, doc.numPages, `Memeriksa halaman ${i} dari ${doc.numPages}…`);
    const page = await doc.getPage(i);
    const v1 = page.getViewport({ scale:1 });
    const vp = page.getViewport({ scale: Math.min(2, 440 / Math.max(v1.width, v1.height) * 1.3) });
    const c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
    const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
    await page.render({ canvasContext:ctx, viewport:vp }).promise;
    pages.push(analyzeCanvas(c, v1.width, v1.height, i));
  }
  return { meta, pages, fileState:'ok' };
}

/* File contoh buatan (tanpa internet): 8 halaman, sengaja berisi
   halaman berwarna, 1 kosong, 1 landscape, 1 teks mepet tepi */
async function makeSamplePdf(onProgress){
  const specs = ['cover','text','text','chart','text','blank','photo','edge'];
  const pages = [];
  for(let i = 0; i < specs.length; i++){
    onProgress(i, specs.length, `Memeriksa halaman ${i+1} dari ${specs.length}…`);
    await sleep(RM ? 0 : 110);
    const t = specs[i], land = t === 'photo', wPt = land ? 842 : 595, hPt = land ? 595 : 842;
    const W = 440, H = Math.round(W*hPt/wPt), c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
    const m = W * .1;
    const lines = (y0, n, color = '#555') => { x.fillStyle = color; for(let k = 0; k < n; k++){ const lw = (W-2*m) * (k%5 === 4 ? .55 : .94 - (k%3)*.05); x.fillRect(m, y0 + k*13, lw, 5); } };
    if(t === 'cover'){ x.fillStyle='#6B212C'; x.fillRect(0,0,W,H*.36); x.fillStyle='#fff'; x.font='bold 30px Georgia'; x.fillText('Materi Kuliah',m,H*.18); x.font='italic 16px Georgia'; x.fillText('Pengantar Sistem Digital',m,H*.25); x.fillStyle='#27363F'; x.fillRect(m,H*.44,W*.25,8); lines(H*.5,8); }
    if(t === 'text'){ x.fillStyle='#27363F'; x.font='bold 18px Georgia'; x.fillText('Bab ' + i, m, m+8); lines(m+28, Math.floor((H-2*m-40)/13)); }
    if(t === 'chart'){ x.fillStyle='#27363F'; x.font='bold 18px Georgia'; x.fillText('Hasil Pengukuran',m,m+8); lines(m+28,6);
      ['#6B212C','#27363F','#B0475A','#685652','#2F6F8F'].forEach((cl,k)=>{ x.fillStyle=cl; const bh=60+k*28; x.fillRect(m+k*58,H*.62-bh,40,bh); }); lines(H*.68,10); }
    if(t === 'photo'){ const g=x.createLinearGradient(0,0,W,H); g.addColorStop(0,'#2F6F8F'); g.addColorStop(.55,'#8EA1AE'); g.addColorStop(1,'#6B212C'); x.fillStyle=g; x.fillRect(m*.6,m*.6,W-m*1.2,H-m*1.2); x.fillStyle='#E8C27A'; x.beginPath(); x.arc(W*.72,H*.32,34,0,7); x.fill(); x.fillStyle='#27363F'; x.beginPath(); x.moveTo(m*.6,H-m*.6); x.lineTo(W*.35,H*.45); x.lineTo(W*.6,H-m*.6); x.fill(); }
    if(t === 'edge'){ x.fillStyle='#333'; for(let k=0; k*13 < H-16; k++) x.fillRect(4, 6+k*13, W-8-(k%4)*30, 5); }
    pages.push(analyzeCanvas(c, wPt, hPt, i+1));
  }
  return { meta:{ name:'Materi_Kuliah_contoh.pdf', pages:specs.length, mb:'file contoh' }, pages, fileState:'ok' };
}
