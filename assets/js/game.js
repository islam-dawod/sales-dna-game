/* ============================================================
   SALES DNA — GAME FLOW V3
   employee  : 8 SALES CITY zones (12-trait behaviour model)
   candidate : 5 levels × 5 challenges (fixed 25) + FOCUS bonus
   ============================================================ */
(function (root) {
  'use strict';
  var Q = root.SDNA.Q, NC = root.SDNA.NC, Store = root.SDNA.Store, UI = root.SDNA.UI,
      Engine = root.SDNA.Engine, Art = root.SDNA.Art;
  var T = UI.T, esc = UI.esc;

  var S = null, app = null;
  var XP_Q = 50, XP_ZONE = 500;          // XP is progress only — never answer quality
  var ANSWER_ICONS = ['🎯', '🔥', '⚡', '🧠'];

  /* ---------------- sound (generated, no files) ---------------- */
  var Sound = (function () {
    var ctx = null;
    function on() { return Store.get().settings.sound; }
    function ac() {
      if (!ctx && (root.AudioContext || root.webkitAudioContext)) {
        ctx = new (root.AudioContext || root.webkitAudioContext)();
      }
      return ctx;
    }
    function blip(freq, dur, type, vol) {
      if (!on()) return;
      var c = ac(); if (!c) return;
      var o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, c.currentTime);
      g.gain.exponentialRampToValueAtTime(vol || 0.09, c.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + (dur || 0.15));
      o.connect(g); g.connect(c.destination);
      o.start(); o.stop(c.currentTime + (dur || 0.15) + 0.02);
    }
    return {
      tap:    function () { blip(520, 0.09, 'triangle', 0.07); },
      pick:   function () { blip(680, 0.13, 'triangle', 0.09); setTimeout(function () { blip(880, 0.12, 'sine', 0.07); }, 70); },
      unlock: function () { [440, 587, 740, 880].forEach(function (f, i) { setTimeout(function () { blip(f, 0.16, 'sine', 0.08); }, i * 90); }); },
      win:    function () { [523, 659, 784, 1046].forEach(function (f, i) { setTimeout(function () { blip(f, 0.22, 'triangle', 0.09); }, i * 120); }); },
      toggle: function () { var s = Store.get(); s.settings.sound = !s.settings.sound; Store.save(); return s.settings.sound; }
    };
  })();

  var BADGES = {
    tower:  { icon: '🎯', ar: 'صائد الأهداف',  he: 'ציד היעדים' },
    arena:  { icon: '🔥', ar: 'ناجٍ من الرفض',  he: 'שורד דחיות' },
    hq:     { icon: '⏱', ar: 'آلة منضبطة',     he: 'מכונת משמעת' },
    lab:    { icon: '🧠', ar: 'متعلّم سريع',    he: 'לומד מהיר' },
    trust:  { icon: '🛡', ar: 'صاحب مسؤولية',  he: 'בעל אחריות' },
    street: { icon: '⚡', ar: 'ثابت تحت الضغط', he: 'יציב בלחץ' },
    battle: { icon: '💼', ar: 'مُغلق صفقات',    he: 'סוגר עסקאות' },
    final:  { icon: '🏆', ar: 'بطل المبيعات',   he: 'אלוף המכירות' }
  };

  /* ---------------- model abstraction ---------------- */
  function isNC() { return S.model === 'nc'; }
  function getQ(id) { return isNC() ? NC.get(id) : Q.get(id); }
  function meta(i) {
    return isNC() ? NC.LEVELS[i] : Q.zone(S.plan[i].zone);
  }

  /* ---------------- session start ---------------- */
  function start(mode, subject) {
    app = document.getElementById('app');
    Art.injectDefs();
    var plan;
    if (mode === 'candidate') {
      plan = NC.plan('cand').map(function (b) { return { zone: b.key, qs: b.qs.slice() }; });
    } else if (mode === 'employee22') {
      /* same instrument as the candidates, minus the 3 questions that are
         off-limits for existing staff — this is what makes the two
         populations comparable question by question */
      plan = NC.plan('emp').map(function (b) { return { zone: b.key, qs: b.qs.slice() }; });
    } else {
      plan = Store.buildPlan('employee', Math.random, subject.exclude || []);
    }
    S = {
      model: (mode === 'candidate' || mode === 'employee22') ? 'nc' : 'emp',
      mode: mode, subject: subject, name: (subject.name || '').split(' ')[0],
      plan: plan, queue: plan.map(function (b) { return b.qs.slice(); }),
      blockIdx: 0, qIdx: 0, answers: [], xp: 0, badges: [], startedAt: Date.now()
    };
    document.body.classList.add('in-game');
    renderMap(true);
  }

  function leave() {
    document.body.classList.remove('in-game');
    document.documentElement.style.removeProperty('--zone-hue');
    root.SDNA.App.go('home');
  }

  /* environment shifts per level/zone */
  function applyEnv(m) {
    document.documentElement.style.setProperty('--zone-hue', (m.hue || 0) + 'deg');
  }

  /* ---------------- HUD ---------------- */
  function hud() {
    var m = meta(S.blockIdx);
    return '<div class="hud">' +
      '<div class="hud-zone"><span class="hud-dot" style="background:' + m.color + '"></span>' +
        '<b>' + esc(m.code) + '</b><small>' + esc(UI.getLang() === 'he' ? m.he : m.ar) + '</small></div>' +
      '<div class="hud-right">' +
        '<div class="hud-xp" dir="ltr">' + Art.icon('coin') + '<b id="xpNow">' + S.xp + '</b></div>' +
        '<button class="hud-btn" id="sndBtn" title="sound">' + (Store.get().settings.sound ? '🔊' : '🔇') + '</button>' +
        '<button class="hud-btn" id="quitBtn" title="exit">✕</button>' +
      '</div></div>';
  }
  function bindHud() {
    var s = document.getElementById('sndBtn');
    if (s) s.onclick = function () { s.textContent = Sound.toggle() ? '🔊' : '🔇'; };
    var q = document.getElementById('quitBtn');
    if (q) q.onclick = function () { if (confirm(T('confirm_exit'))) leave(); };
  }

  /* ---------------- map ---------------- */
  function renderMap(first) {
    var lang = UI.getLang();
    applyEnv(meta(S.blockIdx));
    app.innerHTML = '<div class="screen city-screen">' + hud() +
      '<div class="map-head"><h2>' + (isNC() ? 'SALES DNA CHALLENGE' : 'SALES CITY') + '</h2>' +
      '<p class="muted">' + (S.name ? esc(T('map_hello').replace('{n}', S.name)) : esc(T('map_title'))) +
      (isNC() ? ' · <b>' + S.plan.reduce(function (n, b) { return n + b.qs.length; }, 0) + '</b> ' + esc(T('q_of')) : '') + '</p></div>' +
      '<div class="city-map">' +
        S.plan.map(function (b, i) {
          var m = meta(i);
          var st = i < S.blockIdx ? 'done' : i === S.blockIdx ? 'active' : 'locked';
          return '<div class="zone-node ' + st + '" style="--c:' + m.color + '">' +
            '<div class="zn-art">' + Art.zoneEmblem(isNC() ? m.key : b.zone, m.color) +
              (st === 'locked' ? '<span class="zn-lock">🔒</span>' : '') +
              (st === 'done' ? '<span class="zn-check">✓</span>' : '') + '</div>' +
            '<div class="zn-info"><b>' + (isNC() ? 'LEVEL ' + m.n + ' · ' : '') + esc(m.code) + '</b>' +
              '<span>' + esc(lang === 'he' ? m.he : m.ar) + '</span>' +
              '<i>' + b.qs.length + ' ' + esc(isNC() ? T('challenges') : T('q_of')) + '</i></div>' +
            (st === 'active' ? '<div class="zn-hero">' + Art.hero({ pose: 'idle', expr: 'idle' }) + '</div>' : '') +
            '</div>';
        }).join('') +
      '</div>' +
      '<button class="btn btn-primary btn-xl" id="goZone">' +
        (first ? esc(T('start_challenge')) : esc(isNC() ? T('next_level') : T('next_zone'))) + '</button>' +
      '</div>';
    bindHud();
    document.getElementById('goZone').onclick = function () { Sound.tap(); renderZoneIntro(); };
  }

  /* ---------------- level gate ---------------- */
  function renderZoneIntro() {
    var m = meta(S.blockIdx);
    var ch = Q.CHARACTERS[m.mentor];
    var hello = S.name ? T('zone_hello').replace('{n}', S.name) : '';
    applyEnv(m);
    app.innerHTML = '<div class="screen zone-intro" style="--c:' + m.color + '">' + hud() +
      '<div class="gate"><div class="gate-half l"></div><div class="gate-half r"></div></div>' +
      '<div class="zi-body">' +
        '<div class="zi-badge">' + (isNC() ? 'LEVEL ' + m.n + ' / 5' : 'ZONE ' + m.n) + '</div>' +
        '<div class="zi-emblem pop">' + Art.zoneEmblem(isNC() ? m.key : S.plan[S.blockIdx].zone, m.color) + '</div>' +
        '<h1 class="zi-title">' + esc(m.code) + '</h1>' +
        '<h3 class="zi-sub">' + esc(UI.getLang() === 'he' ? m.he : m.ar) + '</h3>' +
        '<div class="mentor-bubble"><span class="mentor-dot" style="--c:' + ch.color + '">' + (ch.icon || '★') + '</span>' +
          '<div><b>' + esc(ch.ar) + '</b><span>' + esc(hello + ch.line_ar) + '</span></div></div>' +
        '<button class="btn btn-primary btn-xl" id="goQ">' + esc(T('enter')) + '</button>' +
      '</div></div>';
    bindHud();
    Sound.unlock();
    document.getElementById('goQ').onclick = function () { Sound.tap(); S.qIdx = 0; renderQuestion(); };
  }

  /* ---------------- question scene ---------------- */
  function renderQuestion() {
    var qs = S.queue[S.blockIdx];
    if (S.qIdx >= qs.length) return renderZoneComplete();
    var q = getQ(qs[S.qIdx]);
    var m = meta(S.blockIdx);
    var opts = Store.shuffle(q.a.map(function (o, i) { return { o: o, i: i }; }));
    var who = q.who || (!isNC() && m.key === 'final' ? 'boss' : null);

    var stars = '';
    for (var i = 0; i < qs.length; i++) stars += '<i class="' + (i < S.qIdx ? 'on' : i === S.qIdx ? 'now' : '') + '"></i>';

    app.innerHTML = '<div class="screen scene" style="--c:' + m.color + '" data-zone="' + (isNC() ? m.key : S.plan[S.blockIdx].zone) + '">' + hud() +
      '<div class="stars">' + stars + '</div>' +
      (isNC() ? '<div class="chal-count">' + esc(T('challenge')) + ' <span dir="ltr">' + (S.qIdx + 1) + '/' + qs.length + '</span></div>' : '') +
      '<div class="stage">' +
        '<div class="actor hero-actor ' + (who ? 'with-cust' : 'solo') + '">' +
          Art.hero({ pose: who ? 'phone' : 'idle', expr: 'focus' }) + '</div>' +
        (who ? '<div class="actor cust-actor">' +
            (who === 'coach' ? Art.coach() : Art.customer(who)) +
            '<span class="cust-tag">' + (who === 'coach' ? '🎓 ' + esc(UI.getLang() === 'he' ? 'המנהל' : 'المدير')
              : (Art.CUSTOMERS[who] ? Art.CUSTOMERS[who].icon + ' ' + esc(Art.CUSTOMERS[who].ar) : '')) + '</span>' +
          '</div>' : '') +
        (q.line ? '<div class="bubble cust-bubble fade-up">' + esc(q.line) + '</div>' : '') +
      '</div>' +
      '<div class="panel">' +
        '<h2 class="q-text fade-up">' + esc(q.q) + '</h2>' +
        '<div class="opts">' + opts.map(function (o, k) {
          return '<button class="opt fade-up" style="animation-delay:' + (0.05 * k + 0.08) + 's" data-i="' + o.i + '">' +
            '<span class="opt-ic">' + ANSWER_ICONS[k] + '</span>' +
            '<span class="opt-t">' + esc(o.o.t) + '</span>' +
            '<span class="opt-key">' + 'ABCD'[k] + '</span></button>';
        }).join('') + '</div>' +
      '</div></div>';

    bindHud();
    UI.$$('.opt', app).forEach(function (b) {
      b.onclick = function () { choose(q, parseInt(b.dataset.i, 10), b); };
    });
  }

  function choose(q, optIndex, node) {
    UI.$$('.opt', app).forEach(function (b) { b.disabled = true; b.classList.add('dim'); });
    node.classList.remove('dim'); node.classList.add('chosen');
    Sound.pick();

    var opt = q.a[optIndex];
    if (isNC()) {
      S.answers.push({ qid: q.id, opt: optIndex, lvl: q.lvl });
    } else {
      S.answers.push({ qid: q.id, opt: optIndex, s: opt.s, f: opt.f || null, zone: q.zone, trait: q.trait });
    }
    S.xp += XP_Q;
    var xpNode = document.getElementById('xpNow');
    if (xpNode) UI.countUp(xpNode, S.xp, 420);
    node.appendChild(UI.el('<span class="gain">+' + XP_Q + ' XP</span>'));

    var heroBox = UI.$('.hero-actor', app);
    if (heroBox) {
      heroBox.classList.add('react');
      heroBox.innerHTML = Art.hero({ pose: 'point', expr: 'happy' });
    }
    var stage = UI.$('.stage', app);
    if (stage) stage.appendChild(UI.el('<div class="hero-bubble pop">' +
      esc(S.name ? T('recorded_name').replace('{n}', S.name) : T('recorded')) + '</div>'));

    /* adaptive follow-up (extra question, does not replace one of the 25) */
    if (opt.fu && getQ(opt.fu) && S.queue[S.blockIdx].indexOf(opt.fu) === -1) {
      S.queue[S.blockIdx].splice(S.qIdx + 1, 0, opt.fu);
    }

    var scene = UI.$('.scene', app);
    setTimeout(function () { if (scene) scene.classList.add('scene-out'); }, 480);
    setTimeout(function () { S.qIdx++; renderQuestion(); }, 760);
  }

  /* ---------------- level complete ---------------- */
  function renderZoneComplete() {
    var m = meta(S.blockIdx);
    var key = isNC() ? m.key : S.plan[S.blockIdx].zone;
    var badge = BADGES[key] || null;
    /* badge is awarded for finishing the level (never reveals answer quality) */
    if (badge) S.badges.push(key);
    S.xp += XP_ZONE;
    var last = S.blockIdx >= S.plan.length - 1;
    var nextM = last ? null : meta(S.blockIdx + 1);

    UI.confetti(50);
    Sound.win();
    app.innerHTML = '<div class="screen zone-done" style="--c:' + m.color + '">' +
      '<div class="zd-hero">' + Art.hero({ pose: 'cheer', expr: 'happy' }) + '</div>' +
      '<div class="zd-card pop">' +
        '<div class="zd-emblem">' + Art.zoneEmblem(key, m.color) + '</div>' +
        '<h1>' + esc(m.code) + '<br><span>' + esc(isNC() ? T('level_done') : T('zone_complete')) + '</span></h1>' +
        (S.name ? '<p class="muted">' + esc(T('great_name').replace('{n}', S.name)) + '</p>' : '') +
        '<div class="zd-stats">' +
          '<div><b id="xpBig">0</b><small>XP</small></div>' +
          '<div><b>' + (S.blockIdx + 1) + '/' + S.plan.length + '</b><small>' + (isNC() ? 'LEVELS' : 'ZONES') + '</small></div>' +
          '<div><b>' + S.badges.length + '</b><small>BADGES</small></div>' +
        '</div>' +
        (badge ? '<div class="badge-earned pop"><span>' + badge.icon + '</span>' +
          esc(UI.getLang() === 'he' ? badge.he : badge.ar) + '</div>' : '') +
        (nextM ? '<div class="next-zone">NEXT: <b style="color:' + nextM.color + '">' + esc(nextM.code) + '</b></div>' : '') +
        '<button class="btn btn-primary btn-xl" id="nextZ">' + esc(last ? T('finish') : T('continue_')) + '</button>' +
      '</div></div>';
    UI.countUp(document.getElementById('xpBig'), S.xp, 900);
    document.getElementById('nextZ').onclick = function () {
      Sound.tap();
      S.blockIdx++;
      if (S.blockIdx >= S.plan.length) return salesComplete();
      renderMap(false);
    };
  }

  /* ---------------- sales part finished ---------------- */
  function salesComplete() {
    var st = Store.get();
    var payload = { answers: S.answers, completedAt: new Date().toISOString().slice(0, 10), xp: S.xp, badges: S.badges };

    if (S.subject.type === 'employee') {
      if (S.mode === 'employee22') Store.updateEmployee(S.subject.id, { nc22: payload });
      else Store.updateEmployee(S.subject.id, { assessment: payload });
    } else {
      Store.updateCandidate(S.subject.id, { nc: payload, stage: 2 });
    }

    if (!st.settings.focusEnabled) return finalScreen();

    /* 🏆 SALES LEVEL COMPLETE → 🔓 BONUS LEVEL */
    UI.confetti(90); Sound.win();
    app.innerHTML = '<div class="screen zone-done">' +
      '<div class="zd-hero">' + Art.hero({ pose: 'cheer', expr: 'happy' }) + '</div>' +
      '<div class="zd-card pop">' +
        '<div class="fin-trophy">🏆</div>' +
        '<h1>SALES CHALLENGE<br><span>' + esc(T('sales_part_done')) + '</span></h1>' +
        '<div class="zd-stats"><div><b>' + S.xp + '</b><small>XP</small></div>' +
          '<div><b>' + S.answers.length + '</b><small>' + esc(T('q_of')) + '</small></div>' +
          '<div><b>' + S.badges.length + '</b><small>BADGES</small></div></div>' +
        '<button class="btn btn-primary btn-xl" id="toFocus">⚡ ' + esc(T('one_more')) + '</button>' +
        '<button class="btn btn-ghost btn-xs" id="skipFocus">' + esc(T('skip')) + '</button>' +
      '</div></div>';
    document.getElementById('toFocus').onclick = function () {
      Sound.tap();
      root.SDNA.Focus.run(S.subject, function (result) {
        if (S.subject.type === 'employee') Store.updateEmployee(S.subject.id, { focus: result });
        else Store.updateCandidate(S.subject.id, { focus: result, stage: 3 });
        finalScreen(result);
      });
    };
    document.getElementById('skipFocus').onclick = function () { Sound.tap(); finalScreen(); };
  }

  /* ---------------- final screens ---------------- */
  function finalScreen(focusResult) {
    if (S.subject.type === 'employee') return finishEmployee(focusResult);
    return finishCandidate();
  }

  function finishEmployee() {
    if (S.model === 'nc') return finishEmployeeQuick();
    var d = Engine.dna(S.answers), ch = Engine.character(d);
    UI.confetti(110); Sound.win();
    app.innerHTML = '<div class="screen final-screen">' +
      '<div class="fin-hero">' + Art.hero({ pose: 'cheer', expr: 'happy' }) + '</div>' +
      '<div class="fin-card pop">' +
        '<div class="fin-trophy">🏆</div>' +
        '<h1>' + esc(T('challenge_done')) + '</h1>' +
        '<p class="muted">' + esc(T('thanks_emp')) + '</p>' +
        '<div class="char-card"><div class="cc-emoji">' + ch.emoji + '</div>' +
          '<div><small>YOUR SALES STYLE</small><b>' + esc(ch.key) + ' · ' + esc(ch.ar) + '</b>' +
          '<span>' + esc(ch.desc_ar) + '</span></div></div>' +
        '<div class="zd-stats"><div><b>' + S.xp + '</b><small>XP</small></div>' +
          '<div><b>' + S.badges.length + '</b><small>BADGES</small></div>' +
          '<div><b>' + S.answers.length + '</b><small>' + esc(T('q_of')) + '</small></div></div>' +
        '<button class="btn btn-ghost" id="fin">' + esc(T('exit')) + '</button>' +
      '</div></div>';
    document.getElementById('fin').onclick = leave;
  }

  /* employee finished the 22-question comparable set */
  function finishEmployeeQuick() {
    var sc = NC.score(S.answers, Store.get());
    var top = NC.DIM_KEYS.filter(function (k) { return sc.dims[k] != null; })
      .sort(function (a, b) { return sc.dims[b] - sc.dims[a]; })[0];
    UI.confetti(110); Sound.win();
    app.innerHTML = '<div class="screen final-screen">' +
      '<div class="fin-hero">' + Art.hero({ pose: 'cheer', expr: 'happy' }) + '</div>' +
      '<div class="fin-card pop">' +
        '<div class="fin-trophy">🏆</div>' +
        '<h1>' + esc(T('challenge_done')) + '</h1>' +
        '<p class="muted">' + esc(T('thanks_emp')) + '</p>' +
        (top ? '<div class="char-card"><div class="cc-emoji">' + NC.DIMS[top].icon + '</div>' +
          '<div><small>YOUR STRONGEST SIDE</small><b>' +
          esc(UI.getLang() === 'he' ? NC.DIMS[top].he : NC.DIMS[top].ar) + '</b>' +
          '<span>' + esc(T('thanks_emp_quick')) + '</span></div></div>' : '') +
        '<div class="zd-stats"><div><b>' + S.xp + '</b><small>XP</small></div>' +
          '<div><b>' + S.answers.length + '</b><small>' + esc(T('q_of')) + '</small></div></div>' +
        '<button class="btn btn-ghost" id="fin">' + esc(T('exit')) + '</button>' +
      '</div></div>';
    document.getElementById('fin').onclick = leave;
  }

  /* the candidate never sees a score — only a celebration */
  function finishCandidate() {
    UI.confetti(140); Sound.win();
    app.innerHTML = '<div class="screen final-screen">' +
      '<div class="fin-hero">' + Art.hero({ pose: 'cheer', expr: 'happy' }) + '</div>' +
      '<div class="fin-card pop">' +
        '<div class="fin-trophy">🏆</div>' +
        '<h1>CHALLENGE COMPLETE</h1>' +
        (S.name ? '<h2 class="cand-bravo">' + esc(T('bravo_name').replace('{n}', S.name)) + '</h2>' : '') +
        '<p class="big">' + esc(T('cand_done_1')) + '</p>' +
        '<p class="muted">' + esc(T('cand_done_2')) + '</p>' +
        '<div class="zd-stats"><div><b>' + S.xp + '</b><small>XP</small></div>' +
          '<div><b>' + S.badges.length + '</b><small>BADGES</small></div></div>' +
        '<button class="btn btn-ghost" id="fin">' + esc(T('exit')) + '</button>' +
      '</div></div>';
    document.getElementById('fin').onclick = leave;
  }

  /* manager can replay the focus level for an employee to build the benchmark */
  function focusOnly(subject, kind, doneCb) {
    app = document.getElementById('app');
    Art.injectDefs();
    document.body.classList.add('in-game');
    S = { model: 'emp', subject: subject, name: (subject.name || '').split(' ')[0],
          plan: [], queue: [], blockIdx: 0, qIdx: 0, answers: [], xp: 0, badges: [] };
    root.SDNA.Focus.run(subject, function (result) {
      if (kind === 'employee') Store.updateEmployee(subject.id, { focus: result });
      else Store.updateCandidate(subject.id, { focus: result });
      document.body.classList.remove('in-game');
      if (doneCb) doneCb(result); else root.SDNA.App.go('manager');
    });
  }

  function calibrateSpot(doneCb) {
    app = document.getElementById('app');
    Art.injectDefs();
    document.body.classList.add('in-game');
    S = { model: 'emp', subject: { name: '' }, plan: [], queue: [], blockIdx: 0, qIdx: 0, answers: [], xp: 0, badges: [] };
    root.SDNA.Focus.calibrate(function (result) {
      document.body.classList.remove('in-game');
      if (doneCb) doneCb(result);
    });
  }

  root.SDNA.Game = { start: start, focusOnly: focusOnly, calibrateSpot: calibrateSpot, Sound: Sound, BADGES: BADGES };
})(window);
