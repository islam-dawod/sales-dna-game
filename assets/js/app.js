/* ============================================================
   SALES DNA — APP SHELL / ROUTER
   ============================================================ */
(function (root) {
  'use strict';
  var Q = root.SDNA.Q, Store = root.SDNA.Store, UI = root.SDNA.UI,
      Engine = root.SDNA.Engine, Game = root.SDNA.Game, Manager = root.SDNA.Manager;
  var T = UI.T, esc = UI.esc;
  var app, route = 'splash';

  function go(r, data) {
    route = r;
    document.body.classList.toggle('mgr-mode', r === 'manager');
    ({
      splash: splash, home: home,
      empLogin: empLogin, empReady: empReady,
      candReg: candReg,
      mgrLogin: mgrLogin, manager: function () { Manager.open(); }
    }[r] || home)(data);
    window.scrollTo(0, 0);
  }

  /* ---------------- splash ---------------- */
  function splash() {
    app.innerHTML = '<div class="screen splash">' +
      '<div class="logo-xl"><span class="l1">SALES</span><span class="l2">DNA</span></div>' +
      '<div class="tagline">' + esc(T('app_sub')) + '</div>' +
      '<div class="orbit"><i>🎯</i><i>🔥</i><i>🧠</i><i>⏱</i><i>🏆</i></div>' +
      '<button class="btn btn-primary btn-xl pulse" id="startBtn">START</button>' +
      '<div class="splash-note muted">GAME · ASSESSMENT · SALES ANALYTICS</div>' +
      '</div>';
    document.getElementById('startBtn').onclick = function () {
      document.body.classList.add('flash');
      setTimeout(function () { document.body.classList.remove('flash'); go('home'); }, 320);
    };
  }

  /* ---------------- role select ---------------- */
  function home() {
    app.innerHTML = '<div class="screen roles">' +
      '<h2 class="rl-title">' + esc(T('who_are_you')) + '</h2>' +
      '<div class="role-grid">' +
        roleCard('emp', '🧑‍💼', T('role_emp'), T('role_emp_s'), '#3b82f6') +
        roleCard('cand', '🚀', T('role_cand'), T('role_cand_s'), '#8b5cf6') +
        roleCard('mgr', '🧠', T('role_mgr'), T('role_mgr_s'), '#10b981') +
      '</div></div>';
    UI.$$('[data-role]', app).forEach(function (c) {
      c.onclick = function () {
        var r = c.dataset.role;
        go(r === 'emp' ? 'empLogin' : r === 'cand' ? 'candReg' : 'mgrLogin');
      };
    });
  }
  function roleCard(k, icon, title, sub, color) {
    return '<button class="role-card" data-role="' + k + '" style="--c:' + color + '">' +
      '<div class="rc-icon">' + icon + '</div><b>' + esc(title) + '</b><small>' + esc(sub) + '</small>' +
      '<span class="rc-go">›</span></button>';
  }

  /* ---------------- employee login ---------------- */
  function empLogin() {
    var codes = Store.get().employees.slice(0, 4).map(function (e) { return e.code; }).join(' · ');
    app.innerHTML = '<div class="screen form-screen">' +
      backBtn() + '<div class="fs-icon">🧑‍💼</div><h2>' + esc(T('emp_login')) + '</h2>' +
      '<div class="form">' +
      '<label class="fld"><span>' + esc(T('emp_code')) + '</span><input id="code" placeholder="E101" autocomplete="off"></label>' +
      '<button class="btn btn-primary btn-lg" id="doLogin">' + esc(T('login')) + '</button>' +
      '<p class="muted sm">DEMO: ' + esc(codes) + '</p></div></div>';
    bindBack();
    document.getElementById('doLogin').onclick = function () {
      var e = Store.findEmployeeByCode(document.getElementById('code').value);
      if (!e) return UI.toast(T('not_found'), 'bad');
      go('empReady', e);
    };
  }

  function empReady(e) {
    var yrs = e.startDate ? (2026 - Number(String(e.startDate).slice(0, 4))) : '—';
    app.innerHTML = '<div class="screen form-screen">' +
      backBtn() + '<div class="fs-icon">👋</div>' +
      '<h2>' + esc(T('welcome')) + ' ' + esc(e.name) + '</h2>' +
      '<div class="mini-facts">' +
        '<div><small>' + esc(T('dept')) + '</small><b>' + esc(e.dept) + '</b></div>' +
        '<div><small>' + esc(T('seniority')) + '</small><b>' + yrs + 'y</b></div>' +
        '<div><small>' + esc(T('target_pct')) + '</small><b>' + e.targetPct + '%</b></div>' +
      '</div>' +
      '<h3>' + esc(T('ready')) + '</h3><p class="muted">' + esc(T('ready_sub')) + '</p>' +
      '<button class="btn btn-primary btn-xl pulse" id="startGame">START</button></div>';
    bindBack();
    document.getElementById('startGame').onclick = function () {
      Game.start('employee', { type: 'employee', id: e.id });
    };
  }

  /* ---------------- candidate registration ---------------- */
  function candReg() {
    app.innerHTML = '<div class="screen form-screen">' +
      backBtn() + '<div class="fs-icon">🚀</div><h2>' + esc(T('reg_title')) + '</h2>' +
      '<div class="form">' +
      '<label class="fld"><span>' + esc(T('full_name')) + '</span><input id="cn"></label>' +
      '<label class="fld"><span>' + esc(T('phone')) + '</span><input id="cp" inputmode="tel"></label>' +
      '<label class="fld"><span>' + esc(T('email')) + '</span><input id="ce" inputmode="email"></label>' +
      '<button class="btn btn-primary btn-lg" id="doReg">' + esc(T('ready')) + ' →</button>' +
      '<p class="muted sm">' + esc(T('ready_sub')) + '</p></div></div>';
    bindBack();
    document.getElementById('doReg').onclick = function () {
      var n = document.getElementById('cn').value.trim(),
          p = document.getElementById('cp').value.trim(),
          m = document.getElementById('ce').value.trim();
      if (!n || !p) return UI.toast(T('fill_all'), 'bad');
      var c = Store.addCandidate({ name: n, phone: p, email: m, stage: 1 });
      Game.start('c1', { type: 'candidate', id: c.id });
    };
  }

  /* ---------------- manager login ---------------- */
  function mgrLogin() {
    app.innerHTML = '<div class="screen form-screen">' +
      backBtn() + '<div class="fs-icon">🧠</div><h2>' + esc(T('mgr_login')) + '</h2>' +
      '<div class="form">' +
      '<label class="fld"><span>' + esc(T('pin')) + '</span><input id="pin" type="password" inputmode="numeric" autocomplete="off"></label>' +
      '<button class="btn btn-primary btn-lg" id="doPin">' + esc(T('login')) + '</button>' +
      '<p class="muted sm">' + esc(T('demo_pin')) + '</p></div></div>';
    bindBack();
    var run = function () {
      if (document.getElementById('pin').value !== Store.get().settings.pin) return UI.toast(T('wrong_pin'), 'bad');
      go('manager');
    };
    document.getElementById('doPin').onclick = run;
    document.getElementById('pin').onkeydown = function (ev) { if (ev.key === 'Enter') run(); };
  }

  function backBtn() { return '<button class="btn btn-ghost btn-xs back-b" id="bk">‹ ' + esc(T('back')) + '</button>'; }
  function bindBack() { var b = document.getElementById('bk'); if (b) b.onclick = function () { go('home'); }; }

  /* ---------------- boot ---------------- */
  function boot() {
    app = document.getElementById('app');
    var s = Store.load();
    UI.setLang(s.settings.lang || 'ar');
    document.getElementById('langBtn').onclick = function () {
      UI.setLang(UI.getLang() === 'ar' ? 'he' : 'ar');
      document.getElementById('langBtn').textContent = UI.getLang() === 'ar' ? 'עברית' : 'عربي';
      go(route === 'manager' ? 'manager' : route === 'splash' ? 'splash' : 'home');
    };
    document.getElementById('langBtn').textContent = UI.getLang() === 'ar' ? 'עברית' : 'عربي';
    document.getElementById('homeBtn').onclick = function () { go('splash'); };
    go('splash');
  }

  root.SDNA.App = { go: go, boot: boot };
  document.addEventListener('DOMContentLoaded', boot);
})(window);
