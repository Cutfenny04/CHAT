/* =========================================================
   admin/admin-orders.js — kelola pesanan
   A-02 dashboard · A-03 daftar · A-04 detail · A-05 ubah status
   A-06 papan kanban (drag & drop) · A-09 chat pelanggan
   A-10 laporan Smart Print Check · A-11 pratinjau konfigurasi
   + Mode sibuk untuk jam ramai
   ========================================================= */
function viewAdminOrders(){
  const all = Store.orders();
  const today = all.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString());
  const pend = all.filter(o => o.status === 'Belum selesai').length;
  const omzet = today.reduce((a, o) => a + o.est.total, 0);
  const me = Store.session();
  const views = [['list','Daftar',I.list],['board','Papan',I.board],['busy','Mode sibuk',I.bolt]];
  return adminShell('', `
    <p class="eyebrow reveal">${new Date().toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long'})}</p>
    <h1 class="h1 reveal">Selamat ${greeting()}, <em>${esc(me.name)}</em></h1>
    <div class="stats" data-stagger>
      <div class="stat"><span>Masuk hari ini</span><b class="count" data-to="${today.length}">${today.length}</b></div>
      <div class="stat hot"><span>Belum selesai</span><b class="count" data-to="${pend}">${pend}</b></div>
      <div class="stat"><span>Selesai</span><b class="count" data-to="${all.length - pend}">${all.length - pend}</b></div>
      <div class="stat"><span>Estimasi hari ini</span><b style="font-size:26px">${rp(omzet)}</b></div>
    </div>
    <div class="toolbar reveal">
      <div class="seg" style="min-width:300px">${views.map(([v, l, i]) => `<button class="${S.admView === v ? 'on' : ''}" onclick="App.admView('${v}')" style="display:flex;gap:6px;align-items:center;justify-content:center">${i.replace('<svg', '<svg width="16" height="16"')}${l}</button>`).join('')}</div>
      ${S.admView === 'busy' ? '' : `<div class="searchbox">${I.search}<label class="sr" for="aq">Cari pesanan</label><input id="aq" type="search" maxlength="60" placeholder="Cari kode, nama, atau file…" value="${esc(S.admQ)}" oninput="App.admQ(this.value)"></div>`}
      ${S.admView === 'list' ? `<div class="seg">${['Belum selesai','Selesai','Semua'].map(s => `<button class="${S.admFilter === s ? 'on' : ''}" onclick="App.admFilter('${s}')">${s}</button>`).join('')}</div>` : ''}
    </div>
    ${S.admView === 'board' ? boardView(all) : S.admView === 'busy' ? busyView(all) : listView(all)}`);
}

function filterQ(list){
  if(!S.admQ) return list;
  const q = norm(S.admQ);
  return list.filter(o => norm(`${o.code} ${o.customer.name} ${o.file.name}`).includes(q));
}
const orderMeta = o => `${o.sidesN} muka · ${o.config.paper}${o.config.duplex ? ' · bolak-balik' : ''} · ${o.copies}× · ${o.color.colN ? 'Warna' : 'Hitam putih'}`;

/* ---------- Daftar + panel detail ---------- */
function listView(all){
  let list = all.slice().sort((a, b) => b.createdAt - a.createdAt);
  if(S.admFilter !== 'Semua') list = list.filter(o => o.status === S.admFilter);
  list = filterQ(list);
  if(!list.find(o => o.code === S.admSel)) S.admSel = list[0] ? list[0].code : null;
  const sel = all.find(o => o.code === S.admSel);
  return `<div class="split"><div class="olist" data-stagger>${list.length ? list.map(o => `
      <button class="ocard ${o.code === S.admSel ? 'on' : ''}" onclick="App.sel('${o.code}')">
        <span class="c">${o.code}</span>${statusBadge(o.status)}
        <span class="m">${esc(o.customer.name)} · ${esc(o.file.name)}</span>
        <span class="m">${orderMeta(o)} · ${ago(o.createdAt)}</span>
      </button>`).join('') : '<p class="muted">Tidak ada pesanan.</p>'}</div>
    <div>${sel ? detailPanel(sel) : ''}</div></div>`;
}

