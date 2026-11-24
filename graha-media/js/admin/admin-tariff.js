/* =========================================================
   admin/admin-tariff.js — Kelola tarif (A-08)
   Satu sumber tarif untuk katalog, Peta Warna, dan Nota Jahit.
   Tarif hitam putih = harga produk PRT-001.
   ========================================================= */
function viewAdminTariff(){
  const T = Store.tariff(), fin = ['JLD-001','JLD-002','FIN-001','FIN-002'].map(s => Store.product(s));
  const statusSel = (id, cur) => `<select class="inp" id="${id}"><option ${cur === 'simulasi' ? 'selected' : ''}>simulasi</option><option ${cur === 'terkonfirmasi' ? 'selected' : ''}>terkonfirmasi</option></select>`;
  return adminShell('tarif', `<p class="eyebrow reveal">Kelola tarif</p><h1 class="h1 reveal">Tabel <em>tarif</em></h1>
  <p class="muted reveal" style="margin:6px 0 18px;max-width:70ch">Ubah angka lalu simpan; estimasi di sisi mahasiswa langsung memakai tarif baru. Tarif bertanda simulasi menunggu konfirmasi toko.</p>
  <form onsubmit="event.preventDefault();App.saveTariff()">
  <div class="tblwrap reveal"><table class="tbl" style="min-width:640px"><thead><tr><th>Item</th><th>Satuan</th><th>Tarif</th><th>Status</th></tr></thead><tbody>
    <tr><td><b>Cetak hitam putih A4</b><br><span class="small muted">Rp1.000 / 3 halaman dari wawancara</span></td><td>per muka</td><td><input class="inp" id="t-bw" type="number" min="1" value="${T.bw}"></td><td>${statusSel('s-bw', T.bwStatus)}</td></tr>
    ${T.tiers.map((t, i) => `<tr><td>Cetak warna A4 · ${i ? T.tiers[i-1].max : 1}–${t.max > 100 ? 100 : t.max}% area berwarna</td><td>per muka</td><td><input class="inp" id="t-tier${i}" type="number" min="1" value="${t.price}"></td><td>${i === 0 ? statusSel('s-tier', T.tierStatus) : '<span class="small muted">sama dengan baris pertama</span>'}</td></tr>`).join('')}
    ${Object.entries(T.paperFactor).filter(([k]) => k !== 'A4').map(([k, v], i) => `<tr><td>Pengali kertas ${k}</td><td>× harga A4</td><td><input class="inp" id="t-pf-${k}" type="number" step="0.1" min="0.1" value="${v}"></td><td>${i === 0 ? statusSel('s-paper', T.paperStatus) : '<span class="small muted">sama dengan baris di atas</span>'}</td></tr>`).join('')}
    ${fin.map(p => `<tr><td>${esc(p.name)} <span class="small muted">(${p.sku})</span></td><td>per ${UNIT[p.pricing_unit]}</td><td><input class="inp" id="t-${p.sku}" type="number" min="1" value="${p.base_price}"></td><td>${statusSel('s-' + p.sku, p.price_status)}</td></tr>`).join('')}
  </tbody></table></div>
  <div class="row mt reveal" style="flex-wrap:wrap"><button class="btn btn-berry" type="submit">Simpan tarif</button><button type="button" class="btn btn-ghost" onclick="App.resetTariff()">Kembalikan tarif awal</button></div>
  </form>`);
}

Object.assign(App, {
  saveTariff(){
    const num = id => Number($('#' + id).value);
    const T = Store.tariff();
    const tiers = T.tiers.map((t, i) => ({ ...t, price:num('t-tier' + i) }));
    const paperFactor = { ...T.paperFactor }; Object.keys(paperFactor).forEach(k => { if(k !== 'A4') paperFactor[k] = num('t-pf-' + k); });
    const all = [num('t-bw'), ...tiers.map(t => t.price), ...Object.values(paperFactor)];
    if(all.some(v => !(v > 0))){ toast('Semua tarif harus lebih dari 0'); return; }
    Store.saveTariff({ tiers, paperFactor, tierStatus:$('#s-tier').value, paperStatus:$('#s-paper').value });
    const list = Store.products();
    const setP = (sku, price, status) => { const p = list.find(x => x.sku === sku); p.base_price = price; p.price_status = status; };
    setP('PRT-001', num('t-bw'), $('#s-bw').value);
    ['JLD-001','JLD-002','FIN-001','FIN-002'].forEach(s => setP(s, num('t-' + s), $('#s-' + s).value));
    Store.saveProducts(list);
    toast('Tarif disimpan'); render(true);
  },
  resetTariff(){
    Store.saveTariff(DEFAULT_TARIFF);
    const list = Store.products();
    ['PRT-001','JLD-001','JLD-002','FIN-001','FIN-002'].forEach(s => { const d = DEFAULT_PRODUCTS.find(x => x.sku === s), p = list.find(x => x.sku === s); p.base_price = d.base_price; p.price_status = d.price_status; });
    Store.saveProducts(list); toast('Tarif dikembalikan'); render(true);
  }
});
