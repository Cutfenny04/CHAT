/* =========================================================
   views/product.js — Detail produk (M-05)
   ========================================================= */
function viewProduct(slug){
  const p = Store.productBySlug(slug);
  if(!p || !p.is_active) return viewCatalog();
  const related = Store.activeProducts().filter(x => x.category === p.category && x.sku !== p.sku).slice(0, 2);
  const waMsg = `Halo Graha Media, saya mau tanya tentang ${p.name} (${p.sku}).`;
  return phone(`
  <div style="padding:0 18px"><a class="back" href="#/katalog">${I.left} Katalog</a></div>
  <div class="detail-art reveal">${art(p)}</div>
  <section class="sec">
    <div class="row reveal" style="gap:6px;flex-wrap:wrap"><span class="badge b-mist">${catName(p.category)}</span>${priceTag(p)}</div>
    <h1 class="h1 reveal" style="margin-top:8px">${esc(p.name)}</h1>
    <p class="muted reveal" style="margin-top:6px">${esc(p.description || p.short_desc)}</p>
    <p class="reveal" style="margin-top:12px"><span class="price" style="font-size:24px">mulai ${rp(p.base_price)}</span> <span class="muted small">/ ${UNIT[p.pricing_unit]}</span></p>
    <div class="card reveal mt"><dl class="spec">
      <dt>SKU</dt><dd>${p.sku}</dd>
      <dt>Satuan</dt><dd>per ${UNIT[p.pricing_unit]}</dd>
      <dt>Estimasi waktu</dt><dd>${esc(p.lead_time)}</dd>
      <dt>Status tarif</dt><dd>${p.price_status}</dd>
      <dt>Opsi</dt><dd>${(p.options || []).map(esc).join(' · ') || '—'}</dd></dl></div>
    <div class="stack mt reveal">
      <a class="btn btn-berry btn-block" href="#/pesan/${p.slug}">${I.upload} Pesan & unggah PDF</a>
      <a class="btn btn-ghost btn-block" target="_blank" rel="noopener" href="${wa(CONFIG.WA_TOKO, waMsg)}">${I.chat} Tanya via WhatsApp</a>
    </div>
    ${p.price_status === 'simulasi' ? '<p class="note mt reveal">Tarif simulasi: belum dikonfirmasi toko, dipakai untuk uji prototype.</p>' : ''}
  </section>
  ${related.length ? `<div class="stitch-draw"></div>
    <section class="sec" style="padding-bottom:10px"><h2 class="h2 reveal" style="font-size:21px">Sering dipesan <em>bersama</em></h2></section>
    <div class="grid" data-stagger>${related.map(pcard).join('')}</div>` : ''}`, 'katalog', waMsg);
}
