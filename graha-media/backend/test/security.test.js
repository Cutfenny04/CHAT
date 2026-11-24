/* =========================================================
   test/security.test.js — uji keamanan API (npm test)
   Memakai database PostgreSQL tiruan di memori (pg-mem),
   jadi tidak perlu Supabase untuk menjalankan tes ini.
   ========================================================= */
process.env.JWT_SECRET = 'tes-rahasia-jwt-minimal-32-karakter-panjang!';
process.env.BCRYPT_COST = '4';
process.env.CORS_ORIGINS = 'http://localhost:5500';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const { newDb, DataType } = require('pg-mem');
const { createApp } = require('../src/app');
const { sql } = require('../src/lib/db');

/* ---------- Siapkan database & aplikasi ---------- */
const mem = newDb();
// pg-mem belum punya fungsi length(); daftarkan agar CHECK di schema.sql bisa dipakai
mem.public.registerFunction({ name:'length', args:[DataType.text], returns:DataType.integer, implementation: s => s.length });
mem.public.none(fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8'));
const { Pool } = mem.adapters.createPg();
const pool = new Pool();
const app = createApp({ pool });

const seedAdmin = async () => {
  await pool.query(`INSERT INTO users (email, name, wa, role, password_hash) VALUES ($1,$2,$3,'admin',$4)`,
    ['admin@grahamedia.id', 'Pak Herman', '6281234567890', bcrypt.hashSync('Admin12345', 4)]);
  await pool.query(`INSERT INTO products (sku, slug, name, category, size, short_desc, pricing_unit, base_price, price_status, lead_time, tags)
    VALUES ('PRT-001','print-hitam-putih-a4','Print Hitam Putih A4','print','A4','Makalah','per_halaman',333,'terkonfirmasi','±30 menit','["bw","skripsi"]'),
           ('PRT-002','print-warna-a4','Print Warna A4','warna','A4','Slide','per_halaman',750,'simulasi','±45 menit','["warna","slide"]')`);
};

/* Klien dengan cookie sesi + token CSRF */
async function client(){
  const agent = request.agent(app);
  const r = await agent.get('/api/auth/csrf');
  const token = r.body.csrfToken;
  const send = (method, url) => agent[method](url).set('X-CSRF-Token', token);
  return { agent, post: url => send('post', url), patch: url => send('patch', url), get: url => agent.get(url) };
}
const tableCount = async t => (await pool.query(`SELECT COUNT(*)::int AS n FROM ${t}`)).rows[0].n;

test.before(seedAdmin);

/* ---------- 1. Query selalu berparameter ---------- */
test('sql`` mengubah input menjadi parameter, bukan teks SQL', () => {
  const evil = "x' OR '1'='1";
  const q = sql`SELECT * FROM users WHERE email = ${evil}`;
  assert.strictEqual(q.text, 'SELECT * FROM users WHERE email = $1');
  assert.deepStrictEqual(q.values, [evil]);
});

test('walau validasi dilewati, payload SQLi tetap diperlakukan sebagai data', async () => {
  const db = require('../src/lib/db');
  const rows = await db.query(sql`SELECT email FROM users WHERE email = ${"' OR '1'='1"}`);
  assert.strictEqual(rows.length, 0, 'tidak boleh mengembalikan semua pengguna');
  await db.query(sql`SELECT email FROM users WHERE email = ${"x'; DROP TABLE users; --"}`);
  assert.ok(await tableCount('users') >= 1, 'tabel users tetap ada');
});

test('query() menolak string SQL biasa (tidak bisa concat)', async () => {
  const db = require('../src/lib/db');
  await assert.rejects(() => db.query("SELECT * FROM users WHERE email = 'a'"), /parameterized/);
});

/* ---------- 2. SQL injection di login ---------- */
test('login dengan payload SQL injection ditolak', async () => {
  const c = await client();
  for(const email of ["admin@grahamedia.id' --", "' OR '1'='1", "admin@grahamedia.id' OR 1=1--"]){
    const r = await c.post('/api/auth/login').send({ email, password:"' OR '1'='1" });
    assert.ok([400, 401, 429].includes(r.status), `status ${r.status} untuk ${email}`);
    assert.ok(!r.headers['set-cookie']?.some(x => x.startsWith('gm_session=ey')), 'tidak boleh dapat sesi');
  }
});

/* ---------- 3. SQL injection di pencarian ---------- */
test('pencarian dengan payload SQLi tidak membocorkan data & tabel tetap utuh', async () => {
  const c = await client();
  const before = await tableCount('users');
  for(const q of ["' OR '1'='1", "%' UNION SELECT email, password_hash FROM users --", "'; DROP TABLE users; --"]){
    const r = await c.get('/api/products').query({ q });
    assert.strictEqual(r.status, 400, `payload "${q}" harus ditolak validasi`);
  }
  // Wildcard LIKE dari pengguna di-escape: "%" tidak mengembalikan semua produk
  const wild = await c.get('/api/products').query({ q:'%' });
  assert.strictEqual(wild.status, 200);
  assert.strictEqual(wild.body.products.length, 0);
  assert.strictEqual(await tableCount('users'), before);
});

test('parameter sort hanya dari daftar putih', async () => {
  const c = await client();
  const r = await c.get('/api/products').query({ sort:'name; DROP TABLE products' });
  assert.strictEqual(r.status, 400);
  assert.strictEqual(await tableCount('products'), 2);
});

/* ---------- 4. Data berisi kutip disimpan sebagai data biasa ---------- */
test("nama dengan tanda kutip (O'Brien) tersimpan apa adanya, bukan dieksekusi", async () => {
  const c = await client();
  const r = await c.post('/api/auth/register').send({ name:"Siti O'Brien", email:'siti@demo.id', wa:'6281211112222', password:'Rahasia123' });
  assert.strictEqual(r.status, 201);
  const row = (await pool.query(`SELECT name FROM users WHERE email = $1`, ['siti@demo.id'])).rows[0];
  assert.strictEqual(row.name, "Siti O'Brien");
});

/* ---------- 5. Otorisasi, CSRF, XSS ---------- */
test('mahasiswa tidak bisa memanggil endpoint admin', async () => {
  const c = await client();
  await c.post('/api/auth/login').send({ email:'siti@demo.id', password:'Rahasia123' }).expect(200);
  const r = await c.patch('/api/admin/orders/GM-0101-001/status').send({ status:'Selesai' });
  assert.strictEqual(r.status, 403);
});

test('permintaan tanpa token CSRF ditolak', async () => {
  const r = await request(app).post('/api/auth/login').send({ email:'siti@demo.id', password:'Rahasia123' });
  assert.strictEqual(r.status, 403);
});

test('catatan pesanan berisi skrip atau SQL ditolak', async () => {
  const c = await client();
  await c.post('/api/auth/login').send({ email:'siti@demo.id', password:'Rahasia123' }).expect(200);
  const base = { file_name:'Materi.pdf', pages:8, copies:1, est_total:5000,
    config:{ paper:'A4', orient:'portrait', scale:'fit', duplex:false, layout:1, bind:'left' },
    finishing:{ jilid:'none', laminasi:false, potong:false } };
  for(const note of ['<script>alert(1)</script>', "'; DELETE FROM orders; --"]){
    const r = await c.post('/api/orders').send({ ...base, note });
    assert.strictEqual(r.status, 400);
  }
  const ok = await c.post('/api/orders').send({ ...base, note:'Tolong jilid warna biru, hal 1-5' });
  assert.strictEqual(ok.status, 201);
  const mine = await c.get('/api/orders/me');
  assert.strictEqual(mine.body.orders.length, 1, 'hanya pesanan milik sendiri');
});

test('field tambahan seperti role diabaikan saat daftar (anti mass assignment)', async () => {
  const c = await client();
  const r = await c.post('/api/auth/register').send({ name:'Penyusup', email:'x@demo.id', wa:'6281299990000', password:'Rahasia123', role:'admin' });
  assert.strictEqual(r.status, 201);
  assert.strictEqual(r.body.user.role, 'mahasiswa');
});

test('error database tidak membocorkan detail SQL', async () => {
  const c = await client();
  const r = await c.post('/api/auth/register').send({ name:'Siti Lagi', email:'siti@demo.id', wa:'6281211113333', password:'Rahasia123' });
  assert.strictEqual(r.status, 409);
  assert.ok(!/duplicate|constraint|users_email/i.test(JSON.stringify(r.body)));
});

test('upload file bukan PDF ditolak walau namanya .pdf', async () => {
  const c = await client();
  await c.post('/api/auth/login').send({ email:'siti@demo.id', password:'Rahasia123' }).expect(200);
  const r = await c.post('/api/uploads').attach('file', Buffer.from('MZ bukan pdf'), { filename:'tugas.pdf', contentType:'application/pdf' });
  assert.strictEqual(r.status, 400);
  const ok = await c.post('/api/uploads').attach('file', Buffer.from('%PDF-1.7\n...'), { filename:'../../tugas<x>.pdf', contentType:'application/pdf' });
  assert.strictEqual(ok.status, 201);
  assert.ok(!ok.body.file.name.includes('/') && !ok.body.file.name.includes('<'));
});

test('header keamanan terpasang', async () => {
  const r = await request(app).get('/api/health');
  assert.ok(r.headers['content-security-policy']);
  assert.strictEqual(r.headers['x-content-type-options'], 'nosniff');
  assert.ok(!r.headers['x-powered-by']);
});
