/* =========================================================
   middleware/security.js — header aman, CORS, rate limit,
   CSRF (double-submit token), validasi, dan penanganan error
   ========================================================= */
const crypto = require('crypto');
const helmet = require('helmet');
const cors = require('cors');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

/* Header HTTP aman: CSP, HSTS, X-Frame-Options (anti clickjacking), nosniff, dll. */
const securityHeaders = helmet({
  contentSecurityPolicy: { directives: { defaultSrc:["'none'"], frameAncestors:["'none'"] } }, // API hanya mengirim JSON
  crossOriginResourcePolicy: { policy:'same-site' }
});

/* CORS: hanya asal frontend yang terdaftar di .env */
function corsPolicy(){
  const allowed = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  return cors({
    origin: (origin, cb) => cb(null, !origin || allowed.includes(origin)),
    credentials: true,
    methods: ['GET','POST','PATCH','DELETE'],
    allowedHeaders: ['Content-Type','X-CSRF-Token']
  });
}

/* Rate limit umum & khusus login (anti brute force) */
const apiLimiter = rateLimit({ windowMs: 15*60*1000, limit: 300, standardHeaders:'draft-8', legacyHeaders:false,
  message: { error:'Terlalu banyak permintaan, coba lagi nanti.' } });
const loginLimiter = rateLimit({ windowMs: 15*60*1000, limit: 5, standardHeaders:'draft-8', legacyHeaders:false,
  keyGenerator: req => `${ipKeyGenerator(req.ip)}|${String(req.body?.email || '').toLowerCase().slice(0, 100)}`,
  skipSuccessfulRequests: true,
  message: { error:'Terlalu banyak percobaan login. Coba lagi 15 menit lagi.' } });

/* CSRF double-submit: cookie gm_csrf (bisa dibaca JS) harus sama dengan header X-CSRF-Token */
function issueCsrf(req, res){
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('gm_csrf', token, { sameSite:'strict', secure: process.env.NODE_ENV === 'production', httpOnly:false, maxAge: 8*3600*1000 });
  return token;
}
function csrfProtect(req, res, next){
  if(['GET','HEAD','OPTIONS'].includes(req.method)) return next();
  const cookie = req.cookies?.gm_csrf, header = req.get('X-CSRF-Token');
  if(!cookie || !header || cookie.length !== header.length || !crypto.timingSafeEqual(Buffer.from(cookie), Buffer.from(header)))
    return res.status(403).json({ error:'Token CSRF tidak valid.' });
  next();
}

/* Validasi Zod untuk body / query / params. Field tak dikenal dibuang. */
const validate = (schema, where = 'body') => (req, res, next) => {
  const r = schema.safeParse(req[where] ?? {});
  if(!r.success){
    const issue = r.error.issues[0];
    if(/pola yang tidak diizinkan/.test(issue.message)) console.warn(`[keamanan] pola serangan ditolak di ${req.method} ${req.path} (${issue.path.join('.')}) dari ${req.ip}`);
    return res.status(400).json({ error: issue.message, field: issue.path.join('.') });
  }
  req.valid = { ...(req.valid || {}), [where]: r.data };
  next();
};

/* Error handler: jangan pernah bocorkan pesan SQL/stack ke pengguna */
function errorHandler(err, req, res, next){
  if(err && err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error:'File terlalu besar (maks. 20 MB).' });
  if(err && err.type === 'entity.too.large') return res.status(413).json({ error:'Data terlalu besar.' });
  if(err && err.type === 'entity.parse.failed') return res.status(400).json({ error:'Format JSON tidak valid.' });
  if(err && err.code === '23505') return res.status(409).json({ error:'Data sudah ada.' });   // unique violation
  console.error('[error]', err);                                                         // detail hanya di log server
  res.status(500).json({ error:'Terjadi kesalahan pada server.' });
}

module.exports = { securityHeaders, corsPolicy, apiLimiter, loginLimiter, issueCsrf, csrfProtect, validate, errorHandler };
