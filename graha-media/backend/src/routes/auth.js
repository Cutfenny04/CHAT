/* =========================================================
   routes/auth.js — daftar, masuk, keluar, profil
   Kata sandi di-hash dengan bcrypt; pesan error login dibuat
   sama untuk email salah/sandi salah (tidak membocorkan akun).
   ========================================================= */
const express = require('express');
const bcrypt = require('bcryptjs');
const { sql, one } = require('../lib/db');
const S = require('../schemas');
const { validate, loginLimiter, issueCsrf } = require('../middleware/security');
const { setSession, clearSession, requireAuth } = require('../middleware/auth');

const router = express.Router();
const COST = Number(process.env.BCRYPT_COST) || 12;
const DUMMY_HASH = bcrypt.hashSync('dummy-password-1', 4);   // untuk menyamakan waktu respons

/* Ambil token CSRF (dipanggil frontend sekali saat halaman dibuka) */
router.get('/csrf', (req, res) => res.json({ csrfToken: issueCsrf(req, res) }));

router.post('/register', validate(S.register), async (req, res) => {
  const { name, email, wa, password } = req.valid.body;
  const hash = await bcrypt.hash(password, COST);
  const user = await one(sql`
    INSERT INTO users (email, name, wa, role, password_hash)
    VALUES (${email}, ${name}, ${wa}, 'mahasiswa', ${hash})
    RETURNING id, email, name, wa, role`);
  setSession(res, user);
  res.status(201).json({ user });
});

router.post('/login', loginLimiter, validate(S.login), async (req, res) => {
  const { email, password } = req.valid.body;
  const row = await one(sql`SELECT id, email, name, wa, role, password_hash FROM users WHERE email = ${email}`);
  const ok = await bcrypt.compare(password, row ? row.password_hash : DUMMY_HASH);
  if(!row || !ok){
    console.warn(`[keamanan] login gagal untuk ${email} dari ${req.ip}`);
    return res.status(401).json({ error:'Email atau kata sandi salah.' });
  }
  const { password_hash, ...user } = row;
  setSession(res, user);
  res.json({ user });
});

router.post('/logout', (req, res) => { clearSession(res); res.json({ ok:true }); });

router.get('/me', requireAuth, (req, res) => res.json({ user:req.user }));

module.exports = router;
