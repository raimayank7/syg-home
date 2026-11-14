/* home.shareyourgroup.com/ac: AC capacity and running-cost calculators. Pure functions tested by: node sites/ac/test_ac.js
   Official constant: one ton of refrigeration = 3517 watts (BEE label note, Common Regulation, 26 Dec 2025). 1 Btu/h = 0.29307107 W (standard definition). */
(function () {
  'use strict';
  var A = { TR_W: 3517, BTU_W: 0.29307107 };
  A.load = function (o) { return o.area * o.wpm2 + (o.extraW || 0); };           /* watts, from the user's own assumption wpm2 */
  A.tr = function (w) { return w / A.TR_W; };
  A.btu = function (w) { return w / A.BTU_W; };
  /* electricity (kWh) to deliver `coolKwh` of cooling at a seasonal ratio ISEER (kWh of heat removed per kWh of electricity) */
  A.elec = function (coolKwh, iseer) { return coolKwh / iseer; };
  A.coolKwh = function (capacityW, hours, loadPct) { return capacityW / 1000 * hours * loadPct / 100; };
  if (typeof module !== 'undefined') { module.exports = A; return; }
  var d = document;
  function $(i) { return d.getElementById(i); }
  function v(i) { var x = parseFloat(String($(i) ? $(i).value : '').replace(/,/g, '')); return isFinite(x) ? x : NaN; }
  function fm(x, dp) { return (Math.round(x * Math.pow(10, dp || 0)) / Math.pow(10, dp || 0)).toLocaleString('en-IN', { maximumFractionDigits: dp || 0 }); }
  function out(k, h) { var e = $(k + '-out'); if (e) { e.innerHTML = h; e.hidden = !h; } }
  function size() {
    var u = $('sz-u').value, area = v('sz-a') * (u === 'ft' ? 0.09290304 : 1), w = v('sz-w'), ex = v('sz-x') || 0; if (!(area > 0 && w > 0)) return out('sz', '');
    var L = A.load({ area: area, wpm2: w, extraW: ex });
    out('sz', '<h2>About ' + fm(L) + ' W of cooling, which is ' + fm(A.tr(L), 2) + ' tons of refrigeration</h2><div class="tbl"><table><tbody><tr><td>Floor area</td><td class="num">' + fm(area, 1) + ' m&sup2;</td></tr><tr><td>Assumed cooling per m&sup2; (your box)</td><td class="num">' + fm(w) + ' W</td></tr><tr><td>Extra heat sources you listed</td><td class="num">' + fm(ex) + ' W</td></tr><tr><td>Cooling load</td><td class="num">' + fm(L) + ' W</td></tr><tr><td>In tons of refrigeration (1 TR = 3,517 W)</td><td class="num">' + fm(A.tr(L), 2) + '</td></tr><tr><td>In Btu per hour</td><td class="num">' + fm(A.btu(L)) + '</td></tr></tbody></table></div><p>The watts per square metre figure is your assumption, not an official value. Ask an installer to check the room.</p>');
  }
  function conv() {
    var x = v('cv-v'), u = $('cv-u').value; if (!(x > 0)) return out('cv', '');
    var w = u === 'tr' ? x * A.TR_W : u === 'btu' ? x * A.BTU_W : u === 'kw' ? x * 1000 : x;
    out('cv', '<h2>' + fm(w) + ' W</h2><div class="tbl"><table><tbody><tr><td>Watts</td><td class="num">' + fm(w) + '</td></tr><tr><td>Kilowatts</td><td class="num">' + fm(w / 1000, 3) + '</td></tr><tr><td>Tons of refrigeration</td><td class="num">' + fm(A.tr(w), 3) + '</td></tr><tr><td>Btu per hour</td><td class="num">' + fm(A.btu(w)) + '</td></tr></tbody></table></div>');
  }
  function run() {
    var cap = v('rc-cap'), h = v('rc-h'), lp = v('rc-l'), a = v('rc-a'), b = v('rc-b'), r = v('rc-r'); if (!(cap > 0 && h > 0 && lp > 0 && a > 0)) return out('rc', '');
    var c = A.coolKwh(cap, h, lp), ea = A.elec(c, a), html = '<h2>About ' + fm(ea) + ' units of electricity for ' + fm(c) + ' kWh of cooling</h2><p>At ISEER ' + fm(a, 2) + ': ' + fm(ea, 1) + ' kWh' + (r > 0 ? ', about &#8377;' + fm(ea * r) : '') + '.</p>';
    if (b > 0) { var eb = A.elec(c, b); html += '<p>At ISEER ' + fm(b, 2) + ': ' + fm(eb, 1) + ' kWh' + (r > 0 ? ', about &#8377;' + fm(eb * r) : '') + '. Difference: ' + fm(Math.abs(ea - eb), 1) + ' kWh' + (r > 0 ? ' (about &#8377;' + fm(Math.abs(ea - eb) * r) + ')' : '') + '.</p>'; }
    out('rc', html + '<p class="hint">Simple division: cooling energy divided by the seasonal ratio. Real use differs with weather, settings and the unit.</p>');
  }
  var T = { sz: size, cv: conv, rc: run };
  function go(e) { var h = e && e.target.closest ? e.target.closest('[data-tool]') : null; if (h) T[h.getAttribute('data-tool')](); else Object.keys(T).forEach(function (k) { if ($(k + '-out')) T[k](); }); }
  d.addEventListener('input', go); d.addEventListener('change', go); go();
})();
