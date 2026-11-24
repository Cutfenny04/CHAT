/* =========================================================
   views/catalog.js — Katalog, pencarian & filter (M-03, M-04)
   ========================================================= */
function catalogResults(){
  let r = searchProducts(S.q);
  if(S.cat !== 'all') r = r.filter(x => x.p.category === S.cat);
  if(S.sort === 'low')  r.sort((a, b) => a.p.base_price - b.p.base_price);
  if(S.sort === 'high') r.sort((a, b) => b.p.base_price - a.p.base_price);
  const fuzzy = S.q && r.some(x => x.fuzzy);
  if(!r.length) return `<div class="empty reveal">${patch(64)}<h3 class="h2" style="font-size:21px">Belum ketemu “${esc(S.q)}”</h3>
    <p class="muted small" style="margin:6px 0 14px">Coba kata lain, atau tanyakan langsung ke toko.</p>
    <a class="btn btn-berry" target="_blank" rel="noopener" href="${wa(CONFIG.WA_TOKO, `Halo Graha Media, apakah ada layanan "${S.q}"?`)}">${I.chat} Tanya via WhatsApp</a></div>`;
  return `<p class="small muted" style="padding:0 18px 10px">${r.length} layanan${S.q ? ` untuk “${esc(S.q)}”` : ''}${fuzzy ? ' · termasuk hasil mirip' : ''}</p>
    <div class="grid" data-stagger>${r.map((x, i) => pcard(x.p, i)).join('')}</div>`;
}

function viewCatalog(){
  return phone(`
  <section class="sec" style="padding-bottom:10px"><p class="eyebrow reveal">Katalog</p><h1 class="h1 reveal">Mau cetak <em>apa</em> hari ini?</h1></section>
  <div class="searchbox reveal">${I.search}<label class="sr" for="q">Cari layanan</label>
    <input id="q" type="search" maxlength="60" placeholder="Cari: print skripsi, fc, poster…" value="${esc(S.q)}" oninput="App.search(this.value)" autocomplete="off"></div>
  <div class="chips reveal" id="sugg" ${S.q ? 'hidden' : ''}>${SEARCH_SUGGESTIONS.map(s => `<button class="chip" onclick="App.search('${s}',true)">${s}</button>`).join('')}</div>
  <div class="chips reveal">${[{id:'all', name:'Semua'}, ...CATEGORIES].map(c => `<button class="chip ${S.cat === c.id ? 'on' : ''}" onclick="App.cat('${c.id}')">${c.name}</button>`).join('')}</div>
  <div class="row between" style="padding:4px 18px 12px"><span class="small muted">Urutkan</span>
    <select class="sortsel" onchange="App.sort(this.value)" aria-label="Urutkan">
      <option value="rel" ${S.sort === 'rel' ? 'selected' : ''}>Paling relevan</option>
      <option value="low" ${S.sort === 'low' ? 'selected' : ''}>Harga termurah</option>
      <option value="high" ${S.sort === 'high' ? 'selected' : ''}>Harga termahal</option>
    </select></div>
  <div id="results">${catalogResults()}</div>`, 'katalog');
}

Object.assign(App, {
  /* Perbarui hasil saja (bukan seluruh halaman) agar fokus input tidak hilang */
  search(v, fill){
    v = Security.clean(v, Security.LIMITS.search);
    const attack = Security.detect(v);
    if(attack){ Security.logAttack(attack, 'pencarian katalog'); toast('Kata kunci tidak valid'); v = ''; const q = $('#q'); if(q) q.value = ''; }
    S.q = v;
    if(fill){ const q = $('#q'); if(q){ q.value = v; q.focus(); } }
    const sg = $('#sugg'); if(sg) sg.hidden = !!v;
    $('#results').innerHTML = catalogResults(); initFx(false);
  },
  cat(id){ S.cat = id; render(true); initFx(false); },
  sort(v){ S.sort = v; $('#results').innerHTML = catalogResults(); initFx(false); }
});
