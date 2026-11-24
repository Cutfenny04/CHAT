# Backend Graha Media — API aman (anti SQL injection)

Express + PostgreSQL (Supabase). Folder ini adalah kerangka backend sesuai PRD bagian 10,
dengan fokus pada keamanan. Frontend prototype belum memanggil API ini; sambungkan dengan
mengganti fungsi di `../js/core/store.js` menjadi `fetch()` ke endpoint di bawah.

## Menjalankan

```bash
cd backend
npm install
cp .env.example .env      # isi DATABASE_URL, JWT_SECRET, CORS_ORIGINS
npm test                  # 14 uji keamanan, memakai database tiruan di memori (tanpa Supabase)
npm start                 # http://localhost:3000
```

Di Supabase SQL Editor jalankan berurutan: `db/schema.sql`, lalu `db/security.sql`.

## Bagaimana SQL injection dicegah

| Lapisan | Di mana | Apa yang dilakukan |
|---|---|---|
| 1. Parameterized query | `src/lib/db.js` | Semua query ditulis `sql\`... ${nilai}\``; nilai dikirim sebagai parameter `$1, $2`, tidak pernah digabung ke teks SQL. `query()` menolak string SQL biasa. |
| 2. Daftar putih | `src/lib/db.js` (`orderBy`), `src/schemas.js` | Nama kolom & arah urutan hanya dari daftar tetap; kategori/status/ukuran memakai `enum`. |
| 3. Escape wildcard LIKE | `likeEscape()` | `%` dan `_` dari pengguna tidak jadi pola pencarian. |
| 4. Validasi skema (Zod) | `src/schemas.js` | Tipe, panjang, format dibatasi; field tak dikenal dibuang (anti mass assignment); pola SQLi/XSS ditolak sebagai lapisan tambahan. |
| 5. Hak akses minimum | `db/security.sql` | Role `gm_app` tidak bisa DROP/ALTER/TRUNCATE/DELETE, hanya kolom tertentu yang bisa di-UPDATE. |
| 6. Row Level Security | `db/security.sql` | Akses langsung ke tabel lewat API publik Supabase ditolak. |
| 7. Batasan database | `db/schema.sql` | `CHECK` panjang & nilai, `UNIQUE`, `FOREIGN KEY`. |
| 8. Error tidak bocor | `errorHandler` | Pesan SQL/stack hanya di log server, pengguna menerima pesan umum. |
| 9. Timeout query | `statement_timeout = 5s` | Menghentikan serangan berbasis waktu (`pg_sleep`). |

## Keamanan lain

- **Kata sandi**: bcrypt (cost 12), aturan minimal 8 karakter berisi huruf & angka.
- **Sesi**: JWT di cookie `httpOnly` + `SameSite=Strict` + `Secure` (produksi), berlaku 8 jam; peran dicek ulang ke database tiap permintaan.
- **CSRF**: token double-submit (`GET /api/auth/csrf`, kirim di header `X-CSRF-Token`).
- **Brute force**: login dibatasi 5 percobaan gagal / 15 menit per IP + email; API umum 300 permintaan / 15 menit.
- **Header aman** (Helmet): CSP, HSTS, `X-Frame-Options`, `nosniff`, tanpa `X-Powered-By`.
- **CORS**: hanya asal yang terdaftar di `CORS_ORIGINS`.
- **Upload**: maks. 20 MB, 1 file, dicek isi `%PDF-` (bukan hanya ekstensi), nama file dibersihkan, nama di storage acak.
- **Otorisasi**: mahasiswa hanya melihat pesanannya sendiri (`user_id` dari sesi), endpoint admin dijaga `requireRole('admin')`.
- **Rahasia**: semua kunci di `.env` (tidak di-commit, lihat `.gitignore`).

## Endpoint

| Method | Endpoint | Akses |
|---|---|---|
| GET | `/api/auth/csrf` | publik |
| POST | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` | publik |
| GET | `/api/auth/me` | login |
| GET | `/api/products?q=&category=&sort=`, `/api/products/:slug` | publik |
| POST / PATCH | `/api/admin/products`, `/api/admin/products/:sku` | admin |
| POST | `/api/uploads` (multipart, field `file`) | mahasiswa |
| POST | `/api/orders` | mahasiswa |
| GET | `/api/orders/me` | login |
| GET | `/api/admin/orders?status=` | admin |
| PATCH | `/api/admin/orders/:code/status` | admin |

## Belum dikerjakan (lanjutan)

- Unggah file ke Supabase Storage (bucket privat) — tandai `TODO` di `src/routes/orders.js`.
- Menghitung ulang estimasi harga di server dari data analisis (saat ini `est_total` dari frontend, harga final dikonfirmasi admin).
- Endpoint kelola tarif.
