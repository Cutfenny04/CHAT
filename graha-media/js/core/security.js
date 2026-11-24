/* =========================================================
   core/security.js — lapisan keamanan sisi browser
   ---------------------------------------------------------
   PENTING: keamanan di browser hanya lapisan pertama (bisa
   dilewati oleh penyerang). Perlindungan utama dari SQL
   injection ada di backend: parameterized query, validasi
   skema, dan hak akses database (lihat folder backend/).

   Isi file ini:
   1. Sanitasi & validasi input (panjang, karakter, format)
   2. Deteksi pola SQL injection & XSS → ditolak + dicatat
   3. Hash kata sandi bergaram (SHA-256 berulang)
   4. Pembatasan percobaan login (anti brute force)
   5. Pemeriksaan isi file PDF (magic bytes) & nama file aman
   6. Parsing JSON aman (anti prototype pollution)
   7. Penjaga peran (role guard) untuk aksi admin
   8. Log kejadian keamanan
   ========================================================= */
const Security = (() => {

  /* ---------- 1. Batas & format input ---------- */
  const LIMITS = { name:60, email:100, password:72, wa:16, note:500, search:60, text:200, desc:400, sku:7 };
  const RULES = {
    name:     { re:/^[\p{L}][\p{L} .'\-]{1,59}$/u, msg:'Nama hanya boleh huruf, spasi, titik, tanda petik, atau tanda hubung.' },
    email:    { re:/^[^\s@<>()[\]\\,;:"]{1,64}@[a-z0-9.-]{1,63}\.[a-z]{2,24}$/i, msg:'Format email tidak valid.' },
    wa:       { re:/^\+?62\d{8,13}$/, msg:'Nomor WhatsApp harus diawali 62, contoh 6281234567890.' },
    password: { re:/^(?=.*[A-Za-z])(?=.*\d).{8,72}$/, msg:'Kata sandi minimal 8 karakter, berisi huruf dan angka.' },
    sku:      { re:/^[A-Z]{3}-\d{3}$/, msg:'Format KAT-NNN, mis. PRT-005.' }
  };

  /* ---------- 2. Pola serangan (pertahanan berlapis) ---------- */
  const PATTERNS = [
    { type:'sqli', re:/('|%27|")\s*(or|and)\s*('|%27|")?\s*[\w'"]+\s*(=|like)\s*[\w'"]+/i },  // ' OR '1'='1
    { type:'sqli', re:/\bunion\b[\s\S]{0,40}\bselect\b/i },                                     // UNION SELECT
    { type:'sqli', re:/;\s*(drop|delete|insert|update|alter|truncate|create|grant|exec)\b/i },  // ; DROP TABLE
    { type:'sqli', re:/\b(drop|truncate|alter)\s+(table|database|schema)\b/i },
    { type:'sqli', re:/\b(pg_sleep|sleep|benchmark|waitfor\s+delay|xp_cmdshell|information_schema|pg_catalog)\b/i },
    { type:'sqli', re:/(--\s|--$|['"]\s*--|\/\*|\*\/)/ },                                     // komentar SQL
    { type:'sqli', re:/\b(select|delete)\b[\s\S]{0,30}\bfrom\b/i },
    { type:'sqli', re:/\binsert\s+into\b|\bupdate\b\s+\w+\s+\bset\b/i },
    { type:'xss',  re:/<\s*\/?\s*(script|iframe|object|embed|svg|img|style|link|meta)\b/i },
    { type:'xss',  re:/javascript\s*:|data\s*:\s*text\/html|\bon[a-z]+\s*=/i }
  ];

  /* Bersihkan teks: normalisasi Unicode, buang karakter kontrol, rapikan spasi, potong panjang */
  function clean(value, max = LIMITS.text){
    return String(value ?? '')
      .normalize('NFC')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g, '')
      .replace(/[ \t]+/g, ' ')
      .trim()
      .slice(0, max);
  }

  /* Kembalikan jenis serangan bila terdeteksi, atau null */
  function detect(value){
    const s = String(value ?? '');
    let decoded = s; try{ decoded = decodeURIComponent(s); }catch(e){}
    for(const p of PATTERNS) if(p.re.test(s) || p.re.test(decoded)) return p.type;
    return null;
  }

  /* Periksa banyak isian sekaligus.
     fields: { id: { value, rule?, max?, required?, label } }
     Hasil: { ok, values, errors } — values sudah dibersihkan */
  function check(fields, context = 'form'){
    const values = {}, errors = {};
    for(const [id, f] of Object.entries(fields)){
      const v = f.rule === 'password' ? String(f.value ?? '').slice(0, LIMITS.password) : clean(f.value, f.max || LIMITS[f.rule] || LIMITS.text);
      values[id] = v;
      if(!v){ if(f.required !== false) errors[id] = `${f.label || 'Isian'} wajib diisi.`; continue; }
      const attack = f.rule === 'password' ? null : detect(v);
      if(attack){ errors[id] = 'Isian mengandung pola yang tidak diizinkan.'; log(attack === 'sqli' ? 'Pola SQL injection ditolak' : 'Pola XSS ditolak', `${context} · ${id}`); continue; }
      if(f.rule && RULES[f.rule] && !RULES[f.rule].re.test(v)) errors[id] = RULES[f.rule].msg;
    }
    return { ok:!Object.keys(errors).length, values, errors };
  }

  /* Angka dengan batas wajar (tarif, harga, jumlah) */
  function number(value, min, max){
    const n = Number(value);
    return Number.isFinite(n) && n >= min && n <= max ? n : null;
  }

  /* ---------- 3. Hash kata sandi (SHA-256 bergaram, diulang) ----------
     Di backend gunakan bcrypt/argon2. Ini agar sandi tidak tersimpan polos di browser. */
  const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const rr = (v, a) => (v >>> a) | (v << (32 - a));
  function sha256(text){
    const bytes = new TextEncoder().encode(text), l = bytes.length, size = ((l + 9 + 63) >> 6) << 6;
    const buf = new Uint8Array(size); buf.set(bytes); buf[l] = 0x80;
    const dv = new DataView(buf.buffer);
    dv.setUint32(size - 4, (l * 8) >>> 0); dv.setUint32(size - 8, Math.floor(l * 8 / 4294967296));
    let H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    const w = new Uint32Array(64);
    for(let i = 0; i < size; i += 64){
      for(let t = 0; t < 16; t++) w[t] = dv.getUint32(i + t*4);
      for(let t = 16; t < 64; t++){
        const s0 = rr(w[t-15],7) ^ rr(w[t-15],18) ^ (w[t-15] >>> 3), s1 = rr(w[t-2],17) ^ rr(w[t-2],19) ^ (w[t-2] >>> 10);
        w[t] = (w[t-16] + s0 + w[t-7] + s1) >>> 0;
      }
      let [a,b,c,d,e,f,g,h] = H;
      for(let t = 0; t < 64; t++){
        const t1 = (h + (rr(e,6) ^ rr(e,11) ^ rr(e,25)) + ((e & f) ^ (~e & g)) + K[t] + w[t]) >>> 0;
        const t2 = ((rr(a,2) ^ rr(a,13) ^ rr(a,22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      H = H.map((x, k) => (x + [a,b,c,d,e,f,g,h][k]) >>> 0);
    }
    return H.map(x => x.toString(16).padStart(8, '0')).join('');
  }
  const ITERATIONS = 3000;
  function hashPassword(password, salt){
    let out = sha256(salt + ':' + password);
    for(let i = 0; i < ITERATIONS; i++) out = sha256(out + salt);
    return out;
  }
  function randomSalt(){
    const a = new Uint8Array(16); crypto.getRandomValues(a);
    return [...a].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  /* Bandingkan string tanpa berhenti di karakter pertama yang beda */
  function safeEqual(a, b){
    if(typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
    let diff = 0; for(let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  /* ---------- 4. Batas percobaan login ---------- */
  const MAX_ATTEMPTS = 5, LOCK_MS = 60 * 1000;
  function lockInfo(email){
    const all = safeParse(localStorageGet('gm_attempts')) || {};
    const rec = all[clean(email, LIMITS.email).toLowerCase()] || { n:0, until:0 };
    return { ...rec, locked: rec.until > Date.now(), wait: Math.ceil((rec.until - Date.now()) / 1000) };
  }
  function recordAttempt(email, success){
    const key = clean(email, LIMITS.email).toLowerCase();
    const all = safeParse(localStorageGet('gm_attempts')) || {};
    if(success){ delete all[key]; }
    else {
      const rec = all[key] || { n:0, until:0 }; rec.n++;
      if(rec.n >= MAX_ATTEMPTS){ rec.until = Date.now() + LOCK_MS; rec.n = 0; log('Akun dikunci sementara', `${key} · ${MAX_ATTEMPTS}× gagal`); }
      all[key] = rec;
    }
    localStorageSet('gm_attempts', JSON.stringify(all));
  }

  /* ---------- 5. File ---------- */
  /* PDF asli selalu diawali byte "%PDF-"; nama/ekstensi bisa dipalsukan */
  async function isRealPdf(file){
    try{
      const head = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
      const text = String.fromCharCode(...head);
      return text.indexOf('%PDF-') >= 0 && text.indexOf('%PDF-') < 1024;
    }catch(e){ return false; }
  }
  /* Nama file aman untuk ditampilkan & disimpan */
  function safeFileName(name){
    const base = clean(String(name).split(/[\\/]/).pop(), 120).replace(/[^\p{L}\p{N} ._()\-]/gu, '_').replace(/\.{2,}/g, '.');
    return /\.pdf$/i.test(base) ? base : base + '.pdf';
  }

  /* ---------- 6. JSON aman ---------- */
  function safeParse(json){
    if(typeof json !== 'string') return null;
    try{
      return JSON.parse(json, (k, v) => (k === '__proto__' || k === 'constructor' || k === 'prototype') ? undefined : v);
    }catch(e){ return null; }
  }
  function localStorageGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function localStorageSet(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }

  /* ---------- 8. Log keamanan (dibaca di menu admin Keamanan) ---------- */
  function log(event, detail = ''){
    const list = safeParse(localStorageGet('gm_security_log')) || [];
    list.unshift({ at:Date.now(), event:clean(event, 80), detail:clean(detail, 120) });
    localStorageSet('gm_security_log', JSON.stringify(list.slice(0, 100)));
  }
  /* Catat sesuai jenis serangan yang terdeteksi */
  const logAttack = (type, where) => log(type === 'sqli' ? 'Pola SQL injection ditolak' : 'Pola XSS ditolak', where);
  const readLog = () => safeParse(localStorageGet('gm_security_log')) || [];

  return { LIMITS, RULES, clean, detect, check, number, sha256, hashPassword, randomSalt, safeEqual,
           MAX_ATTEMPTS, lockInfo, recordAttempt, isRealPdf, safeFileName, safeParse, log, logAttack, readLog };
})();

/* ---------- 7. Penjaga peran ----------
   Dipakai di awal setiap aksi yang mengubah data. */
function requireRole(role){
  const me = typeof Store !== 'undefined' ? Store.session() : null;
  if(me && me.role === role) return true;
  Security.log('Aksi ditolak: peran tidak sesuai', `butuh ${role}`);
  if(typeof toast === 'function') toast('Akses ditolak. Silakan masuk dengan akun yang sesuai.');
  return false;
}
