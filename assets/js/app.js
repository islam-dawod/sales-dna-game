/* ============================================================
   SALES DNA — APP SHELL / ROUTER  (V2)
   ============================================================ */
(function (root) {
  'use strict';
  var Store = root.SDNA.Store, UI = root.SDNA.UI, Art = root.SDNA.Art,
      Game = root.SDNA.Game, API = root.SDNA.API;
  function srv() { return API && API.isServer(); }
  var T = UI.T, esc = UI.esc;
  var app, route = 'splash';

  function go(r, data) {
    route = r;
    document.body.classList.toggle('mgr-mode', r === 'manager');
    if (r !== 'manager') document.body.classList.remove('in-game');
    ({
      splash: splash, home: home,
      empLogin: empLogin, empReady: empReady,
      candName: candName, candHello: candHello,
      mgrLogin: mgrLogin, manager: openManager
    }[r] || home)(data);
    window.scrollTo(0, 0);
  }

  /* ---------------- deferred modules ----------------
     The manager console is a quarter of all the JavaScript in the project and
     a candidate never touches it, so it is fetched only when someone actually
     opens the console. Nothing else changes: once loaded it behaves exactly as
     if it had been in the page from the start. */
  var loaded = {};
  function loadScript(file) {
    if (loaded[file]) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var ver = (document.body && document.body.dataset.ver) || '';
      var el = document.createElement('script');
      el.src = 'assets/js/' + file + (ver ? '?v=' + ver : '');
      el.async = false;
      el.onload = function () { loaded[file] = 1; resolve(); };
      el.onerror = function () { reject(new Error('load_failed: ' + file)); };
      document.head.appendChild(el);
    });
  }

  function openManager() {
    if (root.SDNA.Manager) return root.SDNA.Manager.open();
    app.innerHTML = '<div class="screen"><p class="muted">' + esc(T('loading')) + '</p></div>';
    loadScript('manager.js').then(function () {
      root.SDNA.Manager.open();
    })['catch'](function (err) {
      UI.toast('⚠ ' + err.message, 'bad');
      if (API && API.logError) API.logError('module_load', err.message);
      go('home');
    });
  }

  /* ---------------- splash ---------------- */
  function splash() {
    app.innerHTML = '<div class="screen splash">' +
      '<div class="splash-hero">' + Art.hero({ pose: 'point', expr: 'happy' }) + '</div>' +
      '<div class="splash-txt">' +
        '<div class="logo-xl"><span class="l1">SALES</span><span class="l2">DNA</span></div>' +
        '<div class="logo-tag">THE SALES CHALLENGE</div>' +
        '<div class="tagline">' + esc(T('game_sub')) + '</div>' +
        '<button class="btn btn-primary btn-xl pulse" id="startBtn">' + esc(T('start_challenge')) + '</button>' +
        '<div class="splash-note">GAME · ASSESSMENT · SALES ANALYTICS</div>' +
      '</div></div>';
    document.getElementById('startBtn').onclick = function () {
      Game.Sound.tap();
      document.body.classList.add('flash');
      setTimeout(function () { document.body.classList.remove('flash'); go('home'); }, 300);
    };
  }

  /* ---------------- role select ---------------- */
  function home() {
    app.innerHTML = '<div class="screen roles">' +
      '<h2 class="rl-title">' + esc(T('who_are_you')) + '</h2>' +
      '<div class="role-grid">' +
        roleCard('emp', Art.hero({ pose: 'idle', expr: 'idle' }), T('role_emp'), T('role_emp_s'), '#3b82f6') +
        roleCard('cand', Art.hero({ pose: 'cheer', expr: 'happy' }), T('role_cand'), T('role_cand_s'), '#8b5cf6') +
        roleCard('mgr', Art.coach(), T('role_mgr'), T('role_mgr_s'), '#10b981') +
      '</div></div>';
    UI.$$('[data-role]', app).forEach(function (c) {
      c.onclick = function () {
        Game.Sound.tap();
        var r = c.dataset.role;
        go(r === 'emp' ? 'empLogin' : r === 'cand' ? 'candName' : 'mgrLogin');
      };
    });
  }
  function roleCard(k, art, title, sub, color) {
    return '<button class="role-card" data-role="' + k + '" style="--c:' + color + '">' +
      '<div class="rc-art">' + art + '</div>' +
      '<div class="rc-txt"><b>' + esc(title) + '</b><small>' + esc(sub) + '</small></div>' +
      '<span class="rc-go">›</span></button>';
  }

  /* ---------------- employee ---------------- */
  function empLogin() {
    app.innerHTML = '<div class="screen form-screen">' + backBtn() +
      '<div class="fs-art small">' + Art.hero({ pose: 'idle', expr: 'idle' }) + '</div>' +
      '<h2>' + esc(T('emp_login')) + '</h2>' +
      '<div class="form">' +
      '<label class="fld"><span>' + esc(T('emp_code')) + '</span>' +
        '<input id="code" placeholder="ABCD-1234" autocomplete="off" spellcheck="false" ' +
        'style="text-transform:uppercase;letter-spacing:1px"></label>' +
      '<button class="btn btn-primary btn-lg" id="doLogin">' + esc(T('login')) + '</button>' +
      '<p class="muted sm">' + esc(T('emp_code_note')) + '</p></div></div>';
    bindBack();
    var tries = 0;
    var run = function () {
      var field = document.getElementById('code');
      var v = String(field.value || '').trim().toUpperCase();
      if (!v) return UI.toast(T('not_found'), 'bad');
      var reject = function (msg) {
        tries++;
        field.value = ''; field.classList.add('err');
        setTimeout(function () { field.classList.remove('err'); }, 900);
        if (tries >= 3) { field.disabled = true; setTimeout(function () { field.disabled = false; field.focus(); }, 1500); }
        UI.toast(msg || T('not_found'), 'bad');
      };
      if (srv()) {
        field.disabled = true;
        API.loginEmployee(v).then(function (res) {
          field.disabled = false;
          Store.hydrateOne('employee', res.employee, res.settings);
          go('empReady', res.employee);
        })['catch'](function (err) {
          field.disabled = false;
          reject(err.message === 'too_many_attempts' ? T('too_many') : T('not_found'));
        });
        return;
      }
      UI.hashPass(v, function (h) {
        var e = Store.findByCodeHash(h);
        if (!e) return reject();
        go('empReady', e);
      });
    };
    document.getElementById('doLogin').onclick = run;
    document.getElementById('code').onkeydown = function (ev) { if (ev.key === 'Enter') run(); };
  }

  function empReady(e) {
    var yrs = e.startDate ? (2026 - Number(String(e.startDate).slice(0, 4))) + 'y' : '—';
    app.innerHTML = '<div class="screen form-screen hello">' + backBtn() +
      '<div class="fs-art">' + Art.hero({ pose: 'cheer', expr: 'happy' }) + '</div>' +
      '<h1 class="hello-name">' + esc(T('hello_name').replace('{n}', e.name.split(' ')[0])) + '</h1>' +
      '<div class="mini-facts">' +
        '<div><small>' + esc(T('dept')) + '</small><b>' + esc(e.dept || '—') + '</b></div>' +
        '<div><small>' + esc(T('seniority')) + '</small><b>' + yrs + '</b></div>' +
        '<div><small>' + esc(T('target_pct')) + '</small><b>' + (e.targetPct == null ? '—' : e.targetPct + '%') + '</b></div>' +
      '</div>' +
      '<h3>' + esc(T('ready_challenge')) + '</h3>' +
      '<div class="pick-mode">' +
        '<button class="mode-card" id="startQuick" style="--c:#22d3ee">' +
          '<b>⚡ ' + esc(T('mode_quick')) + '</b><small>' + esc(T('mode_quick_note')) + '</small>' +
          (e.nc22 ? '<i class="done-tag">✓</i>' : '') + '</button>' +
        '<button class="mode-card" id="startFull" style="--c:#8b5cf6">' +
          '<b>🏙 ' + esc(T('mode_full')) + '</b><small>' + esc(T('mode_full_note')) + '</small>' +
          (e.assessment ? '<i class="done-tag">✓</i>' : '') + '</button>' +
      '</div></div>';
    bindBack();
    document.getElementById('startQuick').onclick = function () {
      Game.start('employee22', { type: 'employee', id: e.id, name: e.name });
    };
    document.getElementById('startFull').onclick = function () {
      Game.start('employee', { type: 'employee', id: e.id, name: e.name });
    };
  }

  /* ---------------- candidate: name first (required) ---------------- */
  function candName() {
    var s = Store.get().settings;
    app.innerHTML = '<div class="screen form-screen">' + backBtn() +
      '<div class="fs-art small">' + Art.hero({ pose: 'point', expr: 'idle' }) + '</div>' +
      '<h2>' + esc(T('before_start')) + '</h2>' +
      '<div class="form">' +
      '<label class="fld req"><span>' + esc(T('full_name')) + ' *</span><input id="cn" autocomplete="name"></label>' +
      '<label class="fld"><span>' + esc(T('phone')) + (s.requirePhone ? ' *' : '') + '</span><input id="cp" inputmode="tel"></label>' +
      '<label class="fld"><span>' + esc(T('email')) + (s.requireEmail ? ' *' : '') + '</span><input id="ce" inputmode="email"></label>' +
      '<button class="btn btn-primary btn-lg" id="doReg">' + esc(T('next')) + ' →</button></div></div>';
    bindBack();
    var run = function () {
      var n = document.getElementById('cn').value.trim(),
          p = document.getElementById('cp').value.trim(),
          m = document.getElementById('ce').value.trim();
      if (!n) { UI.$('#cn').classList.add('err'); return UI.toast(T('name_required'), 'bad'); }
      if ((s.requirePhone && !p) || (s.requireEmail && !m)) return UI.toast(T('fill_all'), 'bad');
      if (srv()) {
        var btn = document.getElementById('doReg');
        btn.disabled = true;
        API.registerCandidate({ name: n, phone: p, email: m }).then(function (res) {
          btn.disabled = false;
          Store.hydrateOne('candidate', res.candidate, res.settings);
          go('candHello', res.candidate);
        })['catch'](function (err) {
          btn.disabled = false;
          UI.toast(err.message === 'too_many_attempts' ? T('too_many') : T('fill_all'), 'bad');
        });
        return;
      }
      var c = Store.addCandidate({ name: n, phone: p, email: m, stage: 1 });
      go('candHello', c);
    };
    document.getElementById('doReg').onclick = run;
    document.getElementById('cn').onkeydown = function (ev) { if (ev.key === 'Enter') run(); };
  }

  function candHello(c) {
    var first = c.name.split(' ')[0];
    app.innerHTML = '<div class="screen form-screen hello">' +
      '<div class="fs-art">' + Art.hero({ pose: 'cheer', expr: 'happy' }) + '</div>' +
      '<h1 class="hello-name pop">' + esc(T('hello_name').replace('{n}', first)) + '</h1>' +
      '<h3>' + esc(T('ready_challenge')) + '</h3>' +
      '<p class="muted">' + esc(T('quick_note')) + '</p>' +
      '<button class="btn btn-primary btn-xl pulse" id="startGame">' + esc(T('start_challenge')) + '</button></div>';
    document.getElementById('startGame').onclick = function () {
      Game.start('candidate', { type: 'candidate', id: c.id, name: c.name });
    };
  }

  /* ---------------- manager ---------------- */
  function mgrLogin() {
    app.innerHTML = '<div class="screen form-screen">' + backBtn() +
      '<div class="fs-art small">' + Art.coach() + '</div>' +
      '<h2>' + esc(T('mgr_login')) + '</h2>' +
      '<div class="form">' +
      '<label class="fld"><span>' + esc(T('pin')) + '</span><input id="pin" type="password" autocomplete="current-password"></label>' +
      '<button class="btn btn-primary btn-lg" id="doPin">' + esc(T('login')) + '</button>' +
      '<p class="muted sm">' + esc(T('pin_hint')) + '</p></div></div>';
    bindBack();
    var tries = 0;
    var run = function () {
      var field = document.getElementById('pin');
      var val = field.value;
      if (!val) return UI.toast(T('wrong_pin'), 'bad');
      if (srv()) {
        field.disabled = true;
        API.loginManager(val).then(function () {
          return API.fetchState();
        }).then(function (data) {
          field.disabled = false; field.value = '';
          Store.hydrate(data);
          go('manager');
        })['catch'](function (err) {
          field.disabled = false; field.value = '';
          field.classList.add('err');
          setTimeout(function () { field.classList.remove('err'); }, 900);
          UI.toast(err.message === 'too_many_attempts' ? T('too_many') : T('wrong_pin'), 'bad');
        });
        return;
      }
      UI.hashPass(val, function (h) {
        var st = Store.get().settings;
        var ok = (h.sha && st.pinSha && h.sha === st.pinSha) ||
                 (h.fnv && st.pinFnv && h.fnv === st.pinFnv);
        if (!ok) {
          tries++;
          field.value = '';
          field.classList.add('err');
          setTimeout(function () { field.classList.remove('err'); }, 900);
          /* small delay after repeated attempts */
          if (tries >= 3) { field.disabled = true; setTimeout(function () { field.disabled = false; field.focus(); }, 1500); }
          return UI.toast(T('wrong_pin'), 'bad');
        }
        field.value = '';
        go('manager');
      });
    };
    document.getElementById('doPin').onclick = run;
    document.getElementById('pin').onkeydown = function (ev) { if (ev.key === 'Enter') run(); };
  }

  function backBtn() { return '<button class="btn btn-ghost btn-xs back-b" id="bk">‹ ' + esc(T('back')) + '</button>'; }
  function bindBack() { var b = document.getElementById('bk'); if (b) b.onclick = function () { go('home'); }; }

  /* The footer used to assert "demo build — data is stored locally in your
     browser". That stayed on the page after the backend went live and became
     simply untrue, so it now reports the mode the app is actually running in. */
  function showMode(server) {
    var tag = document.getElementById('modeTag');
    if (!tag) return;
    tag.textContent = '· ' + (server ? T('server_on') : T('server_off'));
    tag.className = server ? 'mode-on' : 'mode-off';
  }

  /* Anything that breaks in a candidate's browser is reported once, so a stuck
     assessment shows up in the console instead of being guessed at later. */
  function watchForErrors() {
    if (!API || !API.logError) return;
    root.addEventListener('error', function (ev) {
      var where = ev.filename ? ' @' + String(ev.filename).split('/').pop() + ':' + ev.lineno : '';
      API.logError('js_error', (ev.message || 'error') + where);
    });
    root.addEventListener('unhandledrejection', function (ev) {
      var r = ev.reason;
      API.logError('promise_rejection', (r && (r.message || r)) || 'unhandled rejection');
    });
  }

  /* ---------------- boot ---------------- */
  function boot() {
    watchForErrors();
    app = document.getElementById('app');
    if (API) {
      API.probe().then(function (mode) {
        if (mode === 'server') {
          Store.setServerMode(true);
          Store.loadEmpty();
          document.body.classList.add('server-mode');
        }
        showMode(mode === 'server');
        start();
      });
      return;
    }
    showMode(false);
    start();
  }

  function start() {
    var s = Store.load();
    Art.injectDefs();
    document.getElementById('world').innerHTML = Art.city();
    UI.setLang(s.settings.lang || 'ar');
    var lb = document.getElementById('langBtn');
    lb.textContent = UI.getLang() === 'ar' ? 'English' : 'عربي';
    lb.onclick = function () {
      UI.setLang(UI.getLang() === 'ar' ? 'en' : 'ar');
      lb.textContent = UI.getLang() === 'ar' ? 'English' : 'عربي';
      go(route === 'manager' ? 'manager' : route === 'splash' ? 'splash' : 'home');
    };
    document.getElementById('homeBtn').onclick = function () { go('splash'); };
    /* subtle parallax on the city */
    document.addEventListener('mousemove', function (ev) {
      var x = (ev.clientX / window.innerWidth - 0.5);
      var w = document.getElementById('world');
      if (w) w.style.transform = 'translate3d(' + (-x * 22).toFixed(1) + 'px,0,0) scale(1.06)';
    });
    go('splash');
  }

  root.SDNA.App = { go: go, boot: boot };
  document.addEventListener('DOMContentLoaded', boot);
})(window);
