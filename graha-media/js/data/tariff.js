/* =========================================================
   data/tariff.js — tarif awal & ukuran kertas
   Tarif hitam putih diambil dari produk PRT-001 (satu sumber).
   Admin bisa mengubah tarif di menu Tarif.
   ========================================================= */
const DEFAULT_TARIFF = {
  /* Tarif warna per muka A4 berdasarkan % area berwarna (simulasi) */
  tiers: [
    { max:10,  price:750  },
    { max:30,  price:1000 },
    { max:60,  price:1500 },
    { max:101, price:2000 }
  ],
  tierStatus: 'simulasi',
  /* Pengali harga per ukuran kertas (simulasi) */
  paperFactor: { A4:1, F4:1.2, A3:2 },
  paperStatus: 'simulasi'
};

/* Ukuran kertas dalam milimeter */
const PAPERS = { A4:{w:210,h:297}, A3:{w:297,h:420}, F4:{w:215,h:330} };

/* Ukuran halaman PDF dalam point (1 pt = 1/72 inci) untuk deteksi ukuran */
const SIZE_REF = [['A4',595,842],['A3',842,1191],['F4',609,935],['Letter',612,792],['Legal',612,1008],['A5',420,595]];