function detailPanel(o){
  const c = o.config, done = o.status === 'Selesai';
  const msg = `Halo ${o.customer.name}, pesanan ${o.code} di Graha Media ${done ? 'sudah selesai dan bisa diambil di toko' : 'sedang kami proses'}.`;
  return `<section class="dpanel reveal" aria-live="polite">
    <div class="row between" style="align-items:flex-start"><div><p class="eyebrow">Detail pesanan</p><h2>${o.code}</h2>
      <p class="small muted">${fdate(o.createdAt)} · ${esc(o.customer.name)} · ${esc(o.customer.wa)}${o.reorderOf ? ` · ulang dari ${o.reorderOf}` : ''}</p></div>${statusBadge(o.status)}</div>
    <div class="actions">
      ${done ? `<button class="btn btn-ghost" onclick="App.setStatus('${o.code}','Belum selesai')">Kembalikan ke Belum selesai</button>`
             : `<button class="btn btn-pine" onclick="App.setStatus('${o.code}','Selesai')">${I.check} Tandai Selesai</button>`}
      <a class="btn btn-ghost" target="_blank" rel="noopener" href="${wa(o.customer.wa, msg)}">${I.chat} Chat pelanggan</a>
      <button class="btn btn-ghost" disabled title="Prototype tidak menyimpan file. Versi backend memakai Supabase Storage.">${I.download} Unduh PDF</button>
    </div>
    <div class="dsec"><h4>Dokumen</h4><p class="small"><b>${esc(o.file.name)}</b> · ${o.file.pages} halaman · ${esc(o.file.mb)}</p>
      <div class="thumbrow mt">${o.thumbs.length ? o.thumbs.map((t, i) => `<img src="${t}" alt="Halaman ${i+1}">`).join('')
        : Array(Math.min(o.file.pages, 5)).fill(0).map(() => `<div class="tph"><div class="mini" style="width:70%;transform:none;box-shadow:none"><i></i><i></i><i class="s"></i></div></div>`).join('')}</div></div>
    <div class="dsec"><h4>Konfigurasi cetak</h4><div class="cfg">
      <div><small>Kertas</small><b>${c.paper}</b></div><div><small>Orientasi</small><b>${c.orient === 'portrait' ? 'Portrait' : 'Landscape'}</b></div>
      <div><small>Skala</small><b>${c.scale === 'fit' ? 'Sesuaikan' : 'Ukuran asli'}</b></div><div><small>Sisi</small><b>${c.duplex ? 'Bolak-balik' : 'Satu sisi'}</b></div>
      <div><small>Layout</small><b>${c.layout} hal/lbr</b></div><div><small>Salinan</small><b>${o.copies}</b></div>
      <div><small>Lembar</small><b>${o.sheets} / salinan</b></div><div><small>Finishing</small><b>${finishingText(o.finishing)}${o.finishing.jilid !== 'none' ? ` (${c.bind === 'top' ? 'atas' : 'kiri'})` : ''}</b></div>
    </div></div>
    <div class="dsec"><h4>Smart Print Check</h4><p class="small"><b>${o.check.score}/${o.check.total}</b> halaman tanpa catatan</p>
      ${o.check.issues.length ? `<ul class="small" style="margin:6px 0 0 18px">${o.check.issues.map(i => `<li>${esc(i)}</li>`).join('')}</ul><p class="note" style="margin-top:6px">Pelanggan sudah melihat peringatan ini dan memilih melanjutkan.</p>` : '<p class="small muted">Tidak ada peringatan.</p>'}</div>
    <div class="dsec"><h4>Peta warna & estimasi</h4><p class="small">${o.color.colN} muka berwarna${o.color.colN ? ` (tertinggi ${pct(o.color.maxPct)}%)` : ''} · ${o.color.bwN} muka hitam putih</p>
      ${o.est.lines.map(l => `<div class="nline small"><span>${esc(l.label)} <span class="muted">· ${esc(l.sub)}</span></span><b>${rp(l.amount)}</b></div>`).join('')}
      <div class="ntotal"><span style="font-weight:700">Estimasi total</span><b style="font-size:24px">${rp(o.est.total)}</b></div></div>
    ${o.note ? `<div class="dsec"><h4>Catatan pelanggan</h4><p>“${esc(o.note)}”</p></div>` : ''}
    <div class="dsec"><h4>Riwayat status</h4><div class="hist">${o.history.map(h => `<span>${fdate(h.at)} · ${h.status} · oleh ${esc(h.by)}</span>`).join('')}</div></div>
  </section>`;
}

