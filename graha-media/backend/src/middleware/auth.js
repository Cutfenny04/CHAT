/* =========================================================
   middleware/auth.js — autentikasi JWT di cookie httpOnly
   + penjaga peran (mahasiswa / admin)
   Token tidak bisa dibaca JavaScript (aman dari pencurian via XSS).
   ========================================================= */
const jwt = require('jsonwebtoken');
const { one, sql } = require('../lib/db');

const COOKIE = 'gm_session';
const HOURS = 8;

function secret(){
  const s = process.env.JWT_SECRET;
  if(!s || s.length < 32) throw new Error('JWT_SECRET wajib diisi minimal 32 karakter');
  return s;
}

function setSession(res, user){
  const token = jwt.sign({ sub:String(user.id), role:user.role }, secret(), { algorithm:'HS256', expiresIn:`${HOURS}h` });
  res.cookie(COOKIE, token, { httpOnly:true, sameSite:'strict', secure: process.env.NODE_ENV === 'production', maxAge: HOURS*3600*1000, path:'/' });
}
const clearSession = res => res.clearCookie(COOKIE, { path:'/' });

/* Wajib login: verifikasi token, lalu cek ulang pengguna di database (peran terbaru) */
async function requireAuth(req, res, next){
  try{
    const payload = jwt.verify(req.cookies?.[COOKIE] || '', secret(), { algorithms:['HS256'] });
    const user = await one(sql`SELECT id, email, name, wa, role FROM users WHERE id = ${Number(payload.sub)}`);
    if(!user) throw new Error('no user');
    req.user = user; next();
  }catch(e){
    clearSession(res);
    res.status(401).json({ error:'Silakan masuk terlebih dahulu.' });
  }
}

const requireRole = role => (req, res, next) => {
  if(req.user?.role !== role){
    console.warn(`[keamanan] akses ${req.method} ${req.path} ditolak untuk peran ${req.user?.role} (butuh ${role})`);
    return res.status(403).json({ error:'Akses ditolak.' });
  }
  next();
};

module.exports = { setSession, clearSession, requireAuth, requireRole };
