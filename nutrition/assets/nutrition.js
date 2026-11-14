/* home.shareyourgroup.com/nutrition: gram calculator on the home page. Values per 100 g come from /data/foods.json (USDA SR Legacy). Runs in the browser. */
(function () {
  'use strict';
  var d = document, rows = [], byName = {};
  function $(i) { return d.getElementById(i); }
  function fm(x, dp) { if (x == null) return '-'; dp = dp || 0; return (Math.round(x * Math.pow(10, dp)) / Math.pow(10, dp)).toLocaleString('en-IN', { maximumFractionDigits: dp }); }
  function calc() {
    var r = byName[($('nt-food').value || '').trim().toLowerCase()], g = parseFloat(String($('nt-g').value).replace(/,/g, '')), out = $('nt-out');
    if (!r || !(g >= 0)) { out.hidden = true; return; }
    var f = g / 100, v = r.v, L = [['Energy', v.kcal, 'kcal', 0], ['Protein', v.protein, 'g', 1], ['Fat', v.fat, 'g', 1], ['Carbohydrate', v.carb, 'g', 1], ['Sugars', v.sugar, 'g', 1], ['Dietary fibre', v.fibre, 'g', 1], ['Sodium', v.na, 'mg', 0], ['Potassium', v.k, 'mg', 0], ['Calcium', v.ca, 'mg', 0], ['Iron', v.fe, 'mg', 1]];
    out.innerHTML = '<h2>' + fm(g, 1) + ' g of ' + r.n + ' has about ' + fm(v.kcal * f) + ' kcal</h2><div class="tbl"><table><tbody>' + L.filter(function (x) { return x[1] != null; }).map(function (x) { return '<tr><td>' + x[0] + '</td><td class="num">' + fm(x[1] * f, x[3]) + ' ' + x[2] + '</td></tr>'; }).join('') + '</tbody></table></div><p><a href="/nutrition/' + r.s + '/">Full nutrition facts for ' + r.n + '</a>. Typical USDA values; information only.</p>';
    out.hidden = false;
    try { localStorage.setItem('nut-last', JSON.stringify([r.n, $('nt-g').value])); } catch (e) {}
  }
  d.addEventListener('input', function (e) { if (e.target.closest && e.target.closest('#nut')) calc(); });
  d.addEventListener('change', function (e) { if (e.target.closest && e.target.closest('#nut')) calc(); });
  fetch('/nutrition/data/foods.json').then(function (r) { return r.json(); }).then(function (j) {
    rows = j; var dl = $('nt-list'); j.forEach(function (r) { byName[r.n.toLowerCase()] = r; var o = d.createElement('option'); o.value = r.n; dl.appendChild(o); });
    try { var l = JSON.parse(localStorage.getItem('nut-last')); if (l) { $('nt-food').value = l[0]; $('nt-g').value = l[1]; } } catch (e) {}
    calc();
  });
})();
