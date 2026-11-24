/* =========================================================
   features/search.js — pencarian ramah mahasiswa
   Toleran salah ketik (jarak Levenshtein ≤ 1) dan mengenal sinonim.
   ========================================================= */
const SYNONYMS = {
  fc:'fotokopi', fotocopy:'fotokopi', bw:'hitam putih', hp:'hitam putih',
  binding:'jilid', laminating:'laminasi', laminate:'laminasi', folio:'f4',
  color:'warna', colour:'warna', berwarna:'warna', cutting:'potong',
  ppt:'presentasi', slide:'presentasi',
  print:'', cetak:'', printing:''   // kata umum, diabaikan
};
const SEARCH_SUGGESTIONS = ['print skripsi','fc','poster a3','laminating','jilid spiral','warnaa'];

function levenshtein(a, b){
  const m = a.length, n = b.length; if(Math.abs(m - n) > 1) return 2;
  let prev = Array.from({length:n+1}, (_, i) => i);
  for(let i = 1; i <= m; i++){
    const cur = [i];
    for(let j = 1; j <= n; j++) cur[j] = Math.min(prev[j]+1, cur[j-1]+1, prev[j-1] + (a[i-1] === b[j-1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

/* Mengembalikan [{p, score, fuzzy}] urut paling relevan */
function searchProducts(q){
  const list = Store.activeProducts();
  const raw = norm(q).split(' ').filter(Boolean);
  const toks = raw.flatMap(t => t in SYNONYMS ? (SYNONYMS[t] ? norm(SYNONYMS[t]).split(' ') : []) : [t]);
  if(!raw.length || !toks.length) return list.map(p => ({ p, score:0 }));
  return list.map(p => {
    const hay = norm([p.name, p.short_desc, p.tags.join(' '), catName(p.category), p.sku, p.size].join(' ')).split(' ');
    let score = 0, hit = 0, fuzzy = false;
    toks.forEach(t => {
      let best = 0;
      hay.forEach(w => {
        if(w === t) best = Math.max(best, 3);
        else if(t.length >= 2 && w.startsWith(t)) best = Math.max(best, 2);
        else if(t.length >= 4 && levenshtein(w, t) <= 1){ best = Math.max(best, 1.5); fuzzy = true; }
      });
      if(best) hit++;
      score += best;
    });
    if(norm(p.name).includes(norm(q))) score += 4;
    return { p, score: score + hit * 2, hit, fuzzy };
  }).filter(r => r.hit > 0).sort((a, b) => b.score - a.score);
}
