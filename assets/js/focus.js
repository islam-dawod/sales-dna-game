/* ============================================================
   SALES DNA — BONUS LEVEL: FOCUS & PROCESSING CHALLENGE
   Game 1  👁 SPOT THE DIFFERENCE   (4 planned differences, 45s)
   Game 2  ⚡ QUICK SCAN             (3 rounds, card disappears)
   ------------------------------------------------------------
   NOT an intelligence test. It never feeds the SALES DNA match
   score: it is reported separately and stays at weight 0 until
   company data proves it separates strong from weak employees.

   Coordinate contract (Part A of the V3 spec):
   · both panes render the SAME scene geometry (viewBox 700×300)
   · every difference is stored as NORMALISED 0–1 coordinates
   · clicks are mapped through the real content box, so letterboxing
     from preserveAspectRatio can never shift the hit test
   · the circle is drawn around the DIFFERENCE, never around the click
   ============================================================ */
(function (root) {
  'use strict';
  var UI = root.SDNA.UI, Art = root.SDNA.Art, Store = root.SDNA.Store;
  var esc = function (s) { return UI.esc(s); };
  function isEn() { return UI.getLang() === 'en'; }
  function L(ar, enTxt) { return isEn() ? enTxt : ar; }

  /* one shared coordinate system for both images */
  var VB_W = 700, VB_H = 300;
  var MIN_HIT_PX = 30;                     /* hit area is always ≥ 30px even if the detail is tiny */

  /* the four planned differences — normalised 0–1, never pixels */
  var DIFFS = [
    { id: 'clock',   x: 450 / VB_W, y: 75 / VB_H,  r: 0.055, ar: 'عقارب الساعة',       en: 'The clock hands' },
    { id: 'crm',     x: 536 / VB_W, y: 214 / VB_H, r: 0.058, ar: 'رقم على شاشة CRM',   en: 'A number on the CRM screen' },
    { id: 'headset', x: 310 / VB_W, y: 247 / VB_H, r: 0.050, ar: 'زر صغير في السمّاعة', en: 'A small button on the headset' },
    { id: 'plant',   x: 622 / VB_W, y: 100 / VB_H, r: 0.052, ar: 'ورقة في النبتة',     en: 'A leaf on the plant' }
  ];

  /* ============================================================
     THE OFFICE SCENE — two variants, exactly 4 subtle differences
     ============================================================ */
  function scene(v, debug) {
    var b = v === 'b';
    var out = [];
    out.push('<rect width="700" height="300" fill="#0e1729"/>');
    out.push('<rect y="250" width="700" height="50" fill="#0a1120"/>');
    out.push('<path d="M0 250 h700" stroke="#22304a" stroke-width="2"/>');
    /* window with night city */
    out.push('<rect x="20" y="30" width="140" height="120" rx="6" fill="#0b1526" stroke="#2b3d5c" stroke-width="4"/>');
    out.push('<circle cx="130" cy="58" r="12" fill="#dbeafe" opacity=".65"/>');
    [[30,110,16,40],[52,96,14,54],[72,120,18,30],[96,88,16,62],[118,116,14,34],[136,104,12,46]].forEach(function (r) {
      out.push('<rect x="' + r[0] + '" y="' + r[1] + '" width="' + r[2] + '" height="' + r[3] + '" fill="#16233c"/>');
      for (var yy = r[1] + 6; yy < r[1] + r[3] - 4; yy += 10)
        for (var xx = r[0] + 3; xx < r[0] + r[2] - 4; xx += 7)
          out.push('<rect x="' + xx + '" y="' + yy + '" width="3" height="4" fill="#60a5fa" opacity=".55"/>');
    });
    out.push('<path d="M90 30 v120 M20 90 h140" stroke="#2b3d5c" stroke-width="3"/>');
    /* targets board */
    out.push('<rect x="200" y="25" width="160" height="100" rx="6" fill="#101c33" stroke="#2b3d5c" stroke-width="3"/>');
    out.push('<text x="280" y="45" text-anchor="middle" font-size="12" fill="#7f95bb" font-family="sans-serif">MONTHLY TARGET</text>');
    [[214,58],[240,50],[266,64],[292,42],[318,54],[338,48]].forEach(function (p, i) {
      out.push('<rect x="' + p[0] + '" y="' + p[1] + '" width="14" height="' + (112 - p[1]) + '" rx="2" fill="' +
        (i % 2 ? '#3b82f6' : '#22d3ee') + '" opacity=".8"/>');
    });
    out.push('<path d="M208 112 h146" stroke="#2b3d5c" stroke-width="2"/>');
    /* 1 · clock — minute hand */
    out.push('<circle cx="450" cy="75" r="34" fill="#0b1526" stroke="#8494ad" stroke-width="4"/>');
    for (var i = 0; i < 12; i++) {
      var a = i * Math.PI / 6;
      out.push('<circle cx="' + (450 + 27 * Math.sin(a)).toFixed(1) + '" cy="' + (75 - 27 * Math.cos(a)).toFixed(1) +
        '" r="1.6" fill="#8494ad"/>');
    }
    out.push('<path d="M450 75 l14 -10" stroke="#e5e7eb" stroke-width="3.5" stroke-linecap="round"/>');
    out.push(b ? '<path d="M450 75 l5 23" stroke="#22d3ee" stroke-width="3" stroke-linecap="round"/>'
               : '<path d="M450 75 l21 11" stroke="#22d3ee" stroke-width="3" stroke-linecap="round"/>');
    out.push('<circle cx="450" cy="75" r="3" fill="#e5e7eb"/>');
    /* 4 · plant — one leaf */
    out.push('<rect x="540" y="150" width="130" height="7" rx="3" fill="#22304a"/>');
    out.push('<path d="M592 150 l-10 -26 h44 l-10 26 z" fill="#7c4a2d"/>');
    out.push('<path d="M604 124 C596 108 578 100 566 104 C572 120 588 126 604 124 z" fill="#10b981" opacity=".9"/>');
    out.push('<path d="M604 124 C612 106 632 98 644 104 C638 120 620 128 604 124 z" fill="#34d399" opacity=".9"/>');
    if (!b) out.push('<path d="M606 122 C606 104 616 90 630 86 C634 102 622 116 606 122 z" fill="#059669" opacity=".95"/>');
    out.push('<path d="M604 126 v-14" stroke="#065f46" stroke-width="3"/>');
    /* people */
    out.push(person(250));
    out.push(person(410));
    /* desk */
    out.push('<rect y="250" width="700" height="18" fill="#1b2942"/>');
    out.push('<rect y="268" width="700" height="10" fill="#131f34"/>');
    /* monitor A */
    out.push('<rect x="86" y="176" width="104" height="70" rx="5" fill="#050b16" stroke="#33415c" stroke-width="3"/>');
    out.push('<path d="M96 232 l18 -22 l16 12 l20 -30 l18 22" stroke="#22d3ee" stroke-width="3" fill="none"/>');
    out.push('<rect x="128" y="246" width="20" height="6" fill="#33415c"/>');
    /* 2 · CRM monitor — one digit */
    out.push('<rect x="470" y="168" width="130" height="80" rx="5" fill="#050b16" stroke="#33415c" stroke-width="3"/>');
    out.push('<text x="480" y="186" font-size="10" fill="#7f95bb" font-family="sans-serif">CRM · CUSTOMER</text>');
    out.push('<text x="480" y="202" font-size="11" fill="#cfe0ff" font-family="sans-serif">SAMIR K.</text>');
    out.push('<text x="480" y="221" font-size="16" fill="#34d399" font-family="monospace">' + (b ? '18,900' : '18,400') + '</text>');
    out.push('<text x="480" y="238" font-size="10" fill="#7f95bb" font-family="sans-serif">STATUS: INTERESTED</text>');
    out.push('<rect x="525" y="248" width="20" height="5" fill="#33415c"/>');
    /* 3 · headset — small button */
    out.push('<path d="M312 246 a20 20 0 0 1 38 0" stroke="#111827" stroke-width="6" fill="none"/>');
    out.push('<rect x="304" y="240" width="12" height="16" rx="5" fill="#1f2937"/>');
    out.push('<rect x="346" y="240" width="12" height="16" rx="5" fill="#1f2937"/>');
    if (!b) out.push('<circle cx="310" cy="247" r="3.6" fill="#22d3ee"/>');
    /* desk phone / cup / documents */
    out.push('<rect x="200" y="234" width="46" height="16" rx="3" fill="#1f2937"/>');
    out.push('<path d="M204 234 q22 -16 38 0" stroke="#111827" stroke-width="6" fill="none"/>');
    out.push('<path d="M382 232 h26 l-3 18 h-20 z" fill="#e5e7eb"/>');
    out.push('<path d="M408 236 a7 7 0 0 1 0 10" stroke="#e5e7eb" stroke-width="3" fill="none"/>');
    out.push('<path d="M386 236 h18" stroke="#b45309" stroke-width="3"/>');
    out.push('<rect x="620" y="238" width="52" height="12" rx="2" fill="#e5e7eb" opacity=".85"/>');
    out.push('<rect x="624" y="232" width="52" height="12" rx="2" fill="#cbd5e1" opacity=".85"/>');
    /* debug hitboxes — manager / developer only, never a candidate */
    if (debug) {
      DIFFS.forEach(function (d, i) {
        var cx = d.x * VB_W, cy = d.y * VB_H, rr = Math.max(MIN_HIT_PX, d.r * VB_W);
        out.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + rr + '" fill="none" stroke="#f472b6" stroke-width="2" stroke-dasharray="5 4"/>');
        out.push('<text x="' + cx + '" y="' + (cy + 5) + '" text-anchor="middle" font-size="14" fill="#f472b6" font-family="monospace">' + (i + 1) + '</text>');
      });
    }
    return '<svg viewBox="0 0 ' + VB_W + ' ' + VB_H + '" preserveAspectRatio="xMidYMid meet" ' +
      'class="spot-svg" xmlns="http://www.w3.org/2000/svg">' + out.join('') + '</svg>';

    function person(cx) {
      return '<g>' +
        '<path d="M' + (cx - 46) + ' 250 c0 -34 20 -54 46 -54 c26 0 46 20 46 54 z" fill="url(#gSuit)" opacity=".95"/>' +
        '<circle cx="' + cx + '" cy="176" r="26" fill="url(#gSkin)"/>' +
        '<path d="M' + (cx - 26) + ' 172 c0 -22 12 -32 26 -32 c14 0 26 10 26 32 c-6 -10 -12 -14 -26 -14 c-14 0 -20 4 -26 14 z" fill="#241f36"/>' +
        '<circle cx="' + (cx - 9) + '" cy="178" r="3" fill="#1e1b2e"/><circle cx="' + (cx + 9) + '" cy="178" r="3" fill="#1e1b2e"/>' +
        '<path d="M' + (cx - 8) + ' 190 q8 6 16 0" stroke="#7c3f27" stroke-width="2.5" fill="none"/>' +
        '<path d="M' + (cx - 27) + ' 170 a27 27 0 0 1 54 0" stroke="#111827" stroke-width="5" fill="none"/>' +
        '<rect x="' + (cx - 33) + '" y="166" width="12" height="18" rx="5" fill="#111827"/>' +
        '<rect x="' + (cx + 21) + '" y="166" width="12" height="18" rx="5" fill="#111827"/>' +
        '</g>';
    }
  }

  /* ---------- geometry: real content box of a letterboxed svg ---------- */
  function contentBox(svgEl) {
    var r = svgEl.getBoundingClientRect();
    var vbAR = VB_W / VB_H, boxAR = r.width / r.height, cw, ch, ox, oy;
    if (boxAR > vbAR) { ch = r.height; cw = ch * vbAR; ox = (r.width - cw) / 2; oy = 0; }
    else { cw = r.width; ch = cw / vbAR; ox = 0; oy = (r.height - ch) / 2; }
    return { left: r.left + ox, top: r.top + oy, w: cw, h: ch, ox: ox, oy: oy };
  }
  function normalise(ev, svgEl) {
    var c = contentBox(svgEl);
    return { nx: (ev.clientX - c.left) / c.w, ny: (ev.clientY - c.top) / c.h, box: c };
  }
  function hitTest(nx, ny, box, taken) {
    var best = null, bestD = Infinity;
    DIFFS.forEach(function (d) {
      if (taken && taken[d.id]) return;
      var dx = (nx - d.x) * box.w, dy = (ny - d.y) * box.h;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var rad = Math.max(MIN_HIT_PX, d.r * box.w);
      if (dist <= rad && dist < bestD) { bestD = dist; best = d; }
    });
    return best;
  }

  /* ============================================================
     QUICK SCAN
     ============================================================ */
  /* the card content itself, per language — the distractors are built from
     these same lists so a card never mixes languages */
  var DATA = {
    ar: {
      names:    ['سمير خطيب', 'رانيا حداد', 'محمود عابد', 'ليلى نصار', 'فادي شاهين', 'دانا قاسم'],
      services: ['زرع أسنان', 'تقويم شفاف', 'تبييض', 'تركيبات زيركون', 'حشوات تجميلية', 'جراحة لثة'],
      status:   ['مهتم', 'يفكّر', 'ينتظر موافقة العائلة', 'يريد تقسيط'],
      notes:    ['يسأل عن التقسيط', 'يفضّل التواصل بالواتساب', 'زار العيادة مرة', 'تحوّل من عميل قديم'],
      follow:   ['اليوم', 'غداً', 'بعد يومين', 'الأسبوع القادم']
    },
    en: {
      names:    ['Samir Khatib', 'Rania Haddad', 'Mahmoud Abed', 'Layla Nassar', 'Fadi Shaheen', 'Dana Qasem'],
      services: ['Dental implant', 'Clear aligners', 'Whitening', 'Zirconia crowns', 'Cosmetic fillings', 'Gum surgery'],
      status:   ['Interested', 'Thinking about it', 'Waiting on the family', 'Wants instalments'],
      notes:    ['Asking about instalments', 'Prefers WhatsApp', 'Visited the clinic once', 'Referred by an old customer'],
      follow:   ['Today', 'Tomorrow', 'In two days', 'Next week']
    }
  };
  function D() { return isEn() ? DATA.en : DATA.ar; }

  function card(round, rnd) {
    var price = (8 + Math.floor(rnd() * 26)) * 1000;
    var calls = 1 + Math.floor(rnd() * 5);
    var hour = 9 + Math.floor(rnd() * 10);
    var min = rnd() > .5 ? '30' : '00';
    var d = D();
    var fields = [
      { k: 'name',    ar: 'الاسم',             en: 'Name',         v: d.names[Math.floor(rnd() * d.names.length)] },
      { k: 'service', ar: 'الخدمة المطلوبة',   en: 'Service requested',      v: d.services[Math.floor(rnd() * d.services.length)] },
      { k: 'price',   ar: 'السعر المعروض',     en: 'Price quoted',       v: price.toLocaleString('en-US') },
      { k: 'calls',   ar: 'عدد الاتصالات',     en: 'Number of calls', v: String(calls) },
      { k: 'time',    ar: 'وقت مناسب للاتصال', en: 'Best time to call',  v: hour + ':' + min },
      { k: 'status',  ar: 'الحالة',            en: 'Status',      v: d.status[Math.floor(rnd() * d.status.length)] },
      { k: 'follow',  ar: 'موعد المتابعة',     en: 'Follow-up date',  v: d.follow[Math.floor(rnd() * d.follow.length)] },
      { k: 'note',    ar: 'ملاحظة',            en: 'Note',       v: d.notes[Math.floor(rnd() * d.notes.length)] }
    ];
    return { fields: fields.slice(0, [5, 6, 7][round - 1]), secs: [8, 7, 6][round - 1], price: price, calls: calls };
  }

  function questionsFor(c, rnd) {
    var pool = c.fields.filter(function (f) { return f.k !== 'name'; });
    var idx = pool.map(function (_, i) { return i; }), picked = [];
    for (var k = 0; k < 2 && idx.length; k++) {
      var j = Math.floor(rnd() * idx.length);
      picked.push(pool[idx[j]]); idx.splice(j, 1);
    }
    return picked.map(function (f) {
      var qtext = {
        service: L('ما هي الخدمة التي يريدها العميل؟', 'Which service does the customer want?'),
        price:   L('ما هو السعر المعروض؟', 'What price was quoted?'),
        calls:   L('كم مرة تم الاتصال بالعميل؟', 'How many times was the customer called?'),
        time:    L('ما هو الوقت المناسب للاتصال؟', 'What is the best time to call?'),
        status:  L('ما هي حالة العميل؟', 'What is the customer status?'),
        follow:  L('ما هو موعد المتابعة؟', 'When is the follow-up?'),
        note:    L('ما هي الملاحظة المسجّلة؟', 'What note was recorded?')
      }[f.k];
      var o = distractors(f, c, rnd);
      return { q: qtext, opts: o.list, correct: o.correct, field: f.k };
    });
  }

  function distractors(f, c, rnd) {
    var list;
    if (f.k === 'price') {
      var p = c.price;
      list = [p, p + 1000, p - 2000, p + 3000].map(function (x) { return x.toLocaleString('en-US'); });
    } else if (f.k === 'calls') {
      list = [c.calls, c.calls + 1, Math.max(1, c.calls - 1), c.calls + 2].map(String);
    } else if (f.k === 'follow') {
      list = ['اليوم', 'غداً', 'بعد يومين', 'الأسبوع القادم'];
    } else if (f.k === 'status') {
      list = STATUS.slice();
    } else if (f.k === 'service') {
      list = [f.v].concat(SERVICES.filter(function (s) { return s !== f.v; }).slice(0, 3));
    } else if (f.k === 'time') {
      var hh = parseInt(f.v, 10), mm = f.v.split(':')[1];
      list = [f.v, (hh + 1) + ':' + mm, (hh - 1) + ':' + mm, hh + ':' + (mm === '30' ? '00' : '30')];
    } else {
      list = [f.v].concat(NOTES.filter(function (s) { return s !== f.v; }).slice(0, 3));
    }
    var uniq = [];
    list.forEach(function (x) { x = String(x); if (uniq.indexOf(x) < 0) uniq.push(x); });
    if (uniq.indexOf(String(f.v)) < 0) uniq[0] = String(f.v);
    var four = uniq.slice(0, 4);
    while (four.length < 4) four.push(four[0] + ' ');
    var shuffled = four.sort(function () { return rnd() - 0.5; });
    var ci = shuffled.indexOf(String(f.v));
    if (ci < 0) { shuffled[0] = String(f.v); ci = 0; }
    return { list: shuffled, correct: ci };
  }

  /* ============================================================
     SCORING — accuracy 60% · speed 30% · completion 10%
     ============================================================ */
  function clamp01(x) { return Math.max(0, Math.min(1, x)); }

  function scoreFrom(raw) {
    var s = raw.spot, q = raw.scan;
    var foundRatio = s.total ? s.found / s.total : 0;
    var clicks = s.found + s.wrong;
    var precision = clicks ? s.found / clicks : 0;
    var scanRatio = q.total ? q.correct / q.total : 0;
    var avgDetect = s.times && s.times.length
      ? s.times.reduce(function (a, b) { return a + b; }, 0) / s.times.length : s.limit;
    var speedSpot = clamp01(1 - (avgDetect - 6) / 22);
    var speedScan = clamp01(1 - (q.avg - 2) / 6);
    var accuracy = 100 * (0.35 * foundRatio + 0.25 * precision + 0.40 * scanRatio);
    var speed = 100 * (0.5 * speedSpot + 0.5 * speedScan);
    var completion = 100 * (0.5 * foundRatio + 0.5 * clamp01(q.total / 6));
    return {
      focus: Math.round(0.6 * accuracy + 0.3 * speed + 0.1 * completion),
      sub: {
        visual:   Math.round(100 * (0.7 * foundRatio + 0.3 * precision)),
        speed:    Math.round(speed),
        accuracy: Math.round(100 * (0.5 * precision + 0.5 * scanRatio)),
        recall:   Math.round(100 * scanRatio)
      },
      raw: {
        found: s.found, total: s.total, wrong: s.wrong, times: s.times || [],
        elapsed: s.elapsed, first: (s.times && s.times[0]) || null,
        detections: s.detections || [],
        scanCorrect: q.correct, scanTotal: q.total, scanAvg: q.avg, rounds: q.rounds
      },
      completedAt: raw.completedAt || null
    };
  }

  /* ============================================================
     SPOT THE DIFFERENCE — playable board (shared by game + QA)
     opts: { debug, calibration, limit, onEnd(result) }
     ============================================================ */
  function spotBoard(host, opts) {
    opts = opts || {};
    var limit = opts.limit || 45;
    var debug = !!opts.debug;
    var found = {}, res = { found: 0, total: DIFFS.length, wrong: 0, times: [], detections: [], elapsed: 0, limit: limit };
    var t0 = performance.now(), ended = false, iv = null;
    var missTimes = [], cooldownUntil = 0;

    host.innerHTML =
      '<div class="fx-top"><div class="fx-title">👁 SPOT THE DIFFERENCE' + (debug ? ' · DEBUG' : '') + '</div>' +
        '<div class="fx-stat"><b id="fxFound">0</b>/' + DIFFS.length + ' ' + esc(L('اختلافات', 'differences')) + '</div>' +
        '<div class="fx-timer" id="fxTimer" dir="ltr">00:' + String(limit).padStart(2, '0') + '</div></div>' +
      '<div class="fx-bar"><i id="fxBar" style="width:100%"></i></div>' +
      '<div class="spot-wrap">' +
        pane('a') + pane('b') +
      '</div>' +
      '<div class="fx-hint muted sm" id="fxHint">' +
        esc(L('اضغط على المكان الذي تلاحظ فيه اختلافاً', 'Click where you notice a difference')) + '</div>';

    function pane(v) {
      return '<div class="spot-pane" data-v="' + v + '">' + scene(v, debug) +
        '<span class="spot-lbl">' + v.toUpperCase() + '</span>' +
        '<div class="spot-marks" dir="ltr"></div></div>';
    }

    var timerNode = host.querySelector('#fxTimer'), barNode = host.querySelector('#fxBar');
    iv = setInterval(function () {
      var left = limit - (performance.now() - t0) / 1000;
      if (left <= 0) return finish();
      timerNode.textContent = '00:' + String(Math.ceil(left)).padStart(2, '0');
      barNode.style.width = (100 * left / limit) + '%';
      if (left < 10) timerNode.classList.add('urgent');
    }, 100);

    /* keep every marks layer exactly over the rendered image content box */
    function syncLayers() {
      UI.$$('.spot-pane', host).forEach(function (pane) {
        var svg = pane.querySelector('svg'), layer = pane.querySelector('.spot-marks');
        var pr = pane.getBoundingClientRect(), c = contentBox(svg);
        layer.style.left = (c.left - pr.left) + 'px';
        layer.style.top = (c.top - pr.top) + 'px';
        layer.style.width = c.w + 'px';
        layer.style.height = c.h + 'px';
      });
    }
    syncLayers();
    var ro = root.ResizeObserver ? new ResizeObserver(syncLayers) : null;
    if (ro) UI.$$('.spot-pane', host).forEach(function (p) { ro.observe(p); });
    root.addEventListener('resize', syncLayers);

    UI.$$('.spot-pane', host).forEach(function (pane) {
      pane.addEventListener('click', function (ev) {
        if (ended) return;
        var now = performance.now();
        if (now < cooldownUntil) return;                     /* anti-spam cooldown */
        var svg = pane.querySelector('svg');
        var m = normalise(ev, svg);
        if (m.nx < 0 || m.nx > 1 || m.ny < 0 || m.ny > 1) return;   /* clicked the letterbox */
        var hit = hitTest(m.nx, m.ny, m.box, found);
        if (hit) {
          found[hit.id] = true;
          res.found++;
          var t = Math.round((now - t0) / 100) / 10;
          res.times.push(t);
          res.detections.push({ id: hit.id, t: t });
          host.querySelector('#fxFound').textContent = res.found;
          markAll(hit, res.found);
          root.SDNA.Game.Sound.pick();
          if (res.found === DIFFS.length) setTimeout(finish, 550);
        } else {
          res.wrong++;
          missFlash(pane, ev);
          root.SDNA.Game.Sound.tap();
          missTimes.push(now);
          missTimes = missTimes.filter(function (x) { return now - x < 1500; });
          if (missTimes.length >= 3) { cooldownUntil = now + 700; missTimes = []; flashHint(); }
        }
      });
    });

    /* the circle is anchored to the DIFFERENCE coordinate in BOTH panes */
    function markAll(d, n) {
      syncLayers();
      UI.$$('.spot-pane', host).forEach(function (pane) {
        var layer = pane.querySelector('.spot-marks');
        var size = Math.max(MIN_HIT_PX * 1.9, d.r * layer.offsetWidth * 2.1);
        var m = document.createElement('i');
        m.className = 'spot-mark ok';
        m.style.left = (d.x * 100) + '%';
        m.style.top = (d.y * 100) + '%';
        m.style.width = m.style.height = size + 'px';
        m.dataset.n = n;
        layer.appendChild(m);
      });
    }
    function missFlash(pane, ev) {
      var pr = pane.getBoundingClientRect();
      var m = document.createElement('i');
      m.className = 'spot-mark miss';
      m.style.left = (ev.clientX - pr.left) + 'px';
      m.style.top = (ev.clientY - pr.top) + 'px';
      pane.appendChild(m);
      setTimeout(function () { m.remove(); }, 650);
    }
    function flashHint() {
      var h = host.querySelector('#fxHint');
      if (!h) return;
      h.classList.add('cool');
      setTimeout(function () { h.classList.remove('cool'); }, 700);
    }

    function finish() {
      if (ended) return;
      ended = true;
      clearInterval(iv);
      if (ro) ro.disconnect();
      root.removeEventListener('resize', syncLayers);
      res.elapsed = Math.round((performance.now() - t0) / 100) / 10;
      if (opts.onEnd) opts.onEnd(res);
    }
    return { stop: finish, res: res };
  }

  /* ============================================================
     RUNNER — full bonus level
     ============================================================ */
  function run(subject, done) {
    var app = document.getElementById('app');
    var rnd = Math.random;
    var res = {
      spot: { found: 0, total: DIFFS.length, wrong: 0, times: [], detections: [], elapsed: 0, limit: 45 },
      scan: { correct: 0, total: 0, avg: 0, rounds: 3 }
    };
    var scanTimes = [];
    var name = (subject && subject.name || '').split(' ')[0];
    var debug = !!(Store.get().settings.spotDebug);

    intro();

    function intro() {
      app.innerHTML = '<div class="screen focus-intro">' +
        '<div class="fx-hero">' + Art.hero({ pose: 'point', expr: 'wow' }) + '</div>' +
        '<div class="fin-card pop">' +
          '<div class="unlock pop">🔓 <b>BONUS LEVEL UNLOCKED</b></div>' +
          '<h1>⚡ ONE LAST CHALLENGE</h1>' +
          '<p class="big">' + esc(L('جاهز لاختبار تركيزك؟', 'Ready to test your focus?')) + '</p>' +
          '<p class="muted">' + esc(L('تحديان قصيران · حوالي دقيقة ونصف · الوقت يبدأ عند الضغط',
                                      'Two short challenges · about a minute and a half · the clock starts when you click')) + '</p>' +
          '<button class="btn btn-primary btn-xl" id="fxStart">' + esc(L('ابدأ التحدي', 'Start the challenge')) + '</button>' +
        '</div></div>';
      document.getElementById('fxStart').onclick = function () { root.SDNA.Game.Sound.unlock(); spotIntro(); };
    }

    function spotIntro() {
      app.innerHTML = '<div class="screen focus-brief">' +
        '<div class="fin-card pop">' +
          '<div class="fx-badge">GAME 1 / 2</div>' +
          '<h1>👁 SPOT THE DIFFERENCE</h1>' +
          '<p class="big">' + esc(L('هناك 4 اختلافات بين الصورتين. اكتشفها قبل انتهاء الوقت.',
                                    'There are 4 differences between the two pictures. Find them before the time runs out.')) + '</p>' +
          '<p class="muted sm">' + esc(L('الاختلافات صغيرة جداً · اضغط بدقة · الضغط الخاطئ يُحتسب',
                                         'The differences are very small · click precisely · wrong clicks are counted')) + '</p>' +
          '<button class="btn btn-primary btn-xl" id="go">' + esc(L('ابدأ · 45 ثانية', 'Start · 45 seconds')) + '</button>' +
        '</div></div>';
      document.getElementById('go').onclick = function () {
        app.innerHTML = '<div class="screen focus-game" id="spotHost"></div>';
        spotBoard(document.getElementById('spotHost'), {
          debug: debug, limit: 45,
          onEnd: function (r) { res.spot = r; scanIntro(); }
        });
      };
    }

    function scanIntro() {
      app.innerHTML = '<div class="screen focus-brief">' +
        '<div class="fin-card pop">' +
          '<div class="fx-badge">GAME 2 / 2</div>' +
          '<h1>⚡ QUICK SCAN</h1>' +
          '<p class="big">' + esc(L('ستظهر بطاقة عميل لثوانٍ قليلة ثم تختفي. ركّز جيداً على التفاصيل.',
                                    'A customer card will appear for a few seconds, then disappear. Concentrate on the details.')) + '</p>' +
          '<p class="muted sm">' + esc(L('3 جولات · الكرت يصبح أصعب في كل جولة',
                                         '3 rounds · the card gets harder each round')) + '</p>' +
          '<button class="btn btn-primary btn-xl" id="go">' + esc(L('ابدأ', 'Start')) + '</button>' +
        '</div></div>';
      document.getElementById('go').onclick = function () { round(1); };
    }

    function round(r) {
      if (r > 3) return finish();
      var c = card(r, rnd), qs = questionsFor(c, rnd);
      countdown();

      function countdown() {
        var n = 3;
        app.innerHTML = '<div class="screen focus-game">' +
          '<div class="fx-top"><div class="fx-title">⚡ QUICK SCAN</div>' +
            '<div class="fx-stat">🔥 ROUND ' + r + '/3</div>' +
            '<div class="fx-timer" dir="ltr">00:0' + c.secs + '</div></div>' +
          '<div class="scan-say">' + esc(L('ركّز جيداً… ستختفي البطاقة!', 'Concentrate… the card is about to vanish!')) + '</div>' +
          '<div class="count-big" id="cnt">3</div></div>';
        var iv = setInterval(function () {
          n--;
          if (n <= 0) { clearInterval(iv); showCard(); return; }
          document.getElementById('cnt').textContent = n;
        }, 620);
      }

      function showCard() {
        app.innerHTML = '<div class="screen focus-game">' +
          '<div class="fx-top"><div class="fx-title">⚡ QUICK SCAN</div>' +
            '<div class="fx-stat">🔥 ROUND ' + r + '/3</div>' +
            '<div class="fx-timer urgent" id="fxTimer" dir="ltr">00:0' + c.secs + '</div></div>' +
          '<div class="fx-bar"><i id="fxBar" style="width:100%"></i></div>' +
          '<div class="cust-card pop"><div class="cc-head">CUSTOMER CARD</div>' +
            c.fields.map(function (f) {
              return '<div class="cc-row"><span>' + esc(isEn() ? f.en : f.ar) + '</span><b>' + esc(f.v) + '</b></div>';
            }).join('') + '</div></div>';
        var t0 = performance.now(), bar = document.getElementById('fxBar'), tm = document.getElementById('fxTimer');
        var iv = setInterval(function () {
          var left = c.secs - (performance.now() - t0) / 1000;
          if (left <= 0) { clearInterval(iv); ask(0); return; }
          bar.style.width = (100 * left / c.secs) + '%';
          tm.textContent = '00:0' + Math.ceil(left);
        }, 80);
      }

      function ask(qi) {
        if (qi >= qs.length) return round(r + 1);
        var q = qs[qi], t0 = performance.now();
        res.scan.total++;
        app.innerHTML = '<div class="screen focus-game">' +
          '<div class="fx-top"><div class="fx-title">⚡ QUICK SCAN</div>' +
            '<div class="fx-stat">🔥 ROUND ' + r + '/3</div>' +
            '<div class="fx-stat">' + esc(L('سؤال', 'Question')) + ' ' + (qi + 1) + '/' + qs.length + '</div></div>' +
          '<div class="scan-q pop">💨 ' + esc(L('اختفت البطاقة!', 'The card is gone!')) + '</div>' +
          '<h2 class="q-text">' + esc(q.q) + '</h2>' +
          '<div class="opts scan-opts">' + q.opts.map(function (o, k) {
            return '<button class="opt" data-k="' + k + '"><span class="opt-ic">' + 'ABCD'[k] + '</span>' +
              '<span class="opt-t">' + esc(o) + '</span></button>';
          }).join('') + '</div></div>';
        UI.$$('.opt', app).forEach(function (btn) {
          btn.onclick = function () {
            scanTimes.push(Math.round(((performance.now() - t0) / 1000) * 10) / 10);
            var ok = Number(btn.dataset.k) === q.correct;
            if (ok) res.scan.correct++;
            UI.$$('.opt', app).forEach(function (b) { b.disabled = true; b.classList.add('dim'); });
            btn.classList.remove('dim');
            btn.classList.add(ok ? 'chosen' : 'wrong');
            root.SDNA.Game.Sound[ok ? 'pick' : 'tap']();
            setTimeout(function () { ask(qi + 1); }, 420);
          };
        });
      }
    }

    function finish() {
      res.scan.avg = scanTimes.length
        ? Math.round((scanTimes.reduce(function (a, b) { return a + b; }, 0) / scanTimes.length) * 10) / 10 : 0;
      var out = scoreFrom(res);
      out.completedAt = new Date().toISOString().slice(0, 10);
      done(out);
    }
  }

  /* ============================================================
     CALIBRATION TEST — admin must hit all 4 before publishing
     ============================================================ */
  function calibrate(done) {
    var app = document.getElementById('app');
    app.innerHTML = '<div class="screen focus-brief">' +
      '<div class="fin-card pop">' +
        '<div class="fx-badge">CALIBRATION</div>' +
        '<h1>🎯 TEST GAME</h1>' +
        '<p class="big">' + esc(L('اضغط على كل الاختلافات الأربعة للتحقق من دقة مواقعها قبل النشر.',
                                  'Click all four differences to verify their positions before publishing.')) + '</p>' +
        '<p class="muted sm">' + esc(L('وضع المطوّر: أماكن الضغط ظاهرة', 'Developer mode: the hit areas are visible')) + '</p>' +
        '<button class="btn btn-primary btn-xl" id="go">' + esc(L('ابدأ الاختبار', 'Start the test')) + '</button>' +
      '</div></div>';
    document.getElementById('go').onclick = function () {
      app.innerHTML = '<div class="screen focus-game" id="spotHost"></div>';
      spotBoard(document.getElementById('spotHost'), {
        debug: true, limit: 120,
        onEnd: function (r) {
          var ok = r.found === DIFFS.length;
          var s = Store.get();
          s.settings.spotValidated = { ok: ok, found: r.found, total: DIFFS.length,
            at: new Date().toISOString().slice(0, 16).replace('T', ' '), wrong: r.wrong };
          Store.save();
          app.innerHTML = '<div class="screen focus-brief"><div class="fin-card pop">' +
            '<div class="fin-trophy">' + (ok ? '✅' : '⚠️') + '</div>' +
            '<h1>' + r.found + '/' + DIFFS.length + (ok ? ' VALIDATED' : ' — NOT VALIDATED') + '</h1>' +
            '<div class="focus-raw">' + r.detections.map(function (d, i) {
              var meta = DIFFS.filter(function (x) { return x.id === d.id; })[0];
              return '<div class="fraw"><small>' + (i + 1) + ' · ' + esc(isEn() ? meta.en : meta.ar) + '</small><b>' + d.t + 's</b></div>';
            }).join('') + '</div>' +
            '<p class="' + (ok ? 'muted' : 'warn') + '">' + esc(ok
              ? L('كل أزرار الاختلافات في مواقعها الصحيحة — المشهد جاهز للنشر.',
                  'Every difference hit area is in the right place — the scene is cleared for publishing.')
              : L('لم يتم التحقق من كل الاختلافات. لا تنشر المشهد قبل 4/4.',
                  'Not every difference was verified. Do not publish the scene before 4/4.')) + '</p>' +
            '<p class="muted sm">' + esc(L('ضغطات خاطئة أثناء الاختبار', 'Wrong clicks during the test')) + ': ' + r.wrong + '</p>' +
            '<button class="btn btn-primary" id="back">' + esc(L('رجوع', 'Back')) + '</button>' +
            '</div></div>';
          document.getElementById('back').onclick = function () { if (done) done(s.settings.spotValidated); };
        }
      });
    };
  }

  root.SDNA.Focus = {
    run: run, calibrate: calibrate, scoreFrom: scoreFrom, spotBoard: spotBoard,
    scene: scene, DIFFS: DIFFS, VB: { w: VB_W, h: VB_H }, MIN_HIT_PX: MIN_HIT_PX,
    contentBox: contentBox, normalise: normalise, hitTest: hitTest,
    SUB: {
      visual:   { ar: 'الانتباه البصري',        en: 'Visual Attention' },
      speed:    { ar: 'سرعة المعالجة',     en: 'Processing Speed' },
      accuracy: { ar: 'الدقة',             en: 'Accuracy' },
      recall:   { ar: 'استيعاب معلومات سريع', en: 'Quick Information Recall' }
    }
  };
})(window);