/* ---------- Papan kanban (A-06) ---------- */
function boardView(all){
  const list = filterQ(all.slice().sort((a, b) => a.createdAt - b.createdAt));
  const col = (status, title) => {
    const items = list.filter(o => o.status === status);
    return `<div class="col" data-status="${status}" ondragover="App.dragOver(event)" ondragleave="this.classList.remove('over')" ondrop="App.drop(event,'${status}')">
      <h3>${title}<span>${items.length}</span></h3>
      ${items.map(o => `<div class="kcard ${status === 'Selesai' ? 'd' : ''}" draggable="true" ondragstart="App.dragStart(event,'${o.code}')" ondragend="this.classList.remove('dragging')">
        <div class="row between"><span class="c">${o.code}</span><span class="small muted">${ago(o.createdAt)}</span></div>
        <span class="small"><b>${esc(o.customer.name)}</b> · ${esc(o.file.name)}</span>
        <span class="small muted">${orderMeta(o)}</span>
        <div class="row" style="gap:6px;margin-top:6px">
          <button class="btn btn-ghost btn-sm" onclick="App.admView('list');App.sel('${o.code}')">Detail</button>
          <button class="btn ${status === 'Selesai' ? 'btn-ghost' : 'btn-pine'} btn-sm" onclick="App.setStatus('${o.code}','${status === 'Selesai' ? 'Belum selesai' : 'Selesai'}')">${status === 'Selesai' ? '← Belum selesai' : 'Selesai →'}</button>
        </div></div>`).join('') || '<p class="small muted">Kosong. Seret kartu ke sini.</p>'}
    </div>`;
  };
  return `<p class="note" style="margin-bottom:10px">Seret kartu antar kolom untuk mengubah status, atau ketuk tombolnya (lebih mudah di iPad).</p>
    <div class="board">${col('Belum selesai', 'Belum selesai')}${col('Selesai', 'Selesai')}</div>`;
}

/* ---------- Mode sibuk ---------- */
function busyView(all){
  const list = all.filter(o => o.status === 'Belum selesai').sort((a, b) => a.createdAt - b.createdAt);
  if(!list.length) return `<div class="empty card">${patch(70)}<h2 class="h2" style="font-size:22px">Semua pesanan beres</h2><p class="muted small">Tidak ada pesanan yang menunggu.</p></div>`;
  return `<p class="note" style="margin-bottom:10px">Urut dari yang paling lama menunggu. Satu ketukan untuk menandai selesai.</p>
  <div class="busygrid" data-stagger>${list.map(o => `<article class="bcard" id="b-${o.code}">
    <div class="row between"><span class="c">${o.code}</span><span class="small muted">${ago(o.createdAt)}</span></div>
    <b>${esc(o.customer.name)}</b>
    <span class="small muted">${orderMeta(o)} · ${finishingText(o.finishing)}</span>
    ${o.note ? `<span class="small">“${esc(o.note)}”</span>` : ''}
    <button class="btn btn-pine" onclick="App.busyDone('${o.code}')">${I.check} Selesai</button>
  </article>`).join('')}</div>`;
}

Object.assign(App, {
  sel(code){ S.admSel = code; render(true); if(window.innerWidth < 768){ const d = $('.dpanel'); d && d.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); } },
  admView(v){ S.admView = v; render(true); initFx(false); },
  admFilter(s){ S.admFilter = s; render(true); },
  admQ(v){ v = Security.clean(v, Security.LIMITS.search); const attack = Security.detect(v); if(attack){ Security.logAttack(attack, 'pencarian admin'); v = ''; } S.admQ = v; render(true); const el = $('#aq'); if(el){ el.focus(); el.setSelectionRange(v.length, v.length); } },
  setStatus(code, status){
    if(!requireRole('admin')) return;
    Store.updateStatus(code, status, Store.session().name);
    toast(`${code} ditandai ${status}`); render(true);
  },
  busyDone(code){
    const c = $('#b-' + code);
    if(c && !RM){ c.classList.add('leaving'); setTimeout(() => App.setStatus(code, 'Selesai'), 300); }
    else App.setStatus(code, 'Selesai');
  },
  /* drag & drop kanban */
  dragStart(e, code){ e.dataTransfer.setData('text/plain', code); e.target.classList.add('dragging'); },
  dragOver(e){ e.preventDefault(); e.currentTarget.classList.add('over'); },
  drop(e, status){
    e.preventDefault(); e.currentTarget.classList.remove('over');
    const code = Security.clean(e.dataTransfer.getData('text/plain'), 20), o = Store.order(code);
    if(o && o.status !== status) App.setStatus(code, status);
  }
});
