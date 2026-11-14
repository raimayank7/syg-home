/* home.shareyourgroup.com/cook: the converter on the home page. Weights come from /data/ingredients.json (USDA household measures). Runs in the browser. */
(function () {
  'use strict';
  var d = document, CUP = 236.588, OZ = 28.3495, rows = null;
  function $(i) { return d.getElementById(i); }
  function fmt(x, dp) { dp = dp == null ? 1 : dp; return (Math.round(x * Math.pow(10, dp)) / Math.pow(10, dp)).toLocaleString('en-IN', { maximumFractionDigits: dp }); }
  function calc() {
    if (!rows) return;
    var s = $('cv-ing').value, v = parseFloat(String($('cv-v').value).replace(/,/g, '')), u = $('cv-u').value, r = rows.filter(function (x) { return x.s === s; })[0], out = $('cv-out');
    if (!r || !(v >= 0)) { out.hidden = true; return; }
    var cupG = r.c, g;
    if (u === 'cup') g = v * cupG; else if (u === 'mcup') g = v * cupG * 250 / CUP; else if (u === 'tbsp') g = v * cupG / 16; else if (u === 'tsp') g = v * cupG / 48;
    else if (u === 'g') g = v; else if (u === 'oz') g = v * OZ; else g = v * 1000;
    out.innerHTML = '<h2>' + fmt(v, 2) + ' ' + $('cv-u').options[$('cv-u').selectedIndex].text + ' of ' + r.n.split(' (')[0] + ' is about ' + fmt(g, g < 10 ? 1 : 0) + ' g</h2>' +
      '<div class="tbl"><table><tbody><tr><td>Grams</td><td class="num">' + fmt(g, g < 10 ? 1 : 0) + ' g</td></tr><tr><td>Ounces</td><td class="num">' + fmt(g / OZ, 2) + ' oz</td></tr><tr><td>US cups</td><td class="num">' + fmt(g / cupG, 2) + '</td></tr>' +
      '<tr><td>Metric cups (250 ml)</td><td class="num">' + fmt(g / (cupG * 250 / CUP), 2) + '</td></tr><tr><td>Tablespoons</td><td class="num">' + fmt(g / (cupG / 16), 1) + '</td></tr><tr><td>Teaspoons</td><td class="num">' + fmt(g / (cupG / 48), 1) + '</td></tr></tbody></table></div>' +
      '<p>' + (r.v === 'cup' ? 'Based on ' + fmt(cupG, 0) + ' g per US cup (USDA).' : 'The USDA gives a spoon weight only; the cup is worked out from it (16 tablespoons or 48 teaspoons to a cup).') + ' <a href="/cook/' + r.s + '/">All measures for ' + r.n.split(' (')[0] + '</a></p>';
    out.hidden = false;
    try { localStorage.setItem('cook-last', JSON.stringify([s, $('cv-v').value, u])); } catch (e) {}
  }
  d.addEventListener('input', function (e) { if (e.target.closest && e.target.closest('#conv')) calc(); });
  d.addEventListener('change', function (e) { if (e.target.closest && e.target.closest('#conv')) calc(); });
  fetch('/cook/data/ingredients.json').then(function (r) { return r.json(); }).then(function (j) {
    rows = j;
    try { var l = JSON.parse(localStorage.getItem('cook-last')); if (l) { $('cv-ing').value = l[0]; $('cv-v').value = l[1]; $('cv-u').value = l[2]; } } catch (e) {}
    calc();
  });
})();
