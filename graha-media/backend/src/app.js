/* =========================================================
   app.js — menyusun aplikasi Express dengan semua lapisan keamanan
   Urutan middleware penting: header aman → CORS → batas ukuran →
   cookie → rate limit → CSRF → route → error handler.
   ========================================================= */
const express = require('express');
const cookieParser = require('cookie-parser');
const db = require('./lib/db');
const { securityHeaders, corsPolicy, apiLimiter, csrfProtect, errorHandler } = require('./middleware/security');

function createApp({ pool } = {}){
  db.init(pool);
  const app = express();
  app.disable('x-powered-by');                     // jangan umumkan teknologi server
  app.set('trust proxy', 1);                       // IP asli di belakang proxy (Railway)
  app.set('query parser', 'simple');               // tolak objek bersarang di query string

  app.use(securityHeaders);
  app.use(corsPolicy());
  app.use(express.json({ limit:'100kb', strict:true }));
  app.use(cookieParser());
  app.use('/api', apiLimiter);
  app.use('/api', csrfProtect);

  app.get('/api/health', (req, res) => res.json({ ok:true }));
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api', require('./routes/products'));
  app.use('/api', require('./routes/orders'));

  app.use((req, res) => res.status(404).json({ error:'Tidak ditemukan.' }));
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
