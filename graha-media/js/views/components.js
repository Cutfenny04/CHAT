/* =========================================================
   views/components.js — potongan tampilan yang dipakai ulang
   header, navigasi bawah, tombol WhatsApp, kartu produk, dll.
   ========================================================= */
function header(){
  const me = Store.session();
  return `<header class="hdr" id="hdr">
    <a href="#/" class="logo">Graha Media<small>studio cetak</small></a>
    <div class="hdr-actions">
      <a class="iconbtn" href="#/katalog" aria-label="Cari layanan">${I.search}</a>
      ${me && me.role === 'mahasiswa'
        ? `<a class="iconbtn" href="#/profil" aria-label="Profil ${esc(me.name)}">${I.user}</a>`
        : `<a class="btn btn-pine btn-sm" href="#/masuk">Masuk</a>`}
    </div></header>`;
}

function bnav(active){
  const items = [['','Beranda',I.home],['katalog','Katalog',I.grid],['pesan','Cetak',I.upload],['pesanan','Pesanan',I.receipt]];
  return `<nav class="bnav" aria-label="Navigasi utama">${items.map(([h,l,i]) =>
    `<a href="#/${h}" class="${active === h ? 'on' : ''}" ${active === h ? 'aria-current="page"' : ''}>${i}<span>${l}</span></a>`).join('')}</nav>`;
}

/* Tombol WhatsApp melayang dengan pesan sesuai konteks halaman */
const waFab = msg => `<a class="wa" href="${wa(CONFIG.WA_TOKO, msg)}" target="_blank" rel="noopener">${I.chat}<span>WhatsApp</span></a>`;

/* Kerangka halaman mahasiswa */
const phone = (content, active, waMsg = 'Halo Graha Media, saya mau tanya tentang layanan cetak.') =>
  `<div class="phone">${header()}${content}</div>${bnav(active)}${waFab(waMsg)}`;

/* Ilustrasi produk (pola sesuai kategori, tanpa foto) */
function art(p){
  const pat = { print:'pat-polka', warna:'pat-berrydot', jilid:'pat-gingham', finishing:'pat-stripe' }[p.category] || 'pat-polka';
  return `<div class="art ${pat}"><div class="mini ${p.category}"><span>${esc(p.size === '—' ? '' : p.size)}</span><i></i><i></i><i class="s"></i>${p.category === 'warna' ? '<b></b>' : '<i></i><i class="s"></i>'}</div></div>`;
}
const priceTag = p => `<span class="badge ${p.price_status === 'terkonfirmasi' ? 'b-ok' : 'b-sim'}">${p.price_status === 'terkonfirmasi' ? 'tarif terkonfirmasi' : 'tarif simulasi'}</span>`;

function pcard(p, i){
  return `<a class="pcard tilt" style="--rot:${i % 2 ? 2 : -2}deg" href="#/produk/${p.slug}">
    ${art(p)}
    <div class="body"><h3>${esc(p.name)}</h3><p class="sd">${esc(p.short_desc)}</p>
    <span class="price">mulai ${rp(p.base_price)} <small style="font-weight:500;color:var(--branch)">/ ${UNIT[p.pricing_unit]}</small></span>
    ${priceTag(p)}<span class="lead">${I.clock} ${esc(p.lead_time)}</span></div></a>`;
}

/* Indikator jam ramai toko */
function busyInfo(){
  const hot = CONFIG.isPeakHour();
  return `<div class="busy reveal"><span class="dot ${hot ? 'hot' : ''}"></span><span>${hot
    ? '<b>Toko sedang ramai.</b> Pesanan mungkin selesai lebih lama dari estimasi.'
    : '<b>Toko sedang lengang.</b> Waktu yang pas untuk mengirim pesanan.'}</span></div>`;
}

/* Tombol pilihan bersegmen: memanggil App.cfg(key, value) */
const seg = (key, opts, cur) => `<div class="seg" role="radiogroup">${opts.map(([v, l]) =>
  `<button role="radio" aria-checked="${String(cur) === String(v)}" class="${String(cur) === String(v) ? 'on' : ''}" onclick="App.cfg('${key}','${v}')">${l}</button>`).join('')}</div>`;

const backBtn = to => `<button class="back" onclick="App.step(${to})">${I.left} Kembali</button>`;

const statusBadge = s => `<span class="sbadge ${s === 'Selesai' ? 'd' : 'p'}">${s === 'Selesai' ? I.check : I.clock} ${s}</span>`;

const finishingText = fin => [fin.jilid !== 'none' ? (fin.jilid === 'soft' ? 'Jilid soft' : 'Jilid spiral') : '', fin.laminasi ? 'Laminasi' : '', fin.potong ? 'Potong' : ''].filter(Boolean).join(', ') || '—';
