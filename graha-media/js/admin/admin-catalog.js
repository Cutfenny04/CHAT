/* =========================================================
   admin/admin-catalog.js — Kelola katalog (A-07)
   Tambah, ubah, aktif/nonaktifkan produk dengan validasi skema.
   Produk tidak dihapus, hanya dinonaktifkan (PRD bagian 6).
   ========================================================= */
function viewAdminCatalog(){
  const list = Store.products();
  return adminShell('katalog', `<p class="eyebrow reveal">Kelola katalog</p><h1 class="h1 reveal">Data produk <em>konsisten</em></h1>
  <p class="muted reveal" style="margin:6px 0 18px;max-width:70ch">Semua produk mengikuti skema yang sama. Harga di katalog, Peta Warna, dan Nota Jahit diambil dari data ini.</p>
  <div class="row reveal" style="margin-bottom:14px;flex-wrap:wrap">
    <button class="btn btn-pine" onclick="App.editProduct()">${I.plus} Tambah produk</button>
    <button class="btn btn-ghost" onclick="App.resetCatalog()">Kembalikan data awal</button>
  </div>
  <div class="tblwrap reveal"><table class="tbl"><thead><tr><th>SKU</th><th>Nama</th><th>Kategori</th><th>Satuan</th><th>Harga dasar</th><th>Tarif</th><th>Estimasi</th><th>Validasi</th><th>Aktif</th><th></th></tr></thead><tbody>
  ${list.map(p => { const errs = Object.keys(validateProduct(p, list, p.sku)); return `<tr class="${p.is_active ? '' : 'off'}">
    <td><b>${p.sku}</b></td><td>${esc(p.name)}</td><td>${catName(p.category)}</td><td>${UNIT[p.pricing_unit]}</td>
    <td class="num">${rp(p.base_price)}</td><td>${priceTag(p)}</td><td>${esc(p.lead_time)}</td>
    <td>${errs.length ? `<span class="badge b-warn">${errs.join(', ')}</span>` : '<span class="badge b-ok">✓ lengkap</span>'}</td>
    <td><label class="toggle" style="margin:0"><input type="checkbox" ${p.is_active ? 'checked' : ''} ${SYSTEM_SKUS.includes(p.sku) ? 'disabled title="Dipakai perhitungan harga"' : ''} onchange="App.toggleProduct('${p.sku}',this.checked)"><span class="sr">Aktif</span></label></td>
    <td><button class="btn btn-ghost btn-sm" onclick="App.editProduct('${p.sku}')">${I.edit} Ubah</button></td></tr>`; }).join('')}
  </tbody></table></div>
  ${S.editing ? productModal() : ''}`);
}

