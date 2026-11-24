/* =========================================================
   routes/orders.js — pesanan mahasiswa & kelola pesanan admin
   Mahasiswa hanya bisa melihat pesanannya sendiri (filter
   user_id dari sesi, bukan dari input). Upload PDF dicek isinya.
   ========================================================= */
const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const { sql, query, one } = require('../lib/db');
const S = require('../schemas');
const { validate } = require('../middleware/security');
const { requireAuth, requireRole } = require('../middleware/auth');
const { isPdf, safeFileName } = require('../lib/security');

const router = express.Router();

/* Upload: simpan di memori, maks. 20 MB, 1 file, hanya PDF */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1, fields: 5 },
  fileFilter: (req, file, cb) => cb(null, file.mimetype === 'application/pdf')
});

router.post('/uploads', requireAuth, requireRole('mahasiswa'), upload.single('file'), (req, res) => {
  if(!req.file || !isPdf(req.file.buffer)) return res.status(400).json({ error:'File harus PDF yang valid.' });
  const name = safeFileName(req.file.originalname);
  const key = `${req.user.id}/${crypto.randomUUID()}.pdf`;   // nama di storage acak, bukan dari pengguna
  // TODO: unggah req.file.buffer ke Supabase Storage (bucket privat) dengan path `key`
  res.status(201).json({ file: { key, name, size: req.file.size } });
});

const newCode = async () => {
  const d = new Date(), dm = String(d.getDate()).padStart(2, '0') + String(d.getMonth() + 1).padStart(2, '0');
  const r = await one(sql`SELECT COUNT(*)::int AS n FROM orders`);
  return `GM-${dm}-${String(r.n + 1).padStart(3, '0')}`;
};

/* Mahasiswa: kirim pesanan.
   Catatan: est_total adalah estimasi; harga final ditetapkan admin di toko. */
router.post('/orders', requireAuth, requireRole('mahasiswa'), validate(S.order), async (req, res) => {
  const o = req.valid.body;
  const code = await newCode();
  const row = await one(sql`
    INSERT INTO orders (code, user_id, file_name, pages, config, copies, finishing, note, est_total, status)
    VALUES (${code}, ${req.user.id}, ${o.file_name}, ${o.pages}, ${JSON.stringify(o.config)}, ${o.copies},
            ${JSON.stringify(o.finishing)}, ${o.note}, ${o.est_total}, 'Belum selesai')
    RETURNING id, code, status, created_at`);
  await query(sql`INSERT INTO order_history (order_id, status, by_user) VALUES (${row.id}, 'Belum selesai', ${req.user.id})`);
  res.status(201).json({ order: row });
});

router.get('/orders/me', requireAuth, async (req, res) => {
  const rows = await query(sql`
    SELECT code, file_name, pages, config, copies, finishing, note, est_total, status, created_at
    FROM orders WHERE user_id = ${req.user.id} ORDER BY created_at DESC`);
  res.json({ orders: rows });
});

/* ---------- Admin ---------- */
router.get('/admin/orders', requireAuth, requireRole('admin'), validate(S.adminOrderQuery, 'query'), async (req, res) => {
  const { status } = req.valid.query;
  const filter = status === 'Semua' ? sql.empty : sql`WHERE o.status = ${status}`;
  const rows = await query(sql`
    SELECT o.code, o.file_name, o.pages, o.config, o.copies, o.finishing, o.note, o.est_total, o.status, o.created_at,
           u.name AS customer_name, u.wa AS customer_wa
    FROM orders o JOIN users u ON u.id = o.user_id ${filter}
    ORDER BY o.created_at DESC`);
  res.json({ orders: rows });
});

router.patch('/admin/orders/:code/status', requireAuth, requireRole('admin'),
  validate(S.params.code, 'params'), validate(S.orderStatus), async (req, res) => {
  const { code } = req.valid.params, { status } = req.valid.body;
  const row = await one(sql`UPDATE orders SET status = ${status} WHERE code = ${code} RETURNING id, code, status`);
  if(!row) return res.status(404).json({ error:'Pesanan tidak ditemukan.' });
  await query(sql`INSERT INTO order_history (order_id, status, by_user) VALUES (${row.id}, ${status}, ${req.user.id})`);
  res.json({ order: { code: row.code, status: row.status } });
});

module.exports = router;
