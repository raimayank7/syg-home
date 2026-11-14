/* home.shareyourgroup.com/cook: oven to air fryer converter. The adjustments are the user's own assumptions (defaults: 20 C lower, 20 percent shorter). Runs in the browser. */
(function () {
  'use strict';
  var d = document;
  function $(i) { return d.getElementById(i); }
  function v(i) { var x = parseFloat(String($(i).value).replace(/,/g, '')); return isFinite(x) ? x : NaN; }
  function calc() {
    var out = $('ov-out'), t = v('ov-t'), m = v('ov-m'), dt = v('ov-dt'), dm = v('ov-dm'), u = $('ov-u').value;
    if (!(t > 0 && m > 0 && dt >= 0 && dm >= 0 && dm < 100)) { out.hidden = true; return; }
    var nt = u === 'F' ? t - dt * 9 / 5 : t - dt, nm = m * (1 - dm / 100), other = u === 'F' ? (nt - 32) * 5 / 9 : nt * 9 / 5 + 32;
    out.innerHTML = '<h2>Air fryer starting point: ' + Math.round(nt) + ' &deg;' + u + ' for about ' + (Math.round(nm * 10) / 10) + ' minutes</h2><p>That is ' + Math.round(other) + ' &deg;' + (u === 'F' ? 'C' : 'F') + '. Check the food with a thermometer against the <a href="/cook/safe-cooking-temperatures/">official minimum internal temperatures</a>: the time is only a guide.</p>';
    out.hidden = false;
  }
  d.addEventListener('input', function (e) { if (e.target.closest && e.target.closest('#oven')) calc(); });
  d.addEventListener('change', function (e) { if (e.target.closest && e.target.closest('#oven')) calc(); });
  calc();
})();
