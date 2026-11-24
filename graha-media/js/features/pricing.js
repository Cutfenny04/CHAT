/* =========================================================
   features/pricing.js — perhitungan estimasi harga (Nota Jahit)
   Harga dihitung per "muka" (satu sisi kertas yang dicetak).
   Semua angka diambil dari Store.tariff() dan Store.product().
   ========================================================= */

/* Kelompokkan halaman menjadi muka cetak sesuai layout (1 atau 2 halaman per muka) */
function sides(f){
  const ps = f.pages.filter(p => !(f.skipBlank && p.blank));
  const per = f.config.layout, out = [];
  for(let i = 0; i < ps.length; i += per) out.push(ps.slice(i, i + per));
  return out;
}
const sheetsPerCopy = f => { const n = sides(f).length; return f.config.duplex ? Math.ceil(n/2) : n; };

/* Harga satu muka: hitam putih bila tidak ada halaman berwarna (≥1%),
   selain itu pakai tier warna dari halaman paling berwarna */
function sideCost(f, side){
  const T = Store.tariff();
  const fac = T.paperFactor[f.config.paper] || 1;
  const colorPages = side.filter(p => !f.allBW && !f.bw[p.n] && p.colorPct >= 1);
  if(!colorPages.length) return { bw:true, pct:0, cost:T.bw * fac };
  const pc = Math.max(...colorPages.map(p => p.colorPct));
  return { bw:false, pct:pc, cost:T.tiers.find(t => pc < t.max).price * fac };
}

function estimate(f){
  const T = Store.tariff(), ss = sides(f);
  let bwN = 0, colN = 0, bwSum = 0, colSum = 0, maxPct = 0;
  ss.forEach(s => { const r = sideCost(f, s); if(r.bw){ bwN++; bwSum += r.cost; } else { colN++; colSum += r.cost; maxPct = Math.max(maxPct, r.pct); } });
  const sheets = sheetsPerCopy(f), c = f.copies, P = f.config.paper, lines = [];
  const paperSim = P !== 'A4' && T.paperStatus === 'simulasi';
  if(bwN)  lines.push({ label:`Cetak hitam putih ${P}`, sub:`${bwN} muka × ${c} salinan`, amount:bwSum*c, status: paperSim ? 'simulasi' : T.bwStatus });
  if(colN) lines.push({ label:`Cetak warna ${P}`, sub:`${colN} muka · tarif per proporsi warna × ${c}`, amount:colSum*c, status:T.tierStatus });
  if(f.jilid !== 'none'){ const p = Store.product(f.jilid === 'soft' ? 'JLD-001' : 'JLD-002'); lines.push({ label:p.name, sub:`${c} × ${rp(p.base_price)}`, amount:p.base_price*c, status:p.price_status }); }
  if(f.laminasi){ const p = Store.product('FIN-001'); lines.push({ label:'Laminasi', sub:`${sheets*c} lembar × ${rp(p.base_price)}`, amount:p.base_price*sheets*c, status:p.price_status }); }
  if(f.potong){ const p = Store.product('FIN-002'); lines.push({ label:'Potong kertas', sub:'per dokumen', amount:p.base_price, status:p.price_status }); }
  lines.forEach(l => l.amount = Math.round(l.amount));
  const raw = lines.reduce((a, l) => a + l.amount, 0);
  return { lines, total: Math.ceil(raw/100)*100, sheets, sidesN:ss.length, bwN, colN, maxPct, anySim: lines.some(l => l.status === 'simulasi') };
}
