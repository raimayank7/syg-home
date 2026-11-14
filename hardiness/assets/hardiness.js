/* home.shareyourgroup.com/hardiness: ZIP code to USDA plant hardiness zone. Data: /data/z/<first 3 digits>.json {zip: zone}. Runs in the browser; the ZIP code is not sent anywhere except as a file name of the first three digits. */
(function () {
  'use strict';
  var d = document, cache = {}, T = { '1a': '-60 to -55', '1b': '-55 to -50', '2a': '-50 to -45', '2b': '-45 to -40', '3a': '-40 to -35', '3b': '-35 to -30', '4a': '-30 to -25', '4b': '-25 to -20', '5a': '-20 to -15', '5b': '-15 to -10', '6a': '-10 to -5', '6b': '-5 to 0', '7a': '0 to 5', '7b': '5 to 10', '8a': '10 to 15', '8b': '15 to 20', '9a': '20 to 25', '9b': '25 to 30', '10a': '30 to 35', '10b': '35 to 40', '11a': '40 to 45', '11b': '45 to 50', '12a': '50 to 55', '12b': '55 to 60', '13a': '60 to 65', '13b': '65 to 70' };
  function $(i) { return d.getElementById(i); }
  function c(f) { return Math.round((f - 32) * 5 / 9 * 10) / 10; }
  function show(zip, zone) {
    var out = $('hz-out'), r = T[zone].split(' to ').map(Number), n = parseInt(zone, 10);
    out.innerHTML = '<h2>ZIP code ' + zip + ' is in zone ' + zone + '</h2><p><span class="zbadge">' + zone + '</span></p><p>The average annual extreme minimum winter temperature in this zone is ' + r[0] + ' to ' + r[1] + ' &deg;F (' + c(r[0]) + ' to ' + c(r[1]) + ' &deg;C). This is an average of the coldest night of each winter over 1991 to 2020, not the coldest ever recorded.</p>' +
      '<p><a href="/hardiness/zone-' + n + '/">About zone ' + n + '</a> &middot; <a href="/hardiness/how-to-find-your-zone/">How to use your zone</a></p><p class="hint">Map data: USDA Plant Hardiness Zone Map 2023, PRISM Group, Oregon State University.</p>';
    out.hidden = false;
  }
  function look() {
    var z = ($('hz-zip').value || '').replace(/\D/g, ''), out = $('hz-out');
    if (z.length !== 5) { out.hidden = true; return; }
    var p = z.slice(0, 3);
    (cache[p] ? Promise.resolve(cache[p]) : fetch('/hardiness/data/z/' + p + '.json').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) { cache[p] = j; return j; })).then(function (j) {
      if (j[z]) { show(z, j[z]); try { localStorage.setItem('hz-zip', z); } catch (e) {} } else { out.innerHTML = '<h2>ZIP code ' + z + ' is not in the list</h2><p>The USDA table covers ZIP codes of the 50 states, the District of Columbia and Puerto Rico. Check the number, or look at <a href="/hardiness/how-to-find-your-zone/">how to find your zone</a> for places without a ZIP code.</p>'; out.hidden = false; }
    }).catch(function () { out.innerHTML = '<h2>ZIP code ' + z + ' is not in the list</h2><p>No data for that ZIP code prefix. Check the number.</p>'; out.hidden = false; });
  }
  d.addEventListener('input', function (e) { if (e.target.id === 'hz-zip') look(); });
  d.addEventListener('submit', function (e) { if (e.target.id === 'hz-form') { e.preventDefault(); look(); } });
  try { var s = localStorage.getItem('hz-zip'); if (s && $('hz-zip')) { $('hz-zip').value = s; look(); } } catch (e) {}
})();
