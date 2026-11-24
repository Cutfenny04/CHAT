-- =========================================================
-- security.sql — hak akses database (khusus Supabase/PostgreSQL)
-- Jalankan SETELAH schema.sql di Supabase SQL Editor.
--
-- 1. Role aplikasi "gm_app" dengan hak minimum (least privilege):
--    tidak bisa DROP/ALTER/TRUNCATE tabel, tidak bisa DELETE pesanan.
--    Jadi walaupun ada celah, perintah seperti "; DROP TABLE" gagal.
-- 2. Row Level Security (RLS) aktif: akses langsung lewat API
--    Supabase (anon key) ditolak; semua lewat backend Express.
-- =========================================================

-- 1. Role aplikasi (ganti sandi, lalu pakai di DATABASE_URL)
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'gm_app') THEN
    CREATE ROLE gm_app LOGIN PASSWORD 'GANTI_SANDI_YANG_KUAT';
  END IF;
END $$;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM gm_app;
GRANT USAGE ON SCHEMA public TO gm_app;
GRANT SELECT, INSERT          ON users          TO gm_app;
GRANT UPDATE (name, wa)       ON users          TO gm_app;   -- tidak bisa mengubah role/password_hash lewat UPDATE biasa
GRANT SELECT, INSERT, UPDATE  ON products       TO gm_app;   -- tanpa DELETE: produk hanya dinonaktifkan
GRANT SELECT, INSERT          ON orders         TO gm_app;
GRANT UPDATE (status)         ON orders         TO gm_app;   -- hanya kolom status yang bisa diubah
GRANT SELECT, INSERT          ON order_history  TO gm_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO gm_app;
ALTER ROLE gm_app SET statement_timeout = '5s';

-- 2. Row Level Security
ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;

-- Backend (gm_app) boleh mengakses; otorisasi per pengguna dilakukan di Express
CREATE POLICY gm_app_users    ON users         FOR ALL TO gm_app USING (true) WITH CHECK (true);
CREATE POLICY gm_app_products ON products      FOR ALL TO gm_app USING (true) WITH CHECK (true);
CREATE POLICY gm_app_orders   ON orders        FOR ALL TO gm_app USING (true) WITH CHECK (true);
CREATE POLICY gm_app_history  ON order_history FOR ALL TO gm_app USING (true) WITH CHECK (true);

-- Role publik Supabase hanya boleh membaca produk aktif (opsional untuk katalog)
CREATE POLICY public_read_products ON products FOR SELECT TO anon, authenticated USING (is_active = true);
REVOKE ALL ON users, orders, order_history FROM anon, authenticated;
