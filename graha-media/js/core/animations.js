/* =========================================================
   core/animations.js — animasi scroll (PRD bagian 8)
   - Fade-up & stagger saat elemen masuk layar (IntersectionObserver)
   - Header menyusut, parallax renda, garis jahitan "dijahit",
     ticker berbalik arah, angka menghitung naik
   Hanya transform/opacity, dan dimatikan bila reduced-motion.
   ========================================================= */
let revealObserver;

function initFx(instant){
  if(revealObserver) revealObserver.disconnect();
  // Anak dari [data-stagger] muncul bergiliran (jeda 60 ms, maks. 8)
  $$('[data-stagger]').forEach(parent => [...parent.children].forEach((c, i) => {
    if(!c.classList.contains('tilt')) c.classList.add('reveal');
    c.style.transitionDelay = Math.min(i, 8) * 60 + 'ms';
  }));
  const els = $$('.reveal,.tilt');
  if(instant || RM || !('IntersectionObserver' in window)){
    els.forEach(e => { e.classList.add('in'); e.style.transitionDelay = '0ms'; });
  } else {
    revealObserver = new IntersectionObserver(entries => entries.forEach(e => {
      if(!e.isIntersecting) return;
      e.target.classList.add('in'); revealObserver.unobserve(e.target);
      if(e.target.classList.contains('stat')) countUp(e.target.querySelector('.count'));
    }), { threshold:.12, rootMargin:'0px 0px -6% 0px' });
    els.forEach(e => revealObserver.observe(e));
  }
  const total = $('#total'); if(total && !instant) countUp(total, true);
  onScroll();
}

function countUp(el, money){
  if(!el) return;
  const to = +el.dataset.to;
  if(RM || !to){ el.textContent = money ? rp(to) : to; return; }
  const t0 = performance.now(), dur = 650;
  (function tick(t){
    const k = Math.min(1, (t - t0) / dur), v = to * (1 - Math.pow(1 - k, 3));
    el.textContent = money ? rp(Math.round(v/100)*100) : Math.round(v);
    if(k < 1) requestAnimationFrame(tick); else el.textContent = money ? rp(to) : to;
  })(t0);
}

let lastY = 0, ticking = false;
function onScroll(){
  const y = window.scrollY, vh = window.innerHeight;
  const hdr = $('#hdr'); if(hdr) hdr.classList.toggle('shrink', y > 40);
  if(!RM){ const lace = $('#lace'); if(lace) lace.style.transform = `translateY(${y * 0.3}px)`; }
  $$('.stitch-draw').forEach(el => {
    const r = el.getBoundingClientRect();
    const p = RM ? 1 : Math.max(0, Math.min(1, (vh - r.top) / (vh * .55)));
    el.style.clipPath = `inset(0 ${100 - p*100}% 0 0)`;
  });
  const st = $('#steps'), fill = $('#stepsfill');
  if(st && fill){ const r = st.getBoundingClientRect(); const p = RM ? 1 : Math.max(0, Math.min(1, (vh*.75 - r.top) / r.height)); fill.style.height = (p*100) + '%'; }
  const tk = $('#ticker'); if(tk && Math.abs(y - lastY) > 4) tk.classList.toggle('rev', y < lastY);
  lastY = y;
}
window.addEventListener('scroll', () => {
  if(ticking) return; ticking = true;
  requestAnimationFrame(() => { onScroll(); ticking = false; });
}, { passive:true });
