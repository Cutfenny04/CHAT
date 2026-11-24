/* =========================================================
   routes/products.js — katalog (publik) & kelola produk (admin)
   Pencarian memakai ILIKE berparameter + escape wildcard;
   urutan memakai daftar putih, bukan teks dari pengguna.
   ========================================================= */
const express = require('express');
const { sql, query, one, orderBy, likeEscape } = require('../lib/db');
const S = require('../schemas');
const { validate } = require('../middleware/security');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const COLUMNS = sql`sku, slug, name, category, size, short_desc, description, pricing_unit, base_price, price_status, lead_time, options, tags, is_active`;
const SORTS = { rel:'name ASC', low:'base_price ASC', high:'base_price DESC' };
const slugify = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* GET /api/products?q=&category=&sort= */
router.get('/products', validate(S.productQuery, 'query'), async (req, res) => {
  const { q, category, sort } = req.valid.query;
  const where = [sql`is_active = true`];
  if(category !== 'all') where.push(sql`category = ${category}`);
  if(q){
    const like = '%' + likeEscape(q) + '%';
    where.push(sql`(name ILIKE ${like} OR short_desc ILIKE ${like} OR CAST(tags AS TEXT) ILIKE ${like})`);
  }
  const rows = await query(sql`SELECT ${COLUMNS} FROM products WHERE ${sql.join(where)} ORDER BY ${orderBy(sort, SORTS)}`);
  res.json({ products: rows });
});

router.get('/products/:slug', validate(S.params.slug, 'params'), async (req, res) => {
  const p = await one(sql`SELECT ${COLUMNS} FROM products WHERE slug = ${req.valid.params.slug} AND is_active = true`);
  if(!p) return res.status(404).json({ error:'Produk tidak ditemukan.' });
  res.json({ product: p });
});

/* ---------- Admin ---------- */
router.post('/admin/products', requireAuth, requireRole('admin'), validate(S.product), async (req, res) => {
  const p = req.valid.body;
  const row = await one(sql`
    INSERT INTO products (sku, slug, name, category, size, short_desc, description, pricing_unit, base_price, price_status, lead_time, options, tags, is_active)
    VALUES (${p.sku}, ${slugify(p.name)}, ${p.name}, ${p.category}, ${p.size}, ${p.short_desc}, ${p.description}, ${p.pricing_unit},
            ${p.base_price}, ${p.price_status}, ${p.lead_time}, ${JSON.stringify(p.options)}, ${JSON.stringify(p.tags)}, ${p.is_active})
    RETURNING ${COLUMNS}`);
  res.status(201).json({ product: row });
});

router.patch('/admin/products/:sku', requireAuth, requireRole('admin'), validate(S.params.sku, 'params'), validate(S.product), async (req, res) => {
  const p = req.valid.body;
  const row = await one(sql`
    UPDATE products SET slug = ${slugify(p.name)}, name = ${p.name}, category = ${p.category}, size = ${p.size},
      short_desc = ${p.short_desc}, description = ${p.description}, pricing_unit = ${p.pricing_unit}, base_price = ${p.base_price},
      price_status = ${p.price_status}, lead_time = ${p.lead_time}, options = ${JSON.stringify(p.options)},
      tags = ${JSON.stringify(p.tags)}, is_active = ${p.is_active}, updated_by = ${req.user.id}
    WHERE sku = ${req.valid.params.sku}
    RETURNING ${COLUMNS}`);
  if(!row) return res.status(404).json({ error:'Produk tidak ditemukan.' });
  res.json({ product: row });
});

module.exports = router;
