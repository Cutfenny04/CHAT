/* =========================================================
   landing.js — logika landing page
   - Mengisi mockup hero, ticker, kartu layanan (dari data produk)
   - Fitur "sticky scroll": visual berganti sesuai teks yang dibaca
   - Kalkulator perkiraan harga (tarif sama dengan aplikasi)
   - Parallax mockup HP, menu mobile, tautan WhatsApp
   Animasi reveal & scroll umum memakai js/core/animations.js
   ========================================================= */
const Landing = {};
window.Landing = Landing;

/* ---------- Tautan WhatsApp & ikon ---------- */
$$('[data-wa]').forEach(a => a.href = wa(CONFIG.WA_TOKO, a.dataset.wa));
$('#wa-ic').innerHTML = I.chat;
$$('[data-ic]').forEach(li => li.insertAdjacentHTML('afterbegin', I[li.dataset.ic]));
$('#fpatch').innerHTML = patch(70);
$('#calc-patch').innerHTML = patch(54);
$('#busy-line').textContent = CONFIG.isPeakHour()
  ? 'Toko sedang ramai sekarang, pesanan mungkin selesai lebih lama.'
  : 'Toko sedang lengang, waktu yang pas untuk mengirim pesanan.';

Landing.menu = btn => {
  const m = $('#lmenu'), open = m.classList.toggle('open');
  btn.setAttribute('aria-expanded', open);
};
$$('#lmenu a').forEach(a => a.addEventListener('click', () => $('#lmenu').classList.remove('open')));

/* ---------- Mockup hero ---------- */
const ringSvg = (score, total) => {
  const r = 18, c = 2*Math.PI*r, p = score/total;
  return `<svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="${r}" fill="none" stroke="#DCE0E8" stroke-width="5"/><circle cx="22" cy="22" r="${r}" fill="none" stroke="#6B212C" stroke-width="5" stroke-linecap="round" stroke-dasharray="${c*p} ${c}" transform="rotate(-90 22 22)"/></svg>`;
};
const checkRows = [
  ['ok','Ukuran halaman','OK'], ['ok','Orientasi konsisten','OK'], ['warn','Halaman 6 kosong','Periksa'],
  ['warn','Hal. 8 mepet tepi','Periksa'], ['ok','File tidak terkunci','OK']
];
const rowsHTML = (rows, big) => rows.map(([st, t, l]) => `<div class="mrow ${st}" ${big ? 'style="font-size:14px;padding:11px 0"' : ''}><i>${st === 'ok' ? I.check : I.alert}</i>${t}<em>${l}</em></div>`).join('');
$('#mscore').innerHTML = `${ringSvg(6,8)}<div><b>6/8</b><span style="font-size:10px;color:var(--branch)">halaman tanpa catatan</span></div>`;
$('#mrows').innerHTML = rowsHTML(checkRows);

/* Nota mini dihitung dari tarif yang sama dengan aplikasi */
(function heroNota(){
  const T = Store.tariff();
  const bw = Math.round(T.bw * 5), col = T.tiers[0].price + T.tiers[2].price;
  const total = Math.ceil((bw + col) / 100) * 100;
  $('#fnota-lines').innerHTML = `<div class="l"><span>Hitam putih · 5 muka</span><b>${rp(bw)}</b></div><div class="l"><span>Warna · 2 muka</span><b>${rp(col)}</b></div>`;
  const t = $('#fnota-total'); t.dataset.to = total; t.textContent = rp(total);
  setTimeout(() => countUp(t, true), 600);
})();

/* ---------- Ticker ---------- */
const words = ['Periksa','Simulasikan','Optimalkan','Cetak','Jilid','Laminasi','Potong','A4 · F4 · A3'];
$('#ticktrack').innerHTML = [...words, ...words].map(w => `<span>${w} ✦</span>`).join('');

/* ---------- Visual fitur ---------- */
const VISUALS = [
  () => `<div class="vcheck"><div class="mcard" style="padding:18px">
      <p class="eyebrow" style="margin:0">Smart Print Check</p>
      <div class="mscore" style="margin:8px 0">${ringSvg(6,8).replace('viewBox','width="56" height="56" viewBox')}<div><b style="font-size:26px">6/8</b><span class="small muted">halaman tanpa catatan</span></div></div>
      ${rowsHTML(checkRows, true)}</div></div>`,
  () => `<div class="vsim"><div class="vsheet"><div class="pg"><i></i><i class="c"></i><i></i><i class="s"></i></div></div>
      <div class="vchips"><span class="on">A4</span><span>F4</span><span>A3</span><span class="on">Bolak-balik</span><span>Jilid kiri</span></div></div>`,
  () => {
    const pages = [['Warna 35%',1,'linear-gradient(135deg,#6B212C,#8EA1AE)',true],['H/P',0,'',false],['H/P',0,'',false],['Warna 5%',1,'linear-gradient(90deg,#6B212C 20%,#27363F 20% 40%,#685652 40% 60%,transparent 60%)',false],['kosong',2,'',false],['Warna 33%',1,'linear-gradient(135deg,#2F6F8F,#8EA1AE 55%,#6B212C)',true]];
    return `<div class="vmap">${pages.map(([t, c, g, hot]) => `<div class="vpg ${c === 1 ? 'c' : ''}"><span class="tg" ${c === 2 ? 'style="background:var(--mist);color:var(--pine)"' : ''}>${t}</span>${hot ? `<span class="hrt">${heart}</span>` : ''}
      ${c === 2 ? '' : `<i></i><i style="width:70%"></i>${g ? `<b style="background:${g}"></b>` : '<i></i><i></i><i style="width:50%"></i>'}`}</div>`).join('')}</div>`;
  }
];
$('#fvisual').innerHTML = VISUALS.map((v, i) => `<div class="fv ${i === 0 ? 'on' : ''}" data-i="${i}">${v()}</div>`).join('');
$$('.fv-inline').forEach((el, i) => el.innerHTML = `<div class="fv pat-gingham">${VISUALS[i]()}</div>`);

