/* =========================================================
   views/home.js — Beranda (M-02)
   Hero denim + renda, jam ramai, ticker, 3 fitur unggulan,
   produk populer, alur "periksa → simulasikan → optimalkan → cetak"
   ========================================================= */
function viewHome(){
  const popular = ['PRT-001','PRT-002','PRT-003','JLD-001'].map(s => Store.product(s)).filter(p => p && p.is_active);
  const words = ['Periksa','Simulasikan','Optimalkan','Cetak','Jilid','Laminasi','Potong'];
  return phone(`
  <section class="hero denim reveal">
    <div class="lace" id="lace" aria-hidden="true"></div>
    <p class="eyebrow">Print untuk mahasiswa</p>
    <h1>Cetak tugasmu, <em>tanpa tebak-tebakan.</em></h1>
    <p>Unggah PDF, cek kelayakannya, lihat simulasi cetak, dan tahu perkiraan harganya sebelum kirim.</p>
    <a class="btn btn-paper" href="#/pesan">${I.upload} Cetak PDF sekarang</a>
    ${patch(62)}
  </section>
  ${busyInfo()}
  <div class="ticker" id="ticker" aria-hidden="true"><div class="track">${[...words, ...words].map(t => `<span>${t} ✦</span>`).join('')}</div></div>

  <section class="sec">
    <p class="eyebrow reveal">Kenapa Graha Media</p>
    <h2 class="h2 reveal">Dokumenmu dicek <em>sebelum</em> uangmu keluar</h2>
    <div class="folders" data-stagger>
      <div class="folder"><span class="clip">${I.clip}</span><p class="tag">Smart Print Check</p><h3>Periksa kelayakan</h3><p>Halaman kosong, ukuran, orientasi, dan margin dicek otomatis begitu file diunggah.</p></div>
      <div class="folder f2"><span class="clip">${I.clip}</span><p class="tag">Print Preview Simulator</p><h3>Lihat hasilnya dulu</h3><p>Coba ukuran kertas, orientasi, bolak-balik, 2 halaman per lembar, dan posisi jilid.</p></div>
      <div class="folder f3"><span class="clip">${I.clip}</span><p class="tag">Peta Warna Halaman</p><h3>Tahu kenapa harganya segitu</h3><p>Proporsi warna dan biaya tiap halaman terlihat. Pilih halaman mana yang cukup hitam putih.</p></div>
    </div>
  </section>
  <div class="stitch-draw" aria-hidden="true"></div>

  <section class="sec" style="padding-bottom:10px">
    <div class="row between"><h2 class="h2 reveal">Layanan <em>populer</em></h2><a href="#/katalog" class="small" style="font-weight:700;color:var(--berry)">Lihat semua</a></div>
  </section>
  <div class="chips reveal">${CATEGORIES.map(c => `<a class="chip" href="#/katalog" onclick="S.cat='${c.id}'">${c.name}</a>`).join('')}</div>
  <div class="grid" data-stagger>${popular.map(pcard).join('')}</div>

  <section class="sec" style="margin-top:12px">
    <p class="eyebrow reveal">Cara kerja</p>
    <h2 class="h2 reveal">Periksa, simulasikan, <em>optimalkan,</em> cetak</h2>
    <ol class="steps" id="steps"><span class="fill" id="stepsfill"></span>
      <li data-n="1" class="reveal"><b>Unggah PDF</b><span>Dari HP, maksimal ${CONFIG.MAX_MB} MB dan ${CONFIG.MAX_PAGES} halaman.</span></li>
      <li data-n="2" class="reveal"><b>Cek & tinjau peringatan</b><span>Lanjutkan atau ganti file, kamu yang putuskan.</span></li>
      <li data-n="3" class="reveal"><b>Atur & lihat simulasi</b><span>Kertas, orientasi, sisi cetak, jilid, laminasi.</span></li>
      <li data-n="4" class="reveal"><b>Cek Nota Jahit, kirim</b><span>Dapat kartu pesanan, pantau statusnya dari HP.</span></li>
    </ol>
  </section>

  <footer class="foot denim reveal"><div class="lace" aria-hidden="true"></div>
    <p class="logo" style="color:var(--paper)">Graha Media<small style="color:var(--frost)">studio cetak</small></p>
    <p style="margin-top:10px">Harga di website adalah estimasi. Harga akhir dikonfirmasi di toko.</p>
  </footer>`, '');
}
