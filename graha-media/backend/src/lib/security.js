/* =========================================================
   lib/security.js — fungsi keamanan yang dipakai banyak route
   ========================================================= */

/* Pola serangan (sama dengan frontend js/core/security.js).
   Ini pertahanan BERLAPIS; perlindungan utama tetap parameterized query di lib/db.js. */
const PATTERNS = [
  { type:'sqli', re:/('|%27|")\s*(or|and)\s*('|%27|")?\s*[\w'"]+\s*(=|like)\s*[\w'"]+/i },
  { type:'sqli', re:/\bunion\b[\s\S]{0,40}\bselect\b/i },
  { type:'sqli', re:/;\s*(drop|delete|insert|update|alter|truncate|create|grant|exec)\b/i },
  { type:'sqli', re:/\b(drop|truncate|alter)\s+(table|database|schema)\b/i },
  { type:'sqli', re:/\b(pg_sleep|sleep|benchmark|waitfor\s+delay|xp_cmdshell|information_schema|pg_catalog)\b/i },
  { type:'sqli', re:/(--\s|--$|['"]\s*--|\/\*|\*\/)/ },
  { type:'sqli', re:/\b(select|delete)\b[\s\S]{0,30}\bfrom\b/i },
  { type:'sqli', re:/\binsert\s+into\b|\bupdate\b\s+\w+\s+\bset\b/i },
  { type:'xss',  re:/<\s*\/?\s*(script|iframe|object|embed|svg|img|style|link|meta)\b/i },
  { type:'xss',  re:/javascript\s*:|data\s*:\s*text\/html|\bon[a-z]+\s*=/i }
];
function detect(value){
  const s = String(value ?? '');
  let decoded = s; try{ decoded = decodeURIComponent(s); }catch(e){}
  for(const p of PATTERNS) if(p.re.test(s) || p.re.test(decoded)) return p.type;
  return null;
}

/* Bersihkan teks: buang karakter kontrol & karakter arah teks tersembunyi */
const clean = (v, max = 200) => String(v ?? '').normalize('NFC')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g, '')
  .replace(/[ \t]+/g, ' ').trim().slice(0, max);

/* PDF asli diawali "%PDF-" (magic bytes) */
const isPdf = buf => Buffer.isBuffer(buf) && buf.subarray(0, 1024).includes(Buffer.from('%PDF-'));

const safeFileName = name => {
  const base = clean(String(name).split(/[\\/]/).pop(), 120).replace(/[^\p{L}\p{N} ._()\-]/gu, '_').replace(/\.{2,}/g, '.');
  return /\.pdf$/i.test(base) ? base : base + '.pdf';
};

module.exports = { detect, clean, isPdf, safeFileName };
