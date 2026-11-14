/* home.shareyourgroup.com/shelf: food search on the home page. /data/foods.json lists the foods; runs in the browser. */
(function () {
  'use strict';
  var d = document, rows = [];
  function $(i) { return d.getElementById(i); }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function show() {
    var q = ($('sh-q').value || '').trim().toLowerCase(), box = $('sh-list'); if (!q) { box.innerHTML = ''; return; }
    var w = q.split(/\s+/), hit = rows.filter(function (r) { var n = r.n.toLowerCase(); return w.every(function (x) { return n.indexOf(x) > -1; }); }).sort(function (a, b) { return (a.n.toLowerCase().indexOf(w[0]) === 0 ? 0 : 1) - (b.n.toLowerCase().indexOf(w[0]) === 0 ? 0 : 1) || a.n.length - b.n.length; }).slice(0, 30);
    box.innerHTML = hit.length ? hit.map(function (r) { return '<li><a href="/shelf/' + r.s + '/">' + esc(r.n) + '</a></li>'; }).join('') : '<li>No food with that name in the FoodKeeper data.</li>';
  }
  d.addEventListener('input', function (e) { if (e.target.id === 'sh-q') show(); });
  fetch('/shelf/data/foods.json').then(function (r) { return r.json(); }).then(function (j) { rows = j; show(); });
})();
