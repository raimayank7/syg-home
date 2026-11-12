/* Garden: "what can I sow now" finder (region + month), remembered region, search on the plant list. */
(function () {
  'use strict';
  var d = document, $ = function (id) { return d.getElementById(id); };
  var reg = $('g-reg'), mon = $('g-mon'), out = $('g-out');
  if (reg && mon && out) {
    try { var r = localStorage.getItem('garden-region'); if (r) reg.value = r; } catch (e) {}
    mon.value = String(new Date().getMonth() + 1);
    var data = null;
    var show = function () {
      if (!data) return;
      var R = reg.value, m = +mon.value, name = mon.options[mon.selectedIndex].text;
      try { localStorage.setItem('garden-region', R); } catch (e) {}
      var veg = data.veg.filter(function (v) { return v[2][R].indexOf(m) > -1; }), fl = data.flowers.filter(function (f) { return f[1][R].indexOf(m) > -1; });
      var html = '<h2>Sow in ' + SYG.esc(name) + ': ' + SYG.esc(reg.options[reg.selectedIndex].text) + '</h2>';
      html += veg.length ? '<p><b>Vegetables and herbs</b></p><div class="chips">' + veg.map(function (v) { return '<a href="/garden/plant/' + v[0] + '/">' + SYG.esc(v[1]) + '</a>'; }).join('') + '</div>'
        : '<p>No vegetable in our list is usually sown in this month here. Use the time to prepare soil and compost.</p>';
      if (fl.length) html += '<p><b>Flowers</b></p><p>' + fl.map(function (f) { return SYG.esc(f[0]); }).join(', ') + '. <a href="/garden/flowers/">Flower calendar</a></p>';
      html += '<p><a class="btn sm ghost" href="/garden/month/' + name.toLowerCase() + '/">All garden jobs for ' + SYG.esc(name) + '</a></p>';
      out.innerHTML = html; out.hidden = false;
    };
    SYG.json('/garden/data/sow.json').then(function (j) { data = j; show(); }).catch(function () { out.innerHTML = '<p>The list could not be loaded. Please open the month page from the list below.</p>'; out.hidden = false; });
    reg.addEventListener('change', show); mon.addEventListener('change', show);
  }
  var q = $('q');
  if (q) q.addEventListener('input', function () {
    var s = q.value.trim().toLowerCase(), n = 0;
    d.querySelectorAll('#plants-ul li').forEach(function (li) { var hit = !s || li.textContent.toLowerCase().indexOf(s) > -1; li.hidden = !hit; if (hit) n++; });
    $('none').hidden = n > 0;
  });
})();
