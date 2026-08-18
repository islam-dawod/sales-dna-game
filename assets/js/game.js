/* ============================================================
   SALES DNA — GAME FLOW (levels, questions, XP, animations)
   ============================================================ */
(function (root) {
  'use strict';
  var Q = root.SDNA.Q, Store = root.SDNA.Store, UI = root.SDNA.UI, Engine = root.SDNA.Engine;
  var T = UI.T, esc = UI.esc;

  var S = null;              // active session
  var app = null;

  var BADGES = {
    target:      { icon: '🎯', ar: 'صائد الأهداف', he: 'ציד היעדים' },
    rejection:   { icon: '🔥', ar: 'ناجٍ من الضغط', he: 'שורד לחץ' },
    discipline:  { icon: '⏱', ar: 'آلة منضبطة', he: 'מכונת משמעת' },
    learning:    { icon: '🧠', ar: 'متعلّم سريع', he: 'לומד מהיר' },
    responsibility: { icon: '🛡', ar: 'صاحب مسؤولية', he: 'בעל אחריות' },
    commitment:  { icon: '🤝', ar: 'ملتزم', he: 'מחויב' },
    battle:      { icon: '🏆', ar: 'محارب مبيعات', he: 'לוחם מכירות' }
  };

  function levelMeta(n) { return Q.LEVELS.filter(function (l) { return l.n === n; })[0]; }

  function start(mode, subject) {
    app = document.getElementById('app');
    var plan = Store.buildPlan(mode, Math.random, subject.exclude || []);
    S = {
      mode: mode, subject: subject, plan: plan,
      blockIdx: 0, qIdx: 0, answers: [], xp: 0, streak: 0, badges: [],
      queue: plan.map(function (b) { return b.qs.slice(); }),
      startedAt: Date.now()
    };
    renderMap(true);
  }

  /* ---------------- game map ---------------- */
  function renderMap(intro) {
    var lvls = S.plan.map(function (b) { return levelMeta(b.lvl); });
    var html = '<div class="screen map-screen">' +
      '<div class="map-head"><h2>' + esc(T('map_title')) + '</h2>' +
      '<p class="muted">' + esc(T('ready_sub')) + '</p></div>' +
      '<div class="map-track">' +
      lvls.map(function (l, i) {
        var st = i < S.blockIdx ? 'done' : i === S.blockIdx ? 'active' : 'locked';
        return '<div class="map-node ' + st + '" style="--c:' + l.color + '">' +
          '<div class="map-dot">' + (st === 'done' ? '✓' : l.icon) + '</div>' +
          '<div class="map-info"><b>LEVEL ' + l.n + '</b><span>' + esc(l.code) + '</span>' +
          '<small>' + esc(UI.getLang() === 'he' ? l.he : l.ar) + ' · ' + S.plan[i].qs.length + ' ' + esc(T('q_of')) + '</small></div>' +
          '<div class="map-state">' + (st === 'locked' ? '🔒' : st === 'done' ? '' : '▶') + '</div></div>';
      }).join('') +
      '</div>' +
      '<button class="btn btn-primary btn-lg" id="goLevel">' + (intro ? esc(T('start')) : esc(T('next_challenge'))) + ' <span class="arrow">‹</span></button>' +
      '</div>';
    app.innerHTML = html;
    document.getElementById('goLevel').onclick = function () { renderLevelIntro(); };
  }

  /* ---------------- level intro ---------------- */
  function renderLevelIntro() {
    var blk = S.plan[S.blockIdx];
    var l = levelMeta(blk.lvl);
    var ch = Q.CHARACTERS[l.char];
    app.innerHTML = '<div class="screen level-intro" style="--c:' + l.color + '">' +
      '<div class="li-badge">LEVEL ' + l.n + '</div>' +
      '<div class="li-icon pop">' + l.icon + '</div>' +
      '<h1 class="li-title">' + esc(l.code) + '</h1>' +
      '<h3 class="li-sub">' + esc(UI.getLang() === 'he' ? l.he : l.ar) + '</h3>' +
      '<div class="char-bubble"><div class="char-ava" style="--c:' + ch.color + '">' + ch.emoji + '</div>' +
      '<div class="char-say"><b>' + esc(ch.ar) + '</b><span>' + esc(ch.line_ar) + '</span></div></div>' +
      '<button class="btn btn-primary btn-lg" id="goQ">' + esc(T('start')) + '</button></div>';
    document.getElementById('goQ').onclick = function () { S.qIdx = 0; renderQuestion(); };
  }

  /* ---------------- question ---------------- */
  function totalCount() {
    return S.queue.reduce(function (s, b) { return s + b.length; }, 0);
  }
  function answeredCount() { return S.answers.length; }

  function renderQuestion() {
    var qs = S.queue[S.blockIdx];
    if (S.qIdx >= qs.length) { return renderLevelComplete(); }
    var q = Q.get(qs[S.qIdx]);
    var l = levelMeta(S.plan[S.blockIdx].lvl);
    var opts = Store.shuffle(q.a.map(function (o, i) { return { o: o, i: i }; }));
    var prog = Math.round(100 * answeredCount() / totalCount());

    app.innerHTML = '<div class="screen q-screen" style="--c:' + l.color + '">' +
      '<div class="q-top">' +
        '<div class="q-lvl"><span class="dot" style="background:' + l.color + '"></span> LEVEL ' + l.n + ' · ' + esc(l.code) + '</div>' +
        '<div class="q-xp" dir="ltr">⭐ <b id="xpNow">' + S.xp + '</b> XP · 🔥 ' + S.streak + '</div>' +
      '</div>' +
      '<div class="prog"><div class="prog-fill" style="width:' + prog + '%"></div></div>' +
      '<div class="q-count">' + esc(T('q_of')) + ' <span dir="ltr">' + (S.qIdx + 1) + ' / ' + qs.length + '</span></div>' +
      '<h2 class="q-text fade-up">' + esc(q.q) + '</h2>' +
      '<div class="opts">' + opts.map(function (o, k) {
        return '<button class="opt fade-up" style="animation-delay:' + (0.06 * k + 0.1) + 's" data-i="' + o.i + '">' +
          '<span class="opt-key">' + 'ABCD'[k] + '</span><span class="opt-t">' + esc(o.o.t) + '</span></button>';
      }).join('') + '</div>' +
      '<div class="q-foot muted">' + esc(T('recorded')) + ' · ' + esc(T('ready_sub')) + '</div>' +
      '</div>';

    UI.$$('.opt', app).forEach(function (b) {
      b.onclick = function () { choose(q, parseInt(b.dataset.i, 10), b); };
    });
  }

  function choose(q, optIndex, node) {
    UI.$$('.opt', app).forEach(function (b) { b.disabled = true; b.classList.add('dim'); });
    node.classList.remove('dim'); node.classList.add('chosen');

    var opt = q.a[optIndex];
    S.answers.push({ qid: q.id, opt: optIndex, s: opt.s, f: opt.f || null, lvl: q.lvl, trait: q.trait });
    S.streak++;
    var gain = 100 + Math.min(150, S.streak * 10);
    S.xp += gain;
    var xpNode = document.getElementById('xpNow');
    if (xpNode) UI.countUp(xpNode, S.xp, 500);

    var fx = UI.el('<div class="gain">+' + gain + ' XP</div>');
    node.appendChild(fx);

    // adaptive follow-up
    if (opt.fu && Q.get(opt.fu) && S.queue[S.blockIdx].indexOf(opt.fu) === -1) {
      S.queue[S.blockIdx].splice(S.qIdx + 1, 0, opt.fu);
    }

    var l = levelMeta(S.plan[S.blockIdx].lvl);
    var ch = Q.CHARACTERS[l.char];
    var say = UI.el('<div class="say-pop"><span class="ava" style="--c:' + ch.color + '">' + ch.emoji + '</span>' + esc(T('recorded')) + '</div>');
    app.appendChild(say);

    setTimeout(function () { S.qIdx++; renderQuestion(); }, 780);
  }

  /* ---------------- level complete ---------------- */
  function renderLevelComplete() {
    var blk = S.plan[S.blockIdx];
    var l = levelMeta(blk.lvl);
    var lvlAnswers = S.answers.filter(function (a) { return a.lvl === blk.lvl; });
    var score = lvlAnswers.length ? lvlAnswers.reduce(function (s, a) { return s + a.s; }, 0) / lvlAnswers.length : 0;
    var badge = null;
    if (score >= 82 && BADGES[l.key]) { badge = BADGES[l.key]; S.badges.push(l.key); }
    var bonus = 250;
    S.xp += bonus;

    UI.confetti(40);
    app.innerHTML = '<div class="screen level-done" style="--c:' + l.color + '">' +
      '<div class="ld-icon pop">✨</div>' +
      '<h1>' + esc(T('level_complete')) + '</h1>' +
      '<h3 class="li-sub">' + esc(l.code) + '</h3>' +
      '<div class="ld-stats">' +
        '<div class="ld-stat"><b id="xpBig">0</b><small>XP</small></div>' +
        '<div class="ld-stat"><b>🔥 ' + S.streak + '</b><small>' + esc(T('streak')) + '</small></div>' +
        '<div class="ld-stat"><b>+' + bonus + '</b><small>BONUS</small></div>' +
      '</div>' +
      (badge ? '<div class="badge-earned pop"><span>' + badge.icon + '</span>' +
        esc(UI.getLang() === 'he' ? badge.he : badge.ar) + '</div>' : '') +
      '<button class="btn btn-primary btn-lg" id="nextLv">' + esc(T('next_challenge')) + '</button></div>';
    UI.countUp(document.getElementById('xpBig'), S.xp, 900);

    document.getElementById('nextLv').onclick = function () {
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
      Store.updateCandidate(c.id, { s1: payload, stage: 2 });
      var d = Engine.dna(payload.answers);
      var m = Engine.match(d, st);
      Store.updateCandidate(c.id, { stage: 3 });
      return finishCandidate(m);
    }
    Store.updateCandidate(c.id, { s2: payload, stage: 4 });
    return finishCandidate(null);
  }

  function finishEmployee() {
    var d = Engine.dna(S.answers);
    var ch = Engine.character(d);
    UI.confetti(90);
    var top = Engine.TK.filter(function (t) { return d.traits[t] != null; })
      .sort(function (a, b) { return d.traits[b] - d.traits[a]; }).slice(0, 3);
    app.innerHTML = '<div class="screen final-screen">' +
      '<div class="fin-icon pop">🏁</div>' +
      '<h1>' + esc(T('challenge_done')) + '</h1>' +
      '<p class="muted">' + esc(T('thanks_emp')) + '</p>' +
      '<div class="char-card pop"><div class="cc-emoji">' + ch.emoji + '</div>' +
      '<div><small>SALES CHARACTER</small><b>' + esc(ch.key) + ' · ' + esc(ch.ar) + '</b>' +
      '<span>' + esc(ch.desc_ar) + '</span></div></div>' +
      UI.bars(top.map(function (t) {
        return { label: UI.getLang() === 'he' ? Q.TRAITS[t].he : Q.TRAITS[t].ar, value: d.traits[t], icon: Q.TRAITS[t].icon, color: Q.TRAITS[t].color };
      })) +
      '<div class="ld-stats"><div class="ld-stat"><b>' + S.xp + '</b><small>XP</small></div>' +
      '<div class="ld-stat"><b>' + S.badges.length + '</b><small>BADGES</small></div></div>' +
      '<button class="btn btn-ghost" id="fin">' + esc(T('exit')) + '</button></div>';
    document.getElementById('fin').onclick = function () { root.SDNA.App.go('home'); };
  }

  /* candidate never sees scores (spec §57) */
  function finishCandidate(m) {
    UI.confetti(90);
    app.innerHTML = '<div class="screen final-screen">' +
      '<div class="fin-icon pop">🎉</div>' +
      '<h1>' + esc(T('challenge_done')) + '</h1>' +
      '<p class="muted big">' + esc(T('thanks_cand')) + '</p>' +
      '<div class="ld-stats"><div class="ld-stat"><b>' + S.xp + '</b><small>XP</small></div>' +
      '<div class="ld-stat"><b>' + S.answers.length + '</b><small>' + esc(T('q_of')) + '</small></div>' +
      '<div class="ld-stat"><b>🔥 ' + S.streak + '</b><small>' + esc(T('streak')) + '</small></div></div>' +
      (S.mode === 'c1' ? '<button class="btn btn-primary btn-lg" id="cont">' + esc(T('continue_')) + ' — LEVEL 2</button>' : '') +
      '<button class="btn btn-ghost" id="fin">' + esc(T('exit')) + '</button></div>';
    document.getElementById('fin').onclick = function () { root.SDNA.App.go('home'); };
    var cont = document.getElementById('cont');
    if (cont) cont.onclick = function () {
      var st = Store.get();
      var c = st.candidates.filter(function (x) { return x.id === S.subject.id; })[0];
      var used = (c.s1 ? c.s1.answers.map(function (a) { return a.qid; }) : []);
      start('c2', { type: 'candidate', id: c.id, exclude: used });
    };
  }

  root.SDNA.Game = { start: start, BADGES: BADGES };
})(window);
