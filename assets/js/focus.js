/* ============================================================
   SALES DNA — BONUS LEVEL: FOCUS & PROCESSING CHALLENGE
   Game 1  👁 SPOT THE DIFFERENCE  (4 subtle differences, 45s)
   Game 2  ⚡ QUICK SCAN            (3 rounds, card disappears)
   ------------------------------------------------------------
   This is NOT an intelligence test and it never feeds the
   SALES DNA match score. It is reported separately and can only
   gain weight once company data shows it correlates with results.
   ============================================================ */
(function (root) {
  'use strict';
  var UI = root.SDNA.UI, Art = root.SDNA.Art;
  var esc = function (s) { return UI.esc(s); };
  function he() { return UI.getLang() === 'he'; }
  function L(ar, hev) { return he() ? hev : ar; }

  /* ============================================================
     THE OFFICE SCENE — one high-detail vector scene, two variants
     with exactly 4 planned, subtle differences.
     ============================================================ */
  var HOTSPOTS = [
    { id: 'clock', x: 450, y: 75,  r: 44, ar: 'عقارب الساعة',        he: 'מחוגי השעון' },
    { id: 'crm',   x: 536, y: 214, r: 46, ar: 'رقم على شاشة CRM',    he: 'מספר במסך ה-CRM' },
    { id: 'phones',x: 330, y: 243, r: 40, ar: 'زر صغير في السمّاعة',  he: 'כפתור קטן באוזנייה' },
    { id: 'plant', x: 604, y: 116, r: 40, ar: 'ورقة في النبتة',      he: 'עלה בעציץ' }
  ];

  function scene(v) {                     /* v = 'a' | 'b' */
    var b = v === 'b';
    var out = [];
    /* room */
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
    /* clock — DIFFERENCE 1: minute hand position */
    out.push('<circle cx="450" cy="75" r="34" fill="#0b1526" stroke="#8494ad" stroke-width="4"/>');
    for (var i = 0; i < 12; i++) {
      var a = i * Math.PI / 6;
      out.push('<circle cx="' + (450 + 27 * Math.sin(a)).toFixed(1) + '" cy="' + (75 - 27 * Math.cos(a)).toFixed(1) +
        '" r="1.6" fill="#8494ad"/>');
    }
    out.push('<path d="M450 75 l14 -10" stroke="#e5e7eb" stroke-width="3.5" stroke-linecap="round"/>');   /* hour */
    out.push(b ? '<path d="M450 75 l6 22" stroke="#22d3ee" stroke-width="3" stroke-linecap="round"/>'
               : '<path d="M450 75 l20 12" stroke="#22d3ee" stroke-width="3" stroke-linecap="round"/>');  /* minute */
    out.push('<circle cx="450" cy="75" r="3" fill="#e5e7eb"/>');
    /* shelf + plant — DIFFERENCE 4: one leaf missing */
    out.push('<rect x="540" y="150" width="130" height="7" rx="3" fill="#22304a"/>');
    out.push('<path d="M592 150 l-10 -26 h44 l-10 26 z" fill="#7c4a2d"/>');
    out.push('<path d="M604 124 C596 108 578 100 566 104 C572 120 588 126 604 124 z" fill="#10b981" opacity=".9"/>');
    out.push('<path d="M604 124 C612 106 632 98 644 104 C638 120 620 128 604 124 z" fill="#34d399" opacity=".9"/>');
    if (!b) out.push('<path d="M604 122 C602 104 610 88 622 82 C628 98 618 116 604 122 z" fill="#059669" opacity=".95"/>');
    out.push('<path d="M604 126 v-14" stroke="#065f46" stroke-width="3"/>');
    /* two sales people behind the desk */
    out.push(person(250, '#4f8cff', '#8b5cf6'));
    out.push(person(410, '#22d3ee', '#3b82f6'));
    /* desk */
    out.push('<rect y="250" width="700" height="18" fill="#1b2942"/>');
    out.push('<rect y="268" width="700" height="10" fill="#131f34"/>');
    /* monitor A — chart */
    out.push('<rect x="86" y="176" width="104" height="70" rx="5" fill="#050b16" stroke="#33415c" stroke-width="3"/>');
    out.push('<path d="M96 232 l18 -22 l16 12 l20 -30 l18 22" stroke="#22d3ee" stroke-width="3" fill="none"/>');
    out.push('<rect x="128" y="246" width="20" height="6" fill="#33415c"/>');
    /* monitor B — CRM card, DIFFERENCE 2: one digit */
    out.push('<rect x="470" y="168" width="130" height="80" rx="5" fill="#050b16" stroke="#33415c" stroke-width="3"/>');
    out.push('<text x="480" y="186" font-size="10" fill="#7f95bb" font-family="sans-serif">CRM · CUSTOMER</text>');
    out.push('<text x="480" y="202" font-size="11" fill="#cfe0ff" font-family="sans-serif">SAMIR K.</text>');
    out.push('<text x="480" y="219" font-size="15" fill="#34d399" font-family="monospace">' + (b ? '18,900' : '18,400') + '</text>');
    out.push('<text x="480" y="236" font-size="10" fill="#7f95bb" font-family="sans-serif">STATUS: INTERESTED</text>');
    out.push('<rect x="525" y="248" width="20" height="5" fill="#33415c"/>');
    /* headset on desk — DIFFERENCE 3: small button */
    out.push('<path d="M312 246 a20 20 0 0 1 38 0" stroke="#111827" stroke-width="6" fill="none"/>');
    out.push('<rect x="304" y="240" width="12" height="16" rx="5" fill="#1f2937"/>');
    out.push('<rect x="346" y="240" width="12" height="16" rx="5" fill="#1f2937"/>');
    if (!b) out.push('<circle cx="310" cy="248" r="4" fill="#22d3ee"/>');
    /* desk phone */
    out.push('<rect x="200" y="234" width="46" height="16" rx="3" fill="#1f2937"/>');
    out.push('<path d="M204 234 q22 -16 38 0" stroke="#111827" stroke-width="6" fill="none"/>');
    /* coffee cup */
    out.push('<path d="M382 232 h26 l-3 18 h-20 z" fill="#e5e7eb"/>');
    out.push('<path d="M408 236 a7 7 0 0 1 0 10" stroke="#e5e7eb" stroke-width="3" fill="none"/>');
    out.push('<path d="M386 236 h18" stroke="#b45309" stroke-width="3"/>');
    /* documents */
    out.push('<rect x="620" y="238" width="52" height="12" rx="2" fill="#e5e7eb" opacity=".85"/>');
    out.push('<rect x="624" y="232" width="52" height="12" rx="2" fill="#cbd5e1" opacity=".85"/>');
    return '<svg viewBox="0 0 700 300" class="spot-svg" xmlns="http://www.w3.org/2000/svg">' + out.join('') + '</svg>';

    function person(cx, c1, c2) {
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

  /* ============================================================
     QUICK SCAN — customer cards close to the real sales desk
     ============================================================ */
  var NAMES = ['سمير خطيب', 'رانيا حداد', 'محمود عابد', 'ليلى نصار', 'فادي شاهين', 'دانا قاسم'];
  var SERVICES = ['زرع أسنان', 'تقويم شفاف', 'تبييض', 'تركيبات زيركون', 'حشوات تجميلية', 'جراحة لثة'];
  var STATUS = ['مهتم', 'يفكّر', 'ينتظر موافقة العائلة', 'يريد تقسيط'];
  var NOTES = ['يسأل عن التقسيط', 'يفضّل التواصل بالواتساب', 'زار العيادة مرة', 'تحوّل من عميل قديم'];

  function card(round, rnd) {
    var price = (8 + Math.floor(rnd() * 26)) * 1000;
    var calls = 1 + Math.floor(rnd() * 5);
    var hour = 9 + Math.floor(rnd() * 10);
    var min = rnd() > .5 ? '30' : '00';
    var fields = [
      { k: 'name',    ar: 'الاسم',            he: 'שם',            v: NAMES[Math.floor(rnd() * NAMES.length)] },
      { k: 'service', ar: 'الخدمة المطلوبة',  he: 'שירות',         v: SERVICES[Math.floor(rnd() * SERVICES.length)] },
      { k: 'price',   ar: 'السعر المعروض',    he: 'מחיר',          v: price.toLocaleString('en-US') },
      { k: 'calls',   ar: 'عدد الاتصالات',    he: 'מספר שיחות',    v: String(calls) },
      { k: 'time',    ar: 'وقت مناسب للاتصال', he: 'זמן מועדף',    v: hour + ':' + min },
      { k: 'status',  ar: 'الحالة',           he: 'סטטוס',         v: STATUS[Math.floor(rnd() * STATUS.length)] },
      { k: 'follow',  ar: 'موعد المتابعة',    he: 'מועד מעקב',     v: ['اليوم', 'غداً', 'بعد يومين', 'الأسبوع القادم'][Math.floor(rnd() * 4)] },
      { k: 'note',    ar: 'ملاحظة',           he: 'הערה',          v: NOTES[Math.floor(rnd() * NOTES.length)] }
    ];
    var n = [5, 6, 7][round - 1];
    var secs = [8, 7, 6][round - 1];
    return { fields: fields.slice(0, n), secs: secs, price: price, calls: calls };
  }

  function questionsFor(c, rnd) {
    var pool = c.fields.filter(function (f) { return f.k !== 'name'; });
    var picked = [];
    var idx = [0, 1, 2, 3, 4, 5, 6].filter(function (i) { return i < pool.length; });
    /* two questions per round on different fields */
    for (var k = 0; k < 2 && idx.length; k++) {
      var j = Math.floor(rnd() * idx.length);
      picked.push(pool[idx[j]]); idx.splice(j, 1);
    }
    return picked.map(function (f) {
      var qtext = {
        service: L('ما هي الخدمة التي يريدها العميل؟', 'איזה שירות הלקוח רוצה?'),
        price:   L('ما هو السعر المعروض؟', 'מה המחיר שהוצע?'),
        calls:   L('كم مرة تم الاتصال بالعميل؟', 'כמה פעמים התקשרו ללקוח?'),
        time:    L('ما هو الوقت المناسب للاتصال؟', 'מה הזמן המועדף לשיחה?'),
        status:  L('ما هي حالة العميل؟', 'מה סטטוס הלקוח?'),
        follow:  L('ما هو موعد المتابعة؟', 'מה מועד המעקב?'),
        note:    L('ما هي الملاحظة المسجّلة؟', 'מה ההערה שנרשמה?')
      }[f.k];
      var opts = distractors(f, c, rnd);
      return { q: qtext, opts: opts.list, correct: opts.correct, field: f.k };
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
      if (list.indexOf(f.v) < 0) list[0] = f.v;
    } else if (f.k === 'status') {
      list = STATUS.slice();
      if (list.indexOf(f.v) < 0) list[0] = f.v;
    } else if (f.k === 'service') {
      list = [f.v].concat(SERVICES.filter(function (s) { return s !== f.v; }).slice(0, 3));
    } else if (f.k === 'time') {
      var hh = parseInt(f.v, 10), mm = f.v.split(':')[1];
      list = [f.v, (hh + 1) + ':' + mm, (hh - 1) + ':' + mm, hh + ':' + (mm === '30' ? '00' : '30')];
    } else {
      list = [f.v].concat(NOTES.filter(function (s) { return s !== f.v; }).slice(0, 3));
    }
    var uniq = [];
    list.forEach(function (x) { if (uniq.indexOf(x) < 0) uniq.push(x); });
    while (uniq.length < 4) uniq.push(uniq[0] + ' ');
    var shuffled = uniq.slice(0, 4).sort(function () { return rnd() - 0.5; });
    var correctIdx = shuffled.indexOf(String(f.v));
    if (correctIdx < 0) { shuffled[0] = String(f.v); correctIdx = 0; }
    return { list: shuffled, correct: correctIdx };
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
    var expected = 6;                                  // 3 rounds × 2 questions
    var completion = 100 * (0.5 * foundRatio + 0.5 * clamp01(q.total / expected));

    var focus = Math.round(0.6 * accuracy + 0.3 * speed + 0.1 * completion);
    return {
      focus: focus,
      sub: {
        visual:   Math.round(100 * (0.7 * foundRatio + 0.3 * precision)),
        speed:    Math.round(speed),
        accuracy: Math.round(100 * (0.5 * precision + 0.5 * scanRatio)),
        recall:   Math.round(100 * scanRatio)
      },
      raw: {
        found: s.found, total: s.total, wrong: s.wrong, times: s.times || [],
        elapsed: s.elapsed, first: (s.times && s.times[0]) || null,
        scanCorrect: q.correct, scanTotal: q.total, scanAvg: q.avg, rounds: q.rounds
      },
      completedAt: raw.completedAt || null
    };
  }

  /* ============================================================
     RUNNER
     ============================================================ */
  function run(subject, done) {
    var app = document.getElementById('app');
    var rnd = Math.random;
    var res = {
      spot: { found: 0, total: HOTSPOTS.length, wrong: 0, times: [], elapsed: 0, limit: 45 },
      scan: { correct: 0, total: 0, avg: 0, rounds: 3 }
    };
    var scanTimes = [];
    var name = (subject && subject.name || '').split(' ')[0];

    intro();

    /* ---------- unlock screen ---------- */
    function intro() {
      app.innerHTML = '<div class="screen focus-intro">' +
        '<div class="fx-hero">' + Art.hero({ pose: 'point', expr: 'wow' }) + '</div>' +
        '<div class="fin-card pop">' +
          '<div class="unlock pop">🔓 <b>BONUS LEVEL UNLOCKED</b></div>' +
          '<h1>⚡ ONE LAST CHALLENGE</h1>' +
          '<p class="big">' + esc(L('جاهز لاختبار تركيزك؟', 'מוכן לבדוק את הריכוז שלך?')) + '</p>' +
          '<p class="muted">' + esc(L('تحديان قصيران · حوالي دقيقة ونصف · الوقت يبدأ عند الضغط',
                                      'שני אתגרים קצרים · כדקה וחצי · הזמן מתחיל בלחיצה')) + '</p>' +
          '<button class="btn btn-primary btn-xl" id="fxStart">' + esc(L('ابدأ', 'התחל')) + '</button>' +
        '</div></div>';
      document.getElementById('fxStart').onclick = function () { root.SDNA.Game.Sound.unlock(); spotIntro(); };
    }

    /* ---------- game 1: brief ---------- */
    function spotIntro() {
      app.innerHTML = '<div class="screen focus-brief">' +
        '<div class="fin-card pop">' +
          '<div class="fx-badge">GAME 1 / 2</div>' +
          '<h1>👁 SPOT THE DIFFERENCE</h1>' +
          '<p class="big">' + esc(L('هناك 4 اختلافات بين الصورتين. اكتشفها قبل انتهاء الوقت.',
                                    'יש 4 הבדלים בין התמונות. מצא אותם לפני שהזמן נגמר.')) + '</p>' +
          '<p class="muted sm">' + esc(L('الاختلافات صغيرة جداً · كل ضغطة خاطئة تُحتسب',
                                         'ההבדלים קטנים מאוד · כל לחיצה שגויה נרשמת')) + '</p>' +
          '<button class="btn btn-primary btn-xl" id="go">' + esc(L('ابدأ · 45 ثانية', 'התחל · 45 שניות')) + '</button>' +
        '</div></div>';
      document.getElementById('go').onclick = spotPlay;
    }

    /* ---------- game 1: play ---------- */
    function spotPlay() {
      var t0 = performance.now(), limit = 45, ended = false;
      var found = {};
      app.innerHTML = '<div class="screen focus-game">' +
        '<div class="fx-top"><div class="fx-title">👁 SPOT THE DIFFERENCE</div>' +
          '<div class="fx-stat"><b id="fxFound">0</b>/4 ' + esc(L('اختلافات', 'הבדלים')) + '</div>' +
          '<div class="fx-timer" id="fxTimer" dir="ltr">00:45</div></div>' +
        '<div class="fx-bar"><i id="fxBar" style="width:100%"></i></div>' +
        '<div class="spot-wrap">' +
          '<div class="spot-pane" data-v="a">' + scene('a') + '<span class="spot-lbl">A</span><div class="spot-marks"></div></div>' +
          '<div class="spot-pane" data-v="b">' + scene('b') + '<span class="spot-lbl">B</span><div class="spot-marks"></div></div>' +
        '</div>' +
        '<div class="fx-hint muted sm">' + esc(L('اضغط على المكان الذي تلاحظ فيه اختلافاً',
                                                 'לחץ על המקום שבו זיהית הבדל')) + '</div>' +
        '</div>';

      var timerNode = document.getElementById('fxTimer'), barNode = document.getElementById('fxBar');
      var iv = setInterval(function () {
        var left = limit - (performance.now() - t0) / 1000;
        if (left <= 0) { finishSpot(); return; }
        timerNode.textContent = '00:' + String(Math.ceil(left)).padStart(2, '0');
        barNode.style.width = (100 * left / limit) + '%';
        if (left < 10) timerNode.classList.add('urgent');
      }, 100);

      UI.$$('.spot-pane', app).forEach(function (pane) {
        pane.onclick = function (ev) {
          if (ended) return;
          var svg = pane.querySelector('svg').getBoundingClientRect();
          var x = (ev.clientX - svg.left) / svg.width * 700;
          var y = (ev.clientY - svg.top) / svg.height * 300;
          var hit = null;
          HOTSPOTS.forEach(function (h) {
            if (found[h.id]) return;
            var d = Math.sqrt(Math.pow(x - h.x, 2) + Math.pow(y - h.y, 2));
            if (d <= h.r) hit = h;
          });
          if (hit) {
            found[hit.id] = true;
            res.spot.found++;
            res.spot.times.push(Math.round((performance.now() - t0) / 100) / 10);
            document.getElementById('fxFound').textContent = res.spot.found;
            mark(hit, 'ok');
            root.SDNA.Game.Sound.pick();
            if (res.spot.found === HOTSPOTS.length) setTimeout(finishSpot, 500);
          } else {
            res.spot.wrong++;
            pane.classList.remove('shake');
            void pane.offsetWidth;
            pane.classList.add('shake');
            missMark(pane, ev);
            root.SDNA.Game.Sound.tap();
          }
        };
      });

      function mark(h, kind) {
        UI.$$('.spot-pane', app).forEach(function (pane) {
          var m = document.createElement('i');
          m.className = 'spot-mark ' + kind;
          m.style.insetInlineStart = (h.x / 700 * 100) + '%';
          m.style.top = (h.y / 300 * 100) + '%';
          m.style.width = m.style.height = (h.r * 1.6 / 700 * 100) + '%';
          pane.querySelector('.spot-marks').appendChild(m);
        });
      }
      function missMark(pane, ev) {
        var box = pane.getBoundingClientRect();
        var m = document.createElement('i');
        m.className = 'spot-mark miss';
        m.style.left = (ev.clientX - box.left) + 'px';
        m.style.top = (ev.clientY - box.top) + 'px';
        pane.querySelector('.spot-marks').appendChild(m);
        setTimeout(function () { m.remove(); }, 700);
      }
      function finishSpot() {
        if (ended) return;
        ended = true; clearInterval(iv);
        res.spot.elapsed = Math.round((performance.now() - t0) / 100) / 10;
        scanIntro();
      }
    }

    /* ---------- game 2: brief ---------- */
    function scanIntro() {
      app.innerHTML = '<div class="screen focus-brief">' +
        '<div class="fin-card pop">' +
          '<div class="fx-badge">GAME 2 / 2</div>' +
          '<h1>⚡ QUICK SCAN</h1>' +
          '<p class="big">' + esc(L('ستظهر بطاقة عميل لثوانٍ قليلة ثم تختفي. ركّز جيداً على التفاصيل.',
                                    'כרטיס לקוח יופיע לשניות ואז ייעלם. התרכז בפרטים.')) + '</p>' +
          '<p class="muted sm">' + esc(L('3 جولات · الكرت يصبح أصعب في كل جولة',
                                         '3 סבבים · הכרטיס נעשה קשה יותר בכל סבב')) + '</p>' +
          '<button class="btn btn-primary btn-xl" id="go">' + esc(L('ابدأ', 'התחל')) + '</button>' +
        '</div></div>';
      document.getElementById('go').onclick = function () { round(1); };
    }

    /* ---------- game 2: rounds ---------- */
    function round(r) {
      if (r > 3) return finish();
      var c = card(r, rnd);
      var qs = questionsFor(c, rnd);
      countdown();

      function countdown() {
        var n = 3;
        app.innerHTML = '<div class="screen focus-game">' +
          '<div class="fx-top"><div class="fx-title">⚡ QUICK SCAN</div>' +
            '<div class="fx-stat">🔥 ROUND ' + r + '/3</div>' +
            '<div class="fx-timer" dir="ltr">00:0' + c.secs + '</div></div>' +
          '<div class="scan-say">' + esc(L('ركّز جيداً… ستختفي البطاقة!', 'התרכז… הכרטיס ייעלם!')) + '</div>' +
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
              return '<div class="cc-row"><span>' + esc(he() ? f.he : f.ar) + '</span><b>' + esc(f.v) + '</b></div>';
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
            '<div class="fx-stat">' + esc(L('سؤال', 'שאלה')) + ' ' + (qi + 1) + '/' + qs.length + '</div></div>' +
          '<div class="scan-q pop">💨 ' + esc(L('اختفت البطاقة!', 'הכרטיס נעלם!')) + '</div>' +
          '<h2 class="q-text">' + esc(q.q) + '</h2>' +
          '<div class="opts scan-opts">' + q.opts.map(function (o, k) {
            return '<button class="opt" data-k="' + k + '"><span class="opt-ic">' + 'ABCD'[k] + '</span>' +
              '<span class="opt-t">' + esc(o) + '</span></button>';
          }).join('') + '</div></div>';
        UI.$$('.opt', app).forEach(function (btn) {
          btn.onclick = function () {
            var dt = (performance.now() - t0) / 1000;
            scanTimes.push(Math.round(dt * 10) / 10);
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

    /* ---------- done ---------- */
    function finish() {
      res.scan.avg = scanTimes.length
        ? Math.round((scanTimes.reduce(function (a, b) { return a + b; }, 0) / scanTimes.length) * 10) / 10 : 0;
      var out = scoreFrom(res);
      out.completedAt = new Date().toISOString().slice(0, 10);
      done(out);
    }
  }

  root.SDNA.Focus = {
    run: run, scoreFrom: scoreFrom, HOTSPOTS: HOTSPOTS, scene: scene,
    SUB: {
      visual:   { ar: 'الانتباه البصري',        he: 'קשב חזותי',        en: 'Visual Attention' },
      speed:    { ar: 'سرعة المعالجة',          he: 'מהירות עיבוד',     en: 'Processing Speed' },
      accuracy: { ar: 'الدقة',                  he: 'דיוק',             en: 'Accuracy' },
      recall:   { ar: 'استيعاب معلومات سريع',   he: 'קליטת מידע מהירה', en: 'Quick Information Recall' }
    }
  };
})(window);
