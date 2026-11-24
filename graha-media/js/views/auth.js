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
        <div class="field"><label for="rn">Nama lengkap</label><input class="inp" id="rn" required maxlength="60" autocomplete="name"></div>
        <div class="field"><label for="rw">No. WhatsApp</label><input class="inp" id="rw" required maxlength="16" inputmode="tel" placeholder="6281234567890"></div>` : ''}
      <div class="field"><label for="em">Email</label><input class="inp" id="em" type="email" required maxlength="100" autocomplete="email"></div>
      <div class="field"><label for="pw">Kata sandi</label><input class="inp" id="pw" type="password" required minlength="8" maxlength="72" autocomplete="${authTab === 'daftar' ? 'new-password' : 'current-password'}"></div>
      ${authTab === 'daftar' && !isAdmin ? '<p class="note" style="margin-top:6px">Kata sandi minimal 8 karakter, berisi huruf dan angka.</p>' : ''}
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
    const err = $('#autherr');
    const c = Security.check({
      email:{ value:$('#em').value, rule:'email', label:'Email' },
      password:{ value:$('#pw').value, label:'Kata sandi' }
    }, 'login');
    if(!c.ok){ err.textContent = Object.values(c.errors)[0]; return; }
    const r = Store.login(c.values.email, c.values.password);
    if(r.error){ err.textContent = r.error; return; }
    if(r.user.role !== role){
      Store.logout(); Security.log('Login di panel yang salah', c.values.email);
      err.textContent = role === 'admin' ? 'Akun ini bukan akun admin.' : 'Akun admin masuk lewat panel admin.'; return;
    }
    toast(`Halo, ${r.user.name.split(' ')[0]}!`);
    const next = S.next || (role === 'admin' ? 'admin' : ''); S.next = '';
    location.hash = '#/' + next; render();
  },
  register(){
    const err = $('#autherr');
    const c = Security.check({
      name:{ value:$('#rn').value, rule:'name', label:'Nama' },
      wa:{ value:$('#rw').value.replace(/[\s-]/g, ''), rule:'wa', label:'No. WhatsApp' },
      email:{ value:$('#em').value, rule:'email', label:'Email' },
      password:{ value:$('#pw').value, rule:'password', label:'Kata sandi' }
    }, 'daftar');
    if(!c.ok){ err.textContent = Object.values(c.errors)[0]; return; }
    const r = Store.register(c.values);
    if(r.error){ err.textContent = r.error; return; }
    toast('Akun dibuat. Selamat datang!');
    const next = S.next || ''; S.next = ''; location.hash = '#/' + next; render();
  },
  logout(){ Store.logout(); toast('Kamu sudah keluar'); location.hash = S.route.startsWith('admin') ? '#/admin' : '#/'; render(); }
});
