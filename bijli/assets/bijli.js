/* home.shareyourgroup.com/bijli: electricity bill, appliance units and meter reading calculators. Everything runs in the browser.
   The only tariff built in is the one read from an official order (see /about/); for every other supplier you type the rates printed on your own bill. */
(function () {
  'use strict';
  var B = {};
  /* slabs: [{upto: units or null for the rest, rate: rupees per unit}], billed slab by slab ("telescopic"). months scales the slab limits. */
  B.energy = function (units, slabs, months) {
    var left = Math.max(0, units), from = 0, total = 0, rows = [], m = months || 1;
    for (var i = 0; i < slabs.length && left > 0; i++) {
      var cap = slabs[i].upto == null ? Infinity : slabs[i].upto * m, width = cap - from, take = Math.min(left, width);
      if (take > 0) { rows.push({ from: from, to: from + take, units: take, rate: slabs[i].rate, amount: take * slabs[i].rate }); total += take * slabs[i].rate; left -= take; }
      from = cap;
    }
    if (left > 0 && slabs.length) { var r = slabs[slabs.length - 1].rate; rows.push({ from: from, to: from + left, units: left, rate: r, amount: left * r }); total += left * r; }
    return { rows: rows, total: total };
  };
  B.bill = function (o) {
    var e = B.energy(o.units, o.slabs, o.months), fixed = (o.fixedPerKw || 0) * (o.load || 0) * (o.loadShare == null ? 1 : o.loadShare) * (o.months || 1) + (o.fixedFlat || 0) * (o.months || 1);
    var base = e.total + fixed, extra = base * (o.extraPct || 0) / 100 + (o.extraPerUnit || 0) * Math.max(0, o.units), total = Math.max(0, base + extra - (o.rebate || 0));
    return { energy: e, fixed: fixed, extra: extra, total: total, perUnit: o.units > 0 ? total / o.units : 0 };
  };
  B.units = function (watts, hours, count, days) { return watts * hours * (count || 1) * (days || 1) / 1000; };
  if (typeof module !== 'undefined') { module.exports = B; return; }

  var d = document, S = window.SYG, $ = function (q, el) { return (el || d).querySelector(q); }, T = window.BIJLI || {};
  function num(v) { var n = parseFloat(String(v).replace(/,/g, '')); return isFinite(n) ? n : 0; }
  function R(x) { return '₹' + (Math.round(x * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: x % 1 ? 2 : 0, maximumFractionDigits: 2 }); }
  function show(el, h) { el.innerHTML = h; el.hidden = false; }
  function load(k, def) { try { return JSON.parse(localStorage.getItem(k)) || def; } catch (e) { return def; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* ---------- bill calculator ---------- */
  if ($('[data-tool=bill]')) (function () {
    var box = $('#bl-slabs'), out = $('#bl-out'), KEY = 'syg-bijli-own', own = load(KEY, null);
    function rowHtml(upto, rate) {
      return '<div class="srow"><label>Up to units<input type="text" inputmode="decimal" data-upto value="' + (upto == null ? '' : upto) + '" placeholder="rest"></label><label>₹ per unit<input type="text" inputmode="decimal" data-rate value="' + (rate == null ? '' : rate) + '"></label><button type="button" class="x" data-del aria-label="Remove this slab">×</button></div>';
    }
    function setSlabs(list) { box.innerHTML = list.map(function (s) { return rowHtml(s.upto, s.rate); }).join(''); }
    function readSlabs() {
      var rows = [].slice.call(box.querySelectorAll('.srow')).map(function (r) { var u = $('[data-upto]', r).value.trim(); return { upto: u === '' ? null : num(u), rate: num($('[data-rate]', r).value) }; }).filter(function (s) { return s.rate > 0; });
      rows.sort(function (a, b) { return (a.upto == null ? Infinity : a.upto) - (b.upto == null ? Infinity : b.upto); });
      return rows;
    }
    function preset() {
      var v = $('#bl-preset').value, P = T.presets && T.presets[v], note = $('#bl-note');
      $('#bl-band-wrap').hidden = !P;
      if (!P) {
        setSlabs(own && own.slabs && own.slabs.length ? own.slabs : [{ upto: null, rate: null }]);
        $('#bl-fixed').value = own ? own.fixed || '' : ''; $('#bl-flat').value = own ? own.flat || '' : ''; $('#bl-pct').value = own ? own.pct || '' : '';
        note.innerHTML = 'Type the slabs and rates printed on the back of your own bill or on your supplier\'s tariff page. They are remembered in this browser.'; box.classList.remove('lock');
      } else {
        var band = P.bands[+$('#bl-band').value] || P.bands[0];
        setSlabs(band.slabs); $('#bl-fixed').value = band.fixedPerKw; $('#bl-flat').value = ''; $('#bl-pct').value = '';
        if (!num($('#bl-load').value) || num($('#bl-load').value) < band.min || num($('#bl-load').value) > band.max) $('#bl-load').value = band.example;
        note.innerHTML = S.esc(P.note); box.classList.add('lock');
      }
      run();
    }
    function run() {
      var v = $('#bl-preset').value, P = T.presets && T.presets[v], slabs = readSlabs(), units = num($('#bl-units').value), months = +$('#bl-months').value || 1;
      if (!P) save(KEY, { slabs: slabs, fixed: $('#bl-fixed').value, flat: $('#bl-flat').value, pct: $('#bl-pct').value });
      if (!slabs.length) return show(out, '<p><b>Add at least one rate.</b> Type the rupees per unit from your bill. For a single flat rate, leave "Up to units" empty.</p>');
      if (!(units > 0)) return show(out, '<p>Type the units consumed in the bill period. The bill, slab by slab, appears here.</p>');
      var r = B.bill({ units: units, slabs: slabs, months: months, fixedPerKw: num($('#bl-fixed').value), load: num($('#bl-load').value), loadShare: P ? P.loadShare : 1, fixedFlat: num($('#bl-flat').value), extraPct: num($('#bl-pct').value), rebate: num($('#bl-rebate').value) });
      var lines = r.energy.rows.map(function (x) { return '<tr><td>' + Math.round(x.from * 100) / 100 + ' to ' + Math.round(x.to * 100) / 100 + '</td><td class="num">' + Math.round(x.units * 100) / 100 + '</td><td class="num">' + R(x.rate) + '</td><td class="num">' + R(x.amount) + '</td></tr>'; }).join('');
      var t = 'Electricity bill estimate: ' + units + ' units in ' + months + (months > 1 ? ' months' : ' month') + '. Energy charge ' + R(r.energy.total) + ', fixed charge ' + R(r.fixed) + (r.extra ? ', other charges ' + R(r.extra) : '') + (num($('#bl-rebate').value) ? ', less ' + R(num($('#bl-rebate').value)) : '') + '. Total about ' + R(r.total) + '.';
      show(out, '<h2>About ' + R(r.total) + '</h2><div class="tbl"><table><thead><tr><th>Units</th><th class="num">Count</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead><tbody>' + lines + '</tbody></table></div>' +
        '<dl class="facts"><dt>Energy charge</dt><dd>' + R(r.energy.total) + '</dd><dt>Fixed charge</dt><dd>' + R(r.fixed) + (P && P.loadShare !== 1 ? ' (on ' + Math.round(P.loadShare * 100) + '% of ' + num($('#bl-load').value) + ' kW, for ' + months + (months > 1 ? ' months' : ' month') + ')' : '') + '</dd>' +
        (r.extra ? '<dt>Duty and other charges you entered</dt><dd>' + R(r.extra) + '</dd>' : '') + (num($('#bl-rebate').value) ? '<dt>Subsidy or rebate you entered</dt><dd>- ' + R(num($('#bl-rebate').value)) + '</dd>' : '') +
        '<dt>Average cost per unit</dt><dd>' + R(r.perUnit) + '</dd></dl><p class="hint">' + (P ? S.esc(P.caveat) : 'An estimate from the rates you typed. Your bill may also carry fuel adjustment, duty, meter rent, arrears or a subsidy; add them in the boxes above to match it.') + '</p>' +
        '<div class="acts"><button class="btn sm" type="button" data-copy="' + S.esc(t) + '">Copy</button><button class="btn sm ghost" type="button" data-wa="' + S.esc(t + ' https://home.shareyourgroup.com/bijli/') + '">Send on WhatsApp</button></div>');
    }
    $('#bl-add').addEventListener('click', function () { var w = d.createElement('div'); w.innerHTML = rowHtml(null, null); box.appendChild(w.firstChild); });
    box.addEventListener('click', function (e) { var b = e.target.closest('[data-del]'); if (b && box.querySelectorAll('.srow').length > 1) { b.closest('.srow').remove(); run(); } });
    $('#bl-preset').addEventListener('change', preset); $('#bl-band').addEventListener('change', preset);
    $('[data-tool=bill]').addEventListener('input', run);
    $('#bl-months').addEventListener('change', run);
    var qs = /[?&]units=(\d+(\.\d+)?)/.exec(location.search); if (qs) $('#bl-units').value = qs[1];
    preset();
  })();

  /* ---------- appliance units calculator ---------- */
  if ($('[data-tool=apps]')) (function () {
    var KEY = 'syg-bijli-apps', list = load(KEY, []), body = $('#ap-list'), out = $('#ap-out');
    $('#ap-pick').innerHTML = '<option value="">Choose an appliance...</option>' + T.appliances.map(function (a, i) { return '<option value="' + i + '">' + S.esc(a[0]) + ' (about ' + a[1] + ' W)</option>'; }).join('') + '<option value="x">Something else</option>';
    $('#ap-pick').addEventListener('change', function () { var a = T.appliances[+this.value]; if (a) { $('#ap-name').value = a[0]; $('#ap-watts').value = a[1]; $('#ap-hours').value = a[2]; } else if (this.value === 'x') { $('#ap-name').value = ''; $('#ap-watts').value = ''; $('#ap-name').focus(); } });
    function draw() {
      var rate = num($('#ap-rate').value), days = Math.max(1, Math.min(31, parseInt($('#ap-days').value, 10) || 30)), total = 0;
      body.innerHTML = list.length ? '<div class="tbl"><table class="stack"><thead><tr><th>Appliance</th><th>Watts × number</th><th>Hours a day</th><th class="num">Units a day</th><th class="num">Units in ' + days + ' days</th><th></th></tr></thead><tbody>' + list.map(function (a, i) {
        var u = B.units(a.w, a.h, a.n, 1); total += u;
        return '<tr><td data-l="Appliance">' + S.esc(a.name) + '</td><td data-l="Watts × number">' + a.w + ' W × ' + a.n + '</td><td data-l="Hours a day">' + a.h + '</td><td class="num" data-l="Units a day">' + (Math.round(u * 100) / 100) + '</td><td class="num" data-l="Units in ' + days + ' days">' + (Math.round(u * days * 10) / 10) + '</td><td><button type="button" class="btn sm ghost" data-del="' + i + '">Remove</button></td></tr>';
      }).join('') + '</tbody></table></div>' : '<p class="hint">No appliances yet. Add the ones you use every day.</p>';
      save(KEY, list);
      if (!list.length) { out.hidden = true; return; }
      var month = total * days, top = list.slice().sort(function (a, b) { return B.units(b.w, b.h, b.n, 1) - B.units(a.w, a.h, a.n, 1); })[0];
      show(out, '<h2>About ' + (Math.round(month * 10) / 10) + ' units in ' + days + ' days</h2><dl class="facts"><dt>Units a day</dt><dd>' + (Math.round(total * 100) / 100) + '</dd><dt>Biggest user</dt><dd>' + S.esc(top.name) + ' (' + Math.round(B.units(top.w, top.h, top.n, 1) / total * 100) + '% of the total)</dd>' +
        (rate > 0 ? '<dt>Cost at ' + R(rate) + ' a unit</dt><dd>' + R(month * rate) + '</dd>' : '') + '</dl><p class="hint">' + (rate > 0 ? 'A flat rate gives only a rough cost. ' : 'Type your rate per unit above for a rough cost. ') +
        'For a slab-wise bill with fixed charges, <a href="/bijli/?units=' + Math.round(month) + '">open the bill calculator with ' + Math.round(month) + ' units</a>. Watt figures are typical; the label on your own appliance is the true figure, and fridges, air conditioners and geysers switch on and off, so they draw less than their rating over a day.</p>');
    }
    $('#ap-add').addEventListener('click', function () {
      var w = num($('#ap-watts').value), h = num($('#ap-hours').value), n = Math.max(1, parseInt($('#ap-count').value, 10) || 1), msg = $('#ap-msg');
      if (!(w > 0) || !(h > 0) || h > 24) { msg.textContent = 'Type the watts (more than zero) and hours a day (up to 24).'; msg.hidden = false; return; }
      msg.hidden = true; list.push({ name: ($('#ap-name').value.trim() || 'Appliance').slice(0, 40), w: w, h: h, n: n }); $('#ap-pick').value = ''; $('#ap-name').value = ''; $('#ap-watts').value = ''; $('#ap-hours').value = ''; $('#ap-count').value = '1'; draw();
    });
    body.addEventListener('click', function (e) { var b = e.target.closest('[data-del]'); if (b) { list.splice(+b.getAttribute('data-del'), 1); draw(); } });
    $('#ap-rate').addEventListener('input', draw); $('#ap-days').addEventListener('input', draw);
    $('#ap-clear').addEventListener('click', function () { list = []; draw(); });
    draw();
  })();

  /* ---------- meter reading ---------- */
  if ($('[data-tool=meter]')) (function () {
    var out = $('#mt-out');
    function run() {
      var a = num($('#mt-prev').value), b = num($('#mt-now').value), d1 = $('#mt-d1').value, d2 = $('#mt-d2').value;
      if (!$('#mt-prev').value || !$('#mt-now').value) return show(out, '<p>Type the two readings. The units used appear here.</p>');
      if (b < a) return show(out, '<p><b>The present reading is lower than the previous one.</b> Check the two numbers. Leave out any digits after the decimal point or in a red window, and read the line marked kWh.</p>');
      var units = b - a, days = 0;
      if (d1 && d2) days = Math.round((Date.parse(d2) - Date.parse(d1)) / 86400000);
      var h = '<h2>' + (Math.round(units * 100) / 100) + ' units used</h2><dl class="facts"><dt>Previous reading</dt><dd>' + a + '</dd><dt>Present reading</dt><dd>' + b + '</dd>';
      if (days > 0) h += '<dt>Days between readings</dt><dd>' + days + '</dd><dt>Units a day</dt><dd>' + (Math.round(units / days * 100) / 100) + '</dd><dt>At this pace, in 30 days</dt><dd>' + Math.round(units / days * 30) + ' units</dd><dt>At this pace, in 60 days</dt><dd>' + Math.round(units / days * 60) + ' units</dd>';
      h += '</dl>' + (d1 && d2 && days <= 0 ? '<p class="hint">The second date must be after the first.</p>' : '') + '<p><a class="btn sm" href="/bijli/?units=' + Math.round(units) + '">Work out the bill for ' + Math.round(units) + ' units</a></p>';
      show(out, h);
    }
    $('[data-tool=meter]').addEventListener('input', run); run();
  })();
})();
