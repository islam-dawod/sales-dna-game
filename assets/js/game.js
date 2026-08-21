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
    tower:  { icon: '🎯', ar: 'صائد الأهداف',  en: 'Target Hunter' },
    arena:  { icon: '🔥', ar: 'ناجٍ من الرفض',  en: 'Rejection Survivor' },
    hq:     { icon: '⏱', ar: 'آلة منضبطة',     en: 'Discipline Machine' },
    lab:    { icon: '🧠', ar: 'متعلّم سريع',    en: 'Fast Learner' },
    trust:  { icon: '🛡', ar: 'صاحب مسؤولية',  en: 'Owns the Outcome' },
    street: { icon: '⚡', ar: 'ثابت تحت الضغط', en: 'Steady Under Pressure' },
    battle: { icon: '💼', ar: 'مُغلق صفقات',    en: 'Deal Closer' },
    final:  { icon: '🏆', ar: 'بطل المبيعات',   en: 'Sales Champion' }
  };

  /* ---------------- model abstraction ---------------- */
  function isNC() { return S.model === 'nc'; }
  function getQ(id) { return isNC() ? NC.get(id) : Q.get(id); }
  function meta(i) {
    return isNC() ? NC.LEVELS[i] : Q.zone(S.plan[i].zone);
  }

  /* ============================================================
     TIMED LEVELS
     Every level gets its own clock. When it runs out the level closes and
     the next one opens automatically — no dialog, no extension. Questions
     left behind are stored as unanswered, never as wrong answers, so they
     lower completeness instead of the score.

     The deadline is an absolute timestamp kept with the saved run, so
     reloading the page resumes the same level with the time that was
     actually left rather than a fresh three minutes.
     ============================================================ */
  var RUN_KEY = 'sdna_run_v1';
  var tIv = null;

  function timerOn() {
    var st = Store.get().settings;
    return st.timerEnabled !== false;
  }
  function levelSeconds() {
    var n = parseInt(Store.get().settings.levelSeconds, 10);
    if (isNaN(n) || n < 30 || n > 3600) n = 180;
    return n;
  }
  function fmtClock(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    var m = Math.floor(s / 60);
    return m + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
  }
  function remainingMs() {
    if (!S || !S.deadline) return null;
    return S.deadline - Date.now();
  }

  /* ---------- saved run: survives a refresh or a closed browser ---------- */
  function runId() {
    return (S.subject.type || 'x') + ':' + (S.subject.id || 'anon') + ':' + S.mode;
  }
  function saveRun() {
    if (!S) return;
    try {
      localStorage.setItem(RUN_KEY, JSON.stringify({
        id: runId(), model: S.model, mode: S.mode,
        subjectId: S.subject.id, subjectType: S.subject.type,
        plan: S.plan, queue: S.queue, blockIdx: S.blockIdx, qIdx: S.qIdx,
        answers: S.answers, xp: S.xp, badges: S.badges,
        levelStats: S.levelStats, deadline: S.deadline, levelStartedAt: S.levelStartedAt,
        startedAt: S.startedAt, savedAt: Date.now()
      }));
    } catch (e) {}
  }
  function clearRun() {
    try { localStorage.removeItem(RUN_KEY); } catch (e) {}
  }
  function loadRun(id) {
    try {
      var raw = localStorage.getItem(RUN_KEY);
      if (!raw) return null;
      var r = JSON.parse(raw);
      if (!r || r.id !== id) return null;
      /* a run older than 6 hours is stale, not an interruption */
      if (!r.savedAt || Date.now() - r.savedAt > 6 * 3600 * 1000) return null;
      return r;
    } catch (e) { return null; }
  }

  /* ---------- the clock itself ---------- */
  function startLevelClock(resumeDeadline) {
    stopLevelClock();
    if (!timerOn()) { S.deadline = null; return; }
    S.levelStartedAt = resumeDeadline ? S.levelStartedAt : Date.now();
    S.deadline = resumeDeadline || (Date.now() + levelSeconds() * 1000);
    saveRun();
    tIv = setInterval(tick, 250);
    tick();
  }
  function stopLevelClock() {
    if (tIv) { clearInterval(tIv); tIv = null; }
  }
  function tick() {
    var node = document.getElementById('tmr');
    var left = remainingMs();
    if (left === null) return;
    if (node) {
      node.textContent = fmtClock(left);
      var secs = Math.ceil(left / 1000);
      node.parentNode.classList.toggle('t-warn', secs <= 60 && secs > 30);
      node.parentNode.classList.toggle('t-hot', secs <= 30);
    }
    if (left <= 0) { stopLevelClock(); timeUp(); }
  }

  /* how long the level actually took, and what was left undone */
  function closeLevel(timedOut) {
    stopLevelClock();
    var qs = S.queue[S.blockIdx] || [];
    var m = meta(S.blockIdx);
    var answeredHere = S.answers.filter(function (a) { return qs.indexOf(a.qid) >= 0 && !a.unanswered; }).length;
    var secs = S.levelStartedAt ? Math.round((Date.now() - S.levelStartedAt) / 1000) : null;
    S.levelStats.push({
      key: (isNC() ? m.key : S.plan[S.blockIdx].zone), n: m.n, code: m.code,
      answered: answeredHere, total: qs.length,
      seconds: timerOn() ? Math.min(secs == null ? 0 : secs, levelSeconds()) : secs,
      limit: timerOn() ? levelSeconds() : 0,
      timedOut: !!timedOut
    });
    S.deadline = null; S.levelStartedAt = null;
    saveRun();
  }

  /* time's up: bank what was answered, mark the rest, move on. No dialog. */
  function timeUp() {
    var qs = S.queue[S.blockIdx] || [];
    var got = {};
    S.answers.forEach(function (a) { got[a.qid] = 1; });
    qs.forEach(function (id) {
      if (got[id]) return;
      var q = getQ(id);
      if (!q) return;
      /* unanswered — deliberately not a zero. See NC.score() and Engine.dna(). */
      S.answers.push(isNC()
        ? { qid: id, opt: null, lvl: q.lvl, unanswered: true }
        : { qid: id, opt: null, s: null, zone: q.zone, trait: q.trait, unanswered: true });
    });
    closeLevel(true);

    var m = meta(S.blockIdx);
    app.innerHTML = '<div class="screen times-up" style="--c:' + m.color + '">' +
      '<div class="tu-card pop"><div class="tu-icon">⏱</div>' +
        '<h1>' + esc(T('times_up')) + '</h1>' +
        '<p class="muted">' + esc(T('times_up_note')) + '</p>' +
        '<div class="tu-bar"><i></i></div>' +
      '</div></div>';
    Sound.tap();
    setTimeout(function () {
      S.blockIdx++;
      S.qIdx = 0;
      if (S.blockIdx >= S.plan.length) return salesComplete();
      renderMap(false);
    }, 1600);
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
      blockIdx: 0, qIdx: 0, answers: [], xp: 0, badges: [], startedAt: Date.now(),
      levelStats: [], deadline: null, levelStartedAt: null, qStartedAt: null
    };
    document.body.classList.add('in-game');

    /* Pick up an interrupted run rather than handing out a fresh clock: the
       stored deadline is absolute, so a reload costs the time it really took. */
    var prev = loadRun(runId());

    /* A finished result that never reached the server: send it before anything
       else, so a failed upload is recovered instead of silently discarded. */
    if (prev && prev.pending && Store.isServerMode() && root.SDNA.API) {
      var pend = prev.pending;
      renderSaving();
      return sendResult(pend.model, pend.payload).then(function () {
        clearRun();
        UI.toast('✔ ' + T('saving').replace('…', ''));
        renderMap(true);
      })['catch'](function (err) { renderSaveFailed(err, pend.model, pend.payload); });
    }

    if (prev && prev.answers && prev.answers.length && prev.blockIdx < S.plan.length) {
      S.plan = prev.plan || S.plan;
      S.queue = prev.queue || S.queue;
      S.blockIdx = prev.blockIdx;
      S.qIdx = prev.qIdx || 0;
      S.answers = prev.answers;
      S.xp = prev.xp || 0;
      S.badges = prev.badges || [];
      S.levelStats = prev.levelStats || [];
      S.levelStartedAt = prev.levelStartedAt || null;
      if (prev.deadline) {
        if (prev.deadline <= Date.now()) {         /* the clock ran out while away */
          S.deadline = prev.deadline;
          return timeUp();
        }
        startLevelClock(prev.deadline);            /* resume with what is left */
        return renderQuestion();
      }
      return renderMap(false);
    }

    clearRun();
    renderMap(true);
  }

  function leave() {
    stopLevelClock();
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
        '<b>' + esc(m.code) + '</b><small>' + esc(UI.nm(m)) + '</small></div>' +
      '<div class="hud-right">' +
        (S.deadline ? '<div class="hud-timer" dir="ltr">⏱ <b id="tmr">' + fmtClock(remainingMs()) + '</b></div>' : '') +
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
              '<span>' + esc(UI.nm(m)) + '</span>' +
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
        '<h3 class="zi-sub">' + esc(UI.nm(m)) + '</h3>' +
        '<div class="mentor-bubble"><span class="mentor-dot" style="--c:' + ch.color + '">' + (ch.icon || '★') + '</span>' +
          '<div><b>' + esc(UI.nm(ch)) + '</b><span>' + esc(hello + (UI.getLang() === 'en' ? ch.line_en : ch.line_ar)) + '</span></div></div>' +
        '<div class="zi-count">' + S.queue[S.blockIdx].length + ' ' + esc(T('challenges')) +
          (timerOn() ? ' · <b>' + fmtClock(levelSeconds() * 1000) + '</b>' : '') + '</div>' +
        (timerOn() ? '<p class="zi-timenote">' + esc(T('level_time_note')
            .replace('{t}', fmtClock(levelSeconds() * 1000))) + '</p>' : '') +
        '<button class="btn btn-primary btn-xl" id="goQ">' + esc(T('start_level')) + '</button>' +
      '</div></div>';
    bindHud();
    Sound.unlock();
    document.getElementById('goQ').onclick = function () {
      Sound.tap();
      S.qIdx = 0;
      startLevelClock();          /* the clock starts only after the button */
      renderQuestion();
    };
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
            '<span class="cust-tag">' + (who === 'coach' ? '🎓 ' + esc(UI.getLang() === 'en' ? 'The manager' : 'المدير')
              : (Art.CUSTOMERS[who] ? Art.CUSTOMERS[who].icon + ' ' + esc(Art.CUSTOMERS[who].ar) : '')) + '</span>' +
          '</div>' : '') +
        (q.line ? '<div class="bubble cust-bubble fade-up">' + esc(UI.qt(q, 'line')) + '</div>' : '') +
      '</div>' +
      '<div class="panel">' +
        '<h2 class="q-text fade-up">' + esc(UI.qt(q, 'q')) + '</h2>' +
        '<div class="opts">' + opts.map(function (o, k) {
          return '<button class="opt fade-up" style="animation-delay:' + (0.05 * k + 0.08) + 's" data-i="' + o.i + '">' +
            '<span class="opt-ic">' + ANSWER_ICONS[k] + '</span>' +
            '<span class="opt-t">' + esc(UI.qt(o.o, 't')) + '</span>' +
            '<span class="opt-key">' + 'ABCD'[k] + '</span></button>';
        }).join('') + '</div>' +
      '</div></div>';

    bindHud();
    S.qStartedAt = Date.now();
    tick();                       /* keep the freshly rendered clock in step */
    UI.$$('.opt', app).forEach(function (b) {
      b.onclick = function () { choose(q, parseInt(b.dataset.i, 10), b); };
    });
  }

  function choose(q, optIndex, node) {
    UI.$$('.opt', app).forEach(function (b) { b.disabled = true; b.classList.add('dim'); });
    node.classList.remove('dim'); node.classList.add('chosen');
    Sound.pick();

    var opt = q.a[optIndex];
    /* response time per question — an observation, never a score. See rule 9. */
    var ms = S.qStartedAt ? Math.max(0, Date.now() - S.qStartedAt) : null;
    if (isNC()) {
      S.answers.push({ qid: q.id, opt: optIndex, lvl: q.lvl, ms: ms });
    } else {
      S.answers.push({ qid: q.id, opt: optIndex, s: opt.s, f: opt.f || null, zone: q.zone, trait: q.trait, ms: ms });
    }
    /* written the moment it is given, so a timeout or a closed tab keeps it */
    saveRun();
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
    var leftMs = remainingMs();
    closeLevel(false);
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
        (leftMs != null && leftMs > 0
          ? '<div class="zd-left" dir="ltr">⏱ ' + fmtClock(leftMs) + ' <span>' + esc(T('remaining')) + '</span></div>' : '') +
        (badge ? '<div class="badge-earned pop"><span>' + badge.icon + '</span>' +
          esc(UI.nm(badge)) + '</div>' : '') +
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
    stopLevelClock();
    var payload = { answers: S.answers, completedAt: new Date().toISOString().slice(0, 10),
                    xp: S.xp, badges: S.badges, levels: S.levelStats };

    if (S.subject.type === 'employee') {
      if (S.mode === 'employee22') Store.updateEmployee(S.subject.id, { nc22: payload });
      else Store.updateEmployee(S.subject.id, { assessment: payload });
    } else {
      Store.updateCandidate(S.subject.id, { nc: payload, stage: 2 });
    }

    /* The result is only finished once the server has it. Until then the run
       stays in local storage, so a failed upload can be retried instead of
       telling the candidate their answers were sent when they were not. */
    if (Store.isServerMode() && root.SDNA.API) {
      var model = S.subject.type === 'candidate' ? 'nc25' : (S.mode === 'employee22' ? 'nc22' : 'emp36');
      markPending(model, payload);
      renderSaving();
      return sendResult(model, payload).then(function () {
        clearRun();
        afterSalesSaved();
      })['catch'](function (err) {
        renderSaveFailed(err, model, payload);
      });
    }

    clearRun();
    afterSalesSaved();
  }

  /* ---------- uploading the finished result ---------- */
  var SAVE_TRIES = 3;
  function sendResult(model, payload) {
    var n = 0;
    function attempt() {
      n++;
      return root.SDNA.API.saveAssessment(model, payload, payload.levels)['catch'](function (err) {
        /* a rejected payload will be rejected again — only retry transport */
        if (n >= SAVE_TRIES || (err.status && err.status >= 400 && err.status < 500)) throw err;
        return new Promise(function (res) { setTimeout(res, n * 1200); }).then(attempt);
      });
    }
    return attempt();
  }
  /* keep the finished result in the saved run until the upload succeeds */
  function markPending(model, payload) {
    try {
      var raw = localStorage.getItem(RUN_KEY);
      var r = raw ? JSON.parse(raw) : {};
      r.id = runId(); r.pending = { model: model, payload: payload };
      r.savedAt = Date.now();
      localStorage.setItem(RUN_KEY, JSON.stringify(r));
    } catch (e) {}
  }
  function renderSaving() {
    app.innerHTML = '<div class="screen times-up"><div class="tu-card pop">' +
      '<div class="tu-icon">💾</div><h1 style="color:#7dd3fc">' + esc(T('saving')) + '</h1>' +
      '<p class="muted">' + esc(T('saving_note')) + '</p>' +
      '<div class="tu-bar"><i style="animation-duration:2.4s;background:#0ea5e9"></i></div>' +
      '</div></div>';
  }
  function renderSaveFailed(err, model, payload) {
    app.innerHTML = '<div class="screen times-up"><div class="tu-card pop">' +
      '<div class="tu-icon">📡</div><h1>' + esc(T('save_failed')) + '</h1>' +
      '<p class="muted">' + esc(T('save_failed_note')) + '</p>' +
      '<p class="muted sm" dir="ltr">' + esc(err && err.message ? err.message : '') + '</p>' +
      '<button class="btn btn-primary btn-xl" id="retrySave">' + esc(T('retry_save')) + '</button>' +
      '</div></div>';
    document.getElementById('retrySave').onclick = function () {
      Sound.tap();
      renderSaving();
      sendResult(model, payload).then(function () {
        clearRun();
        afterSalesSaved();
      })['catch'](function (e2) { renderSaveFailed(e2, model, payload); });
    };
  }

  function afterSalesSaved() {
    var st = Store.get();
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
        if (Store.isServerMode() && root.SDNA.API) {
          root.SDNA.API.saveFocus(result)['catch'](function (err) {
            UI.toast('⚠ ' + T('save_failed') + ' (' + err.message + ')', 'bad');
          });
        }
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
          '<div><small>YOUR SALES STYLE</small><b>' + esc(ch.key) + ' · ' + esc(UI.nm(ch)) + '</b>' +
          '<span>' + esc(UI.getLang() === 'en' ? ch.desc_en : ch.desc_ar) + '</span></div></div>' +
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
          esc(UI.nm(NC.DIMS[top])) + '</b>' +
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
      var after = function () {
        document.body.classList.remove('in-game');
        if (doneCb) doneCb(result); else root.SDNA.App.go('manager');
      };
      if (Store.isServerMode() && root.SDNA.API) {
        root.SDNA.API.managerFocus(kind, subject.id, result).then(after)['catch'](function (err) {
          UI.toast('⚠ ' + T('save_failed') + ' (' + err.message + ')', 'bad');
          after();
        });
        return;
      }
      after();
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
