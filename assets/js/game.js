/* ============================================================
   SALES DNA — GAME FLOW V2  (SALES CITY)
   City map → zone gate → scene questions → celebration → boss
   ============================================================ */
(function (root) {
  'use strict';
  var Q = root.SDNA.Q, Store = root.SDNA.Store, UI = root.SDNA.UI,
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

  /* ---------------- session ---------------- */
  function start(mode, subject) {
    app = document.getElementById('app');
    Art.injectDefs();
    var plan = Store.buildPlan(mode, Math.random, subject.exclude || []);
    S = {
      mode: mode, subject: subject, name: (subject.name || '').split(' ')[0],
      plan: plan, queue: plan.map(function (b) { return b.qs.slice(); }),
      blockIdx: 0, qIdx: 0, answers: [], xp: 0, badges: [], startedAt: Date.now()
    };
    document.body.classList.add('in-game');
    renderMap(true);
  }

  function leave() {
    document.body.classList.remove('in-game');
    root.SDNA.App.go('home');
  }

  function zoneOf(i) { return Q.zone(S.plan[i].zone); }
  function totalQ() { return S.queue.reduce(function (s, b) { return s + b.length; }, 0); }

  /* shared HUD */
  function hud() {
    var z = zoneOf(S.blockIdx);
    return '<div class="hud">' +
      '<div class="hud-zone"><span class="hud-dot" style="background:' + z.color + '"></span>' +
        '<b>' + esc(z.code) + '</b><small>' + esc(UI.getLang() === 'he' ? z.he : z.ar) + '</small></div>' +
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

  /* ---------------- SALES CITY map ---------------- */
  function renderMap(first) {
    var lang = UI.getLang();
    app.innerHTML = '<div class="screen city-screen">' + hud() +
      '<div class="map-head"><h2>SALES CITY</h2>' +
      '<p class="muted">' + (S.name ? esc(T('map_hello').replace('{n}', S.name)) : esc(T('map_title'))) + '</p></div>' +
      '<div class="city-map">' +
        S.plan.map(function (b, i) {
          var z = Q.zone(b.zone);
          var st = i < S.blockIdx ? 'done' : i === S.blockIdx ? 'active' : 'locked';
          return '<div class="zone-node ' + st + '" style="--c:' + z.color + '">' +
            '<div class="zn-art">' + Art.zoneEmblem(z.key, z.color) +
              (st === 'locked' ? '<span class="zn-lock">🔒</span>' : '') +
              (st === 'done' ? '<span class="zn-check">✓</span>' : '') + '</div>' +
            '<div class="zn-info"><b>' + esc(z.code) + '</b>' +
              '<span>' + esc(lang === 'he' ? z.he : z.ar) + '</span>' +
              '<i>' + b.qs.length + ' ' + esc(T('q_of')) + '</i></div>' +
            (st === 'active' ? '<div class="zn-hero">' + Art.hero({ pose: 'idle', expr: 'idle' }) + '</div>' : '') +
            '</div>';
        }).join('') +
      '</div>' +
      '<button class="btn btn-primary btn-xl" id="goZone">' +
        (first ? esc(T('start_challenge')) : esc(T('next_zone'))) + '</button>' +
      '</div>';
    bindHud();
    document.getElementById('goZone').onclick = function () { Sound.tap(); renderZoneIntro(); };
  }

  /* ---------------- zone gate ---------------- */
  function renderZoneIntro() {
    var z = zoneOf(S.blockIdx);
    var ch = Q.CHARACTERS[z.mentor];
    var hello = S.name ? T('zone_hello').replace('{n}', S.name) : '';
    app.innerHTML = '<div class="screen zone-intro" style="--c:' + z.color + '">' + hud() +
      '<div class="gate"><div class="gate-half l"></div><div class="gate-half r"></div></div>' +
      '<div class="zi-body">' +
        '<div class="zi-badge">ZONE ' + z.n + '</div>' +
        '<div class="zi-emblem pop">' + Art.zoneEmblem(z.key, z.color) + '</div>' +
        '<h1 class="zi-title">' + esc(z.code) + '</h1>' +
        '<h3 class="zi-sub">' + esc(UI.getLang() === 'he' ? z.he : z.ar) + '</h3>' +
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
    var q = Q.get(qs[S.qIdx]);
    var z = zoneOf(S.blockIdx);
    var opts = Store.shuffle(q.a.map(function (o, i) { return { o: o, i: i }; }));
    var isBoss = z.key === 'final';
    var who = q.who || (isBoss ? 'boss' : null);

    var stars = '';
    for (var i = 0; i < qs.length; i++) stars += '<i class="' + (i < S.qIdx ? 'on' : i === S.qIdx ? 'now' : '') + '"></i>';

    app.innerHTML = '<div class="screen scene" style="--c:' + z.color + '" data-zone="' + z.key + '">' + hud() +
      '<div class="stars">' + stars + '</div>' +
      '<div class="stage">' +
        '<div class="actor hero-actor ' + (who ? 'with-cust' : 'solo') + '">' +
          Art.hero({ pose: who ? 'phone' : 'idle', expr: 'focus' }) + '</div>' +
        (who ? '<div class="actor cust-actor">' +
            (who === 'coach' ? Art.coach() : Art.customer(who)) +
            '<span class="cust-tag">' + (Art.CUSTOMERS[who] ? Art.CUSTOMERS[who].icon + ' ' + esc(Art.CUSTOMERS[who].ar) : '') + '</span>' +
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
    S.answers.push({ qid: q.id, opt: optIndex, s: opt.s, f: opt.f || null, zone: q.zone, trait: q.trait });
    S.xp += XP_Q;
    var xpNode = document.getElementById('xpNow');
    if (xpNode) UI.countUp(xpNode, S.xp, 420);
    node.appendChild(UI.el('<span class="gain">+' + XP_Q + ' XP</span>'));

    /* hero reacts */
    var heroBox = UI.$('.hero-actor', app);
    if (heroBox) {
      heroBox.classList.add('react');
      heroBox.innerHTML = Art.hero({ pose: 'point', expr: 'happy' });
    }
    var stage = UI.$('.stage', app);
    if (stage) stage.appendChild(UI.el('<div class="hero-bubble pop">' +
      esc(S.name ? T('recorded_name').replace('{n}', S.name) : T('recorded')) + '</div>'));

    /* adaptive follow-up */
    if (opt.fu && Q.get(opt.fu) && S.queue[S.blockIdx].indexOf(opt.fu) === -1) {
      S.queue[S.blockIdx].splice(S.qIdx + 1, 0, opt.fu);
    }

    var scene = UI.$('.scene', app);
    setTimeout(function () { if (scene) scene.classList.add('scene-out'); }, 480);
    setTimeout(function () { S.qIdx++; renderQuestion(); }, 760);
  }

  /* ---------------- zone complete ---------------- */
  function renderZoneComplete() {
    var z = zoneOf(S.blockIdx);
    var zAnswers = S.answers.filter(function (a) { return a.zone === z.key; });
    var score = zAnswers.length ? zAnswers.reduce(function (s, a) { return s + a.s; }, 0) / zAnswers.length : 0;
    var badge = (score >= 82 && BADGES[z.key]) ? BADGES[z.key] : null;
    if (badge) S.badges.push(z.key);
    S.xp += XP_ZONE;
    var last = S.blockIdx >= S.plan.length - 1;
    var nextZ = last ? null : Q.zone(S.plan[S.blockIdx + 1].zone);

    UI.confetti(50);
    Sound.win();
    app.innerHTML = '<div class="screen zone-done" style="--c:' + z.color + '">' +
      '<div class="zd-hero">' + Art.hero({ pose: 'cheer', expr: 'happy' }) + '</div>' +
      '<div class="zd-card pop">' +
        '<div class="zd-emblem">' + Art.zoneEmblem(z.key, z.color) + '</div>' +
        '<h1>' + esc(z.code) + '<br><span>' + esc(T('zone_complete')) + '</span></h1>' +
        (S.name ? '<p class="muted">' + esc(T('great_name').replace('{n}', S.name)) + '</p>' : '') +
        '<div class="zd-stats">' +
          '<div><b id="xpBig">0</b><small>XP</small></div>' +
          '<div><b>' + (S.blockIdx + 1) + '/' + S.plan.length + '</b><small>ZONES</small></div>' +
          '<div><b>' + S.badges.length + '</b><small>BADGES</small></div>' +
        '</div>' +
        (badge ? '<div class="badge-earned pop"><span>' + badge.icon + '</span>' +
          esc(UI.getLang() === 'he' ? badge.he : badge.ar) + '</div>' : '') +
        (nextZ ? '<div class="next-zone">NEXT: <b style="color:' + nextZ.color + '">' + esc(nextZ.code) + '</b></div>' : '') +
        '<button class="btn btn-primary btn-xl" id="nextZ">' + esc(last ? T('finish') : T('continue_')) + '</button>' +
      '</div></div>';
    UI.countUp(document.getElementById('xpBig'), S.xp, 900);
    document.getElementById('nextZ').onclick = function () {
      Sound.tap();
      S.blockIdx++;
      if (S.blockIdx >= S.plan.length) return finish();
      renderMap(false);
    };
  }

  /* ---------------- finish ---------------- */
  function finish() {
    var st = Store.get();
    var payload = { answers: S.answers, completedAt: new Date().toISOString().slice(0, 10), xp: S.xp, badges: S.badges };

    if (S.subject.type === 'employee') {
      Store.updateEmployee(S.subject.id, { assessment: payload });
      return finishEmployee();
    }
    var c = st.candidates.filter(function (x) { return x.id === S.subject.id; })[0];
    if (S.mode === 'c1') {
      Store.updateCandidate(c.id, { s1: payload, stage: 3 });
      var d = Engine.dna(payload.answers);
      var m = Engine.match(d, st);
      var unlocked = m.match >= (st.settings.thresholds.stage1 || 65);
      return finishStage1(c, unlocked);
    }
    Store.updateCandidate(c.id, { s2: payload, stage: 4 });
    return finishCandidate();
  }

  function finishEmployee() {
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

  /* candidate never sees a score */
  function finishStage1(c, unlocked) {
    UI.confetti(90); Sound.win();
    app.innerHTML = '<div class="screen final-screen">' +
      '<div class="fin-hero">' + Art.hero({ pose: 'cheer', expr: 'happy' }) + '</div>' +
      '<div class="fin-card pop">' +
        '<div class="fin-trophy">🎉</div>' +
        '<h1>' + esc(T('stage1_done')) + '</h1>' +
        '<p class="muted big">' + esc(T('thanks_cand')) + '</p>' +
        '<div class="zd-stats"><div><b>' + S.xp + '</b><small>XP</small></div>' +
          '<div><b>' + S.answers.length + '</b><small>' + esc(T('q_of')) + '</small></div></div>' +
        (unlocked ? '<div class="unlock pop">🔓 <b>LEVEL 2 UNLOCKED</b></div>' +
          '<button class="btn btn-primary btn-xl" id="cont">' + esc(T('continue_')) + '</button>' : '') +
        '<button class="btn btn-ghost" id="fin">' + esc(T('exit')) + '</button>' +
      '</div></div>';
    document.getElementById('fin').onclick = leave;
    var cont = document.getElementById('cont');
    if (cont) cont.onclick = function () { resume(c.id); };
  }

  function finishCandidate() {
    UI.confetti(130); Sound.win();
    app.innerHTML = '<div class="screen final-screen">' +
      '<div class="fin-hero">' + Art.hero({ pose: 'cheer', expr: 'happy' }) + '</div>' +
      '<div class="fin-card pop">' +
        '<div class="fin-trophy">🏆</div>' +
        '<h1>' + esc(T('challenge_done')) + '</h1>' +
        '<p class="muted big">' + esc(T('thanks_cand')) + '</p>' +
        '<div class="zd-stats"><div><b>' + S.xp + '</b><small>XP</small></div>' +
          '<div><b>' + S.badges.length + '</b><small>BADGES</small></div>' +
          '<div><b>' + S.answers.length + '</b><small>' + esc(T('q_of')) + '</small></div></div>' +
        '<button class="btn btn-ghost" id="fin">' + esc(T('exit')) + '</button>' +
      '</div></div>';
    document.getElementById('fin').onclick = leave;
  }

  /* start / resume stage 2 for a candidate (also used by the manager) */
  function resume(candidateId) {
    var c = Store.get().candidates.filter(function (x) { return x.id === candidateId; })[0];
    if (!c) return;
    var used = (c.s1 ? c.s1.answers.map(function (a) { return a.qid; }) : []);
    start('c2', { type: 'candidate', id: c.id, name: c.name, exclude: used });
  }

  root.SDNA.Game = { start: start, resume: resume, Sound: Sound, BADGES: BADGES };
})(window);
