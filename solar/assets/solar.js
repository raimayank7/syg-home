/* home.shareyourgroup.com/solar: rooftop solar subsidy, size and payback calculators for India. All in the browser. Tested by node sites/solar/test_solar.js.
   Subsidy rule: MNRE PM-Surya Ghar Annexure I (PIB, Aug 2024): Rs 30,000/kWp for the first 2 kWp, Rs 18,000/kWp for an additional 1 kWp or part thereof, nothing beyond 3 kWp.
   Output rule: PIB Cabinet release 29 Feb 2024: a 3 kW system generates more than 300 units a month on average, taken here as 100 units per kW per month. */
(function () {
  'use strict';
  var S = { FIRST: 30000, NEXT: 18000, FIRST_SP: 33000, NEXT_SP: 19800, UNITS_PER_KW_MONTH: 100 };
  S.subsidy = function (kw, special) {
    if (!(kw > 0)) return 0;
    var a = Math.min(kw, 2), b = Math.max(0, Math.min(kw, 3) - 2);
    return Math.round(a * (special ? S.FIRST_SP : S.FIRST) + b * (special ? S.NEXT_SP : S.NEXT));
  };
  S.generation = function (kw) { return kw * S.UNITS_PER_KW_MONTH; };
  S.size = function (monthlyUnits) { return monthlyUnits / S.UNITS_PER_KW_MONTH; };
  /* payback: cost and tariff are the user's own figures */
  S.payback = function (o) {
    var net = Math.max(0, o.cost - (o.subsidy || 0)), perYear = o.kw * S.UNITS_PER_KW_MONTH * 12 * o.rate;
    return { net: net, perYear: perYear, years: perYear > 0 ? net / perYear : Infinity };
  };
  if (typeof module !== 'undefined') { module.exports = S; return; }
  var d = document;
  function $(i) { return d.getElementById(i); }
  function v(i) { var x = parseFloat(String($(i) ? $(i).value : '').replace(/,/g, '')); return isFinite(x) ? x : NaN; }
  function fm(x, dp) { return (Math.round(x * Math.pow(10, dp || 0)) / Math.pow(10, dp || 0)).toLocaleString('en-IN', { maximumFractionDigits: dp || 0 }); }
  function out(k, h) { var e = $(k + '-out'); if (e) { e.innerHTML = h; e.hidden = !h; } }
  function sub() { var kw = v('su-kw'); if (!(kw > 0)) return out('su', ''); var sp = chk('su-sp'), r1 = sp ? S.FIRST_SP : S.FIRST, r2 = sp ? S.NEXT_SP : S.NEXT, f = Math.min(kw, 2) * r1, s2 = Math.max(0, Math.min(kw, 3) - 2) * r2;
    out('su', '<h2>Central subsidy: &#8377;' + fm(S.subsidy(kw, sp)) + '</h2><div class="tbl"><table><tbody><tr><td>First ' + fm(Math.min(kw, 2), 2) + ' kWp at &#8377;' + fm(r1) + '</td><td class="num">&#8377;' + fm(f) + '</td></tr><tr><td>Next ' + fm(Math.max(0, Math.min(kw, 3) - 2), 2) + ' kWp at &#8377;' + fm(r2) + '</td><td class="num">&#8377;' + fm(s2) + '</td></tr><tr><td>Above 3 kWp</td><td class="num">no extra subsidy</td></tr></tbody></table></div>' + (kw > 3 ? '<p>The subsidy stops at 3 kWp, so a ' + fm(kw, 2) + ' kWp system gets the same as a 3 kWp one.</p>' : '')); }
  function size() { var u = v('sz-u'); if (!(u > 0)) return out('sz', ''); var kw = S.size(u);
    out('sz', '<h2>About ' + fm(kw, 1) + ' kW of solar</h2><p>At the scheme\'s own figure of about ' + S.UNITS_PER_KW_MONTH + ' units per kW per month, ' + fm(kw, 1) + ' kW generates about ' + fm(S.generation(kw)) + ' units a month, which matches the ' + fm(u) + ' units you use. Systems are sold in whole or half kW steps, and the real output depends on your location, roof direction, shade and cleaning.</p>'); }
  function pay() { var kw = v('pb-kw'), cost = v('pb-cost'), rate = v('pb-rate'); if (!(kw > 0 && cost > 0 && rate > 0)) return out('pb', '');
    var sb = chk('pb-sub') ? S.subsidy(kw, chk('pb-sp')) : 0, r = S.payback({ kw: kw, cost: cost, rate: rate, subsidy: sb });
    out('pb', '<h2>Simple payback: about ' + fm(r.years, 1) + ' years</h2><div class="tbl"><table><tbody><tr><td>System cost (your figure)</td><td class="num">&#8377;' + fm(cost) + '</td></tr><tr><td>Central subsidy</td><td class="num">&#8377;' + fm(sb) + '</td></tr><tr><td>You pay</td><td class="num">&#8377;' + fm(r.net) + '</td></tr><tr><td>Units a year (' + S.UNITS_PER_KW_MONTH + ' per kW per month)</td><td class="num">' + fm(kw * S.UNITS_PER_KW_MONTH * 12) + '</td></tr><tr><td>Saving a year at &#8377;' + fm(rate, 2) + ' a unit</td><td class="num">&#8377;' + fm(r.perYear) + '</td></tr></tbody></table></div><p>This is a simple division. It ignores loan interest, tariff changes, panel ageing, maintenance and what you are paid for surplus power.</p>'); }
  function chk(i) { return $(i) && $(i).checked; }
  var T = { su: sub, sz: size, pb: pay };
  function run(e) { var h = e && e.target.closest ? e.target.closest('[data-tool]') : null; if (h) { T[h.getAttribute('data-tool')](); try { save(); } catch (x) {} } else Object.keys(T).forEach(function (k) { if ($(k + '-out')) T[k](); }); }
  function save() { var h = d.querySelector('[data-tool]'); if (!h) return; var o = {}; [].forEach.call(h.querySelectorAll('input'), function (el) { o[el.id] = el.type === 'checkbox' ? el.checked : el.value; }); localStorage.setItem('solar-' + h.getAttribute('data-tool'), JSON.stringify(o)); }
  function restore() { var h = d.querySelector('[data-tool]'); if (!h) return; try { var o = JSON.parse(localStorage.getItem('solar-' + h.getAttribute('data-tool'))); if (o) Object.keys(o).forEach(function (k) { var el = $(k); if (el) { if (el.type === 'checkbox') el.checked = !!o[k]; else el.value = o[k]; } }); } catch (x) {} }
  d.addEventListener('input', run); d.addEventListener('change', run); restore(); run();
})();
