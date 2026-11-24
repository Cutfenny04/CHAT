/* =========================================================
   core/utils.js — fungsi bantu umum & ikon
   ========================================================= */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const rp = n => 'Rp' + Math.round(n).toLocaleString('id-ID');
const pct = n => (n < 10 ? n.toFixed(1) : Math.round(n)).toString().replace('.', ',');
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* Selalu escape teks dari pengguna sebelum masuk ke HTML */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();

/* Tautan WhatsApp click-to-chat (bukan integrasi API) */
const wa = (num, msg) => `https://wa.me/${String(num).replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`;

function toast(text){
  const el = $('#toast'); el.textContent = text; el.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), 2400);
}
function ago(ms){
  const m = Math.round((Date.now() - ms) / 60000);
  if(m < 1) return 'baru saja';
  if(m < 60) return m + ' menit lalu';
  const h = Math.round(m / 60);
  return h < 24 ? h + ' jam lalu' : new Date(ms).toLocaleDateString('id-ID');
}
const fdate = ms => new Date(ms).toLocaleString('id-ID', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'});

/* ---------- Ikon garis (SVG) ---------- */
const ic = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  home:ic('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>'),
  grid:ic('<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>'),
  search:ic('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  receipt:ic('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>'),
  user:ic('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
  chat:ic('<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5"/>'),
  check:ic('<path d="M5 12l5 5 9-10"/>'),
  alert:ic('<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.5"/>'),
  upload:ic('<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/>'),
  right:ic('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  left:ic('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  clock:ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  file:ic('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>'),
  clip:ic('<path d="M8 12l6-6a3 3 0 014 4l-8 8a5 5 0 01-7-7l7-7"/>'),
  spark:ic('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>'),
  tag:ic('<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>'),
  coins:ic('<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>'),
  bolt:ic('<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>'),
  board:ic('<rect x="3" y="4" width="7" height="16" rx="1.5"/><rect x="14" y="4" width="7" height="10" rx="1.5"/>'),
  list:ic('<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>'),
  download:ic('<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/>'),
  edit:ic('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>'),
  plus:ic('<path d="M12 5v14M5 12h14"/>'),
  logout:ic('<path d="M15 4h4v16h-4"/><path d="M10 8l-4 4 4 4M6 12h10"/>'),
  repeat:ic('<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 014-4h12"/><path d="M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 01-4 4H4"/>'),
  shield:ic('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>'),
  needle:`<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M14 50L46 14"/><ellipse cx="47.5" cy="12.5" rx="3" ry="5" transform="rotate(42 47.5 12.5)"/><path d="M47 13c6 8 4 22-10 28" stroke-dasharray="3 4"/><path d="M8 56h22" stroke-dasharray="4 4"/></svg>`
};

/* Patch hati berjahit (motif dari moodboard) */
const HEART = 'M24 42S6 31 3.5 20.5C1.6 12.4 6.6 6 13.5 6c4.6 0 8.2 2.6 10.5 6.2C26.3 8.6 29.9 6 34.5 6 41.4 6 46.4 12.4 44.5 20.5 42 31 24 42 24 42z';
const patch = (s = 56, cls = '') => `<svg class="patch ${cls}" width="${s}" height="${s}" viewBox="0 0 48 48" aria-hidden="true"><path d="${HEART}" fill="#34495A" stroke="#BEB3AC" stroke-width="2" stroke-dasharray="3 3"/><g transform="translate(12 12) scale(.5)"><path d="${HEART}" fill="#6B212C" stroke="#DCE0E8" stroke-width="3" stroke-dasharray="4 4"/></g></svg>`;
const heart = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="${HEART}" fill="currentColor"/></svg>`;
