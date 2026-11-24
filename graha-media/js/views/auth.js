/* =========================================================
   views/auth.js — Masuk & Daftar (M-01, A-01)
   Mahasiswa: tampilan HP. Admin: kartu di tengah layar (iPad/web).
   Catatan: prototype menyimpan akun di localStorage. Di backend
   asli kata sandi di-hash dan diverifikasi oleh Express + Supabase.
   ========================================================= */
let authTab = 'masuk';

function authForm(role){
  const isAdmin = role === 'admin';
  const demo = DEMO_USERS.filter(u => u.role === role);
  return `
    ${isAdmin ? '' : `<div class="seg reveal" style="margin-bottom:6px">
      <button class="${authTab === 'masuk' ? 'on' : ''}" onclick="App.authTab('masuk')">Masuk</button>
      <button class="${authTab === 'daftar' ? 'on' : ''}" onclick="App.authTab('daftar')">Daftar</button></div>`}
    <form onsubmit="event.preventDefault();App.${!isAdmin && authTab === 'daftar' ? 'register' : 'login'}('${role}')" class="reveal">
      ${!isAdmin && authTab === 'daftar' ? `
        <div class="field"><label for="rn">Nama lengkap</label><input class="inp" id="rn" required autocomplete="name"></div>
        <div class="field"><label for="rw">No. WhatsApp</label><input class="inp" id="rw" required inputmode="tel" placeholder="62812…"></div>` : ''}
      <div class="field"><label for="em">Email</label><input class="inp" id="em" type="email" required autocomplete="email"></div>
      <div class="field"><label for="pw">Kata sandi</label><input class="inp" id="pw" type="password" required minlength="6" autocomplete="${authTab === 'daftar' ? 'new-password' : 'current-password'}"></div>
      <p class="ferr" id="autherr" role="alert"></p>
      <button class="btn ${isAdmin ? 'btn-pine' : 'btn-berry'} btn-block mt" type="submit">${!isAdmin && authTab === 'daftar' ? 'Daftar & masuk' : 'Masuk'}</button>
    </form>
    ${authTab === 'masuk' || isAdmin ? `<div class="reveal mt"><p class="eyebrow">Akun demo prototype</p><div class="demoacc">${demo.map(u =>
      `<button onclick="App.fillDemo('${u.email}','${u.password}')"><span><b>${esc(u.email)}</b><br><span class="muted">sandi: ${esc(u.password)}</span></span><span class="badge b-mist">isi otomatis</span></button>`).join('')}</div></div>` : ''}`;
}

function viewStudentLogin(){
  return phone(`
    <section class="authhero denim reveal"><div class="lace" aria-hidden="true"></div>
      <p class="eyebrow" style="color:var(--frost)">Akun mahasiswa</p>
      <h1>${authTab === 'masuk' ? 'Masuk untuk <em>mulai cetak</em>' : 'Buat akun <em>dalam semenit</em>'}</h1>
    </section>
    <div class="sec"><div class="card">${authForm('mahasiswa')}</div></div>`, '');
}

function viewAdminLogin(){
  return `<div class="authwrap pat-gingham"><div class="card">
    <p class="eyebrow">Panel admin</p><h1 class="h1" style="margin-bottom:6px">Graha Media <em>admin</em></h1>
    <p class="muted small">Untuk pemilik dan staf toko. Optimal di iPad dan browser laptop.</p>
    ${authForm('admin')}
    <a class="back" href="#/">${I.left} Kembali ke situs mahasiswa</a></div></div>`;
}

Object.assign(App, {
  authTab(t){ authTab = t; render(true); },
  fillDemo(email, pw){ $('#em').value = email; $('#pw').value = pw; },
  login(role){
    const u = Store.login($('#em').value, $('#pw').value);
    if(!u){ $('#autherr').textContent = 'Email atau kata sandi salah.'; return; }
    if(u.role !== role){ Store.logout(); $('#autherr').textContent = role === 'admin' ? 'Akun ini bukan akun admin.' : 'Akun admin masuk lewat panel admin.'; return; }
    toast(`Halo, ${u.name.split(' ')[0]}!`);
    const next = S.next || (role === 'admin' ? 'admin' : ''); S.next = '';
    location.hash = '#/' + next; render();
  },
  register(){
    const data = { name:$('#rn').value.trim(), wa:$('#rw').value.trim(), email:$('#em').value.trim(), password:$('#pw').value };
    if(!/^\+?\d[\d\s-]{8,}$/.test(data.wa)){ $('#autherr').textContent = 'Nomor WhatsApp tidak valid.'; return; }
    const r = Store.register(data);
    if(r.error){ $('#autherr').textContent = r.error; return; }
    toast('Akun dibuat. Selamat datang!');
    const next = S.next || ''; S.next = ''; location.hash = '#/' + next; render();
  },
  logout(){ Store.logout(); toast('Kamu sudah keluar'); location.hash = S.route.startsWith('admin') ? '#/admin' : '#/'; render(); }
});
