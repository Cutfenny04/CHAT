/* =========================================================
   data/products.js — data awal katalog (skema konsisten, PRD bagian 6)
   Admin bisa menambah/mengubah produk di menu Katalog;
   perubahan disimpan oleh js/core/store.js.
   ========================================================= */
const CATEGORIES = [
  { id:'print',     name:'Print Dokumen' },
  { id:'warna',     name:'Print Warna' },
  { id:'jilid',     name:'Jilid' },
  { id:'finishing', name:'Finishing' }
];
const UNIT = { per_halaman:'halaman', per_lembar:'lembar', per_dokumen:'dokumen', per_pcs:'pcs' };
const SIZES = ['A4','A3','F4','—'];

const DEFAULT_PRODUCTS = [
  {sku:'PRT-001', slug:'print-hitam-putih-a4', name:'Print Hitam Putih A4', category:'print', size:'A4', short_desc:'Makalah, modul, dan skripsi. Tarif dari wawancara toko.', description:'Cetak dokumen teks hitam putih di kertas A4. Tarif Rp1.000 per 3 halaman sesuai keterangan Pak Herman.', pricing_unit:'per_halaman', base_price:333, price_status:'terkonfirmasi', options:['A4','Satu sisi / bolak-balik','1 atau 2 halaman per lembar'], needs_file:true, lead_time:'±30 menit', tags:['hitam putih','bw','fotokopi','fc','makalah','skripsi','tugas','modul','laporan'], is_active:true},
  {sku:'PRT-002', slug:'print-warna-a4', name:'Print Warna A4', category:'warna', size:'A4', short_desc:'Slide, laporan bergambar. Harga mengikuti proporsi warna.', description:'Harga per halaman dihitung dari persentase area berwarna yang dianalisis otomatis (Peta Warna Halaman).', pricing_unit:'per_halaman', base_price:750, price_status:'simulasi', options:['A4','Satu sisi / bolak-balik','1 atau 2 halaman per lembar'], needs_file:true, lead_time:'±45 menit', tags:['warna','color','slide','presentasi','ppt','gambar','foto'], is_active:true},
  {sku:'PRT-003', slug:'print-warna-a3', name:'Print Warna A3', category:'warna', size:'A3', short_desc:'Poster seminar dan infografis ukuran besar.', description:'Cetak warna di kertas A3. Cocok untuk poster acara kampus dan infografis.', pricing_unit:'per_halaman', base_price:1500, price_status:'simulasi', options:['A3','Satu sisi'], needs_file:true, lead_time:'±1 jam', tags:['poster','a3','infografis','seminar','besar','warna'], is_active:true},
  {sku:'PRT-004', slug:'print-hitam-putih-f4', name:'Print Hitam Putih F4', category:'print', size:'F4', short_desc:'Dokumen resmi dan formulir ukuran folio.', description:'Cetak hitam putih di kertas F4 (folio) untuk formulir dan berkas administrasi.', pricing_unit:'per_halaman', base_price:400, price_status:'simulasi', options:['F4','Satu sisi / bolak-balik'], needs_file:true, lead_time:'±30 menit', tags:['f4','folio','formulir','berkas','legal','hitam putih'], is_active:true},
  {sku:'JLD-001', slug:'jilid-soft-cover', name:'Jilid Soft Cover', category:'jilid', size:'—', short_desc:'Laporan praktikum dan proposal, sampul mika.', description:'Jilid lem dengan sampul soft cover. Dipilih di langkah simulasi saat memesan cetak.', pricing_unit:'per_dokumen', base_price:5000, price_status:'simulasi', options:['Posisi jilid kiri'], needs_file:true, lead_time:'±1 jam', tags:['jilid','binding','laporan','proposal','skripsi','soft cover'], is_active:true},
  {sku:'JLD-002', slug:'jilid-spiral', name:'Jilid Spiral', category:'jilid', size:'—', short_desc:'Modul dan buku catatan yang mudah dibuka rata.', description:'Jilid spiral plastik. Dokumen bisa dibuka 360°.', pricing_unit:'per_dokumen', base_price:8000, price_status:'simulasi', options:['Posisi jilid kiri / atas'], needs_file:true, lead_time:'±1 jam', tags:['jilid','spiral','ring','binding','modul'], is_active:true},
  {sku:'FIN-001', slug:'laminasi-a4', name:'Laminasi A4', category:'finishing', size:'A4', short_desc:'Sertifikat dan kartu agar tahan air.', description:'Laminasi plastik per lembar hasil cetak.', pricing_unit:'per_lembar', base_price:3000, price_status:'simulasi', options:['Glossy'], needs_file:true, lead_time:'±20 menit', tags:['laminasi','laminating','plastik','sertifikat','kartu'], is_active:true},
  {sku:'FIN-002', slug:'potong-kertas', name:'Potong Kertas', category:'finishing', size:'—', short_desc:'Rapikan kartu nama, undangan, atau label.', description:'Pemotongan hasil cetak sesuai garis potong.', pricing_unit:'per_dokumen', base_price:2000, price_status:'simulasi', options:['Sesuai catatan'], needs_file:true, lead_time:'±20 menit', tags:['potong','cutting','kartu nama','undangan','label'], is_active:true}
];

/* Produk yang dipakai sistem untuk perhitungan harga (tidak boleh dihapus) */
const SYSTEM_SKUS = ['PRT-001','JLD-001','JLD-002','FIN-001','FIN-002'];

/* Validasi skema — dipakai di form admin dan tabel katalog */
const REQUIRED_FIELDS = ['sku','slug','name','category','short_desc','pricing_unit','base_price','price_status','lead_time','tags'];
function validateProduct(p, all = [], editingSku = null){
  const errs = {};
  REQUIRED_FIELDS.forEach(k => {
    if(p[k] === undefined || p[k] === '' || p[k] === null) errs[k] = 'Wajib diisi';
  });
  if(p.sku && !/^[A-Z]{3}-\d{3}$/.test(p.sku)) errs.sku = 'Format KAT-NNN, mis. PRT-005';
  if(p.name && p.name.length > 40) errs.name = 'Maksimal 40 karakter';
  if(p.short_desc && p.short_desc.length > 90) errs.short_desc = 'Maksimal 90 karakter';
  if(!(Number(p.base_price) > 0)) errs.base_price = 'Harga harus lebih dari 0';
  if(!Array.isArray(p.tags) || p.tags.length < 2) errs.tags = 'Minimal 2 tag';
  if(all.some(x => x.sku === p.sku && x.sku !== editingSku)) errs.sku = 'SKU sudah dipakai';
  if(all.some(x => x.slug === p.slug && x.sku !== editingSku)) errs.name = 'Nama menghasilkan slug yang sudah dipakai';
  return errs;
}
const slugify = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const catName = id => (CATEGORIES.find(c => c.id === id) || {}).name || id;
