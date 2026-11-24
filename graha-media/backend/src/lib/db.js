/* =========================================================
   lib/db.js — akses database ANTI SQL INJECTION
   ---------------------------------------------------------
   Aturan utama: nilai dari pengguna TIDAK PERNAH digabung ke
   teks SQL. Semua query dibuat dengan tagged template `sql`,
   yang otomatis mengubah setiap ${nilai} menjadi parameter
   $1, $2, … sehingga PostgreSQL memperlakukannya sebagai DATA,
   bukan perintah.

     ✅ sql`SELECT * FROM users WHERE email = ${email}`
        → text: "SELECT * FROM users WHERE email = $1", values: [email]

     ❌ pool.query("SELECT * FROM users WHERE email = '" + email + "'")
        → ditolak oleh fungsi query() di bawah (bukan objek sql).

   Nama kolom/arah urutan tidak bisa jadi parameter, jadi hanya
   boleh dipilih dari daftar putih (lihat `orderBy`).
   ========================================================= */
const { Pool } = require('pg');

const SQL = Symbol('sql');

/* Tagged template: hasilkan query berparameter */
function sql(strings, ...values){
  let text = '', params = [];
  strings.forEach((part, i) => {
    text += part;
    if(i < values.length){
      const v = values[i];
      if(v && v[SQL]){                    // potongan sql lain (fragmen tepercaya)
        text += v.text.replace(/\$(\d+)/g, (_, n) => '$' + (Number(n) + params.length));
        params = params.concat(v.values);
      } else {
        params.push(v);
        text += '$' + params.length;
      }
    }
  });
  return { [SQL]:true, text, values:params };
}

/* Fragmen kosong / gabungan untuk WHERE dinamis */
sql.empty = { [SQL]:true, text:'', values:[] };
sql.join = (parts, sep = ' AND ') => parts.reduce((acc, p, i) => i ? sql`${acc}${raw(sep)}${p}` : p, sql.empty);

/* Teks mentah HANYA untuk konstanta di kode (bukan input pengguna) */
function raw(text){
  if(typeof text !== 'string' || !/^[\w\s,.()*=<>'-]*$/.test(text)) throw new Error('raw() hanya untuk konstanta aman');
  return { [SQL]:true, text, values:[] };
}

/* Daftar putih untuk ORDER BY */
function orderBy(key, allowed){
  if(!Object.prototype.hasOwnProperty.call(allowed, key)) key = Object.keys(allowed)[0];
  return raw(allowed[key]);
}

/* Escape karakter wildcard LIKE agar "%" atau "_" dari pengguna tidak jadi pola */
const likeEscape = s => String(s).replace(/[\\%_]/g, ch => '\\' + ch);

let pool = null;
function init(customPool){
  pool = customPool || new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : undefined,
    max: 10,
    statement_timeout: 5000          // query yang terlalu lama dihentikan (anti time-based attack)
  });
  return pool;
}

/* Satu-satunya pintu ke database: hanya menerima objek dari sql`` */
async function query(q){
  if(!q || !q[SQL]) throw new Error('Query harus dibuat dengan sql`...` (parameterized)');
  const res = await pool.query(q.text, q.values);
  return res.rows;
}
const one = async q => (await query(q))[0] || null;

module.exports = { sql, raw, orderBy, likeEscape, init, query, one };