/* Teks yang berada di tengah layar menentukan visual yang tampil */
const steps = $$('.fstep');
const featObserver = new IntersectionObserver(entries => entries.forEach(e => {
  if(!e.isIntersecting) return;
  const i = e.target.dataset.i;
  steps.forEach(s => s.classList.toggle('on', s === e.target));
  $$('#fvisual .fv').forEach(v => v.classList.toggle('on', v.dataset.i === i));
}), { rootMargin:'-45% 0px -45% 0px' });
steps.forEach(s => featObserver.observe(s));

/* ---------- Kartu layanan (data produk yang sama dengan katalog) ---------- */
$('#svcgrid').innerHTML = Store.activeProducts().slice(0, 8).map(p => `<a class="svc" href="index.html#/produk/${p.slug}">
  ${art(p)}<div class="body"><span class="badge b-mist">${catName(p.category)}</span><h3>${esc(p.name)}</h3><p>${esc(p.short_desc)}</p>
  <span class="price">mulai ${rp(p.base_price)} <small style="font-weight:500;color:var(--branch)">/ ${UNIT[p.pricing_unit]}</small></span>
  <span class="badge ${p.price_status === 'terkonfirmasi' ? 'b-ok' : 'b-sim'}">${p.price_status === 'terkonfirmasi' ? 'tarif terkonfirmasi' : 'tarif simulasi'}</span></div></a>`).join('');

/* Ilustrasi produk (sama dengan views/components.js) */
function art(p){
  const pat = { print:'pat-polka', warna:'pat-berrydot', jilid:'pat-gingham', finishing:'pat-stripe' }[p.category] || 'pat-polka';
  return `<div class="art ${pat}"><div class="mini ${p.category}"><span>${esc(p.size === '—' ? '' : p.size)}</span><i></i><i></i><i class="s"></i>${p.category === 'warna' ? '<b></b>' : '<i></i><i class="s"></i>'}</div></div>`;
}

/* ---------- Kalkulator perkiraan ---------- */
const calc = { pages:20, color:25, dens:20, paper:'A4', copies:1 };
function calcRender(){
  const T = Store.tariff(), fac = T.paperFactor[calc.paper] || 1;
  const colN = Math.round(calc.pages * calc.color / 100), bwN = calc.pages - colN;
  const tier = T.tiers.find(t => calc.dens < t.max);
  const bwCost = T.bw * fac * bwN * calc.copies, colCost = tier.price * fac * colN * calc.copies;
  const total = Math.ceil((bwCost + colCost) / 100) * 100;
  $('#v-pages').textContent = calc.pages;
  $('#v-color').textContent = calc.color + '%';
  $('#c-copies').textContent = calc.copies;
  $('#c-total').textContent = rp(total);
  $('#c-sub').textContent = `${calc.pages} halaman · ${calc.paper} · ${calc.copies} salinan`;
  $('#c-lines').innerHTML = `
    <div><span>Hitam putih · ${bwN} hal × ${rp(T.bw * fac)}</span><b>${rp(bwCost)}</b></div>
    <div><span>Warna · ${colN} hal × ${rp(tier.price * fac)}</span><b>${rp(colCost)}</b></div>
    ${calc.copies > 1 ? `<div><span>Sudah termasuk</span><b>× ${calc.copies} salinan</b></div>` : ''}`;
}
$('#c-pages').addEventListener('input', e => { calc.pages = +e.target.value; calcRender(); });
$('#c-color').addEventListener('input', e => { calc.color = +e.target.value; calcRender(); });
const segBind = (id, key, num) => $$(`#${id} button`).forEach(b => b.addEventListener('click', () => {
  $$(`#${id} button`).forEach(x => x.classList.toggle('on', x === b));
  calc[key] = num ? +b.dataset.v : b.dataset.v; calcRender();
}));
segBind('c-dens', 'dens', true);
segBind('c-paper', 'paper', false);
$('#c-minus').addEventListener('click', () => { calc.copies = Math.max(1, calc.copies - 1); calcRender(); });
$('#c-plus').addEventListener('click', () => { calc.copies = Math.min(99, calc.copies + 1); calcRender(); });
calcRender();

/* ---------- Parallax mockup hero (mengikuti scroll) ---------- */
if(!RM){
  const ph = $('#mphone'), nota = $('#fnota'), pt = $('#fpatch');
  window.addEventListener('scroll', () => requestAnimationFrame(() => {
    const y = Math.min(window.scrollY, 700);
    ph.style.transform = `rotate(${-4 + y * 0.006}deg) translateY(${y * -0.08}px)`;
    nota.style.transform = `rotate(${5 - y * 0.008}deg) translateY(${y * -0.18}px)`;
    pt.style.transform = `rotate(${-14 + y * 0.03}deg) translateY(${y * -0.25}px)`;
  }), { passive:true });
}

initFx(false);
