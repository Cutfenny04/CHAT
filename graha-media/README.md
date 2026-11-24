# Graha Media — Prototype Website Pemesanan Print

Prototype frontend untuk capstone UMKM Graha Media Percetakan, mengikuti PRD.
Dibuat dengan HTML, CSS, dan JavaScript biasa (tanpa build), dipecah per fitur agar mudah dipahami.

## Cara menjalankan

1. Buka folder `graha-media` di VS Code.
2. Klik kanan `index.html` → **Open with Live Server** (ekstensi Live Server).
   Alternatif: di terminal folder ini jalankan `python -m http.server 8000`, lalu buka `http://localhost:8000`.
3. Untuk melihat tampilan HP: tekan F12 → ikon perangkat (Ctrl+Shift+M).
4. Pindah ke panel admin lewat tombol **Admin · iPad/Web** di bar atas.

### Akun demo

| Peran | Email | Kata sandi |
|---|---|---|
| Mahasiswa | `mahasiswa@demo.id` | `demo123` |
| Admin | `admin@grahamedia.id` | `admin123` |

Mahasiswa juga bisa membuat akun baru lewat tab **Daftar**.

### Mencoba alur lengkap

1. Masuk sebagai mahasiswa → **Cetak** → **Coba dengan file contoh** (tanpa internet), atau unggah PDF sendiri (butuh internet untuk PDF.js).
2. Smart Print Check → Print Preview Simulator → Peta Warna & Nota Jahit → Kirim.
3. Buka tab kedua, masuk sebagai admin, tandai pesanan **Selesai** (daftar, papan kanban, atau mode sibuk).
4. Status di tab mahasiswa ikut berubah dalam beberapa detik.

## Struktur folder

```
graha-media/
├── index.html                  Halaman utama, memuat semua CSS & JS
├── css/
│   ├── base.css                Token warna palet, reset, tombol, form
│   ├── patterns.css            Motif denim, renda, polka, kotak-kotak, jahitan
│   ├── animations.css          Animasi scroll & keyframes, reduced-motion
│   ├── student.css             Tampilan mahasiswa (HP): header, nav, beranda, katalog, login
│   ├── order-flow.css          Alur pesan: unggah, cek, simulator, peta warna, nota, status
│   └── admin.css               Panel admin (iPad/web): dashboard, kanban, tabel, modal
└── js/
    ├── config.js               Nomor WhatsApp, batas file, jam ramai, akun demo
    ├── data/
    │   ├── products.js         Data awal katalog + validasi skema produk
    │   └── tariff.js           Tarif warna, pengali kertas, ukuran kertas
    ├── core/
    │   ├── utils.js            Fungsi bantu, format Rupiah, ikon
    │   ├── store.js            Penyimpanan data (localStorage) — pengganti backend
    │   ├── state.js            State tampilan yang sedang aktif
    │   ├── animations.js       Logika animasi scroll
    │   └── router.js           Routing #/... dan penjaga login
    ├── features/
    │   ├── search.js           Pencarian toleran salah ketik + sinonim
    │   ├── pdf-analyzer.js     Baca PDF (PDF.js) & analisis piksel tiap halaman
    │   ├── smart-print-check.js  M-12 Smart Print Check
    │   ├── print-preview.js    M-13 Print Preview Simulator
    │   ├── pricing.js          Perhitungan estimasi harga
    │   └── color-map.js        Peta Warna Halaman + Nota Jahit
    ├── views/                  Halaman mahasiswa
    │   ├── components.js       Header, nav bawah, tombol WhatsApp, kartu produk
    │   ├── auth.js             Masuk & daftar
    │   ├── home.js             Beranda
    │   ├── catalog.js          Katalog & pencarian
    │   ├── product.js          Detail produk
    │   ├── order-flow.js       Alur pesan 5 langkah, kartu pesanan
    │   ├── orders.js           Status pesanan + pesan lagi
    │   └── profile.js          Profil
    ├── admin/                  Panel admin
    │   ├── admin-shell.js      Sidebar & kerangka
    │   ├── admin-orders.js     Daftar, detail, kanban, mode sibuk
    │   ├── admin-catalog.js    Tambah/ubah/nonaktifkan produk
    │   └── admin-tariff.js     Ubah tarif
    └── app.js                  Titik mulai aplikasi
```

## Pemetaan fitur PRD

| ID | Fitur | File |
|---|---|---|
| M-01 / A-01 | Login, daftar, profil | `views/auth.js`, `views/profile.js` |
| M-02 | Beranda + indikator jam ramai | `views/home.js` |
| M-03, M-04 | Katalog, pencarian, filter, urutkan | `views/catalog.js`, `features/search.js` |
| M-05 | Detail produk | `views/product.js` |
| M-06 – M-08 | Form pesan, estimasi, konfirmasi | `views/order-flow.js`, `features/pricing.js` |
| M-09 | Status pesanan | `views/orders.js` |
| M-10 | Tombol WhatsApp (`wa.me`, pesan terisi) | `views/components.js` |
| M-11 | Pesan lagi | `views/orders.js` |
| M-12 | Smart Print Check | `features/smart-print-check.js`, `features/pdf-analyzer.js` |
| M-13 | Print Preview Simulator | `features/print-preview.js` |
| A-02 – A-05 | Dashboard, daftar, detail, ubah status | `admin/admin-orders.js` |
| A-06 | Papan kanban (drag & drop) | `admin/admin-orders.js` |
| A-07 | Kelola katalog | `admin/admin-catalog.js` |
| A-08 | Kelola tarif | `admin/admin-tariff.js` |
| A-09 | Chat pelanggan via WhatsApp | `admin/admin-orders.js` |
| A-10, A-11 | Laporan pemeriksaan & konfigurasi cetak | `admin/admin-orders.js` |

## Batasan prototype

- Data (akun, pesanan, katalog, tarif) disimpan di **localStorage browser**, bukan database. Hapus data situs di browser untuk mengulang dari awal.
- File PDF tidak diunggah ke server; tombol **Unduh PDF** di admin nonaktif.
- Kata sandi akun demo tersimpan apa adanya, hanya untuk demo. Backend asli wajib meng-hash kata sandi.
- Tarif selain hitam putih masih **simulasi** sampai dikonfirmasi Pak Herman.
- Ganti `WA_TOKO` di `js/config.js` dengan nomor WhatsApp toko yang asli.

## Langkah ke backend

Fungsi di `js/core/store.js` adalah satu-satunya tempat data dibaca/ditulis. Saat backend Express + Supabase siap,
ganti isi fungsi-fungsi itu dengan panggilan REST API (lihat daftar endpoint di PRD bagian 10), sementara tampilan tidak perlu diubah.
Analisis warna dan Smart Print Check di `features/pdf-analyzer.js` dapat dipindahkan ke layanan Python (PyMuPDF + Pillow/OpenCV).
