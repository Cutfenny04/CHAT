/* =========================================================
   schemas.js — validasi semua input dengan Zod
   Hanya field yang didaftarkan yang diterima (sisanya dibuang),
   tipe & panjang dibatasi, teks dicek pola SQL injection/XSS.
   ========================================================= */
const { z } = require('zod');
const { detect, clean } = require('./lib/security');

/* Teks aman: dibersihkan, dibatasi panjang, dan ditolak bila berisi pola serangan */
const safeText = (max, min = 1) => z.string()
  .transform(v => clean(v, max))
  .pipe(z.string().min(min, 'Wajib diisi').max(max))
  .refine(v => !detect(v), 'Isian mengandung pola yang tidak diizinkan');
const optionalText = max => z.string().transform(v => clean(v, max)).pipe(z.string().max(max))
  .refine(v => !detect(v), 'Isian mengandung pola yang tidak diizinkan').optional().default('');

const email = z.string().trim().toLowerCase().max(100).pipe(z.email('Format email tidak valid'));
const wa = z.string().transform(v => v.replace(/[\s-]/g, '')).pipe(z.string().regex(/^\+?62\d{8,13}$/, 'Nomor WhatsApp harus diawali 62'));
const password = z.string().min(8).max(72).regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'Kata sandi harus berisi huruf dan angka');
const name = safeText(60, 2).pipe(z.string().regex(/^[\p{L}][\p{L} .'\-]+$/u, 'Nama hanya boleh huruf'));
const sku = z.string().regex(/^[A-Z]{3}-\d{3}$/, 'Format SKU KAT-NNN');
const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(80);
const code = z.string().regex(/^GM-\d{4}-\d{3,6}$/);

const register = z.object({ name, email, wa, password });
const login = z.object({ email, password: z.string().min(1).max(72) });

const productQuery = z.object({
  q: optionalText(60),
  category: z.enum(['all','print','warna','jilid','finishing']).optional().default('all'),
  sort: z.enum(['rel','low','high']).optional().default('rel')
});

const product = z.object({
  sku, name: safeText(40, 3), category: z.enum(['print','warna','jilid','finishing']),
  size: z.enum(['A4','A3','F4','—']), short_desc: safeText(90), description: optionalText(400),
  pricing_unit: z.enum(['per_halaman','per_lembar','per_dokumen','per_pcs']),
  base_price: z.number().int().min(1).max(10_000_000),
  price_status: z.enum(['simulasi','terkonfirmasi']), lead_time: safeText(30),
  options: z.array(safeText(60)).max(10).default([]), tags: z.array(safeText(30)).min(2).max(20),
  is_active: z.boolean().default(true)
});

const config = z.object({
  paper: z.enum(['A4','F4','A3']), orient: z.enum(['portrait','landscape']), scale: z.enum(['fit','actual']),
  duplex: z.boolean(), layout: z.union([z.literal(1), z.literal(2)]), bind: z.enum(['left','top'])
});
const order = z.object({
  file_name: safeText(120), pages: z.number().int().min(1).max(50),
  config, copies: z.number().int().min(1).max(99),
  finishing: z.object({ jilid: z.enum(['none','soft','spiral']), laminasi: z.boolean(), potong: z.boolean() }),
  note: optionalText(500),
  est_total: z.number().int().min(0).max(50_000_000)
});
const orderStatus = z.object({ status: z.enum(['Belum selesai','Selesai']) });
const adminOrderQuery = z.object({ status: z.enum(['Belum selesai','Selesai','Semua']).optional().default('Semua') });

module.exports = { register, login, productQuery, product, order, orderStatus, adminOrderQuery, params: { sku: z.object({ sku }), slug: z.object({ slug }), code: z.object({ code }) } };
