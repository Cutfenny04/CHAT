/* =========================================================
   config.js — pengaturan umum aplikasi
   Ubah nilai di sini tanpa menyentuh file lain.
   ========================================================= */
const CONFIG = {
  WA_TOKO: '6281234567890',   // GANTI: nomor WhatsApp Graha Media (format 62...)
  MAX_MB: 20,                 // batas ukuran PDF (PRD R9)
  MAX_PAGES: 50,              // batas jumlah halaman
  TARGET_SECONDS: 10,         // target waktu estimasi harga
  PDFJS_CDN: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/',
  /* Jam ramai toko (dari wawancara): pagi–siang setiap hari, malam Senin */
  isPeakHour(d = new Date()){
    const h = d.getHours(), day = d.getDay();
    return (h >= 7 && h < 13) || (day === 1 && h >= 18 && h < 22);
  }
};

/* Akun demo prototype. Di backend asli kata sandi di-hash dan disimpan di Supabase. */
const DEMO_USERS = [
  { email:'mahasiswa@demo.id',    password:'demo123',  role:'mahasiswa', name:'Mahasiswa Demo', wa:'6281200000000' },
  { email:'admin@grahamedia.id',  password:'admin123', role:'admin',     name:'Pak Herman',     wa:'6281234567890' }
];

/* Pengguna yang memilih "kurangi gerakan" di sistem operasinya */
const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Wadah semua aksi tombol (onclick="App.xxx()"). Tiap file fitur menambahkan aksinya sendiri. */
const App = {};
window.App = App;
document.documentElement.classList.add('js');
