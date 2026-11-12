/* Kitchen: converters and table filters. Everything runs in the browser. */
(function () {
  'use strict';
  var d = document, $ = function (id) { return d.getElementById(id); };
  function num(el) { var v = parseFloat(String(el.value).replace(',', '.')); return isFinite(v) ? v : NaN; }
  function fmt(x) { if (!isFinite(x)) return ''; var a = Math.abs(x); return (a >= 100 ? Math.round(x) : a >= 10 ? Math.round(x * 10) / 10 : Math.round(x * 100) / 100).toLocaleString('en-IN'); }
  function frac(x) {   // cups as the nearest eighth: 1 1/2, 3/4 ...
    var e = Math.round(x * 8), w = Math.floor(e / 8), r = e % 8, n = r, m = 8;
    while (n && n % 2 === 0) { n /= 2; m /= 2; }
    return (w ? w + (r ? ' ' : '') : '') + (r ? n + '/' + m : (w ? '' : '0'));
  }
  function on(el, fn) { if (el) { el.addEventListener('input', fn); el.addEventListener('change', fn); } }

  /* simple unit converters: <div data-conv> with [data-v], [data-from], [data-to], [data-out]; option values are the size in the base unit */
  d.querySelectorAll('[data-conv]').forEach(function (box) {
    var v = box.querySelector('[data-v]'), a = box.querySelector('[data-from]'), b = box.querySelector('[data-to]'), o = box.querySelector('[data-out]');
    function run() {
      var x = num(v);
      if (isNaN(x)) { o.textContent = 'Type an amount'; return; }
      o.textContent = fmt(x) + ' ' + a.options[a.selectedIndex].text + ' = ' + fmt(x * parseFloat(a.value) / parseFloat(b.value)) + ' ' + b.options[b.selectedIndex].text;
    }
    [v, a, b].forEach(function (e) { on(e, run); }); run();
  });

  /* temperature */
  var tc = $('t-c'), tf = $('t-f'), tg = $('t-g');
  if (tc) {
    var GAS = [[1, 140], [2, 150], [3, 160], [4, 180], [5, 190], [6, 200], [7, 220], [8, 230], [9, 240]];
    var gas = function (c) { if (c < 130 || c > 250) return 'No gas mark for this temperature'; var best = GAS[0]; GAS.forEach(function (g) { if (Math.abs(g[1] - c) < Math.abs(best[1] - c)) best = g; }); return 'Gas mark ' + best[0] + (Math.abs(best[1] - c) > 4 ? ' (nearest)' : ''); };
    on(tc, function () { var c = num(tc); if (isNaN(c)) return; tf.value = Math.round(c * 9 / 5 + 32); tg.textContent = gas(c) + '. In a fan oven set about ' + Math.round(c - 20) + ' °C.'; });
    on(tf, function () { var f = num(tf); if (isNaN(f)) return; var c = (f - 32) * 5 / 9; tc.value = Math.round(c); tg.textContent = gas(c) + '. In a fan oven set about ' + Math.round(c - 20) + ' °C.'; });
    tc.dispatchEvent(new Event('input'));
  }

  /* cups to grams, by ingredient */
  var ci = $('c-ing');
  if (ci) {
    var ca = $('c-amt'), cu = $('c-unit'), co = $('c-out'), cg = $('c-g'), co2 = $('c-out2');
    var run = function () {
      var g = parseFloat(ci.value), name = ci.options[ci.selectedIndex].text, x = num(ca), y = num(cg);
      co.textContent = isNaN(x) ? 'Type an amount' : fmt(x) + ' ' + cu.options[cu.selectedIndex].text + ' of ' + name.toLowerCase() + ' = about ' + fmt(x * g * parseFloat(cu.value)) + ' g';
      if (isNaN(y)) co2.textContent = 'Type the grams';
      else { var cups = y / g; co2.textContent = fmt(y) + ' g of ' + name.toLowerCase() + ' = about ' + (cups >= .25 ? frac(cups) + ' cup' + (cups > 1.06 ? 's' : '') : fmt(cups * 16) + ' tablespoons') + (cups >= .25 && cups < 4 ? ' (' + fmt(cups * 16) + ' tablespoons)' : ''); }
    };
    [ci, ca, cu, cg].forEach(function (e) { on(e, run); }); run();
  }

  /* how much to cook */
  var sa = $('s-ad');
  if (sa) {
    var sc = $('s-ch'), sm = $('s-meal'), sp = $('s-app'), so = $('s-out');
    var calc = function () {
      var n = (num(sa) || 0) + (num(sc) || 0) * .5, k = parseFloat(sp.value), meal = sm.value;
      if (n <= 0) { so.innerHTML = '<p>Type the number of people.</p>'; return; }
      var rice = meal === 'roti' ? 0 : (meal === 'rice' ? 75 : 45), rot = meal === 'rice' ? 0 : (meal === 'roti' ? 3.5 : 2);
      var R = rice * n * k, T = Math.ceil(rot * n * k), A = T * 30, D = 45 * n * k, V = 150 * n * k;
      var row = function (a, b, c) { return '<dt>' + a + '</dt><dd>' + b + (c ? ' <small>' + c + '</small>' : '') + '</dd>'; };
      var cups = function (g, per) { return 'about ' + frac(g / per) + ' cup' + (g / per > 1.06 ? 's' : ''); };
      so.innerHTML = '<h2>For ' + fmt(n) + ' adult portions</h2><dl class="facts">' +
        (R ? row('Rice, raw', fmt(Math.round(R / 5) * 5) + ' g', cups(R, 185)) : '') +
        (T ? row('Rotis', T + ' rotis', fmt(Math.round(A / 10) * 10) + ' g atta, ' + cups(A, 120)) : '') +
        row('Dal, raw', fmt(Math.round(D / 5) * 5) + ' g', cups(D, 192)) +
        row('Vegetables for sabzi, raw', fmt(Math.round(V / 50) * 50) + ' g', '') + '</dl>';
    };
    [sa, sc, sm, sp].forEach(function (e) { on(e, calc); }); calc();
  }

  /* filter a table or list: <input data-filter="#id"> ; rows are tbody tr or li ; chips [data-cat] narrow by data-c */
  d.querySelectorAll('[data-filter]').forEach(function (inp) {
    var box = d.querySelector(inp.getAttribute('data-filter')), none = d.querySelector(inp.getAttribute('data-none') || '#none'), cat = '';
    var rows = [].slice.call(box.querySelectorAll('tbody tr, li'));
    function run() {
      var s = inp.value.trim().toLowerCase(), n = 0;
      rows.forEach(function (r) { var hit = (!s || r.textContent.toLowerCase().indexOf(s) > -1) && (!cat || r.getAttribute('data-c') === cat); r.hidden = !hit; if (hit) n++; });
      if (none) none.hidden = n > 0;
    }
    inp.addEventListener('input', run);
    d.querySelectorAll('[data-cat]').forEach(function (b) {
      b.addEventListener('click', function () { cat = b.getAttribute('data-cat'); d.querySelectorAll('[data-cat]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); run(); });
    });
  });
})();
