/* home.shareyourgroup.com/kcal: calories burned from standard MET values. Pure functions tested by: node sites/kcal/test_kcal.js
   Formulas from the Compendium of Physical Activities website (pacompendium.com, Unit Conversions page, read 13 Nov 2026):
   1 MET = 3.5 ml/kg/min = 1 kcal/kg/hr; METs to kcal/min = METs x 3.5 x body weight in kg / 200.
   Intensity classes from the Physical Activity Guidelines for Americans, 2nd edition (HHS, 2018): sedentary <= 1.5 METs, light < 3.0, moderate 3.0 to 5.9, vigorous 6.0 or more. */
(function () {
  'use strict';
  var K = { LB_KG: 0.45359237 };
  K.perMin = function (met, kg) { return met * 3.5 * kg / 200; };
  K.kcal = function (met, kg, min) { return K.perMin(met, kg) * min; };
  K.minutesFor = function (met, kg, target) { return target / K.perMin(met, kg); };
  K.metMin = function (met, min) { return met * min; };
  K.level = function (met) { return met <= 1.5 ? 'sedentary' : met < 3 ? 'light' : met < 6 ? 'moderate' : 'vigorous'; };
  if (typeof module !== 'undefined') { module.exports = K; return; }
  var d = document;
  function $(i) { return d.getElementById(i); }
  function v(i) { var x = parseFloat(String($(i) ? $(i).value : '').replace(/,/g, '')); return isFinite(x) ? x : NaN; }
  function fm(x, dp) { return (Math.round(x * Math.pow(10, dp || 0)) / Math.pow(10, dp || 0)).toLocaleString('en-IN', { maximumFractionDigits: dp || 0 }); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var ACTS = window.KCACTS || [];   /* [code, heading index, MET, description] */
  var HEADS = window.KCHEADS || [];
  function match() {
    var q = ($('k-q').value || '').toLowerCase().split(/\s+/).filter(Boolean), res = [];
    for (var i = 0; i < ACTS.length && res.length < 80; i++) {
      var t = (ACTS[i][3] + ' ' + HEADS[ACTS[i][1]]).toLowerCase(), ok = true;
      for (var j = 0; j < q.length; j++) if (t.indexOf(q[j]) < 0) { ok = false; break; }
      if (ok) res.push(i);
    }
    return res;
  }
  function fill() {
    var sel = $('k-a'), keep = sel.value, res = match(), h = '';
    res.forEach(function (i) { h += '<option value="' + i + '">' + esc(ACTS[i][3].slice(0, 110)) + ' (' + ACTS[i][2] + ' METs)</option>'; });
    sel.innerHTML = h || '<option value="">No activity matches</option>';
    if (keep && sel.querySelector('option[value="' + keep + '"]')) sel.value = keep;
    $('k-n').textContent = res.length >= 80 ? 'Showing the first 80 matches: type more words to narrow.' : res.length + ' matching activities.';
  }
  function calc() {
    var sel = $('k-a'), i = parseInt(sel.value, 10), kg = v('k-w') * ($('k-u').value === 'lb' ? K.LB_KG : 1), min = v('k-m'), out = $('k-out');
    if (!(i >= 0) || !(kg > 0) || !(min > 0)) { out.hidden = true; return; }
    var a = ACTS[i], met = a[2], tot = K.kcal(met, kg, min), tg = v('k-t');
    var h = '<h2>About ' + fm(tot) + ' kcal in ' + fm(min) + ' minutes</h2><div class="tbl"><table><tbody>' +
      '<tr><td>Activity</td><td>' + esc(a[3]) + '</td></tr><tr><td>Group in the Compendium</td><td>' + esc(HEADS[a[1]]) + ' (code ' + a[0] + ')</td></tr>' +
      '<tr><td>MET value (standard, unchanged)</td><td class="num">' + met + '</td></tr><tr><td>Intensity class</td><td>' + K.level(met) + '</td></tr>' +
      '<tr><td>Body weight used</td><td class="num">' + fm(kg, 1) + ' kg</td></tr><tr><td>Per minute</td><td class="num">' + fm(K.perMin(met, kg), 2) + ' kcal</td></tr>' +
      '<tr><td>Per hour</td><td class="num">' + fm(K.perMin(met, kg) * 60) + ' kcal</td></tr><tr><td>MET-minutes</td><td class="num">' + fm(K.metMin(met, min)) + '</td></tr></tbody></table></div>';
    if (tg > 0) h += '<p>To use about ' + fm(tg) + ' kcal at this activity you would need about ' + fm(K.minutesFor(met, kg, tg)) + ' minutes.</p>';
    h += '<p class="hint">A standard MET value describes an average adult; it is not measured on you. Treat the figure as a rough estimate.</p>';
    out.innerHTML = h; out.hidden = false;
  }
  $('k-q').addEventListener('input', function () { fill(); calc(); });
  d.addEventListener('input', function (e) { if (e.target.id !== 'k-q') calc(); });
  d.addEventListener('change', calc);
  fill(); calc();
})();