function productModal(){
  const p = S.editing, e = S.editing._errs || {}, isNew = !p._orig;
  const opt = (arr, cur) => arr.map(([v, l]) => `<option value="${v}" ${String(cur) === String(v) ? 'selected' : ''}>${l}</option>`).join('');
  const fld = (id, label, html, full) => `<div class="field ${full ? 'full' : ''}"><label for="${id}">${label}</label>${html}${e[id] ? `<p class="ferr">${e[id]}</p>` : ''}</div>`;
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mt" onclick="if(event.target===this)App.closeModal()"><div class="box">
    <div class="row between"><h2 class="h2" id="mt">${isNew ? 'Tambah' : 'Ubah'} <em>produk</em></h2><button class="iconbtn" onclick="App.closeModal()" aria-label="Tutup">✕</button></div>
    <form class="formgrid" onsubmit="event.preventDefault();App.saveProduct()">
      ${fld('sku', 'SKU', `<input class="inp ${e.sku ? 'err' : ''}" id="sku" value="${esc(p.sku)}" placeholder="PRT-005" ${isNew ? '' : 'readonly'}>`)}
      ${fld('name', 'Nama produk', `<input class="inp ${e.name ? 'err' : ''}" id="name" value="${esc(p.name)}" maxlength="40" placeholder="Print Warna F4">`)}
      ${fld('category', 'Kategori', `<select class="inp" id="category">${opt(CATEGORIES.map(c => [c.id, c.name]), p.category)}</select>`)}
      ${fld('size', 'Ukuran', `<select class="inp" id="size">${opt(SIZES.map(s => [s, s]), p.size)}</select>`)}
      ${fld('short_desc', 'Deskripsi singkat (maks. 90)', `<input class="inp ${e.short_desc ? 'err' : ''}" id="short_desc" value="${esc(p.short_desc)}" maxlength="90">`, true)}
      ${fld('description', 'Deskripsi lengkap', `<textarea id="description" rows="2">${esc(p.description)}</textarea>`, true)}
      ${fld('pricing_unit', 'Satuan harga', `<select class="inp" id="pricing_unit">${opt(Object.entries(UNIT).map(([k, v]) => [k, 'per ' + v]), p.pricing_unit)}</select>`)}
      ${fld('base_price', 'Harga dasar (Rp)', `<input class="inp ${e.base_price ? 'err' : ''}" id="base_price" type="number" min="1" value="${esc(p.base_price)}">`)}
      ${fld('price_status', 'Status tarif', `<select class="inp" id="price_status">${opt([['simulasi','simulasi'],['terkonfirmasi','terkonfirmasi']], p.price_status)}</select>`)}
      ${fld('lead_time', 'Estimasi waktu', `<input class="inp ${e.lead_time ? 'err' : ''}" id="lead_time" value="${esc(p.lead_time)}" placeholder="±30 menit">`)}
      ${fld('options', 'Opsi (pisahkan dengan koma)', `<input class="inp" id="options" value="${esc((p.options || []).join(', '))}">`, true)}
      ${fld('tags', 'Tag pencarian (min. 2, pisahkan koma)', `<input class="inp ${e.tags ? 'err' : ''}" id="tags" value="${esc((p.tags || []).join(', '))}">`, true)}
      <div class="row full mt" style="justify-content:flex-end;gap:10px"><button type="button" class="btn btn-ghost" onclick="App.closeModal()">Batal</button><button class="btn btn-berry" type="submit">Simpan produk</button></div>
    </form></div></div>`;
}

Object.assign(App, {
  editProduct(sku){
    const p = sku ? Store.product(sku) : { sku:'', name:'', category:'print', size:'A4', short_desc:'', description:'', pricing_unit:'per_halaman', base_price:'', price_status:'simulasi', lead_time:'', options:[], tags:[], needs_file:true, is_active:true };
    S.editing = { ...p, _orig: sku || null }; render(true);
    setTimeout(() => { const el = $(sku ? '#name' : '#sku'); el && el.focus(); }, 50);
  },
  closeModal(){ S.editing = null; render(true); },
  saveProduct(){
    const list = Store.products(), orig = S.editing._orig;
    const val = id => $('#' + id).value.trim();
    const csv = id => val(id).split(',').map(s => s.trim()).filter(Boolean);
    const p = { ...(orig ? Store.product(orig) : { needs_file:true, is_active:true }),
      sku:val('sku').toUpperCase(), name:val('name'), category:val('category'), size:val('size'),
      short_desc:val('short_desc'), description:val('description'), pricing_unit:val('pricing_unit'),
      base_price:Number(val('base_price')), price_status:val('price_status'), lead_time:val('lead_time'),
      options:csv('options'), tags:csv('tags') };
    p.slug = slugify(p.name);
    const errs = validateProduct(p, list, orig);
    if(Object.keys(errs).length){ S.editing = { ...p, _orig:orig, _errs:errs }; render(true); toast('Periksa kembali isian yang ditandai'); return; }
    if(orig) list[list.findIndex(x => x.sku === orig)] = p; else list.push(p);
    Store.saveProducts(list); S.editing = null; toast(`${p.sku} disimpan`); render(true);
  },
  toggleProduct(sku, on){
    const list = Store.products(); list.find(p => p.sku === sku).is_active = on;
    Store.saveProducts(list); toast(`${sku} ${on ? 'diaktifkan' : 'dinonaktifkan'}`); render(true);
  },
  resetCatalog(){ Store.saveProducts(DEFAULT_PRODUCTS); toast('Katalog dikembalikan ke data awal'); render(true); }
});
