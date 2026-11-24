/* =========================================================
   admin/admin-security.js — menu Keamanan di panel admin
   Menampilkan log kejadian keamanan (login gagal, pola
   SQL injection / XSS yang ditolak, akses ditolak) dan
   daftar perlindungan yang aktif.
   ========================================================= */
function viewAdminSecurity(){
  const log = Security.readLog(), day = Date.now() - 24*3600*1000;
  const count = re => log.filter(l => l.at > day && re.test(l.event)).length;
  const layers = [
    ['Validasi & sanitasi input', 'Panjang, format, dan karakter setiap isian dibatasi (nama, email, WA, catatan, pencarian, form produk, tarif).'],
    ['Deteksi pola SQL injection & XSS', 'Isian seperti \' OR 1=1, UNION SELECT, ; DROP TABLE, atau <script> ditolak dan dicatat.'],
    ['Output di-escape', 'Semua teks dari pengguna di-escape sebelum ditampilkan, sehingga tidak bisa menyisipkan HTML/skrip.'],
    ['Kata sandi ter-hash', 'Disimpan sebagai hash SHA-256 bergaram (3.000 putaran), tidak ada kata sandi polos.'],
    ['Batas percobaan login', `Akun dikunci 60 detik setelah ${Security.MAX_ATTEMPTS} kali gagal.`],
    ['Sesi kedaluwarsa', `Sesi berakhir otomatis setelah ${SESSION_HOURS} jam.`],
    ['Penjaga peran', 'Aksi admin (ubah status, katalog, tarif) ditolak bila bukan akun admin, termasuk lewat console.'],
    ['Pemeriksaan file', 'Isi file dicek benar-benar PDF (magic bytes), nama file dibersihkan.'],
    ['Content Security Policy', 'Skrip hanya dari situs ini dan cdnjs; objek/plugin diblokir.'],
    ['Data lokal aman', 'JSON dibaca tanpa prototype pollution; data rusak diabaikan.']
  ];
  return adminShell('keamanan', `<p class="eyebrow reveal">Keamanan</p><h1 class="h1 reveal">Lapisan <em>keamanan</em></h1>
  <p class="muted reveal" style="margin:6px 0 4px;max-width:72ch">Perlindungan di browser adalah lapisan pertama. Perlindungan utama dari SQL injection ada di backend: <b>parameterized query</b>, validasi skema, dan Row Level Security Supabase (lihat folder <code>backend/</code>).</p>
  <div class="stats" data-stagger>
    <div class="stat hot"><span>SQL injection ditolak (24 jam)</span><b class="count" data-to="${count(/SQL/)}">${count(/SQL/)}</b></div>
    <div class="stat hot"><span>XSS ditolak (24 jam)</span><b class="count" data-to="${count(/XSS/)}">${count(/XSS/)}</b></div>
    <div class="stat"><span>Login gagal (24 jam)</span><b class="count" data-to="${count(/Login gagal/)}">${count(/Login gagal/)}</b></div>
    <div class="stat"><span>Akses ditolak (24 jam)</span><b class="count" data-to="${count(/ditolak: peran|dikunci/)}">${count(/ditolak: peran|dikunci/)}</b></div>
  </div>
  <div class="split" style="margin-top:22px">
    <section class="dpanel reveal" style="position:static"><h4 class="eyebrow">Perlindungan aktif</h4>
      ${layers.map(([t, d]) => `<div class="crow ok"><span class="ic">${I.check}</span><div><h4>${t}</h4><p>${esc(d)}</p></div></div>`).join('')}
    </section>
    <section class="reveal">
      <div class="row between" style="margin-bottom:10px"><h2 class="h2" style="font-size:22px">Log <em>kejadian</em></h2><button class="btn btn-ghost btn-sm" onclick="App.clearSecLog()">Kosongkan log</button></div>
      <div class="tblwrap"><table class="tbl" style="min-width:480px"><thead><tr><th>Waktu</th><th>Kejadian</th><th>Detail</th></tr></thead><tbody>
      ${log.length ? log.slice(0, 50).map(l => `<tr><td class="small">${fdate(l.at)}</td><td>${esc(l.event)}</td><td class="small muted">${esc(l.detail)}</td></tr>`).join('') : '<tr><td colspan="3" class="muted">Belum ada kejadian. Coba ketik <code>\' OR \'1\'=\'1</code> di kolom pencarian atau login.</td></tr>'}
      </tbody></table></div>
    </section>
  </div>`);
}

Object.assign(App, {
  clearSecLog(){
    if(!requireRole('admin')) return;
    try{ localStorage.setItem('gm_security_log', '[]'); }catch(e){}
    Security.log('Log dikosongkan', Store.session().email);
    render(true);
  }
});
