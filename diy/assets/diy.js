/* home.shareyourgroup.com/diy: building and decorating calculators. Everything runs in the browser; nothing is sent anywhere.
   All lengths are worked in metres inside. Tested by:  node sites/diy/test_diy.js */
(function () {
  'use strict';
  var D = {};
  var LEN = { m: 1, ft: 0.3048, cm: 0.01, mm: 0.001, in: 0.0254 };
  D.LEN = LEN;
  D.M3_PER_BAG = 50 / 1440;          /* a 50 kg bag of cement at 1,440 kg per cubic metre */
  D.DRY = 1.54;                      /* dry volume of concrete = 1.54 x wet volume */
  D.DRY_MORTAR = 1.27;               /* dry volume of mortar and plaster = 1.27 x wet volume */
  D.SQFT = 0.09290304;
  D.CUFT = 0.0283168466;
  D.GAL = 3.785411784;
  D.DOOR = 2.0 * 0.9;                /* square metres a typical door takes off the paintable wall */
  D.WINDOW = 1.2 * 1.2;
  function ceil(x) { return Math.ceil(x - 1e-9); }
  function n(x, def) { x = parseFloat(x); return isFinite(x) ? x : (def == null ? 0 : def); }
  D.toM = function (v, u) { return n(v) * (LEN[u] || 1); };

  /* paint. L, W, H in metres. coverage: square metres per litre per coat. */
  D.paint = function (o) {
    var walls = 2 * (o.L + o.W) * o.H, openings = (o.doors || 0) * D.DOOR + (o.windows || 0) * D.WINDOW;
    var wallNet = Math.max(0, walls - openings), ceiling = o.ceiling ? o.L * o.W : 0, area = wallNet + ceiling;
    var coats = o.coats || 2, litres = area * coats / (o.coverage || 10), withExtra = litres * (1 + (o.extra == null ? 10 : o.extra) / 100);
    return { walls: walls, openings: openings, wallNet: wallNet, ceiling: ceiling, area: area, coats: coats, litres: litres, withExtra: withExtra, gallons: withExtra / D.GAL, packs: D.packs(withExtra, [20, 10, 4, 1]) };
  };
  /* fewest litres over (then fewest tins) to reach at least `need` litres with the given tin sizes */
  D.packs = function (need, sizes) {
    var target = Math.max(need, 0), s = sizes.slice().sort(function (a, b) { return b - a; }), best = null, last = s.length - 1;
    function go(i, got, picks) {
      if (i === last) {
        var k = Math.max(0, ceil((target - got) / s[i] - 1e-9)), all = picks.concat([k]), total = got + k * s[i], cnt = all.reduce(function (a, b) { return a + b; }, 0);
        if (!best || total < best.total - 1e-9 || (Math.abs(total - best.total) < 1e-9 && cnt < best.count)) best = { total: total, count: cnt, picks: all };
        return;
      }
      var top = Math.min(ceil(target / s[i]) + 1, 12);
      for (var k = 0; k <= top; k++) go(i + 1, got + k * s[i], picks.concat([k]));
    }
    go(0, 0, []);
    return { sizes: s, picks: best.picks, total: best.total };
  };

  /* tiles. area m2, tile w,h metres, gap metres, waste percent, perBox tiles (0 = unknown) */
  D.tiles = function (o) {
    var eff = (o.w + o.gap) * (o.h + o.gap), exact = o.area / eff, withWaste = exact * (1 + o.waste / 100), count = ceil(withWaste);
    var tileArea = o.w * o.h;
    return { exact: exact, count: count, boxes: o.perBox > 0 ? ceil(count / o.perBox) : 0, covers: count * tileArea, tileArea: tileArea,
      /* grout: volume of the joints per square metre = (cell area - tile area) x joint depth (tile thickness) */
      groutM3: o.area / eff * (eff - tileArea) * (o.thick || 0.009) };
  };
  /* floor planks or laminate in packs */
  D.floor = function (o) {
    var need = o.area * (1 + o.waste / 100), packs = ceil(need / o.pack);
    return { need: need, packs: packs, bought: packs * o.pack, spare: packs * o.pack - o.area };
  };
  /* concrete: a, b, c in metres (length, width, thickness). ratio [cement, sand, aggregate]. */
  D.concrete = function (o) {
    var wet = o.a * o.b * o.c * (1 + (o.waste == null ? 5 : o.waste) / 100), dry = wet * (o.dry || D.DRY), bag = (o.bd ? 50 / o.bd : D.M3_PER_BAG), s = o.ratio[0] + o.ratio[1] + o.ratio[2];
    var cement = dry * o.ratio[0] / s;
    return { wet: wet, dry: dry, cementM3: cement, bags: ceil(cement / bag), cementKg: cement / bag * 50, sandM3: dry * o.ratio[1] / s, aggM3: dry * o.ratio[2] / s, yards: wet / 0.764554858 };
  };
  /* bricks in a wall. length, height of wall (m), thickness 'single' or 'double' brick width, brick l,w,h and mortar joint (m), openings area m2 */
  D.bricks = function (o) {
    var area = Math.max(0, o.L * o.H - (o.openings || 0)), face = (o.l + o.joint) * (o.h + o.joint), layers = o.thick === 'double' ? 2 : 1;
    var exact = area / face * layers, count = ceil(exact * (1 + (o.waste == null ? 5 : o.waste) / 100));
    var thickness = o.thick === 'double' ? o.l : o.w, wallVol = area * thickness, brickVol = exact * o.l * o.w * o.h, mortarWet = Math.max(0, wallVol - brickVol);
    var mortarDry = mortarWet * (o.dry || D.DRY_MORTAR), s = o.ratio[0] + o.ratio[1], cement = mortarDry * o.ratio[0] / s, bag = (o.bd ? 50 / o.bd : D.M3_PER_BAG);
    return { area: area, exact: exact, count: count, wallVol: wallVol, mortarWet: mortarWet, mortarDry: mortarDry, bags: ceil(cement / bag), sandM3: mortarDry * o.ratio[1] / s, perM2: exact / (area || 1) };
  };
  /* plaster or screed: area m2, thickness m */
  D.plaster = function (o) {
    var wet = o.area * o.t * (1 + (o.waste == null ? 10 : o.waste) / 100), dry = wet * (o.dry || D.DRY_MORTAR), s = o.ratio[0] + o.ratio[1], cement = dry * o.ratio[0] / s, bag = (o.bd ? 50 / o.bd : D.M3_PER_BAG);
    return { wet: wet, dry: dry, bags: ceil(cement / bag), sandM3: dry * o.ratio[1] / s };
  };
  /* gravel, soil, mulch: area m2, depth m, density tonnes per m3 */
  D.fill = function (o) {
    var v = o.area * o.depth * (1 + (o.waste == null ? 5 : o.waste) / 100);
    return { m3: v, yards: v / 0.764554858, cuft: v / D.CUFT, tonnes: v * (o.density || 0) };
  };
  /* wallpaper. perimeter and height in metres, roll width and length metres, pattern repeat metres (0 = plain) */
  D.wallpaper = function (o) {
    var strips = ceil(o.perimeter / o.rollW), cut = o.H + (o.repeat || 0) + (o.trim == null ? 0.1 : o.trim), perRoll = Math.floor(o.rollL / cut + 1e-9);
    var rolls = perRoll > 0 ? ceil(strips / perRoll) : 0;
    return { strips: strips, cut: cut, perRoll: perRoll, rolls: rolls };
  };
  D.fmt = function (x, dp) { if (!isFinite(x)) return '-'; dp = dp == null ? 2 : dp; return (Math.round(x * Math.pow(10, dp)) / Math.pow(10, dp)).toLocaleString('en-IN', { maximumFractionDigits: dp }); };
  D.areaUnits = { sqm: 1, sqft: D.SQFT, sqyd: 0.83612736, acre: 4046.8564224, hectare: 10000, sqin: 0.00064516, sqcm: 0.0001 };

  if (typeof module !== 'undefined') { module.exports = D; return; }
  window.DIY = D;

  var d = document;
  function $(q, el) { return (el || d).querySelector(q); }
  function val(id) { var e = d.getElementById(id); return e ? parseFloat(String(e.value).replace(/,/g, '')) : NaN; }
  function sel(id) { var e = d.getElementById(id); return e ? e.value : ''; }
  function chk(id) { var e = d.getElementById(id); return !!(e && e.checked); }
  function F(x, dp) { return D.fmt(x, dp); }
  function out(tool, html) { var el = d.getElementById(tool + '-out'); if (!el) return; el.innerHTML = html; el.hidden = !html; }
  function len(id, uid) { return D.toM(val(id), sel(uid)); }
  function ok() { for (var i = 0; i < arguments.length; i++) if (!(arguments[i] > 0)) return false; return true; }
  function row(a, b) { return '<tr><td>' + a + '</td><td class="num">' + b + '</td></tr>'; }
  function tbl(rows) { return '<div class="tbl"><table><tbody>' + rows.join('') + '</tbody></table></div>'; }
  var hist = {};

  function paint() {
    var o = { L: len('pa-l', 'pa-u'), W: len('pa-w', 'pa-u'), H: len('pa-h', 'pa-u'), doors: val('pa-doors') || 0, windows: val('pa-win') || 0, ceiling: chk('pa-ceil'), coats: val('pa-coats') || 2, coverage: val('pa-cov') || 10, extra: isNaN(val('pa-extra')) ? 10 : val('pa-extra') };
    if (!ok(o.L, o.W, o.H)) return out('pa', '');
    var r = D.paint(o), p = r.packs, parts = [];
    p.sizes.forEach(function (s, i) { if (p.picks[i]) parts.push(p.picks[i] + ' &times; ' + s + ' litre'); });
    var price = val('pa-price'), cost = price > 0 ? '<p>At &#8377;' + F(price, 0) + ' a litre, about <b>&#8377;' + F(r.withExtra * price, 0) + '</b> for ' + F(r.withExtra, 1) + ' litres, or &#8377;' + F(p.total * price, 0) + ' for the tins above.</p>' : '';
    out('pa', '<h2>You need about ' + F(r.withExtra, 1) + ' litres</h2><p>That is ' + F(r.gallons, 1) + ' US gallons, with ' + F(o.extra, 0) + '% extra for the edges and touch-ups. In common tin sizes: <b>' + (parts.join(' + ') || '-') + '</b> (' + F(p.total, 0) + ' litres in all).</p>' +
      tbl([row('Wall area (all four walls)', F(r.walls, 1) + ' m&sup2; (' + F(r.walls / D.SQFT, 0) + ' sq ft)'), row('Minus doors and windows', F(r.openings, 1) + ' m&sup2;'), row('Ceiling', F(r.ceiling, 1) + ' m&sup2;'), row('Area to paint', F(r.area, 1) + ' m&sup2; (' + F(r.area / D.SQFT, 0) + ' sq ft)'), row('Coats', r.coats), row('Litres for the coats', F(r.litres, 1))]) + cost);
  }
  function tile() {
    var area = sel('ti-mode') === 'size' ? len('ti-l', 'ti-u') * len('ti-w', 'ti-u') : val('ti-area') * (D.areaUnits[sel('ti-au')] || 1);
    var tw = D.toM(val('ti-tw'), sel('ti-tu')), th = D.toM(val('ti-th'), sel('ti-tu')), gap = D.toM(val('ti-gap') || 0, 'mm');
    if (!ok(area, tw, th)) return out('ti', '');
    var r = D.tiles({ area: area, w: tw, h: th, gap: gap, waste: isNaN(val('ti-waste')) ? 10 : val('ti-waste'), perBox: val('ti-box') || 0, thick: D.toM(val('ti-thick') || 9, 'mm') });
    out('ti', '<h2>Buy ' + F(r.count, 0) + ' tiles</h2><p>' + (r.boxes ? 'That is <b>' + r.boxes + ' boxes</b> at ' + F(val('ti-box'), 0) + ' tiles a box. ' : '') + 'They cover ' + F(r.covers, 1) + ' m&sup2; for a floor or wall of ' + F(area, 1) + ' m&sup2; (' + F(area / D.SQFT, 0) + ' sq ft).</p>' +
      tbl([row('Floor or wall area', F(area, 2) + ' m&sup2;'), row('Tiles with no waste', F(r.exact, 1)), row('Waste allowance', F(isNaN(val('ti-waste')) ? 10 : val('ti-waste'), 0) + '%'), row('Tiles to buy', F(r.count, 0)), row('Joint filler (grout) wanted, solid volume', F(r.groutM3 * 1000, 1) + ' litres')]) +
      '<p class="hint">The grout figure is the volume of the joints only. Powder grout bags state their own coverage: use that to decide how many to buy.</p>');
  }
  function floor() {
    var area = sel('fl-mode') === 'size' ? len('fl-l', 'fl-u') * len('fl-w', 'fl-u') : val('fl-area') * (D.areaUnits[sel('fl-au')] || 1);
    var pack = val('fl-pack') * (D.areaUnits[sel('fl-pu')] || 1);
    if (!ok(area, pack)) return out('fl', '');
    var r = D.floor({ area: area, pack: pack, waste: isNaN(val('fl-waste')) ? 10 : val('fl-waste') });
    out('fl', '<h2>Buy ' + r.packs + ' packs</h2><p>You need ' + F(r.need, 2) + ' m&sup2; including ' + F(isNaN(val('fl-waste')) ? 10 : val('fl-waste'), 0) + '% waste. ' + r.packs + ' packs give ' + F(r.bought, 2) + ' m&sup2; (' + F(r.bought / D.SQFT, 1) + ' sq ft), which leaves ' + F(r.spare, 2) + ' m&sup2; spare for repairs.</p>');
  }
  function concrete() {
    var a = len('co-a', 'co-u'), b = len('co-b', 'co-u'), c = D.toM(val('co-c'), sel('co-cu')), ratio = sel('co-mix').split(':').map(Number);
    if (!ok(a, b, c)) return out('co', '');
    var r = D.concrete({ a: a, b: b, c: c, ratio: ratio, waste: isNaN(val('co-waste')) ? 5 : val('co-waste'), dry: val('co-dry') || 0, bd: val('co-bd') || 0 });
    out('co', '<h2>' + F(r.wet, 2) + ' cubic metres of concrete</h2><p>That is ' + F(r.yards, 2) + ' cubic yards, or ' + F(r.wet / D.CUFT, 0) + ' cubic feet. For a ' + sel('co-mix').replace(/:/g, ' : ') + ' mix you need about <b>' + r.bags + ' bags</b> of 50 kg cement, <b>' + F(r.sandM3, 2) + ' m&sup3;</b> of sand and <b>' + F(r.aggM3, 2) + ' m&sup3;</b> of coarse aggregate.</p>' +
      tbl([row('Wet volume with waste', F(r.wet, 3) + ' m&sup3;'), row('Dry volume (&times; 1.54)', F(r.dry, 3) + ' m&sup3;'), row('Cement', r.bags + ' bags (' + F(r.cementKg, 0) + ' kg)'), row('Sand', F(r.sandM3, 2) + ' m&sup3; (' + F(r.sandM3 / D.CUFT, 0) + ' cu ft)'), row('Coarse aggregate', F(r.aggM3, 2) + ' m&sup3; (' + F(r.aggM3 / D.CUFT, 0) + ' cu ft)')]));
  }
  function brick() {
    var preset = sel('br-size') === 'custom' ? [val('br-cl'), val('br-cw'), val('br-ch')] : sel('br-size').split('x').map(Number), l = D.toM(preset[0], 'mm'), w = D.toM(preset[1], 'mm'), h = D.toM(preset[2], 'mm'), joint = D.toM(val('br-joint') || 10, 'mm');
    var L = len('br-l', 'br-u'), H = len('br-h', 'br-u'), op = (val('br-open') || 0) * (D.areaUnits[sel('br-ou')] || 1);
    if (!ok(L, H, l)) return out('br', '');
    var r = D.bricks({ L: L, H: H, openings: op, thick: sel('br-thick'), l: l, w: w, h: h, joint: joint, ratio: sel('br-mortar').split(':').map(Number), waste: isNaN(val('br-waste')) ? 5 : val('br-waste'), dry: val('br-dry') || 0, bd: val('br-bd') || 0 });
    out('br', '<h2>About ' + F(r.count, 0) + ' bricks</h2><p>For ' + F(r.area, 1) + ' m&sup2; of wall (' + F(r.area / D.SQFT, 0) + ' sq ft), with ' + F(isNaN(val('br-waste')) ? 5 : val('br-waste'), 0) + '% for breakage. The mortar needs about <b>' + r.bags + ' bags</b> of cement and <b>' + F(r.sandM3, 2) + ' m&sup3;</b> of sand.</p>' +
      tbl([row('Wall volume', F(r.wallVol, 2) + ' m&sup3;'), row('Bricks per square metre of wall', F(r.perM2, 0)), row('Bricks, no breakage', F(r.exact, 0)), row('Mortar, wet', F(r.mortarWet, 3) + ' m&sup3;'), row('Mortar, dry materials', F(r.mortarDry, 3) + ' m&sup3;')]));
  }
  function plaster() {
    var area = sel('pl-mode') === 'size' ? len('pl-l', 'pl-u') * len('pl-w', 'pl-u') : val('pl-area') * (D.areaUnits[sel('pl-au')] || 1), t = D.toM(val('pl-t'), 'mm');
    if (!ok(area, t)) return out('pl', '');
    var r = D.plaster({ area: area, t: t, ratio: sel('pl-mix').split(':').map(Number), waste: isNaN(val('pl-waste')) ? 10 : val('pl-waste'), dry: val('pl-dry') || 0, bd: val('pl-bd') || 0 });
    out('pl', '<h2>About ' + r.bags + ' bags of cement</h2><p>For ' + F(area, 1) + ' m&sup2; (' + F(area / D.SQFT, 0) + ' sq ft) at ' + F(val('pl-t'), 0) + ' mm, plus <b>' + F(r.sandM3, 2) + ' m&sup3;</b> of sand (' + F(r.sandM3 / D.CUFT, 0) + ' cu ft). Wet mortar: ' + F(r.wet, 3) + ' m&sup3;; dry materials: ' + F(r.dry, 3) + ' m&sup3;.</p>');
  }
  function fill() {
    var area = sel('fi-mode') === 'size' ? len('fi-l', 'fi-u') * len('fi-w', 'fi-u') : val('fi-area') * (D.areaUnits[sel('fi-au')] || 1), depth = D.toM(val('fi-d'), sel('fi-du'));
    var dens = parseFloat(sel('fi-mat'));
    if (!ok(area, depth)) return out('fi', '');
    var r = D.fill({ area: area, depth: depth, density: dens, waste: isNaN(val('fi-waste')) ? 5 : val('fi-waste') });
    out('fi', '<h2>' + F(r.m3, 2) + ' cubic metres</h2><p>That is ' + F(r.yards, 2) + ' cubic yards or ' + F(r.cuft, 0) + ' cubic feet. At about ' + F(dens, 2) + ' tonnes per cubic metre that weighs <b>' + F(r.tonnes, 1) + ' tonnes</b>. Ask your supplier for their own weight per cubic metre: it changes with moisture and grade.</p>');
  }
  function wallpaper() {
    var p = D.toM(val('wp-p'), sel('wp-u')), H = len('wp-h', 'wp-u'), rw = D.toM(val('wp-rw'), sel('wp-ru')), rl = D.toM(val('wp-rl'), sel('wp-ru')), rep = D.toM(val('wp-rep') || 0, 'cm');
    if (!ok(p, H, rw, rl)) return out('wp', '');
    var r = D.wallpaper({ perimeter: p, H: H, rollW: rw, rollL: rl, repeat: rep });
    out('wp', r.perRoll < 1 ? '<h2>The roll is too short</h2><p>One strip needs ' + F(r.cut, 2) + ' m but a roll is ' + F(rl, 2) + ' m. Check the roll length.</p>' :
      '<h2>Buy ' + r.rolls + ' rolls</h2><p>You need ' + r.strips + ' strips of ' + F(r.cut, 2) + ' m (wall height, pattern repeat and 10 cm for trimming). Each roll gives ' + r.perRoll + ' strips. Doors and windows are not taken off, which leaves a little spare; buy all rolls from one batch.</p>');
  }
  function area() {
    var v = val('ar-v'), from = D.areaUnits[sel('ar-from')];
    if (!(v >= 0) || !from) return out('ar', '');
    var m2 = v * from, names = { sqm: 'square metres', sqft: 'square feet', sqyd: 'square yards (gaj)', acre: 'acres', hectare: 'hectares', sqin: 'square inches', sqcm: 'square centimetres' };
    out('ar', '<h2>' + F(v, 4) + ' ' + names[sel('ar-from')] + ' equals</h2>' + tbl(Object.keys(D.areaUnits).filter(function (k) { return k !== sel('ar-from'); }).map(function (k) { return row(names[k], F(m2 / D.areaUnits[k], k === 'acre' || k === 'hectare' ? 6 : 3)); })));
  }
  var TOOLS = { pa: paint, ti: tile, fl: floor, co: concrete, br: brick, pl: plaster, fi: fill, wp: wallpaper, ar: area };
  function modes() {
    var bs = d.getElementById('br-size'), bc = d.getElementById('br-custom'); if (bs && bc) bc.hidden = bs.value !== 'custom';
    ['ti', 'fl', 'pl', 'fi'].forEach(function (k) {
      var m = d.getElementById(k + '-mode'); if (!m) return;
      var sz = d.getElementById(k + '-sz'), ar = d.getElementById(k + '-ar');
      if (sz && ar) { sz.hidden = m.value !== 'size'; ar.hidden = m.value === 'size'; }
    });
  }
  function run(e) {
    var host = e && e.target && e.target.closest ? e.target.closest('[data-tool]') : null;
    modes();
    if (host) { var k = host.getAttribute('data-tool'); if (TOOLS[k]) TOOLS[k](); save(); return; }
    Object.keys(TOOLS).forEach(function (k) { if (d.getElementById(k + '-out')) TOOLS[k](); });
  }
  /* remember what was typed, per page, in this browser only */
  function save() {
    var host = $('[data-tool]'); if (!host) return;
    var vals = {}; [].forEach.call(host.querySelectorAll('input,select'), function (el) { if (el.id) vals[el.id] = el.type === 'checkbox' ? el.checked : el.value; });
    try { localStorage.setItem('diy-' + host.getAttribute('data-tool'), JSON.stringify(vals)); } catch (x) {}
  }
  function restore() {
    var host = $('[data-tool]'); if (!host) return;
    try { var vals = JSON.parse(localStorage.getItem('diy-' + host.getAttribute('data-tool'))); if (vals) Object.keys(vals).forEach(function (id) { var el = d.getElementById(id); if (el) { if (el.type === 'checkbox') el.checked = !!vals[id]; else el.value = vals[id]; } }); } catch (x) {}
  }
  d.addEventListener('input', run); d.addEventListener('change', run);
  restore(); run();
})();
