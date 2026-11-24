-- =========================================================
-- schema.sql — tabel Graha Media (PostgreSQL / Supabase)
-- Batasan (CHECK) di database adalah lapisan terakhir: data
-- yang tidak valid ditolak walau lolos dari aplikasi.
-- Jalankan di Supabase SQL Editor, lalu jalankan security.sql.
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE CHECK (length(email) BETWEEN 5 AND 100),
  name          TEXT NOT NULL CHECK (length(name) BETWEEN 2 AND 60),
  wa            TEXT NOT NULL CHECK (length(wa) BETWEEN 10 AND 16),
  role          TEXT NOT NULL DEFAULT 'mahasiswa' CHECK (role IN ('mahasiswa','admin')),
  password_hash TEXT NOT NULL CHECK (length(password_hash) >= 50),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  sku           TEXT PRIMARY KEY CHECK (length(sku) = 7),
  slug          TEXT NOT NULL UNIQUE CHECK (length(slug) <= 80),
  name          TEXT NOT NULL CHECK (length(name) BETWEEN 3 AND 40),
  category      TEXT NOT NULL CHECK (category IN ('print','warna','jilid','finishing')),
  size          TEXT NOT NULL CHECK (size IN ('A4','A3','F4','—')),
  short_desc    TEXT NOT NULL CHECK (length(short_desc) <= 90),
  description   TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 400),
  pricing_unit  TEXT NOT NULL CHECK (pricing_unit IN ('per_halaman','per_lembar','per_dokumen','per_pcs')),
  base_price    INTEGER NOT NULL CHECK (base_price BETWEEN 1 AND 10000000),
  price_status  TEXT NOT NULL CHECK (price_status IN ('simulasi','terkonfirmasi')),
  lead_time     TEXT NOT NULL CHECK (length(lead_time) <= 30),
  options       JSONB NOT NULL DEFAULT '[]',
  tags          JSONB NOT NULL DEFAULT '[]',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  updated_by    INTEGER REFERENCES users(id),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id            SERIAL PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  user_id       INTEGER NOT NULL REFERENCES users(id),
  file_name     TEXT NOT NULL CHECK (length(file_name) <= 120),
  pages         INTEGER NOT NULL CHECK (pages BETWEEN 1 AND 50),
  config        JSONB NOT NULL,
  copies        INTEGER NOT NULL CHECK (copies BETWEEN 1 AND 99),
  finishing     JSONB NOT NULL,
  note          TEXT NOT NULL DEFAULT '' CHECK (length(note) <= 500),
  est_total     INTEGER NOT NULL CHECK (est_total >= 0),
  status        TEXT NOT NULL DEFAULT 'Belum selesai' CHECK (status IN ('Belum selesai','Selesai')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_history (
  id            SERIAL PRIMARY KEY,
  order_id      INTEGER NOT NULL REFERENCES orders(id),
  status        TEXT NOT NULL CHECK (status IN ('Belum selesai','Selesai')),
  by_user       INTEGER NOT NULL REFERENCES users(id),
  at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user   ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
