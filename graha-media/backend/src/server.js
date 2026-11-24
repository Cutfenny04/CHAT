/* =========================================================
   server.js — menjalankan API (npm start)
   ========================================================= */
const { createApp } = require('./app');

for(const key of ['DATABASE_URL','JWT_SECRET']){
  if(!process.env[key]){ console.error(`Variabel ${key} belum diisi di .env`); process.exit(1); }
}

const port = Number(process.env.PORT) || 3000;
createApp().listen(port, () => console.log(`API Graha Media berjalan di http://localhost:${port}`));
