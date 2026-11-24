/* =========================================================
   core/store.js — penyimpanan data (pengganti backend)
   Prototype memakai localStorage browser. Di versi backend,
   fungsi-fungsi ini diganti panggilan REST API ke Express + Supabase.
   ========================================================= */
const mem = {};
const db = {
  get(k, d){ if(k in mem) return mem[k]; try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ mem[k] = v; try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){ /* kuota penuh: tetap di memori */ } },
  forget(k){ delete mem[k]; }
};

const Store = {
  /* ---------- Produk & kategori ---------- */
  products(){ return db.get('gm_products', DEFAULT_PRODUCTS); },
  activeProducts(){ return this.products().filter(p => p.is_active); },
  saveProducts(list){ db.set('gm_products', list); },
  product(sku){ return this.products().find(p => p.sku === sku); },
  productBySlug(slug){ return this.products().find(p => p.slug === slug); },

  /* ---------- Tarif (hitam putih = harga PRT-001) ---------- */
  tariff(){
    const t = db.get('gm_tariff', DEFAULT_TARIFF);
    const bwProd = this.product('PRT-001');
    return { ...t, bw: bwProd.base_price, bwStatus: bwProd.price_status };
  },
  saveTariff(t){ const { bw, bwStatus, ...rest } = t; db.set('gm_tariff', rest); },

  /* ---------- Pesanan ---------- */
  orders(){ return db.get('gm_orders', []); },
  saveOrders(o){ db.set('gm_orders', o); },
  order(code){ return this.orders().find(o => o.code === code); },
  addOrder(o){ const all = this.orders(); all.push(o); this.saveOrders(all); },
  updateStatus(code, status, by){
    const all = this.orders(), o = all.find(x => x.code === code); if(!o) return;
    o.status = status; o.history.push({ at:Date.now(), status, by }); this.saveOrders(all);
  },
  nextCode(){
    const n = db.get('gm_seq', 3) + 1; db.set('gm_seq', n);
    const d = new Date();
    return `GM-${String(d.getDate()).padStart(2,'0')}${String(d.getMonth()+1).padStart(2,'0')}-${String(n).padStart(3,'0')}`;
  },

  /* ---------- Akun & sesi ---------- */
  users(){ return db.get('gm_users', DEMO_USERS); },
  saveUsers(u){ db.set('gm_users', u); },
  session(){ const s = db.get('gm_session', null); return s ? this.users().find(u => u.email === s.email) || null : null; },
  login(email, password){
    const u = this.users().find(x => x.email.toLowerCase() === email.trim().toLowerCase() && x.password === password);
    if(u) db.set('gm_session', { email:u.email });
    return u || null;
  },
  register(data){
    const users = this.users();
    if(users.some(u => u.email.toLowerCase() === data.email.toLowerCase())) return { error:'Email sudah terdaftar.' };
    const u = { ...data, role:'mahasiswa' }; users.push(u); this.saveUsers(users);
    db.set('gm_session', { email:u.email }); return { user:u };
  },
  updateProfile(patch){
    const users = this.users(), me = this.session(); if(!me) return;
    Object.assign(users.find(u => u.email === me.email), patch); this.saveUsers(users);
  },
  logout(){ db.set('gm_session', null); },

  /* ---------- Data contoh pesanan dari mahasiswa lain ---------- */
  seed(){
    if(db.get('gm_orders', null)) return;
    const now = Date.now(), d = new Date(), dm = `${String(d.getDate()).padStart(2,'0')}${String(d.getMonth()+1).padStart(2,'0')}`;
    const base = (o) => ({ thumbs:[], copies:1, note:'', finishing:{jilid:'none',laminasi:false,potong:false}, ...o });
    this.saveOrders([
      base({code:`GM-${dm}-001`, createdAt:now-25*60000, email:'rizky@demo.id', customer:{name:'Rizky A.', wa:'6281211110001'}, file:{name:'Laporan_Praktikum_Fisika.pdf', pages:24, mb:'3,1 MB'}, config:{paper:'A4',orient:'portrait',scale:'fit',duplex:false,layout:1,bind:'left'}, sheets:24, sidesN:24, finishing:{jilid:'soft',laminasi:false,potong:false}, note:'Tolong jilid warna biru.', est:{total:13100, lines:[{label:'Cetak hitam putih A4',sub:'24 muka × 1 salinan',amount:8000},{label:'Jilid Soft Cover',sub:'1 × Rp5.000',amount:5000}]}, color:{colN:0,bwN:24,maxPct:0}, check:{score:23,total:24,issues:['Halaman kosong: hal. 24 terindikasi kosong']}, status:'Belum selesai', history:[{at:now-25*60000,status:'Belum selesai',by:'Sistem'}]}),
      base({code:`GM-${dm}-002`, createdAt:now-8*60000, email:'nadia@demo.id', customer:{name:'Nadia P.', wa:'6281211110002'}, file:{name:'Poster_Seminar_Himpunan.pdf', pages:1, mb:'6,8 MB'}, config:{paper:'A3',orient:'portrait',scale:'fit',duplex:false,layout:1,bind:'left'}, copies:3, sheets:1, sidesN:1, finishing:{jilid:'none',laminasi:true,potong:false}, est:{total:21000, lines:[{label:'Cetak warna A3',sub:'1 muka × 3 salinan',amount:12000},{label:'Laminasi',sub:'3 lembar × Rp3.000',amount:9000}]}, color:{colN:1,bwN:0,maxPct:78}, check:{score:1,total:1,issues:[]}, status:'Belum selesai', history:[{at:now-8*60000,status:'Belum selesai',by:'Sistem'}]}),
      base({code:`GM-${dm}-003`, createdAt:now-130*60000, email:'fajar@demo.id', customer:{name:'Fajar M.', wa:'6281211110003'}, file:{name:'Slide_Kewirausahaan.pdf', pages:12, mb:'2,4 MB'}, config:{paper:'A4',orient:'landscape',scale:'fit',duplex:true,layout:2,bind:'left'}, sheets:3, sidesN:6, note:'2 slide per halaman ya.', est:{total:6000, lines:[{label:'Cetak warna A4',sub:'6 muka × 1 salinan',amount:6000}]}, color:{colN:6,bwN:0,maxPct:22}, check:{score:12,total:12,issues:[]}, status:'Selesai', history:[{at:now-130*60000,status:'Belum selesai',by:'Sistem'},{at:now-70*60000,status:'Selesai',by:'Pak Herman'}]})
    ]);
  }
};
