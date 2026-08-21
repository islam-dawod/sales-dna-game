/* ============================================================
   SALES DNA — MANAGER CONSOLE
   ============================================================ */
(function (root) {
  'use strict';
  var Q = root.SDNA.Q, NC = root.SDNA.NC, Store = root.SDNA.Store, UI = root.SDNA.UI,
      Engine = root.SDNA.Engine, Art = root.SDNA.Art;
  var T = UI.T, esc = UI.esc, TK = Engine.TK;
  var app, tab = 'dash', view = null, compareSel = [];

  var TABS = [
    { k: 'dash', i: '📊', t: 'nav_dash' },
    { k: 'emp', i: '🧑‍💼', t: 'nav_emp' },
    { k: 'cand', i: '🚀', t: 'nav_cand' },
    { k: 'dna', i: '🧬', t: 'nav_dna' },
    { k: 'hitters', i: '🏆', t: 'nav_hitters' },
    { k: 'pattern', i: '🤖', t: 'nav_pattern' },
    { k: 'focus', i: '🧠', t: 'nav_focus' },
    { k: 'predict', i: '🎯', t: 'nav_predict' },
    { k: 'compare', i: '⚖️', t: 'nav_compare' },
    { k: 'questions', i: '❓', t: 'nav_questions' },
    { k: 'settings', i: '⚙️', t: 'nav_settings' }
  ];

  function LL(ar, en) { return UI.getLang() === 'en' ? en : ar; }
  var API = root.SDNA.API;
  function srv() { return Store.isServerMode() && API; }

  /* run a server call, then refresh the console from the server */
  function push(promise, okMsg) {
    if (!promise) return;
    promise.then(function () { return API.fetchState(); })
      .then(function (data) {
        Store.hydrate(data);
        if (okMsg) UI.toast(okMsg);
        body();
      })['catch'](function (err) {
        UI.toast('⚠ ' + err.message, 'bad');
        body();
      });
  }
  /* ---------- time pressure ----------
     Reads the clock report stored with an assessment. Completeness, speed and
     the score stay three separate numbers: nothing here is folded into MATCH,
     and slower is not treated as weaker (see T('speed_note')). */
  function timingCard(payload, title) {
    var tm = Engine.timingStats(payload);
    if (!tm) return '';
    var secs = function (ms) { return ms == null ? '—' : (ms / 1000).toFixed(1) + 's'; };
    var band = Engine.completenessBand(tm.completeness);
    var bandColor = band === 'high' ? '#10b981' : band === 'medium' ? '#f59e0b' : '#ef4444';

    var rows = tm.levels.map(function (b) {
      return '<tr><td><b>' + (b.n ? 'L' + b.n + ' · ' : '') + esc(b.code || b.key) + '</b></td>' +
        '<td' + (b.answered < b.total ? ' class="tm-out"' : '') + '>' + b.answered + '/' + b.total + '</td>' +
        '<td dir="ltr">' + esc(Engine.mmss(b.seconds)) + (b.limit ? ' / ' + esc(Engine.mmss(b.limit)) : '') + '</td>' +
        '<td>' + (b.timedOut ? '<span class="tm-out">⏱ ' + esc(T('times_up')) + '</span>' : '✓') + '</td></tr>';
    }).join('');

    return '<div class="card"><h3>⏱ ' + esc(title || T('timing_title')) + '</h3>' +
      '<div class="kpis">' +
        kpi('📋', tm.completeness == null ? '—' : tm.completeness + '%',
            T('completeness') + ' (' + tm.answered + '/' + tm.asked + ')', bandColor) +
        kpi('🚫', tm.unanswered, T('unanswered'), tm.unanswered ? '#ef4444' : '#8ea0c4') +
        kpi('⚡', secs(tm.avgMs), T('avg_response'), '#22d3ee') +
        kpi('⏳', tm.totalSeconds == null ? '—' : Engine.mmss(tm.totalSeconds), T('total_q_time'), '#3b82f6') +
        (tm.timed ? kpi('⏱', tm.timedOutLevels, T('timed_out_lv'), tm.timedOutLevels ? '#f59e0b' : '#8ea0c4') : '') +
      '</div>' +
      (tm.avgMs != null
        ? '<p class="muted sm" dir="ltr">' + esc(T('fastest')) + ': ' + secs(tm.fastestMs) +
          ' · ' + esc(T('slowest')) + ': ' + secs(tm.slowestMs) + '</p>' : '') +
      (band === 'low' ? '<div class="alert warn-box">⚠ ' + esc(T('completeness_low')) + '</div>' : '') +
      (rows ? '<h3 style="margin-top:14px">' + esc(T('per_level')) + '</h3>' +
        '<div style="overflow-x:auto"><table class="tm-tbl"><thead><tr><th></th><th>' + esc(T('answered_col')) +
        '</th><th>' + esc(T('time_col')) + '</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>'
        : '<p class="muted sm">' + esc(T('not_timed')) + '</p>') +
      '<p class="muted sm">' + esc(T('speed_note')) + '</p></div>';
  }

  function st() { return Store.get(); }
  function empDNA(e) { return e.assessment ? Engine.dna(e.assessment.answers) : null; }
  function candDNA(c) { var a = Engine.candAnswers(c); return a.length ? Engine.dna(a) : null; }
  function lname(t) { return UI.getLang() === 'en' ? Q.TRAITS[t].en : Q.TRAITS[t].ar; }
  function gname(g) {
    return T(g === 'strong' ? 'group_strong' : g === 'medium' ? 'group_medium'
           : g === 'low' ? 'group_low' : 'group_unclassified');
  }
  function gcolor(g) {
    return g === 'strong' ? '#10b981' : g === 'medium' ? '#3b82f6'
         : g === 'low' ? '#ef4444' : '#8ea0c4';
  }
  function num(v, suffix) { return v == null ? '<span class="muted">—</span>' : v + (suffix || ''); }

  function open() { app = document.getElementById('app'); tab = 'dash'; view = null; render(); }

  function render() {
    app.innerHTML =
      '<div class="mgr">' +
        '<aside class="mgr-nav">' +
          '<div class="mgr-logo"><b>SALES<span>DNA</span></b><small>INTELLIGENCE</small>' +
            '<span class="mode-tag ' + (srv() ? 'on' : 'off') + '">' +
            (srv() ? '● ' + esc(T('server_on')) : '○ ' + esc(T('server_off'))) + '</span></div>' +
          TABS.map(function (x) {
            return '<button class="mnav ' + (tab === x.k ? 'on' : '') + '" data-tab="' + x.k + '">' +
              '<span>' + x.i + '</span>' + esc(T(x.t)) + '</button>';
          }).join('') +
          '<button class="mnav out" data-tab="__exit"><span>⏏</span>' + esc(T('exit')) + '</button>' +
        '</aside>' +
        '<main class="mgr-main" id="mgrMain"></main>' +
      '</div>';
    UI.$$('.mnav', app).forEach(function (b) {
      b.onclick = function () {
        if (b.dataset.tab === '__exit') return root.SDNA.App.go('home');
        tab = b.dataset.tab; view = null; render();
      };
    });
    body();
  }

  function body() {
    var m = document.getElementById('mgrMain');
    if (view && view.type === 'emp') return m.innerHTML = empProfile(view.id), bindEmp(m);
    if (view && view.type === 'cand') return m.innerHTML = candProfile(view.id), bindCand(m);
    var fns = { dash: dash, emp: employees, cand: candidates, dna: companyDNA, pattern: patterns,
                hitters: hittersTab, focus: focusTab, predict: predictTab, questions: questions,
                compare: compare, settings: settings };
    m.innerHTML = fns[tab]();
    var binds = { emp: bindEmployees, cand: bindCandidates, pattern: bindPatterns, compare: bindCompare,
                  settings: bindSettings, dash: bindDash, focus: bindFocus, predict: bindPredict,
                  hitters: bindHitters };
    if (binds[tab]) binds[tab](m);
  }

  function head(title, sub, extra) {
    return '<div class="mgr-head"><div><h1>' + esc(title) + '</h1>' +
      (sub ? '<p class="muted">' + esc(sub) + '</p>' : '') + '</div>' + (extra || '') + '</div>';
  }

  /* ================= DASHBOARD ================= */
  function dash() {
    var s = st();
    var tested = s.employees.filter(function (e) { return e.assessment; }).length;
    var g = { strong: 0, medium: 0, low: 0, none: 0 };
    s.employees.forEach(function (e) { g[e.group || 'none']++; });
    var cands = s.candidates;
    var high = cands.filter(function (c) {
      var r = c.nc ? Engine.candidateReport(c, s) : null; return r && r.band === 'high';
    }).length;
    var gs = Engine.groupStats(s.employees);
    var pred = Engine.predictions(s);

    var funnel = [
      { l: UI.getLang() === 'en' ? 'Candidates' : 'مرشحون', v: cands.length },
      { l: UI.getLang() === 'en' ? 'Completed the 25 questions' : 'أكملوا 25 سؤالاً', v: cands.filter(function (c) { return c.nc; }).length },
      { l: UI.getLang() === 'en' ? 'Completed the focus challenge' : 'أكملوا تحدي التركيز', v: cands.filter(function (c) { return c.focus; }).length },
      { l: UI.getLang() === 'en' ? 'Medium match or better' : 'تطابق متوسط فأعلى', v: cands.filter(function (c) { var r = c.nc ? Engine.candidateReport(c, s) : null; return r && r.band !== 'low'; }).length },
      { l: UI.getLang() === 'en' ? 'Interview' : 'مقابلة', v: cands.filter(function (c) { return c.stage >= 5; }).length },
      { l: UI.getLang() === 'en' ? 'Hired' : 'تم توظيفهم', v: cands.filter(function (c) { return c.decision === 'hired'; }).length }
    ];
    var maxF = funnel[0].v || 1;

    return head('SALES INTELLIGENCE', UI.getLang() === 'en' ? 'An overview of the team and the candidates' : 'صورة عامة عن الفريق والمرشحين',
      srv() ? '<button class="btn" id="refreshBtn">⟳ ' + esc(LL('تحديث من السيرفر', 'Refresh from the server')) + '</button>' : '') +
      '<div class="kpis">' +
        kpi('👥', tested + '/' + s.employees.length, T('kpi_tested'), '#3b82f6') +
        kpi('🔥', g.strong, T('kpi_strong'), '#10b981') +
        kpi('⚡', g.medium, T('kpi_medium'), '#3b82f6') +
        kpi('⬇', g.low, T('kpi_low'), '#ef4444') +
        kpi('❔', g.none, T('group_unclassified'), '#8ea0c4') +
        kpi('🚀', cands.length, T('kpi_cand'), '#8b5cf6') +
        kpi('✅', high, T('kpi_high_match'), '#22d3ee') +
      '</div>' +
      '<div class="grid2">' +
        '<div class="card"><h3>' + esc(T('funnel')) + '</h3><div class="funnel">' +
          funnel.map(function (f, i) {
            var w = Math.max(12, Math.round(100 * f.v / maxF));
            return '<div class="fn-row"><span class="fn-l">' + esc(f.l) + '</span>' +
              '<div class="fn-bar" style="width:' + w + '%;background:linear-gradient(90deg,#8b5cf6,#3b82f6);opacity:' + (1 - i * 0.11) + '"><b>' + f.v + '</b></div></div>';
          }).join('') +
        '</div></div>' +
        '<div class="card"><h3>' + esc(T('company_dna')) + '</h3>' +
          UI.radar([
            { name: T('group_strong'), color: '#10b981', traits: gs.strong.traits },
            { name: T('group_medium'), color: '#3b82f6', traits: gs.medium.traits },
            { name: T('group_low'), color: '#ef4444', traits: gs.low.traits }
          ], { size: 340 }) +
        '</div>' +
      '</div>' +
      '<div class="grid2">' +
        '<div class="card"><h3>' + esc(T('top_traits')) + '</h3>' + topTraitsBlock() + '</div>' +
        '<div class="card"><h3>' + esc(T('pred_acc')) + '</h3>' +
          (pred.rows.length ?
            '<div class="big-num">' + pred.accuracy + '%</div><table class="tbl"><tbody>' +
            pred.rows.map(function (r) {
              return '<tr><td>' + esc(r.name) + '</td><td>' + r.match + '%</td><td>' + r.day + 'd</td><td>' + r.actual + '%</td><td>' + (r.ok ? '✅' : '❌') + '</td></tr>';
            }).join('') + '</tbody></table>'
            : '<p class="muted">' + esc(UI.getLang() === 'en' ? 'No post-hire follow-up data yet. Add a follow-up from the card of a hired candidate.' : 'لا توجد بيانات متابعة بعد التوظيف. أضف متابعة من بطاقة مرشّح تم توظيفه.') + '</p>') +
        '</div>' +
      '</div>' +
      healthCard();
  }
  function bindDash() {
    fillHealth();
    var r = document.getElementById('refreshBtn');
    if (r) r.onclick = function () { push(Promise.resolve(), '⟳'); };
  }

  function kpi(icon, val, label, color) {
    return '<div class="kpi" style="--c:' + color + '"><div class="kpi-i">' + icon + '</div>' +
      '<div><b>' + esc(String(val)) + '</b><small>' + esc(label) + '</small></div></div>';
  }

  function topTraitsBlock() {
    var lw = Engine.learnWeights(st().employees);
    var order = TK.slice().sort(function (a, b) { return lw.separation[b] - lw.separation[a]; });
    return UI.bars(order.map(function (t) {
      return { label: lname(t), icon: Q.TRAITS[t].icon, value: Math.min(100, Math.round(lw.separation[t] - 2)), color: Q.TRAITS[t].color };
    }), { suffix: '' }) + '<p class="muted sm">' + esc(T('separation')) + '</p>';
  }

  /* ================= EMPLOYEES ================= */
  var empBranch = null;

  function employees() {
    var s = st();
    var branches = [];
    s.employees.forEach(function (e) { if (e.branch && branches.indexOf(e.branch) < 0) branches.push(e.branch); });
    var list = s.employees.filter(function (e) { return !empBranch || e.branch === empBranch; });

    var rows = list.map(function (e) {
      var d = empDNA(e);
      var cc = Engine.classCheck(e);
      return '<tr data-emp="' + e.id + '">' +
        '<td><b>' + esc(e.name) + '</b></td>' +
        '<td>' + (e.branch ? '<span class="chip">' + esc(e.branch) + '</span>' : '<span class="muted">—</span>') + '</td>' +
        '<td><span class="pill" style="--c:' + gcolor(e.group) + '">' + esc(gname(e.group)) + '</span>' +
          (cc.conflict ? ' <span class="warn" title="' + esc(T('review_class')) + '">⚠</span>' : '') + '</td>' +
        '<td>' + num(e.targetPct, '%') + '</td>' +
        '<td>' + num(e.attendance, '%') + '</td>' +
        '<td>' + num(e.lateDays) + '</td>' +
        '<td>' + (e.managerScore == null ? '<span class="muted">—</span>' : e.managerScore + '/10') + '</td>' +
        '<td>' + (d ? '<b style="color:' + UI.tone(d.overall) + '">' + d.overall + '</b>'
                    : (e.nc22 ? '<span class="chip">22 ✓</span>' : '<span class="muted">' + esc(T('no_assessment')) + '</span>')) + '</td>' +
        /* hasCode comes from the server, which never sends the hash itself;
           codeSha/codeFnv are the local-mode fields */
        '<td>' + (e.hasCode || e.codeSha || e.codeFnv
          ? '<span class="pill" style="--c:#10b981">🔑 ' + esc(T('code_set')) + '</span>'
          : '<span class="pill" style="--c:#ef4444">' + esc(T('code_none')) + '</span>') + '</td>' +
        '<td><button class="btn btn-xs" data-code="' + e.id + '">🔑</button> ' +
            '<button class="btn btn-xs" data-open="' + e.id + '">' + esc(T('view')) + '</button></td></tr>';
    }).join('');

    return head(T('nav_emp'),
      s.employees.length + ' ' + (UI.getLang() === 'en' ? 'employees' : 'موظفاً') + ' · ' +
      (UI.getLang() === 'en' ? 'Enter the real sales numbers, then classify' : 'أدخل أرقام المبيعات الحقيقية ثم صنّف'),
      '<button class="btn btn-primary" id="addEmp">+ ' + esc(T('add_emp')) + '</button>') +
      '<div class="card"><div class="chips pick">' +
        '<button class="chip pickable ' + (empBranch ? '' : 'on') + '" data-br="">' +
          (UI.getLang() === 'en' ? 'All' : 'الكل') + ' <small>' + s.employees.length + '</small></button>' +
        branches.map(function (b) {
          var n = s.employees.filter(function (e) { return e.branch === b; }).length;
          return '<button class="chip pickable ' + (empBranch === b ? 'on' : '') + '" data-br="' + esc(b) + '">' +
            esc(b) + ' <small>' + n + '</small></button>';
        }).join('') + '</div></div>' +
      '<div class="card"><table class="tbl"><thead><tr>' +
      ['name', 'branch_col', 'perf', 'target_pct', 'attendance', 'late', 'mgr_score', 'dna_score', 'code_col', ''].map(function (k) {
        return '<th>' + (k ? esc(T(k)) : '') + '</th>';
      }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  function bindEmployees(m) {
    UI.$$('[data-open]', m).forEach(function (b) {
      b.onclick = function () { view = { type: 'emp', id: b.dataset.open }; body(); };
    });
    UI.$$('[data-br]', m).forEach(function (b) {
      b.onclick = function () { empBranch = b.dataset.br || null; body(); };
    });
    UI.$$('[data-code]', m).forEach(function (b) {
      b.onclick = function () {
        var e = st().employees.filter(function (x) { return x.id === b.dataset.code; })[0];
        if (e) codeModal(e);
      };
    });
    var add = document.getElementById('addEmp');
    if (add) add.onclick = function () { empForm(null); };
  }

  /* ---- private login code: generated here, shown once, stored hashed ---- */
  function codeModal(e) {
    var code = Store.randomCode();
    var node = UI.el('<div class="modal-bg"><div class="modal">' +
      '<h3>🔑 ' + esc(T('set_code')) + ' — ' + esc(e.name) + '</h3>' +
      '<div class="form">' +
        '<label class="fld"><span>' + esc(T('code_col')) + '</span>' +
        '<input id="cdVal" value="' + esc(code) + '" style="text-transform:uppercase;letter-spacing:2px;font-family:Orbitron,monospace"></label>' +
        '<p class="muted sm">🔒 ' + esc(T('code_once')) + '</p>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-primary" id="cdSave">' + esc(T('save')) + '</button>' +
        '<button class="btn" id="cdGen">🎲 ' + esc(T('regenerate')) + '</button>' +
        '<button class="btn" id="cdCopy">⧉ ' + esc(T('copy')) + '</button>' +
        '<button class="btn btn-ghost" id="cdCancel">' + esc(T('cancel')) + '</button>' +
      '</div></div></div>');
    document.body.appendChild(node);
    var field = node.querySelector('#cdVal');
    node.querySelector('#cdCancel').onclick = function () { node.remove(); };
    node.querySelector('#cdGen').onclick = function () { field.value = Store.randomCode(); };
    node.querySelector('#cdCopy').onclick = function () {
      field.select();
      if (root.navigator.clipboard) root.navigator.clipboard.writeText(field.value);
      else document.execCommand('copy');
      UI.toast(T('copied'));
    };
    node.querySelector('#cdSave').onclick = function () {
      var v = String(field.value || '').trim().toUpperCase();
      if (v.length < 6) return UI.toast(T('pin_short'), 'bad');
      if (srv()) {
        node.remove();
        return push(API.setCode(e.id, v), '🔑 ' + T('code_saved') + ' — ' + v);
      }
      Store.setEmployeeCode(e.id, v, function () {
        node.remove();
        UI.toast('🔑 ' + T('code_saved') + ' — ' + v);
        body();
      });
    };
  }

  function empForm(e) {
    var isNew = !e;
    e = e || { name: '', branch: '', dept: '', targetPct: null, attendance: null, lateDays: null,
               managerScore: null, monthsAbove: null, monthsTotal: 12, group: null, startDate: '' };
    var h = '<div class="modal-bg"><div class="modal"><h3>' + esc(isNew ? T('add_emp') : e.name) + '</h3>' +
      '<div class="form">' +
      f('name', T('full_name'), e.name) + f('branch', T('branch_col'), e.branch || '') +
      f('dept', T('dept'), e.dept) + f('startDate', UI.getLang() === 'en' ? 'Start date' : 'تاريخ البدء', e.startDate, 'date') +
      f('targetPct', T('target_pct'), e.targetPct, 'number') +
      f('monthsAbove', UI.getLang() === 'en' ? 'Months above target' : 'أشهر فوق الهدف', e.monthsAbove, 'number') +
      f('attendance', T('attendance'), e.attendance, 'number') +
      f('lateDays', T('late'), e.lateDays, 'number') +
      f('managerScore', T('mgr_score'), e.managerScore, 'number') +
      '<label class="fld"><span>' + esc(T('perf')) + '</span><select data-k="group">' +
        ['', 'strong', 'medium', 'low'].map(function (g) {
          return '<option value="' + g + '"' + ((e.group || '') === g ? ' selected' : '') + '>' + esc(gname(g || null)) + '</option>';
        }).join('') + '</select></label>' +
      '</div><div class="modal-actions">' +
      '<button class="btn btn-primary" id="mSave">' + esc(T('save')) + '</button>' +
      (isNew ? '' : '<button class="btn btn-danger" id="mDel">' + esc(T('delete_')) + '</button>') +
      '<button class="btn btn-ghost" id="mCancel">' + esc(T('cancel')) + '</button></div></div></div>';
    var node = UI.el(h);
    document.body.appendChild(node);
    node.querySelector('#mCancel').onclick = function () { node.remove(); };
    var del = node.querySelector('#mDel');
    if (del) del.onclick = function () {
      if (srv()) { node.remove(); view = null; return push(API.deleteEmployee(e.id), '🗑'); }
      Store.removeEmployee(e.id); node.remove(); view = null; body();
    };
    node.querySelector('#mSave').onclick = function () {
      var patch = {};
      UI.$$('[data-k]', node).forEach(function (i) {
        var v = i.value;
        if (i.type === 'number') patch[i.dataset.k] = v === '' ? null : Number(v);
        else if (i.dataset.k === 'group') patch[i.dataset.k] = v || null;
        else patch[i.dataset.k] = v;
      });
      if (!patch.name) return UI.toast(T('fill_all'), 'bad');
      if (srv()) {
        patch.id = isNew ? '' : e.id;
        patch.monthsTotal = patch.monthsTotal || 12;
        node.remove();
        return push(API.saveEmployee(patch), '✔');
      }
      if (isNew) { patch.monthsTotal = 12; Store.addEmployee(patch); }
      else Store.updateEmployee(e.id, patch);
      node.remove(); body();
    };
    function f(k, lbl, val, type) {
      return '<label class="fld"><span>' + esc(lbl) + '</span><input data-k="' + k + '" type="' + (type || 'text') + '" value="' + esc(val) + '"></label>';
    }
  }

  function empProfile(id) {
    var s = st(), e = s.employees.filter(function (x) { return x.id === id; })[0];
    if (!e) return '<p>—</p>';
    var d = empDNA(e), gs = Engine.groupStats(s.employees), bc = Engine.benchmarkCheck(e);
    var w = Engine.activeWeights(s);
    var out = '<button class="btn btn-ghost btn-xs" id="back">‹ ' + esc(T('back')) + '</button>' +
      head(e.name, [e.branch, e.dept, e.startDate].filter(Boolean).join(' · ') || '—',
        '<div><button class="btn" id="editEmp">✎</button> <button class="btn" onclick="window.print()">' + esc(T('print')) + '</button></div>');
    out += perfBlock(e);
    out += '<div class="grid2">';
    out += '<div class="card"><h3>PERFORMANCE</h3>' +
      '<div class="kpis sm">' + kpi('🎯', e.targetPct == null ? '—' : e.targetPct + '%', T('target_pct'), '#3b82f6') +
      kpi('📅', e.monthsAbove == null ? '—' : e.monthsAbove + '/' + e.monthsTotal, UI.getLang() === 'en' ? 'Months above target' : 'أشهر فوق الهدف', '#10b981') +
      kpi('🕘', e.attendance == null ? '—' : e.attendance + '%', T('attendance'), '#22d3ee') +
      kpi('⏰', e.lateDays == null ? '—' : e.lateDays, T('late'), '#f59e0b') +
      kpi('⭐', e.managerScore == null ? '—' : e.managerScore + '/10', T('mgr_score'), '#8b5cf6') + '</div>' +
      ((e.targetPct == null && !(e.history || []).length) ? '<div class="alert warn-box">' + esc(T('no_emp_data')) + '</div>' : '') +
      '</div>';

    if (d) {
      var ch = Engine.character(d);
      out += '<div class="card"><h3>EMPLOYEE SALES DNA</h3>' +
        '<div class="dna-top">' + UI.ring(d.overall, 'DNA') +
        '<div class="char-card mini"><div class="cc-emoji">' + ch.emoji + '</div><div><small>SALES CHARACTER</small><b>' + esc(ch.key) + '</b><span>' + esc(ch.ar) + '</span></div></div></div>' +
        UI.bars(TK.map(function (t) { return { label: lname(t), icon: Q.TRAITS[t].icon, value: d.traits[t], color: Q.TRAITS[t].color }; })) +
        '</div>';
      out += '</div><div class="grid2">';
      out += '<div class="card"><h3>' + esc(T('vs_strong')) + '</h3>' +
        UI.radar([{ name: e.name, color: '#8b5cf6', traits: d.traits },
                  { name: T('group_strong'), color: '#10b981', traits: gs.strong.traits }], { size: 340 }) + '</div>';
      out += '<div class="card"><h3>' + esc(T('similar_emp')) + '</h3>' +
        Engine.similarEmployees(d, s.employees.filter(function (x) { return x.id !== e.id; }), w, 5).map(function (r) {
          return '<div class="sim-row"><span class="pill" style="--c:' + gcolor(r.emp.group) + '">' + esc(gname(r.emp.group)) + '</span>' +
            '<b>' + esc(r.emp.name) + '</b><span class="sim-v">' + r.sim + '%</span></div>';
        }).join('') + '</div>';
    } else {
      out += '<div class="card"><h3>DNA</h3><p class="muted">' + esc(T('no_assessment')) + '</p>' +
        '<p class="muted sm">' + esc(UI.getLang() === 'en' ? 'The employee can enter the challenge with their own code from the main screen.' : 'يستطيع الموظف الدخول إلى التحدي باستخدام كوده من الشاشة الرئيسية.') + '</p></div>';
    }
    out += '</div>';
    out += timingCard(e.assessment || e.nc22);
    out += devCard(e);
    out += dataQualityCard(e);
    out += '<div class="card"><h3>🧠 ' + esc(T('focus_title')) + '</h3>' +
      (e.focus ? '<div class="focus-head">' + UI.ring(e.focus.focus, 'FOCUS', 110) +
        '<div class="focus-subs">' + ['visual', 'speed', 'accuracy', 'recall'].map(function (k) {
          var SUB = root.SDNA.Focus.SUB;
          return '<div class="fsub"><small>' + esc(UI.getLang() === 'en' ? SUB[k].en : SUB[k].ar) + '</small>' +
            '<b style="color:' + UI.tone(e.focus.sub[k]) + '">' + e.focus.sub[k] + '</b></div>';
        }).join('') + '</div></div>'
        : '<p class="muted">' + esc(T('focus_nodata')) + '</p>') +
      '<button class="btn" data-focus-emp="' + e.id + '">▶ ' + esc(T('play_focus')) + '</button></div>';
    out += '<div class="card"><h3>⚡ ' + esc(T('mode_quick')) + '</h3>' +
      (e.nc22 ? '<p class="ok-line">✅ ' + esc(LL('أجاب على نفس مقياس المرشحين — إجاباته تُستخدم في تحليل جودة الأسئلة.',
                  'Answered the same scale as the candidates — those answers feed the question-quality analysis.')) + '</p>' +
                '<p class="muted sm">' + e.nc22.answers.length + ' ' + esc(T('q_of')) + ' · ' + esc(e.nc22.completedAt || '') + '</p>'
              : '<p class="muted">' + esc(LL('لم يجب بعد على المقياس المشترك (22 موقفاً) — بدونه لا يدخل في مقارنة الأسئلة.',
                  'Has not answered the shared scale yet (22 scenarios) — without it they are not part of the question comparison.')) + '</p>') +
      '<p class="muted sm">' + esc(LL('يدخل الموظف من الشاشة الرئيسية بكوده ويختار «التحدي المقارن».',
        'The employee signs in from the main screen with their code and picks the comparison challenge.')) + '</p></div>';
    return out;
  }

  /* ---- 2. ACTUAL PERFORMANCE: history, consistency, data classification ---- */
  function perfBlock(e) {
    var cc = Engine.classCheck(e), ps = cc.perf;
    var bars = ps.history.length ? '<div class="hist">' + ps.history.map(function (h) {
      var pct = Math.max(6, Math.min(160, h.pct));
      var col = h.pct >= 100 ? '#10b981' : h.pct >= 85 ? '#f59e0b' : '#ef4444';
      return '<div class="hist-col" title="' + h.m + ' · ' + h.pct + '%">' +
        '<i style="height:' + (pct / 160 * 100) + '%;background:' + col + '"></i>' +
        '<small>' + h.m.slice(5) + '</small></div>';
    }).join('') + '<div class="hist-line" style="bottom:' + (100 / 160 * 100) + '%"></div></div>' : '';
    var rank = { strong: 3, medium: 2, low: 1 };
    return '<div class="card"><button class="btn btn-xs" id="monthlyBtn" style="float:inline-end">➕ ' + esc(T('enter_monthly')) + '</button><h3>📈 ' + esc(T('perf_history')) + ' <small class="muted">(' + ps.n + ' ' +
        esc(LL('شهراً', 'months')) + ')</small></h3>' + bars +
      '<div class="kpis sm">' +
        kpi('📊', (ps.avg == null ? '—' : ps.avg + '%'), LL('متوسط تحقيق الهدف', 'Average target attainment'), '#3b82f6') +
        kpi('✔', ps.above == null ? '—' : ps.above + '/' + ps.n, LL('أشهر فوق الهدف', 'Months above target'), '#10b981') +
        kpi('📐', ps.consistency == null ? '—' : ps.consistency, T('perf_consist'), '#8b5cf6') +
        kpi('📈', ps.trend == null ? '—' : (ps.trend > 0 ? '+' : '') + ps.trend, LL('اتجاه آخر 6 أشهر', 'Trend over the last 6 months'), '#22d3ee') +
        kpi('🎚', ps.sd == null ? '—' : '±' + ps.sd, LL('تشتّت', 'Spread'), '#f59e0b') +
      '</div>' +
      '<div class="split"><div><small class="muted">' + esc(T('manager_says')) + '</small><br>' +
        '<span class="pill" style="--c:' + gcolor(e.group) + '">' + esc(gname(e.group)) + '</span></div>' +
        '<div><small class="muted">' + esc(T('data_class')) + '</small><br>' +
        '<span class="pill" style="--c:' + gcolor(cc.data) + '">' + esc(gname(cc.data)) + '</span> ' +
        '<small class="muted">' + cc.score + '/100</small></div></div>' +
      (cc.conflict ? '<div class="alert warn-box">⚠ ' + esc(T('review_class')) + ' — ' +
        esc(cc.direction === 'manager_higher'
          ? LL('تصنيف المدير أعلى مما تدعمه البيانات', 'The manager classification is higher than the data supports')
          : LL('البيانات تشير إلى أداء أفضل من تصنيف المدير', 'The data points to better performance than the manager classification')) +
        '. ' + esc(LL('القرار يبقى للمدير.', 'The decision stays with the manager.')) + '</div>' : '') +
      '<p class="muted sm">' + esc(LL('الأداء الفعلي والـ DNA رقمان مختلفان — لا يُدمجان في مؤشر واحد.',
        'Actual performance and DNA are two different numbers — they are never merged into one measure.')) + '</p></div>';
  }

  function bindEmp(m) {
    var b = document.getElementById('back'); if (b) b.onclick = function () { view = null; body(); };
    var ed = document.getElementById('editEmp');
    if (ed) ed.onclick = function () { empForm(st().employees.filter(function (x) { return x.id === view.id; })[0]); };
    var mb = document.getElementById('monthlyBtn');
    if (mb) mb.onclick = function () {
      monthlyModal(st().employees.filter(function (x) { return x.id === view.id; })[0]);
    };
    UI.$$('[data-focus-emp]', m).forEach(function (btn) {
      btn.onclick = function () {
        var e = st().employees.filter(function (x) { return x.id === btn.dataset.focusEmp; })[0];
        root.SDNA.Game.focusOnly({ id: e.id, type: 'employee', name: e.name }, 'employee', function () {
          root.SDNA.App.go('manager');
        });
      };
    });
  }

  /* ================= CANDIDATES (25-question model) ================= */
  function report(c) { return c.nc ? Engine.candidateReport(c, st()) : null; }

  function candidates() {
    var s = st();
    var rows = s.candidates.map(function (c) {
      var rep = report(c);
      var sc = rep && rep.score;
      return '<tr>' +
        '<td><b>' + esc(c.name) + '</b><small class="muted"> · ' + esc(c.phone || '—') + '</small></td>' +
        '<td class="muted">' + esc(c.createdAt) + '</td>' +
        '<td>' + stageTag(c) + '</td>' +
        '<td>' + (sc ? bandNum(sc.match, rep.band) : '—') + '</td>' +
        '<td>' + (function () {
          var v = rep ? (rep.sims.hitters != null ? rep.sims.hitters : rep.sims.strong) : null;
          return v == null ? '—' : '<b style="color:' + UI.tone(v) + '">' + v + '%</b>';
        })() + '</td>' +
        '<td>' + (sc && sc.consistency != null ? '<span style="color:' + UI.tone(sc.consistency) + '">' + sc.consistency + '%</span>' : '—') + '</td>' +
        '<td>' + (c.focus ? '<span style="color:' + UI.tone(c.focus.focus) + '">' + c.focus.focus + '</span>' : '—') + '</td>' +
        '<td>' + (sc && sc.flags.length ? '<span class="flag-n">🚩 ' + sc.flags.length + '</span>' : '—') + '</td>' +
        '<td>' + (rep ? statusChip(rep.band) : '—') + '</td>' +
        '<td><button class="btn btn-xs" data-open="' + c.id + '">' + esc(T('view')) + '</button></td></tr>';
    }).join('');
    return head(T('nav_cand'), NC.count + ' ' + esc(T('q_of')) + ' · ' + T('open_anyway')) +
      '<div class="card"><table class="tbl"><thead><tr>' +
      ['name', 'date', 'stage', 'full_match', 'sim_strong', 'consistency_idx', 'focus_score', 'flags', 'status', ''].map(function (k) {
        return '<th>' + (k ? esc(T(k)) : '') + '</th>';
      }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table>' +
      (rows ? '' : '<p class="muted" style="padding:14px 4px">' + esc(LL(
        'لا يوجد مرشّحون بعد. أي شخص يفتح الرابط ويختار «أنا مرشّح جديد» ويكمل التحدي سيظهر هنا تلقائياً مع تقريره الكامل.',
        'No candidates yet. Anyone who opens the link, picks "I am a new candidate" and finishes the challenge shows up here automatically with their full report.')) + '</p>') +
      '</div>';
  }

  function stageTag(c) {
    var lang = UI.getLang();
    var txt = c.decision === 'hired' ? (lang === 'en' ? 'Hired' : 'تم التوظيف')
            : c.decision === 'interview' ? (lang === 'en' ? 'Interview' : 'مقابلة')
            : c.decision === 'reject' ? (lang === 'en' ? 'Stopped' : 'متوقف')
            : c.focus ? (lang === 'en' ? 'Complete + focus' : 'مكتمل + التركيز')
            : c.nc ? (lang === 'en' ? 'Complete' : 'مكتمل')
            : (lang === 'en' ? 'Registered' : 'مسجّل');
    return '<span class="stage-tag">' + esc(txt) + '</span>';
  }

  function bandNum(v, band) {
    var c = band === 'high' ? '#10b981' : band === 'mid' ? '#f59e0b' : '#ef4444';
    return '<b style="color:' + c + '">' + v + '%</b>';
  }
  function statusChip(band) {
    var m = { high: ['🟢', '#10b981', 'status_continue'], mid: ['🟡', '#f59e0b', 'status_review'], low: ['🔴', '#ef4444', 'status_low'] }[band];
    return '<span class="pill" style="--c:' + m[1] + '">' + m[0] + ' ' + esc(T(m[2])) + '</span>';
  }

  function bindCandidates(m) {
    UI.$$('[data-open]', m).forEach(function (b) {
      b.onclick = function () { view = { type: 'cand', id: b.dataset.open }; body(); };
    });
  }

  function candProfile(id) {
    var s = st(), c = s.candidates.filter(function (x) { return x.id === id; })[0];
    if (!c) return '<p>—</p>';
    var out = '<button class="btn btn-ghost btn-xs" id="back">‹ ' + esc(T('back')) + '</button>';
    var rep = report(c);
    if (!rep) {
      return out + head(c.name, c.phone + ' · ' + c.email) +
        '<div class="card"><p class="muted">' + esc(T('no_assessment')) + '</p></div>';
    }
    var lang = UI.getLang(), sc = rep.score, D = NC.DIMS;
    var dn = function (k) { return lang === 'en' ? D[k].en : D[k].ar; };
    var strong = rep.groups.strong.dims;
    var rec = rep.band === 'high' ? T('rec_proceed') : rep.band === 'mid' ? T('rec_review') : T('rec_low');
    var conf = Engine.matchConfidence(s);
    var com = Engine.commonalities(rep);

    out += head(c.name, c.phone + ' · ' + c.email + ' · ' + c.createdAt,
      '<button class="btn" onclick="window.print()">' + esc(T('print')) + '</button>');

    /* hero */
    out += '<div class="match-hero ' + rep.band + '">' +
      '<div>' + UI.ring(sc.match, 'SALES DNA', 140) + '</div>' +
      '<div class="mh-info"><b>' + esc(T('band_' + rep.band)) + '</b>' +
        '<div class="mh-sims">' +
          /* the measured comparison first, the manager's labels after it */
          simChip('🏆 ' + T('hit_group'), rep.sims.hitters, '#10b981') +
          simChip(T('oth_group'), rep.sims.belowTarget, '#f59e0b') +
          simChip(T('group_strong'), rep.sims.strong, '#22d3ee') +
          simChip(T('group_medium'), rep.sims.medium, '#3b82f6') +
          simChip(T('group_low'), rep.sims.low, '#ef4444') +
        '</div>' +
        '<div class="mh-sims"><span class="chip">' + esc(T('consistency_idx')) + ': <b style="color:' +
          UI.tone(sc.consistency || 0) + '">' + (sc.consistency == null ? '—' : sc.consistency + '%') + '</b></span>' +
          (c.focus ? '<span class="chip">🧠 ' + esc(T('focus_score')) + ': <b style="color:' + UI.tone(c.focus.focus) + '">' +
            c.focus.focus + '</b></span>' : '') +
          '<span class="chip">' + esc(T('confidence')) + ': <b style="color:' +
            (conf.level === 'high' ? '#10b981' : conf.level === 'medium' ? '#f59e0b' : '#ef4444') + '">' +
            esc(T('conf_' + conf.level)) + '</b></span>' +
          '<span class="chip">' + esc(T('run_25')) + '</span></div>' +
        '<div class="rec-box ' + rep.band + '">' + esc(T('recommendation')) + ': <b>' + esc(rec) + '</b>' +
          '<div class="why">WHY: ' + esc(whyText(rep, com, c, conf)) + '</div></div>' +
      '</div></div>';

    /* the four numbers stay separate — never blended into one score */
    out += '<div class="score-row">' +
      scoreTile('🎯', esc(T('run_25')), sc.match, '#8b5cf6') +
      scoreTile('🧠', esc(T('focus_title')), c.focus ? c.focus.focus : null, '#22d3ee') +
      scoreTile(NC.DIMS.commit.icon, esc(lang === 'en' ? NC.DIMS.commit.en : NC.DIMS.commit.ar), sc.dims.commit, '#ec4899') +
      scoreTile('✔', esc(T('consistency_idx')), sc.consistency, '#10b981') +
      '</div>';

    out += timingCard(c.nc);

    /* six dimensions + radar */
    out += '<div class="grid2">' +
      '<div class="card"><h3>' + esc(T('dna_dims')) + '</h3>' +
        NC.DIM_KEYS.map(function (k) {
          var v = sc.dims[k], b = strong[k];
          return '<div class="dim-row"><div class="dim-lbl">' + D[k].icon + ' ' + esc(dn(k)) +
            '<small class="muted"> ' + (rep.weights[k] || D[k].w) + '%</small></div>' +
            '<div class="dim-track"><div class="dim-fill" style="width:' + (v || 0) + '%;background:' + D[k].color + '"></div>' +
            (b != null ? '<i class="dim-bench" style="inset-inline-start:' + b + '%" title="' + esc(T('group_strong')) + ' ' + b + '"></i>' : '') +
            '</div><div class="dim-val" style="color:' + UI.tone(v || 0) + '">' + (v == null ? '—' : v) + '</div></div>';
        }).join('') +
        '<p class="muted sm">▍ ' + esc(lang === 'en' ? 'The vertical line = the average of the strong employees' : 'الخط العمودي = متوسط الموظفين الأقوياء') + '</p>' +
      '</div>' +
      '<div class="card"><h3>' + esc(T('vs_strong')) + '</h3>' +
        UI.radar([{ name: c.name, color: '#8b5cf6', traits: sc.dims },
                  { name: T('group_strong'), color: '#10b981', traits: strong }],
                 { size: 340, keys: NC.DIM_KEYS, dict: D }) + '</div>' +
      '</div>';

    /* where the candidate matches the strong team and where they differ */
    out += '<div class="grid2">' +
      '<div class="card"><h3>🔥 ' + esc(T('common_strong')) + '</h3>' +
        com.common.map(function (r) {
          return '<div class="sim-row">' + NC.DIMS[r.key].icon + ' <b>' + esc(dn(r.key)) + '</b>' +
            '<span class="muted sm">' + r.cand + ' / ' + r.strong + '</span>' +
            '<span class="sim-v">' + r.match + '%</span></div>';
        }).join('') +
        '<p class="muted sm">' + esc(LL('نسبة التشابه في كل بعد مع متوسط الأقوياء.', 'The similarity on each dimension against the average of the strong employees.')) + '</p></div>' +
      '<div class="card"><h3>⚠ ' + esc(T('differences')) + '</h3>' +
        (com.differences.length ? com.differences.map(function (r) {
          return '<div class="diff-row">' + NC.DIMS[r.key].icon + ' <b>' + esc(dn(r.key)) + '</b>' +
            '<span class="muted sm">' + r.cand + ' ' + esc(LL('مقابل', 'vs')) + ' ' + r.strong + '</span>' +
            '<span class="diff-gap">' + r.delta + '</span></div>';
        }).join('') : '<p class="muted">' + esc(LL('لا فروقات جوهرية عن الأقوياء.', 'No fundamental gaps against the strong employees.')) + '</p>') + '</div>' +
      '</div>';

    /* flags */
    out += '<div class="grid2"><div class="card"><h3>FLAGS</h3>' + flagCards(sc, strong, lang) + '</div>' +
      '<div class="card ai-card"><h3>🤖 ' + esc(T('ai_summary')) + '</h3>' +
      Engine.ncSummary(rep, lang).map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + '</div></div>';

    /* focus challenge */
    out += focusCard(c, s);

    /* interview questions + decision */
    out += '<div class="grid2"><div class="card"><h3>🎤 ' + esc(T('ask_these')) + '</h3><ol class="iq">' +
      Engine.ncInterview(rep, lang).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol></div>' +
      '<div class="card"><h3>' + esc(T('decision')) + '</h3>' +
      '<div class="btn-row">' +
      '<button class="btn btn-primary" data-dec="interview">' + esc(T('proceed')) + '</button>' +
      '<button class="btn btn-ok" data-dec="hired">' + esc(T('hire')) + '</button>' +
      '<button class="btn btn-danger" data-dec="reject">' + esc(T('reject')) + '</button></div>' +
      '<p class="muted sm">' + esc(T('open_anyway')) + '</p>' +
      '<h4>' + esc(T('followup')) + '</h4>' +
      '<div class="form inline">' +
      '<label class="fld"><span>' + esc(UI.getLang() === 'en' ? 'Day' : 'اليوم') + '</span><select id="fuDay"><option>30</option><option>90</option><option>180</option></select></label>' +
      '<label class="fld"><span>' + esc(T('target_pct')) + '</span><input id="fuTarget" type="number" value="100"></label>' +
      '<button class="btn" id="fuAdd">' + esc(T('add_followup')) + '</button></div>' +
      (c.followups && c.followups.length ? '<table class="tbl sm"><tbody>' + c.followups.map(function (f) {
        return '<tr><td>' + f.day + ' ' + (UI.getLang() === 'en' ? 'days' : 'يوم') + '</td><td>' + f.targetPct + '%</td></tr>';
      }).join('') + '</tbody></table>' : '') +
      '</div></div>';
    return out;
  }

  function scoreTile(icon, label, val, color) {
    return '<div class="score-tile" style="--c:' + color + '"><small>' + icon + ' ' + label + '</small>' +
      '<b>' + (val == null ? '—' : val + (label === 'FOCUS' ? '' : '%')) + '</b></div>';
  }

  function whyText(rep, com, c, conf) {
    var lang = UI.getLang();
    var top = com.common.slice(0, 2).map(function (r) { return (lang === 'en' ? NC.DIMS[r.key].en : NC.DIMS[r.key].ar) + ' ' + r.match + '%'; });
    var gap = com.differences.slice(0, 2).map(function (r) { return (lang === 'en' ? NC.DIMS[r.key].en : NC.DIMS[r.key].ar) + ' ' + r.delta; });
    var parts = [];
    if (rep.sims.hitters != null) parts.push(LL('تشابه مع من يحقّقون الهدف ', 'Similarity to target hitters ') + rep.sims.hitters + '%');
    else if (rep.sims.strong != null) parts.push(LL('تشابه مع الأقوياء ', 'Similarity to the strong ') + rep.sims.strong + '%');
    if (top.length) parts.push(LL('الأقرب: ', 'Closest: ') + top.join(', '));
    if (gap.length) parts.push(LL('فجوة: ', 'Gap: ') + gap.join(', '));
    if (rep.score.consistency != null) parts.push(LL('اتساق ', 'Consistency ') + rep.score.consistency + '%');
    parts.push(LL('ثقة النموذج ', 'Model confidence ') + T('conf_' + conf.level));
    if (c.focus) parts.push(LL('التركيز ', 'Focus ') + c.focus.focus + ' (' + LL('بوزن صفر', 'at zero weight') + ')');
    return parts.join(' · ');
  }

  /* 🟢 / 🟡 / 🔴 cards — benchmark wording, never a personal verdict */
  function flagCards(sc, strong, lang) {
    var D = NC.DIMS, out = [];
    var hard = sc.flags.map(function (f) {
      return { dot: f.sev >= 3 ? '🔴' : '🟡', txt: lang === 'en' ? f.en : f.ar, sev: f.sev };
    });
    if (!hard.length) {
      out.push({ dot: '🟢', txt: lang === 'en' ? 'No fundamental commitment issue found' : 'لا توجد مشكلة التزام جوهرية', sev: 0 });
    }
    NC.DIM_KEYS.forEach(function (k) {
      var v = sc.dims[k], b = strong[k];
      if (v == null || b == null) return;
      var name = lang === 'en' ? D[k].en : D[k].ar;
      var d = v - b;
      if (d >= 6) out.push({ dot: '🟢', txt: (lang === 'en' ? 'Above the strong benchmark on ' : 'أعلى من معيار الأقوياء في ') + name + ' (' + v + ' / ' + b + ')', sev: 0 });
      else if (d >= -4) out.push({ dot: '🟢', txt: name + (lang === 'en' ? ' is in line with the strong employees' : ' بمستوى الموظفين الأقوياء') + ' (' + v + ' / ' + b + ')', sev: 0 });
      else if (d >= -14) out.push({ dot: '🟡', txt: name + (lang === 'en' ? ' is slightly below the strong benchmark' : ' أقل قليلاً من معيار الأقوياء') + ' (' + v + ' / ' + b + ')', sev: 1 });
      else out.push({ dot: '🔴', txt: name + (lang === 'en' ? ' is clearly below the strong benchmark' : ' أقل بوضوح من معيار الأقوياء') + ' (' + v + ' / ' + b + ')', sev: 2 });
    });
    if (sc.consistency != null && sc.consistency < 70) {
      out.push({ dot: '🔴', txt: (lang === 'en' ? 'Low consistency on the cross-check questions' : 'اتساق منخفض في أسئلة التقاطع') + ' (' + sc.consistency + '%)', sev: 2 });
    }
    return out.sort(function (a, b) { return b.sev - a.sev; })
      .map(function (f) { return '<div class="flag sev' + f.sev + '">' + f.dot + ' ' + esc(f.txt) + '</div>'; }).join('');
  }

  /* FOCUS CHALLENGE — always reported separately from the match */
  function focusCard(c, s) {
    var lang = UI.getLang(), fs = Engine.focusStats(s.employees);
    if (!c.focus) {
      return '<div class="card"><h3>🧠 ' + esc(T('focus_title')) + '</h3>' +
        '<p class="muted">' + esc(T('focus_nodata')) + '</p>' +
        '<button class="btn" data-focus="' + c.id + '">▶ ' + esc(T('play_focus')) + '</button></div>';
    }
    var f = c.focus, SUB = root.SDNA.Focus.SUB;
    var bench = fs.all.focus;
    var verdict = bench == null ? null : (f.focus >= bench + 5 ? 'focus_above' : f.focus >= bench - 5 ? 'focus_at' : 'focus_below');
    return '<div class="card"><h3>🧠 ' + esc(T('focus_title')) + ' <small class="muted">— ' + esc(T('focus_note')) + '</small></h3>' +
      '<div class="focus-head">' + UI.ring(f.focus, 'FOCUS', 120) +
        '<div class="focus-subs">' +
          ['visual', 'speed', 'accuracy', 'recall'].map(function (k) {
            return '<div class="fsub"><small>' + esc(lang === 'en' ? SUB[k].en : SUB[k].ar) + '</small>' +
              '<b style="color:' + UI.tone(f.sub[k]) + '">' + f.sub[k] + '</b></div>';
          }).join('') +
        '</div></div>' +
      '<div class="focus-raw">' +
        rawItem('👁 ' + (lang === 'en' ? 'Differences found' : 'الاختلافات التي وُجدت'), f.raw.found + '/' + f.raw.total) +
        rawItem('⏱ ' + (lang === 'en' ? 'First find' : 'أول اكتشاف'), (f.raw.first != null ? f.raw.first + 's' : '—')) +
        rawItem('⏳ ' + (lang === 'en' ? 'Total time' : 'الوقت الكلي'), (f.raw.elapsed || 0) + 's') +
        rawItem('❌ ' + (lang === 'en' ? 'Wrong clicks' : 'ضغطات خاطئة'), f.raw.wrong) +
        rawItem('⚡ ' + (lang === 'en' ? 'Correct answers (Quick Scan)' : 'إجابات صحيحة (Quick Scan)'), f.raw.scanCorrect + '/' + f.raw.scanTotal) +
        rawItem('🕒 ' + (lang === 'en' ? 'Average response time' : 'متوسط زمن الرد'), f.raw.scanAvg + 's') +
      '</div>' +
      (bench != null ? '<div class="alert ' + (verdict === 'focus_below' ? 'warn-box' : 'ok-box') + '">' +
        esc(T('focus_bench')) + ': <b>' + esc(T(verdict)) + '</b> — ' +
        esc(lang === 'en' ? 'Team average ' : 'متوسط الفريق ') + bench + ' (' + fs.all.n + ')' +
        '</div>' : '') +
      '<table class="tbl sm"><thead><tr><th></th><th>FOCUS</th><th>n</th></tr></thead><tbody>' +
        ['strong', 'medium', 'low'].map(function (g) {
          return '<tr><td><span class="pill" style="--c:' + gcolor(g) + '">' + esc(gname(g)) + '</span></td>' +
            '<td>' + (fs[g].focus == null ? '—' : fs[g].focus) + '</td><td class="muted">' + fs[g].n + '</td></tr>';
        }).join('') + '</tbody></table>' +
      '<p class="muted sm">' + esc(fs.reliable
        ? (lang === 'en' ? 'There is a consistent gap between strong and low performers on this measure — even so, it does not enter the match score.'
                         : 'يوجد فارق ثابت بين الأقوياء والضعفاء في هذا المؤشر — ومع ذلك لا يدخل في نسبة التطابق.')
        : T('focus_corr_none')) + '</p></div>';
  }
  function rawItem(l, v) {
    return '<div class="fraw"><small>' + esc(l) + '</small><b>' + esc(String(v)) + '</b></div>';
  }

  function simChip(l, v, c) {
    return '<span class="chip">' + esc(l) + ': <b style="color:' + c + '">' + (v == null ? '—' : v + '%') + '</b></span>';
  }

  function bindCand(m) {
    var b = document.getElementById('back'); if (b) b.onclick = function () { view = null; body(); };
    UI.$$('[data-dec]', m).forEach(function (btn) {
      btn.onclick = function () {
        var dec = btn.dataset.dec;
        if (srv()) return push(API.decision(view.id, dec), '✔ ' + dec);
        Store.updateCandidate(view.id, { decision: dec, stage: dec === 'hired' ? 7 : dec === 'interview' ? 5 : 6 });
        UI.toast('✔ ' + dec); body();
      };
    });
    UI.$$('[data-focus]', m).forEach(function (btn) {
      btn.onclick = function () {
        root.SDNA.Game.focusOnly({ id: btn.dataset.focus, type: 'candidate', name: '' }, 'candidate', function () {
          root.SDNA.App.go('manager');
        });
      };
    });
    var add = document.getElementById('fuAdd');
    if (add) add.onclick = function () {
      var day = Number(document.getElementById('fuDay').value);
      var pct = Number(document.getElementById('fuTarget').value);
      if (srv()) return push(API.review(view.id, day, { targetPct: pct }), '✔');
      var c = st().candidates.filter(function (x) { return x.id === view.id; })[0];
      c.followups = c.followups || [];
      c.followups.push({ day: day, targetPct: pct });
      Store.save(); body();
    };
  }

  /* ================= COMPANY DNA ================= */
  function companyDNA() {
    var s = st(), gs = Engine.groupStats(s.employees);
    return head(T('company_dna'), UI.getLang() === 'en' ? 'The profile built from every employee assessed' : 'البروفايل المبني من كل الموظفين الذين تم فحصهم') +
      '<div class="grid2">' +
      '<div class="card"><h3>COMPANY SALES DNA <small class="muted">(n=' + gs.company.n + ')</small></h3>' +
        UI.bars(TK.map(function (t) { return { label: lname(t), icon: Q.TRAITS[t].icon, value: gs.company.traits[t], color: Q.TRAITS[t].color }; })) + '</div>' +
      '<div class="card"><h3>STRONG vs MEDIUM vs LOW</h3>' +
        UI.radar([
          { name: T('group_strong') + ' (' + gs.strong.n + ')', color: '#10b981', traits: gs.strong.traits },
          { name: T('group_medium') + ' (' + gs.medium.n + ')', color: '#3b82f6', traits: gs.medium.traits },
          { name: T('group_low') + ' (' + gs.low.n + ')', color: '#ef4444', traits: gs.low.traits }
        ], { size: 360 }) + '</div></div>' +
      commonDnaBlock() + diffBlock() +
      '<div class="card"><h3>GROUP AVERAGES</h3><table class="tbl"><thead><tr><th></th>' +
      TK.map(function (t) { return '<th>' + Q.TRAITS[t].icon + ' ' + esc(lname(t)) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      ['strong', 'medium', 'low'].map(function (g) {
        return '<tr><td><span class="pill" style="--c:' + gcolor(g) + '">' + esc(gname(g)) + '</span></td>' +
          TK.map(function (t) {
            var v = gs[g].traits[t];
            return '<td style="color:' + (v == null ? '#888' : UI.tone(v)) + '"><b>' + (v == null ? '—' : v) + '</b></td>';
          }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
  }

  function commonDnaBlock() {
    var cd = Engine.commonDNA(st().employees);
    return '<div class="card"><h3>🧬 ' + esc(T('common_dna')) + ' <small class="muted">(n=' + cd.n + ')</small></h3>' +
      UI.bars(cd.rows.map(function (r) {
        return { label: lname(r.key), icon: Q.TRAITS[r.key].icon, value: r.strong, color: Q.TRAITS[r.key].color };
      })) +
      '<p class="muted sm">' + esc(LL('هذه متوسطات الموظفين الأقوياء فقط — وليست بالضرورة ما يفرّقهم عن غيرهم.',
        'These are the averages of the strong employees only — not necessarily what sets them apart from everyone else.')) + '</p></div>';
  }

  function diffBlock() {
    var d = Engine.differentiators(st().employees);
    var rate = { very_high: ['🔥 ' + LL('فارق كبير جداً', 'Very large gap'), '#10b981'],
                 high:      ['🔥 ' + LL('فارق كبير', 'Large gap'), '#22d3ee'],
                 medium:    ['🟡 ' + LL('فارق متوسط', 'Medium gap'), '#f59e0b'],
                 low:       ['⚪ ' + LL('لا يفرّق', 'Does not separate'), '#8ea0c4'],
                 unknown:   ['—', '#8ea0c4'] };
    return '<div class="card"><h3>⚖️ ' + esc(T('differentiators')) + '</h3>' +
      '<table class="tbl"><thead><tr><th>' + esc(T('name')) + '</th><th>' + esc(T('group_strong')) + '</th>' +
      '<th>' + esc(T('group_medium')) + '</th><th>' + esc(T('group_low')) + '</th><th>Δ</th><th></th></tr></thead><tbody>' +
      d.rows.map(function (r) {
        var m = rate[r.rating];
        return '<tr><td>' + Q.TRAITS[r.key].icon + ' ' + esc(lname(r.key)) + '</td>' +
          '<td><b>' + (r.strong == null ? '—' : r.strong) + '</b></td>' +
          '<td>' + (r.medium == null ? '—' : r.medium) + '</td>' +
          '<td>' + (r.low == null ? '—' : r.low) + '</td>' +
          '<td><b style="color:' + m[1] + '">' + (r.delta == null ? '—' : (r.delta > 0 ? '+' : '') + r.delta) + '</b></td>' +
          '<td><span class="pill" style="--c:' + m[1] + '">' + esc(m[0]) + '</span></td></tr>';
      }).join('') + '</tbody></table>' +
      '<div class="rec-box high">KEY SUCCESS DIFFERENTIATORS: <b>' +
        (d.keys.length ? d.keys.map(function (r) { return Q.TRAITS[r.key].icon + ' ' + esc(lname(r.key)); }).join(' · ')
                       : esc(LL('لا يوجد فارق واضح بعد', 'No clear gap yet'))) + '</b></div>' +
      '<p class="muted sm">' + esc(LL('الصفات التي يتشابه فيها الجميع لا تحصل على وزن كبير في نموذج المرشّح.',
        'Traits where everyone looks alike do not carry much weight in the candidate model.')) + '</p></div>';
  }

  /* ================= PATTERNS ================= */
  function patterns() {
    var s = st(), lw = Engine.learnWeights(s.employees);
    var order = TK.slice().sort(function (a, b) { return lw.separation[b] - lw.separation[a]; });
    var qp = Engine.questionPower(s.employees);
    return head('AI PATTERN DISCOVERY', UI.getLang() === 'en' ? 'What actually separates the strong from the low performers' : 'ما الذي يفرّق فعلاً بين الأقوياء والضعفاء',
      '<button class="btn btn-primary" id="runPattern">⚡ ' + esc(T('find_pattern')) + '</button>') +
      '<div id="patternOut">' +
      '<div class="grid2"><div class="card"><h3>' + esc(T('top_traits')) + '</h3>' +
        '<ol class="rank">' + order.map(function (t, i) {
          return '<li><span class="rk">' + (i + 1) + '</span>' + Q.TRAITS[t].icon + ' <b>' + esc(lname(t)) + '</b>' +
            '<span class="sep">Δ ' + Math.round(lw.separation[t] - 2) + '</span>' +
            '<span class="wt">w=' + (lw.weights[t] * 100).toFixed(1) + '%</span></li>';
        }).join('') + '</ol>' +
        '<button class="btn" id="applyW">' + esc(T('apply_weights')) + '</button> ' +
        '<button class="btn btn-ghost" id="autoW">' + esc(T('auto_weights')) + '</button>' +
        '<h4>' + esc(T('weights_25')) + '</h4>' +
        '<div class="chips">' + NC.DIM_KEYS.map(function (k) {
          var w = (st().settings.ncWeights || NC.defaultWeights())[k];
          return '<span class="chip">' + NC.DIMS[k].icon + ' ' + esc(UI.getLang() === 'en' ? NC.DIMS[k].en : NC.DIMS[k].ar) + ' <b>' + w + '%</b></span>';
        }).join('') + '<span class="chip">' + esc(T('consistency_idx')) + ' <b>' + NC.CONSISTENCY_W + '%</b></span></div>' +
        '<div class="btn-row"><button class="btn" id="calW">⚖ ' + esc(T('calibrate')) + '</button>' +
        '<button class="btn btn-ghost" id="resetNcW">↺</button></div>' +
        (lw.learned ? '' : '<p class="muted sm">⚠ ' + esc(UI.getLang() === 'en' ? 'Too few employees assessed — the weights are not stable yet.' : 'عدد الموظفين المفحوصين قليل — الأوزان غير مستقرة بعد.') + '</p>') +
      '</div>' +
      '<div class="card"><h3>' + esc(T('top_questions')) + '</h3><table class="tbl sm"><thead><tr><th>Q</th><th>' + esc(T('group_strong')) + '</th><th>' + esc(T('group_low')) + '</th><th>Δ</th></tr></thead><tbody>' +
        qp.slice(0, 10).map(function (r) {
          return '<tr><td>' + r.qid + ' <small class="muted">' + esc(lname(r.trait)) + '</small></td><td>' + (r.strong == null ? '—' : r.strong) + '</td><td>' + (r.low == null ? '—' : r.low) + '</td>' +
            '<td><b style="color:' + (r.sep >= 18 ? '#10b981' : r.sep >= 8 ? '#f59e0b' : '#ef4444') + '">' + (r.sep == null ? '—' : r.sep) + '</b></td></tr>';
        }).join('') + '</tbody></table></div></div>' +
      qualityBlock() +
      '<div class="card"><h3>' + esc(T('weak_questions')) + '</h3><div class="chips">' +
        (qp.filter(function (r) { return r.verdict === 'weak'; }).map(function (r) {
          return '<span class="chip bad">' + r.qid + ' · ' + esc(lname(r.trait)) + ' · Δ' + r.sep + '</span>';
        }).join('') || '<span class="muted">—</span>') +
      '</div></div></div>';
  }

  function qualityBlock() {
    var qq = Engine.ncQuestionQuality(st().employees);
    var rate = { strong: ['🔥', '#10b981'], medium: ['🟡', '#f59e0b'], weak: ['🔴', '#ef4444'], nodata: ['⚪', '#8ea0c4'] };
    return '<div class="card"><h3>❓ ' + esc(T('q_quality')) + ' <small class="muted">— ' +
      esc(LL('حسب إجابات ' + qq.staff + ' موظفاً على نفس المقياس', 'Based on the answers of ' + qq.staff + ' employees on the same scale')) + '</small></h3>' +
      '<div class="kpis sm">' +
        kpi('🔥', qq.counts.strong, LL('أسئلة قوية', 'Strong questions'), '#10b981') +
        kpi('🟡', qq.counts.medium, LL('متوسطة', 'Medium'), '#f59e0b') +
        kpi('🔴', qq.counts.weak, LL('ضعيفة', 'Weak'), '#ef4444') +
        kpi('⚪', qq.counts.nodata, LL('بلا بيانات', 'No data'), '#8ea0c4') +
      '</div>' +
      '<table class="tbl sm"><thead><tr><th>Q</th><th>' + esc(T('group_strong')) + '</th><th>' + esc(T('group_medium')) +
      '</th><th>' + esc(T('group_low')) + '</th><th>Δ</th><th>' + esc(LL('اختاروا الأفضل', 'Picked the best answer')) + '</th><th></th></tr></thead><tbody>' +
      qq.rows.map(function (r) {
        var m = rate[r.rating];
        return '<tr><td><b>' + r.qid + '</b> <small class="muted">L' + r.lvl + '</small>' +
          (r.staffOnly ? ' <span class="tag aud">' + esc(LL('للمرشحين فقط', 'Candidates only')) + '</span>' : '') + '</td>' +
          '<td>' + (r.strong == null ? '—' : r.strong) + '</td>' +
          '<td>' + (r.medium == null ? '—' : r.medium) + '</td>' +
          '<td>' + (r.low == null ? '—' : r.low) + '</td>' +
          '<td><b style="color:' + m[1] + '">' + (r.sep == null ? '—' : (r.sep > 0 ? '+' : '') + r.sep) + '</b></td>' +
          '<td class="muted">' + (r.topShare && r.topShare.strong != null
            ? r.topShare.strong + '% / ' + (r.topShare.medium == null ? '—' : r.topShare.medium + '%') + ' / ' +
              (r.topShare.low == null ? '—' : r.topShare.low + '%') : '—') + '</td>' +
          '<td>' + m[0] + '</td></tr>';
      }).join('') + '</tbody></table>' +
      '<p class="muted sm">' + esc(LL('العمود قبل الأخير: نسبة من اختار الإجابة الأعلى قيمة في كل مجموعة (أقوياء / متوسطون / ضعفاء). السؤال الذي يجيب عليه الجميع بنفس الشكل لا يعطي معلومة.',
        'The second-to-last column: the share who picked the highest-value answer in each group (strong / medium / low). A question everyone answers the same way carries no information.')) + '</p></div>';
  }

  function bindPatterns(m) {
    var run = document.getElementById('runPattern');
    if (run) run.onclick = function () {
      var out = document.getElementById('patternOut');
      out.style.opacity = '.25';
      run.disabled = true; run.textContent = '⏳ ...';
      setTimeout(function () {
        out.style.opacity = '1'; run.disabled = false; run.textContent = '⚡ ' + T('find_pattern');
        UI.confetti(30); UI.toast(UI.getLang() === 'en' ? 'The patterns were recalculated' : 'تم إعادة حساب الأنماط');
        body();
      }, 900);
    };
    var ap = document.getElementById('applyW');
    if (ap) ap.onclick = function () {
      var s = st(); var w = Engine.learnWeights(s.employees).weights;
      s.settings.weights = w;
      if (srv()) return push(API.saveSettings({ weights: w }), '✔ ' + T('apply_weights'));
      Store.save(); UI.toast('✔ ' + T('apply_weights')); body();
    };
    var au = document.getElementById('autoW');
    if (au) au.onclick = function () {
      var s = st(); s.settings.weights = null;
      if (srv()) return push(API.saveSettings({ weights: null }), '✔ ' + T('auto_weights'));
      Store.save(); UI.toast('✔ ' + T('auto_weights')); body();
    };
    var cal = document.getElementById('calW');
    if (cal) cal.onclick = function () {
      var s = st(), r = Engine.calibrate6(s.employees);
      if (!r.enough) return UI.toast(UI.getLang() === 'en' ? 'Not enough employees have been assessed' : 'عدد الموظفين المفحوصين غير كافٍ', 'bad');
      s.settings.ncWeights = r.weights;
      UI.confetti(30);
      if (srv()) return push(API.saveSettings({ ncWeights: r.weights }), '✔ ' + T('calibrate'));
      Store.save(); UI.toast('✔ ' + T('calibrate')); body();
    };
    var rw = document.getElementById('resetNcW');
    if (rw) rw.onclick = function () {
      var s = st(); s.settings.ncWeights = null;
      if (srv()) return push(API.saveSettings({ ncWeights: null }), '✔');
      Store.save(); UI.toast('✔'); body();
    };
  }

  /* ================= QUESTION BANK ================= */
  function questions() {
    var qp = {}; Engine.questionPower(st().employees).forEach(function (r) { qp[r.qid] = r; });
    var byZone = {};
    Q.all.forEach(function (q) { (byZone[q.zone] = byZone[q.zone] || []).push(q); });
    var audTag = { emp: UI.getLang() === 'en' ? 'Employees only' : 'للموظفين فقط',
                   cand: UI.getLang() === 'en' ? 'Candidates only' : 'للمرشحين فقط' };
    return head(T('nav_questions'),
      Q.all.length + ' ' + (UI.getLang() === 'en' ? 'questions in the bank · ' : 'سؤال في المخزون · ') + T('q_bank_note')) +
      '<div class="card"><p class="muted sm">' +
        esc(UI.getLang() === 'en'
          ? '⚠ System rule: an existing employee is never shown any question about studying, another job, leaving, or future plans — those are all marked "candidates only".'
          : '⚠ قاعدة النظام: لا تُعرض على الموظف الحالي أي أسئلة عن الدراسة أو عمل آخر أو الانتقال أو الخطط المستقبلية — وهي مُعلَّمة "للمرشحين فقط".') +
      '</p></div>' +
      Q.ZONES.map(function (z) {
        var list = byZone[z.key] || [];
        if (!list.length) return '';
        return '<div class="card"><div class="zone-head"><div class="zh-art">' + Art.zoneEmblem(z.key, z.color) + '</div>' +
          '<h3 style="color:' + z.color + ';margin:0">ZONE ' + z.n + ' · ' + esc(z.code) + '</h3></div>' +
          list.map(function (q) {
            var r = qp[q.id];
            return '<div class="qrow"><div class="qrow-h"><b>' + q.id + '</b> ' +
              '<span class="tag">' + Q.TRAITS[q.trait].icon + ' ' + esc(lname(q.trait)) + '</span>' +
              '<span class="tag">D' + q.diff + '</span>' +
              (q.aud !== 'all' ? '<span class="tag aud">' + esc(audTag[q.aud]) + '</span>' : '') +
              (q.mirror ? '<span class="tag">↔ ' + q.mirror + '</span>' : '') +
              (q.who ? '<span class="tag">🎭 ' + esc(q.who) + '</span>' : '') +
              (q.hidden ? '<span class="tag">adaptive</span>' : '') +
              (r && r.sep != null ? '<span class="tag ' + (r.verdict === 'strong' ? 'good' : r.verdict === 'weak' ? 'bad' : '') + '">Δ' + r.sep + '</span>' : '') +
              '</div>' +
              (q.line ? '<div class="qrow-q" style="color:#93c5fd">🗣 "' + esc(UI.qt(q, 'line')) + '"</div>' : '') +
              '<div class="qrow-q">' + esc(UI.qt(q, 'q')) + '</div>' +
              '<ol class="qrow-a">' + q.a.map(function (o) {
                return '<li><span class="sc" style="color:' + UI.tone(o.s) + '">' + o.s + '</span> ' + esc(UI.qt(o, 't')) +
                  (o.f ? ' <em class="fl">🚩' + esc(o.f) + '</em>' : '') + (o.fu ? ' <em class="fl">→' + o.fu + '</em>' : '') + '</li>';
              }).join('') + '</ol></div>';
          }).join('') + '</div>';
      }).join('');
  }

  /* ================= FOCUS ANALYTICS ================= */
  function focusTab() {
    var s = st(), fv = Engine.focusVerdict(s), fs = fv.stats, SUB = root.SDNA.Focus.SUB;
    var val = s.settings.spotValidated;
    var verdictBox = {
      insufficient: ['warn-box', LL('لا توجد بيانات كافية بعد. شغّل التحدي لدى الموظفين الأقوياء والضعفاء قبل استخدامه في أي قرار.',
                                    'Not enough data yet. Run the challenge with both strong and low performers before using it in any decision.')],
      no_signal:    ['warn-box', LL('النتائج متشابهة بين المجموعات — التحدي يبقى جزءاً من التجربة فقط، وبدون تأثير على القرار.',
                                    'The results look alike across the groups — the challenge stays part of the experience only, with no effect on the decision.')],
      signal:       ['ok-box', LL('يوجد فارق ثابت بين الأقوياء والضعفاء — يستحق التحقيق، ومع ذلك وزنه في القرار ما زال صفراً حتى تقرر تغييره.',
                                  'There is a consistent gap between strong and low performers — worth investigating, yet its weight in the decision stays zero until you decide otherwise.')]
    }[fv.verdict];

    return head(T('nav_focus'), T('focus_note')) +
      '<div class="kpis">' +
        kpi('🧠', fs.all.focus == null ? '—' : fs.all.focus, LL('متوسط الفريق', 'Team average'), '#8b5cf6') +
        kpi('👥', fs.all.n, LL('لعبوا التحدي', 'Played the challenge'), '#3b82f6') +
        kpi('Δ', fv.gap == null ? '—' : (fv.gap > 0 ? '+' : '') + fv.gap, LL('فارق أقوياء/ضعفاء', 'Strong / low gap'), '#22d3ee') +
        kpi('⚖', fv.weight + '%', T('focus_weight'), '#f59e0b') +
      '</div>' +
      '<div class="alert ' + verdictBox[0] + '">' + esc(verdictBox[1]) + '</div>' +
      '<div class="grid2">' +
        '<div class="card"><h3>' + esc(LL('حسب المجموعة', 'By group')) + '</h3>' +
          '<table class="tbl"><thead><tr><th></th><th>FOCUS</th>' +
          ['visual', 'speed', 'accuracy', 'recall'].map(function (k) {
            return '<th>' + esc(UI.getLang() === 'en' ? SUB[k].en : SUB[k].ar) + '</th>';
          }).join('') + '<th>n</th></tr></thead><tbody>' +
          ['strong', 'medium', 'low'].map(function (g) {
            return '<tr><td><span class="pill" style="--c:' + gcolor(g) + '">' + esc(gname(g)) + '</span></td>' +
              '<td><b>' + (fs[g].focus == null ? '—' : fs[g].focus) + '</b></td>' +
              ['visual', 'speed', 'accuracy', 'recall'].map(function (k) {
                return '<td>' + (fs[g].sub[k] == null ? '—' : fs[g].sub[k]) + '</td>';
              }).join('') + '<td class="muted">' + fs[g].n + '</td></tr>';
          }).join('') + '</tbody></table></div>' +
        '<div class="card"><h3>👁 ' + esc(LL('معايرة لعبة الاختلافات', 'Spot-the-difference calibration')) + '</h3>' +
          '<div class="alert ' + (val && val.ok ? 'ok-box' : 'warn-box') + '">' +
            (val ? (val.ok ? '✅ ' + val.found + '/' + val.total + ' ' + esc(T('validated'))
                           : '⚠ ' + val.found + '/' + val.total + ' ' + esc(T('not_validated'))) +
                   ' <small class="muted">· ' + esc(val.at) + '</small>'
                 : '⚠ ' + esc(T('not_validated'))) + '</div>' +
          '<div class="btn-row"><button class="btn btn-primary" id="calSpot">🎯 ' + esc(T('calibrate_spot')) + '</button>' +
          '<button class="btn" id="hitBox">' + (s.settings.spotDebug ? '☑' : '☐') + ' ' + esc(T('show_hitboxes')) + '</button></div>' +
          '<p class="muted sm">' + esc(LL('كل اختلاف مخزّن بإحداثيات نسبية 0–1 ومنطقة ضغط لا تقل عن 30 بكسل، لذلك تعمل اللعبة بنفس الدقة على الجوال والحاسوب. وضع إظهار مناطق الضغط لا يظهر للمرشّح إطلاقاً.',
            'Every difference is stored in relative 0–1 coordinates with a hit area of at least 30 pixels, so the game is equally precise on phone and desktop. The hit-area view is never shown to a candidate.')) + '</p></div>' +
      '</div>' +
      '<div class="card"><h3>' + esc(LL('الموظفون', 'Employees')) + '</h3><table class="tbl"><thead><tr>' +
      '<th>' + esc(T('name')) + '</th><th>' + esc(T('perf')) + '</th><th>FOCUS</th><th>👁</th><th>❌</th><th>⚡</th><th></th></tr></thead><tbody>' +
      s.employees.map(function (e) {
        var f = e.focus;
        return '<tr><td>' + esc(e.name) + (e.branch ? ' <small class="muted">' + esc(e.branch) + '</small>' : '') + '</td>' +
          '<td><span class="pill" style="--c:' + gcolor(e.group) + '">' + esc(gname(e.group)) + '</span></td>' +
          '<td>' + (f ? '<b style="color:' + UI.tone(f.focus) + '">' + f.focus + '</b>' : '<span class="muted">—</span>') + '</td>' +
          '<td>' + (f ? f.raw.found + '/' + f.raw.total : '—') + '</td>' +
          '<td>' + (f ? f.raw.wrong : '—') + '</td>' +
          '<td>' + (f ? f.raw.scanCorrect + '/' + f.raw.scanTotal : '—') + '</td>' +
          '<td><button class="btn btn-xs" data-focus-emp="' + e.id + '">▶</button></td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function bindFocus(m) {
    var c = document.getElementById('calSpot');
    if (c) c.onclick = function () {
      root.SDNA.Game.calibrateSpot(function () { root.SDNA.App.go('manager'); });
    };
    var h = document.getElementById('hitBox');
    if (h) h.onclick = function () {
      var s = st(); s.settings.spotDebug = !s.settings.spotDebug;
      if (srv()) return push(API.saveSettings({ spotDebug: s.settings.spotDebug }), null);
      Store.save(); body();
    };
    UI.$$('[data-focus-emp]', m).forEach(function (btn) {
      btn.onclick = function () {
        var e = st().employees.filter(function (x) { return x.id === btn.dataset.focusEmp; })[0];
        root.SDNA.Game.focusOnly({ id: e.id, type: 'employee', name: e.name }, 'employee', function () {
          root.SDNA.App.go('manager');
        });
      };
    });
  }

  /* ================= PREDICTION & POST-HIRE ================= */
  function predictTab() {
    var s = st(), pv = Engine.predictionValidation(s), conf = Engine.matchConfidence(s);
    var hired = s.candidates.filter(function (c) { return c.decision === 'hired'; });
    var vmap = { good: ['✅', T('verdict_good'), '#10b981'], missed: ['❌', T('verdict_missed'), '#ef4444'],
                 pending: ['⏳', T('verdict_pending'), '#8ea0c4'] };
    return head(T('nav_predict'), LL('هل تنبؤات المنظومة تتحقق فعلياً؟', 'Do the predictions actually come true?')) +
      '<div class="kpis">' +
        kpi('🎯', pv.accuracy == null ? '—' : pv.accuracy + '%', T('pred_acc'), '#10b981') +
        kpi('👤', pv.judged, LL('تنبؤات قابلة للفحص', 'Testable predictions'), '#3b82f6') +
        kpi('🔒', T('conf_' + conf.level), T('confidence'), '#8b5cf6') +
      '</div>' +
      '<div class="card"><h3>' + esc(T('confidence')) + '</h3><div class="chips">' +
        conf.reasons.map(function (r) {
          var lbl = { strong_n: LL('موظفون أقوياء بالبيانات', 'Strong employees with data'),
                      low_n: LL('موظفون ضعفاء بالبيانات', 'Low performers with data'),
                      history_n: LL('سجل أداء 6 أشهر+', 'Performance history 6 months+'),
                      separation: LL('صفات تفرّق فعلياً', 'Traits that actually separate') }[r.k];
          return '<span class="chip' + (r.ok ? '' : ' bad') + '">' + (r.ok ? '✅' : '⚠') + ' ' + esc(lbl) + ': <b>' + r.v + '</b></span>';
        }).join('') + '</div>' +
        '<p class="muted sm">' + esc(LL('نسبة التطابق تُعرض دائماً مع مستوى ثقة — 91% مع 3 موظفين أقوياء ليست مثل 91% مع 30.',
          'The match is always shown with a confidence level — 91% based on 3 strong employees is not the same as 91% based on 30.')) + '</p></div>' +
      '<div class="card"><h3>' + esc(LL('التحقق من التنبؤ', 'Prediction validation')) + '</h3>' +
        (pv.rows.length ? '<table class="tbl"><thead><tr><th>' + esc(T('name')) + '</th><th>MATCH</th><th>' +
          esc(LL('اليوم', 'Day')) + '</th><th>' + esc(T('target_pct')) + '</th><th>' + esc(LL('التصنيف الفعلي', 'Actual classification')) +
          '</th><th>FOCUS</th><th></th></tr></thead><tbody>' +
          pv.rows.map(function (r) {
            var v = vmap[r.verdict];
            return '<tr><td>' + esc(r.name) + '</td>' +
              '<td>' + (r.match == null ? '—' : bandNum(r.match, r.band)) + '</td>' +
              '<td>' + (r.day || '—') + '</td>' +
              '<td>' + (r.actual == null ? '—' : r.actual + '%') + '</td>' +
              '<td>' + (r.actualClass ? '<span class="pill" style="--c:' + gcolor(r.actualClass) + '">' + esc(gname(r.actualClass)) + '</span>' : '—') + '</td>' +
              '<td>' + (r.focus == null ? '—' : r.focus) + '</td>' +
              '<td><span class="pill" style="--c:' + v[2] + '">' + v[0] + ' ' + esc(v[1]) + '</span></td></tr>';
          }).join('') + '</tbody></table>'
          : '<p class="muted">' + esc(LL('لا يوجد موظفون تم توظيفهم عبر المنظومة بعد.', 'Nobody has been hired through the system yet.')) + '</p>') +
      '</div>' +
      '<div class="card"><h3>' + esc(T('post_hire')) + ' — 30 / 90 / 180</h3>' +
        (hired.length ? hired.map(function (c) {
          return '<div class="ph-row"><div class="ph-head"><b>' + esc(c.name) + '</b>' +
            '<span class="muted sm">' + (c.hiredAt || c.createdAt) + '</span></div>' +
            '<div class="form inline">' +
            '<label class="fld"><span>' + esc(LL('اليوم', 'Day')) + '</span><select data-ph="day" data-c="' + c.id + '">' +
              [30, 90, 180].map(function (d) { return '<option>' + d + '</option>'; }).join('') + '</select></label>' +
            '<label class="fld"><span>' + esc(T('target_pct')) + '</span><input type="number" data-ph="targetPct" data-c="' + c.id + '" value="100"></label>' +
            '<label class="fld"><span>' + esc(T('attendance')) + '</span><input type="number" data-ph="attendance" data-c="' + c.id + '" value="95"></label>' +
            '<label class="fld"><span>' + esc(LL('انضباط', 'Discipline')) + '</span><input type="number" data-ph="discipline" data-c="' + c.id + '" value="85"></label>' +
            '<label class="fld"><span>' + esc(LL('سرعة تعلّم', 'Learning speed')) + '</span><input type="number" data-ph="learning" data-c="' + c.id + '" value="85"></label>' +
            '<label class="fld"><span>' + esc(T('mgr_score')) + '</span><input type="number" data-ph="managerRating" data-c="' + c.id + '" value="8"></label>' +
            '<button class="btn" data-ph-save="' + c.id + '">+ ' + esc(T('add_followup')) + '</button></div>' +
            ((c.reviews || []).length ? '<table class="tbl sm"><tbody>' + c.reviews.map(function (r) {
              return '<tr><td>' + r.day + 'd</td>' +
                '<td>' + (r.targetPct != null ? r.targetPct + '%' : '—') + '</td>' +
                '<td>' + (r.attendance != null ? '🕘 ' + r.attendance : '') + '</td>' +
                '<td>' + (r.discipline != null ? '⏱ ' + r.discipline : '') + '</td>' +
                '<td>' + (r.learning != null ? '🧠 ' + r.learning : '') + '</td>' +
                '<td>' + (r.managerRating != null ? '⭐ ' + r.managerRating : '') + '</td></tr>';
            }).join('') + '</tbody></table>' : '') + '</div>';
        }).join('') : '<p class="muted">' + esc(LL('لا يوجد بعد.', 'Nothing yet.')) + '</p>') +
      '</div>';
  }

  function bindPredict(m) {
    UI.$$('[data-ph-save]', m).forEach(function (btn) {
      btn.onclick = function () {
        var id = btn.dataset.phSave;
        var c = st().candidates.filter(function (x) { return x.id === id; })[0];
        if (!c) return;
        var rec = {};
        UI.$$('[data-c="' + id + '"]', m).forEach(function (inp) {
          rec[inp.dataset.ph] = Number(inp.value);
        });
        if (srv()) {
          var day = rec.day; delete rec.day;
          return push(API.review(id, day, rec), '✔');
        }
        c.reviews = c.reviews || [];
        c.reviews = c.reviews.filter(function (r) { return r.day !== rec.day; }).concat([rec])
          .sort(function (a, b) { return a.day - b.day; });
        Store.save(); UI.toast('✔'); body();
      };
    });
  }

  /* ================= COMPARE ================= */
  function compare() {
    var s = st();
    var people = s.employees.filter(function (e) { return e.assessment; })
      .map(function (e) { return { id: 'E:' + e.id, name: e.name, tag: gname(e.group), color: gcolor(e.group), traits: empDNA(e).traits }; })
      ;
    var gs = Engine.groupStats(s.employees);
    var sel = people.filter(function (p) { return compareSel.indexOf(p.id) >= 0; });
    var palette = ['#8b5cf6', '#22d3ee', '#f59e0b', '#ec4899'];
    var series = sel.slice(0, 4).map(function (p, i) { return { name: p.name, color: palette[i], traits: p.traits }; });
    series.push({ name: T('group_strong'), color: '#10b981', traits: gs.strong.traits });

    return head(T('nav_compare'), T('select_two')) +
      '<div class="card"><div class="chips pick">' + people.map(function (p) {
        return '<button class="chip pickable ' + (compareSel.indexOf(p.id) >= 0 ? 'on' : '') + '" data-p="' + p.id + '">' +
          '<i style="background:' + p.color + '"></i>' + esc(p.name) + ' <small>' + esc(p.tag) + '</small></button>';
      }).join('') + '</div></div>' +
      '<div class="grid2"><div class="card">' + UI.radar(series, { size: 380 }) + '</div>' +
      '<div class="card"><table class="tbl"><thead><tr><th></th>' +
        series.map(function (x) { return '<th style="color:' + x.color + '">' + esc(x.name) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        TK.map(function (t) {
          return '<tr><td>' + Q.TRAITS[t].icon + ' ' + esc(lname(t)) + '</td>' +
            series.map(function (x) { var v = x.traits[t]; return '<td style="color:' + (v == null ? '#888' : UI.tone(v)) + '"><b>' + (v == null ? '—' : v) + '</b></td>'; }).join('') + '</tr>';
        }).join('') + '</tbody></table></div></div>' +
      compareSummary(s.employees, sel);
  }

  /* How much of this employee's picture we actually hold. Stated plainly so no
     analysis downstream is read as complete when it is not. */
  function dataQualityCard(e) {
    var dq = Engine.dataQuality(e);
    var color = dq.pct >= 90 ? '#10b981' : dq.pct >= 60 ? '#f59e0b' : '#ef4444';
    var label = { assessment: 'miss_assessment', target: 'miss_target', history6: 'miss_history6',
                  attendance: 'miss_attendance', manager_score: 'miss_manager', group: 'miss_group' };
    return '<div class="card"><h3>📋 ' + esc(T('data_quality')) + '</h3>' +
      '<div class="kpis">' + kpi('📋', dq.pct + '%', T('completeness'), color) + '</div>' +
      (dq.missing.length
        ? '<div class="chips">' + dq.missing.map(function (k) {
            return '<span class="chip" style="--c:#f59e0b"><i style="background:#f59e0b"></i>⚠ ' +
              esc(T(label[k])) + '</span>';
          }).join('') + '</div>'
        : '') + '</div>';
  }

  /* Where this employee sits below the people who actually hit target. Phrased
     as a gap to close against a benchmark, never as a verdict on the person,
     and ordered so traits that genuinely separate performers come first. */
  function devCard(e) {
    var dp = Engine.developmentPriorities(e, st().employees, hitThreshold);
    if (!dp || !dp.enough) return '';
    return '<div class="card"><h3>🎯 ' + esc(T('dev_priorities')) +
      ' <small class="muted">— ' + esc(T('benchmark_col')) + ': ' + dp.benchmarkN + ' ' +
      esc(T('hit_group')) + '</small></h3>' +
      (dp.rows.length
        ? '<div style="overflow-x:auto"><table class="tm-tbl"><thead><tr><th></th><th></th>' +
          '<th>' + esc(T('benchmark_col')) + '</th><th>' + esc(T('gap_col')) + '</th><th></th>' +
          '</tr></thead><tbody>' +
          dp.rows.map(function (r, i) {
            return '<tr><td><b>' + (i + 1) + '</b></td>' +
              '<td>' + Q.TRAITS[r.key].icon + ' ' + esc(lname(r.key)) + ' <b>' + r.value + '</b></td>' +
              '<td>' + r.benchmark + '</td>' +
              '<td class="tm-out"><b>' + r.gap + '</b></td>' +
              '<td>' + (r.matters
                ? '<span class="pill" style="--c:#10b981">' + esc(T('matters_tag')) + '</span>' : '') +
              '</td></tr>';
          }).join('') + '</tbody></table></div>'
        : '<p class="muted">' + esc(T('dev_none')) + '</p>') +
      '<p class="muted sm">' + esc(T('dev_note')) + '</p></div>';
  }

  /* Two people picked in Compare: say plainly where they differ and where they
     are effectively the same, so a long trait table is not read as 12 findings. */
  function compareSummary(employees, sel) {
    if (sel.length !== 2) return '';
    var find = function (id) {
      return employees.filter(function (e) { return 'E:' + e.id === id; })[0];
    };
    var cmp = Engine.compareEmployees(find(sel[0].id), find(sel[1].id));
    if (!cmp) return '';
    var row = function (r) {
      return '<div class="sim-row"><b>' + Q.TRAITS[r.key].icon + ' ' + esc(lname(r.key)) + '</b>' +
        '<span class="sim-v" style="color:' + (r.gap > 0 ? '#10b981' : '#fca5a5') + '">' +
        (r.gap > 0 ? '+' : '') + r.gap + '</span></div>';
    };
    return '<div class="card"><h3>🔥 ' + esc(T('major_diff')) + ' — ' +
      esc(sel[0].name) + (cmp.perf.a == null ? '' : ' (' + cmp.perf.a + '%)') + ' ' +
      esc(LL('مقابل', 'vs')) + ' ' + esc(sel[1].name) +
      (cmp.perf.b == null ? '' : ' (' + cmp.perf.b + '%)') + '</h3>' +
      (cmp.major.length
        ? cmp.major.map(row).join('')
        : '<p class="muted">' + esc(LL('لا فروقات جوهرية.', 'No material differences.')) + '</p>') +
      (cmp.similar.length
        ? '<p class="muted sm" style="margin-top:10px">⚪ ' + esc(T('similar_traits')) + ': ' +
          cmp.similar.map(function (r) { return esc(lname(r.key)); }).join(' · ') + '</p>'
        : '') + '</div>';
  }

  /* ================= SYSTEM HEALTH =================
     Items 34, 35, 73 and 74: what is failing and on whose device, rather than
     a manager finding out weeks later that results were quietly not landing. */
  function healthCard() {
    if (!srv()) return '';
    return '<div class="card" id="sysHealth"><h3>🛠 ' + esc(T('sys_health')) + '</h3>' +
      '<p class="muted sm">' + esc(T('loading')) + '</p></div>';
  }

  function fillHealth() {
    var box = document.getElementById('sysHealth');
    if (!box || !srv()) return;
    API.systemHealth().then(function (h) {
      var errColor = h.errors24h ? (h.errors24h > 5 ? '#ef4444' : '#f59e0b') : '#10b981';
      var complete = h.candidates ? Math.round(100 * h.candidatesCompleted / h.candidates) : null;
      box.innerHTML = '<h3>🛠 ' + esc(T('sys_health')) + '</h3>' +
        '<div class="kpis">' +
          kpi('🔴', h.errors24h, T('errors_24h'), errColor) +
          kpi('📅', h.errors7d, T('errors_7d'), h.errors7d ? '#f59e0b' : '#10b981') +
          kpi('🧪', h.assessments, T('kpi_tested'), '#3b82f6') +
          kpi('📊', complete == null ? '—' : complete + '%', T('completion_rate'), '#8b5cf6') +
          kpi('📈', h.monthsOfData, T('months_saved'), h.monthsOfData ? '#10b981' : '#f59e0b') +
        '</div>' +
        (h.byKind && h.byKind.length
          ? '<div class="chips">' + h.byKind.map(function (k) {
              return '<span class="chip" style="--c:#ef4444"><i style="background:#ef4444"></i>' +
                esc(k.kind) + ' <b>' + k.n + '</b></span>';
            }).join('') + '</div>' : '') +
        (h.recent && h.recent.length
          ? '<div style="overflow-x:auto"><table class="tm-tbl"><thead><tr>' +
            '<th>' + esc(T('date')) + '</th><th></th><th></th><th></th></tr></thead><tbody>' +
            h.recent.slice(0, 10).map(function (r) {
              return '<tr><td dir="ltr" style="white-space:nowrap">' + esc(String(r.at).slice(5, 16)) + '</td>' +
                '<td><span class="pill" style="--c:#ef4444">' + esc(r.kind) + '</span></td>' +
                '<td dir="ltr" style="max-width:340px">' + esc(String(r.message).slice(0, 140)) + '</td>' +
                '<td class="muted" dir="ltr">' + esc(deviceOf(r.ua)) +
                  (r.subject_id ? ' · ' + esc(r.subject_id) : '') + '</td></tr>';
            }).join('') + '</tbody></table></div>'
          : '<p class="muted">✓ ' + esc(T('no_errors')) + '</p>');
    })['catch'](function (err) {
      box.innerHTML = '<h3>🛠 ' + esc(T('sys_health')) + '</h3>' +
        '<p class="muted">' + esc(err.message) + '</p>';
    });
  }

  /* just enough of the user agent to tell an iPhone from a desktop */
  function deviceOf(ua) {
    ua = String(ua || '');
    var os = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android'
           : /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'macOS' : '?';
    var br = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome'
           : /Safari\//.test(ua) ? 'Safari' : /Firefox\//.test(ua) ? 'Firefox' : '?';
    return os + ' · ' + br;
  }

  /* ================= MONTHLY PERFORMANCE =================
     The real numbers the whole analysis rests on. Without these the target
     hitters screen has nothing to split on, so this is deliberately a fast
     grid rather than one field at a time: a year of months, tab across.

     Attainment is derived from target and sales as they are typed, so the
     manager enters the figures they actually have and the percentage follows. */
  function monthKeys(n) {
    var out = [], d = new Date(2026, 7, 1);   /* fixed reference, no clock read */
    for (var i = 0; i < n; i++) {
      var y = d.getFullYear(), m = d.getMonth() + 1;
      out.unshift(y + '-' + (m < 10 ? '0' : '') + m);
      d.setMonth(d.getMonth() - 1);
    }
    return out;
  }

  function monthlyModal(e) {
    var existing = {};
    (e.history || []).forEach(function (h) { existing[h.m] = h; });
    var months = monthKeys(12);
    /* keep any month already stored that falls outside the last twelve */
    Object.keys(existing).forEach(function (m) { if (months.indexOf(m) < 0) months.unshift(m); });
    months.sort();

    var cell = function (m, k, val, w) {
      return '<td><input data-m="' + m + '" data-c="' + k + '" type="number" ' +
        'value="' + (val == null ? '' : val) + '" style="width:' + (w || 64) + 'px;padding:5px 6px"></td>';
    };
    var rows = months.map(function (m) {
      var h = existing[m] || {};
      return '<tr><td><b dir="ltr">' + m + '</b></td>' +
        cell(m, 'target', h.target, 78) + cell(m, 'sales', h.sales, 78) +
        cell(m, 'deals', h.deals) +
        '<td><b class="pctOut" data-m="' + m + '" style="font-variant-numeric:tabular-nums">' +
          (h.pct == null ? '—' : h.pct + '%') + '</b>' +
          '<input data-m="' + m + '" data-c="pct" type="hidden" value="' + (h.pct == null ? '' : h.pct) + '"></td>' +
        cell(m, 'attendance', h.attendance) + cell(m, 'lateDays', h.lateDays) +
        cell(m, 'absence', h.absence) + cell(m, 'managerScore', h.managerScore) +
        '</tr>';
    }).join('');

    var h = '<div class="modal-bg"><div class="modal wide"><h3>' +
      esc(T('monthly_perf')) + ' — ' + esc(e.name) + '</h3>' +
      '<div style="overflow:auto;max-height:60vh"><table class="tm-tbl"><thead><tr>' +
        '<th>' + esc(T('month_col')) + '</th><th>' + esc(T('target_col')) + '</th>' +
        '<th>' + esc(T('sales_col')) + '</th><th>' + esc(T('deals_col')) + '</th>' +
        '<th>' + esc(T('pct_col')) + '</th><th>' + esc(T('attend_col')) + '</th>' +
        '<th>' + esc(T('late_col')) + '</th><th>' + esc(T('absence_col')) + '</th>' +
        '<th>' + esc(T('mgr_col')) + '</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="muted sm">' + esc(T('auto_pct_note')) + '</p>' +
      '<div class="modal-actions">' +
      '<button class="btn btn-primary" id="mhSave">' + esc(T('save')) + '</button>' +
      '<button class="btn btn-ghost" id="mhCancel">' + esc(T('cancel')) + '</button></div></div></div>';

    var node = UI.el(h);
    document.body.appendChild(node);

    /* attainment follows the figures as they are typed */
    var recompute = function (m) {
      var get = function (c) {
        var i = node.querySelector('[data-m="' + m + '"][data-c="' + c + '"]');
        return i && i.value !== '' ? Number(i.value) : null;
      };
      var t = get('target'), sa = get('sales');
      var outNode = node.querySelector('.pctOut[data-m="' + m + '"]');
      var hidden = node.querySelector('[data-m="' + m + '"][data-c="pct"]');
      if (t && sa != null) {
        var pct = Math.round(100 * sa / t);
        hidden.value = pct;
        outNode.textContent = pct + '%';
        outNode.style.color = UI.tone(Math.min(100, pct));
      } else if (!t && sa == null) {
        hidden.value = '';
        outNode.textContent = '—';
        outNode.style.color = '';
      }
    };
    UI.$$('input[data-c]', node).forEach(function (i) {
      i.oninput = function () { recompute(i.dataset.m); };
    });

    node.querySelector('#mhCancel').onclick = function () { node.remove(); };
    node.querySelector('#mhSave').onclick = function () {
      var byMonth = {};
      UI.$$('input[data-c]', node).forEach(function (i) {
        var m = i.dataset.m;
        byMonth[m] = byMonth[m] || { m: m };
        byMonth[m][i.dataset.c] = i.value === '' ? null : Number(i.value);
      });
      var history = Object.keys(byMonth).map(function (m) { return byMonth[m]; })
        .filter(function (r) {
          /* a month with nothing in it is not a month with zero performance */
          return r.pct != null || (r.target != null && r.sales != null);
        });
      node.remove();
      var patch = { id: e.id, name: e.name, branch: e.branch, dept: e.dept,
                    startDate: e.startDate, targetPct: e.targetPct, monthsAbove: e.monthsAbove,
                    monthsTotal: e.monthsTotal, attendance: e.attendance, lateDays: e.lateDays,
                    managerScore: e.managerScore, group: e.group, history: history };
      if (srv()) return push(API.saveEmployee(patch), '✔ ' + history.length + ' ' + T('months_saved'));
      Store.updateEmployee(e.id, { history: history });
      UI.toast('✔ ' + history.length + ' ' + T('months_saved'));
      body();
    };
  }

  /* ================= TARGET HITTERS =================
     The question the whole system exists to answer: what is different about
     the people who actually hit target? Membership is decided by measured
     attainment, never by the manager's label.

     The screen is built to resist the obvious mistake. Every trait shows its
     spread next to its mean, and a gap under five points is reported as "no
     real difference" instead of being presented as a cause of success. */
  var hitThreshold = 100;

  function hittersTab() {
    var s = st();
    var hd = Engine.hittersDNA(s.employees, hitThreshold);
    var sp = hd.split;
    var confColor = { high: '#10b981', medium: '#f59e0b', low: '#ef4444' }[hd.confidence];
    var vColorOf = { strong: '#10b981', moderate: '#22d3ee', slight: '#8ea0c4',
                     no_difference: '#8ea0c4', inverse: '#f59e0b', unknown: '#8ea0c4' };
    var vLabel = function (v) { return T('v_' + (v === 'no_difference' ? 'none' : v)); };

    var out = head(T('hitters_q'), T('hitters_sub'),
      '<span class="pill" style="--c:' + confColor + '">' + esc(T('confidence')) + ': ' +
      esc(T('conf_' + hd.confidence)) + '</span>');

    out += '<div class="card"><h3>' + esc(T('hit_threshold')) + '</h3>' +
      '<div class="chips pick">' + [90, 95, 100, 105, 110].map(function (v) {
        return '<button class="chip pickable ' + (hitThreshold === v ? 'on' : '') +
          '" data-th="' + v + '">' + v + '%</button>';
      }).join('') + '</div>' +
      '<div class="kpis" style="margin-top:12px">' +
        kpi('🏆', sp.hitters.length, T('hit_group') + ' (≥ ' + hitThreshold + '%)', '#10b981') +
        kpi('📉', sp.others.length, T('oth_group'), '#f59e0b') +
        kpi('🧬', sp.hitters.length + sp.others.length, T('kpi_tested'), '#3b82f6') +
      '</div>' +
      ((sp.assessedNoPerf || sp.perfNoAssessment)
        ? '<p class="muted sm">⚠ ' + esc(T('hit_missing')
            .replace('{a}', sp.assessedNoPerf).replace('{b}', sp.perfNoAssessment)) + '</p>'
        : '') +
      '</div>';

    if (!hd.enough) {
      return out + '<div class="card"><div class="alert warn-box">⚠ ' +
        esc(T('hit_not_enough')) + '</div></div>';
    }

    /* what actually separates them, and what merely looks like it does */
    out += '<div class="card"><h3>🔥 ' + esc(T('differentiators')) + '</h3>' +
      (hd.differentiators.length
        ? '<div class="chips">' + hd.differentiators.map(function (r) {
            return '<span class="chip"><i style="background:' + Q.TRAITS[r.key].color + '"></i>' +
              Q.TRAITS[r.key].icon + ' ' + esc(lname(r.key)) + ' <b>' +
              (r.gap > 0 ? '+' : '') + r.gap + '</b></span>';
          }).join('') + '</div>'
        : '<p class="muted">' + esc(LL('لا يوجد فارق واضح بعد', 'No clear gap yet')) + '</p>') +
      (hd.notDifferentiating.length
        ? '<p class="muted sm" style="margin-top:10px">⚪ ' + esc(T('v_none')) + ': ' +
          hd.notDifferentiating.map(function (r) {
            return esc(lname(r.key)) + ' (' + (r.gap > 0 ? '+' : '') + r.gap + ')';
          }).join(' · ') + '</p>'
        : '') +
      '<p class="muted sm">' + esc(T('hit_no_diff_note')) + '</p></div>';

    /* mean is never shown alone: median, SD and range come with it */
    out += '<div class="card"><h3>🧬 ' + esc(T('company_dna')) + '</h3>' +
      '<div style="overflow-x:auto"><table class="tm-tbl"><thead><tr>' +
        '<th></th><th>' + esc(T('hit_group')) + '</th><th>' + esc(T('oth_group')) + '</th>' +
        '<th>' + esc(T('gap_col')) + '</th><th>' + esc(T('median_col')) + '</th>' +
        '<th>' + esc(T('sd_col')) + '</th><th>' + esc(T('range_col')) + '</th><th></th>' +
      '</tr></thead><tbody>' +
      hd.rows.map(function (r) {
        var c = vColorOf[r.verdict];
        return '<tr><td><b>' + Q.TRAITS[r.key].icon + ' ' + esc(lname(r.key)) + '</b></td>' +
          '<td><b style="color:' + (r.hitters ? UI.tone(r.hitters.mean) : '#888') + '">' +
            (r.hitters ? r.hitters.mean : '—') + '</b></td>' +
          '<td>' + (r.others ? r.others.mean : '—') + '</td>' +
          '<td><b style="color:' + c + '">' + (r.gap == null ? '—' : (r.gap > 0 ? '+' : '') + r.gap) + '</b></td>' +
          '<td>' + (r.hitters ? r.hitters.median : '—') + '</td>' +
          '<td>' + (r.hitters ? r.hitters.sd : '—') + '</td>' +
          '<td dir="ltr">' + (r.hitters ? r.hitters.min + '–' + r.hitters.max : '—') + '</td>' +
          '<td><span class="pill" style="--c:' + c + '">' + esc(vLabel(r.verdict)) + '</span>' +
            (r.shared ? ' <small class="muted">' + esc(T('sh_' + r.shared)) + '</small>' : '') +
          '</td></tr>';
      }).join('') + '</tbody></table></div></div>';

    /* the two profiles on one radar */
    var hT = {}, oT = {};
    hd.rows.forEach(function (r) {
      hT[r.key] = r.hitters ? r.hitters.mean : null;
      oT[r.key] = r.others ? r.others.mean : null;
    });
    out += '<div class="card">' + UI.radar([
      { name: T('hit_group'), color: '#10b981', traits: hT },
      { name: T('oth_group'), color: '#f59e0b', traits: oT }
    ], { size: 380 }) + '</div>';

    return out;
  }

  function bindHitters(m) {
    UI.$$('[data-th]', m).forEach(function (b) {
      b.onclick = function () { hitThreshold = Number(b.dataset.th); body(); };
    });
  }

  function bindCompare(m) {
    UI.$$('[data-p]', m).forEach(function (b) {
      b.onclick = function () {
        var id = b.dataset.p, i = compareSel.indexOf(id);
        if (i >= 0) compareSel.splice(i, 1); else { if (compareSel.length >= 4) compareSel.shift(); compareSel.push(id); }
        body();
      };
    });
  }

  /* ================= SETTINGS ================= */
  function settings() {
    var s = st();
    return head(T('nav_settings'), 'SALES DNA · local demo data') +
      '<div class="grid2">' +
      '<div class="card"><h3>' + esc(T('thresholds')) + '</h3>' +
        '<label class="fld"><span>🟢 ' + esc(T('band_high')) + ' ≥</span><input id="thHigh" type="number" value="' + s.settings.thresholds.high + '"></label>' +
        '<label class="fld"><span>🟡 ' + esc(T('band_mid')) + ' ≥</span><input id="thMid" type="number" value="' + s.settings.thresholds.mid + '"></label>' +
        '<label class="fld"><span>🚦 ' + esc(T('stage1_th')) + '</span><select id="thStage1">' +
          [55, 60, 65, 70, 75, 80].map(function (v) {
            return '<option value="' + v + '"' + (s.settings.thresholds.stage1 === v ? ' selected' : '') + '>' + v + '%</option>';
          }).join('') + '</select></label>' +
        '<label class="fld"><span>🧠 ' + esc(T('focus_title')) + '</span><select id="fxOn">' +
          '<option value="1"' + (s.settings.focusEnabled ? ' selected' : '') + '>' + esc(UI.getLang() === 'en' ? 'Enabled' : 'مفعّل') + '</option>' +
          '<option value="0"' + (s.settings.focusEnabled ? '' : ' selected') + '>' + esc(UI.getLang() === 'en' ? 'Disabled' : 'معطّل') + '</option></select></label>' +
        '<label class="fld"><span>⚖ ' + esc(T('focus_weight')) + '</span><select id="fxW">' +
          [0, 5, 10, 15].map(function (v) {
            return '<option value="' + v + '"' + ((s.settings.focusWeight || 0) === v ? ' selected' : '') + '>' + v + '%</option>';
          }).join('') + '</select></label>' +
        '<label class="fld"><span>⏱ ' + esc(T('timer_on')) + '</span><select id="tmOn">' +
          '<option value="1"' + (s.settings.timerEnabled !== false ? ' selected' : '') + '>' + esc(UI.getLang() === 'en' ? 'Enabled' : 'مفعّل') + '</option>' +
          '<option value="0"' + (s.settings.timerEnabled === false ? ' selected' : '') + '>' + esc(UI.getLang() === 'en' ? 'Disabled' : 'معطّل') + '</option></select></label>' +
        '<label class="fld"><span>⌛ ' + esc(T('level_secs')) + '</span><select id="tmSecs">' +
          [120, 150, 180, 240, 300].map(function (v) {
            var mm = Math.floor(v / 60) + ':' + (v % 60 < 10 ? '0' : '') + (v % 60);
            return '<option value="' + v + '"' + ((Number(s.settings.levelSeconds) || 180) === v ? ' selected' : '') + '>' + mm + '</option>';
          }).join('') + '</select></label>' +
        '<p class="muted sm">⏱ ' + esc(T('timer_note')) + '</p>' +
        '<p class="muted sm">' + esc(T('open_anyway')) + ' · ' + esc(T('focus_note')) + '</p>' +
        '<button class="btn btn-primary" id="saveTh">' + esc(T('save')) + '</button></div>' +
      '<div class="card"><h3>PIN</h3>' +
        '<label class="fld"><span>' + esc(T('pin_new')) + '</span>' +
          '<input id="pinIn" type="password" autocomplete="new-password" placeholder="••••••••"></label>' +
        '<p class="muted sm">🔒 ' + esc(T('pin_stored')) + '</p>' +
        '<button class="btn btn-primary" id="savePin">' + esc(T('save')) + '</button>' +
        '<p class="muted sm">' + esc(T('pin_note')) + '</p>' +
        '<h3 style="margin-top:18px">' + esc(T('reg_title')) + '</h3>' +
        '<label class="fld"><span>' + esc(T('phone')) + '</span><select id="reqPhone">' +
          '<option value="0"' + (s.settings.requirePhone ? '' : ' selected') + '>' + esc(UI.getLang() === 'en' ? 'Optional' : 'اختياري') + '</option>' +
          '<option value="1"' + (s.settings.requirePhone ? ' selected' : '') + '>' + esc(UI.getLang() === 'en' ? 'Required' : 'إلزامي') + '</option></select></label>' +
        '<label class="fld"><span>' + esc(T('email')) + '</span><select id="reqMail">' +
          '<option value="0"' + (s.settings.requireEmail ? '' : ' selected') + '>' + esc(UI.getLang() === 'en' ? 'Optional' : 'اختياري') + '</option>' +
          '<option value="1"' + (s.settings.requireEmail ? ' selected' : '') + '>' + esc(UI.getLang() === 'en' ? 'Required' : 'إلزامي') + '</option></select></label>' +
        '<p class="muted sm">' + esc(UI.getLang() === 'en' ? 'The full name is always required for a candidate.' : 'الاسم الكامل إلزامي دائماً للمرشح.') + '</p>' +
        '<h3 style="margin-top:18px">DATA</h3>' +
        '<div class="btn-row"><button class="btn" id="expBtn">⬇ ' + esc(T('export_')) + '</button>' +
        '<button class="btn" id="impBtn">⬆ ' + esc(T('import_')) + '</button>' +
        '<button class="btn" id="resetBtn">↺ ' + esc(T('reset_demo')) + '</button>' +
        '<button class="btn btn-danger" id="wipeBtn">🗑 ' + esc(T('clear_all')) + '</button></div>' +
        '<input type="file" id="impFile" accept="application/json" hidden></div>' +
      '</div>' +
      '<div class="card"><h3>WEIGHTS</h3><p class="muted sm">' + (s.settings.weights ? esc(T('apply_weights')) : esc(T('auto_weights'))) + '</p>' +
      UI.bars(TK.map(function (t) {
        var w = Engine.activeWeights(s)[t];
        return { label: lname(t), icon: Q.TRAITS[t].icon, value: Math.round(w * 100 * 4), color: Q.TRAITS[t].color };
      })) + '</div>';
  }

  function bindSettings(m) {
    document.getElementById('saveTh').onclick = function () {
      var s = st();
      s.settings.thresholds.high = Number(document.getElementById('thHigh').value);
      s.settings.thresholds.mid = Number(document.getElementById('thMid').value);
      s.settings.thresholds.stage1 = Number(document.getElementById('thStage1').value);
      s.settings.focusEnabled = document.getElementById('fxOn').value === '1';
      s.settings.focusWeight = Number(document.getElementById('fxW').value);
      s.settings.timerEnabled = document.getElementById('tmOn').value === '1';
      s.settings.levelSeconds = Number(document.getElementById('tmSecs').value);
      if (srv()) return push(API.saveSettings({
        thresholds: s.settings.thresholds, focusEnabled: s.settings.focusEnabled,
        focusWeight: s.settings.focusWeight,
        timerEnabled: s.settings.timerEnabled, levelSeconds: s.settings.levelSeconds
      }), '✔');
      Store.save(); UI.toast('✔'); body();
    };
    document.getElementById('savePin').onclick = function () {
      var ss = st().settings;
      ss.requirePhone = document.getElementById('reqPhone').value === '1';
      ss.requireEmail = document.getElementById('reqMail').value === '1';
      var np = document.getElementById('pinIn').value;
      if (srv()) {
        var chain = API.saveSettings({ requirePhone: ss.requirePhone, requireEmail: ss.requireEmail });
        if (np) {
          if (np.length < 8) return UI.toast(LL('كلمة السر يجب أن تكون 8 أحرف على الأقل',
                                                'The passphrase must be at least 8 characters'), 'bad');
          chain = chain.then(function () { return API.setManagerPass(np); });
          document.getElementById('pinIn').value = '';
        }
        return push(chain, np ? T('pin_saved') : '✔');
      }
      if (np) {
        if (np.length < 6) { Store.save(); return UI.toast(T('pin_short'), 'bad'); }
        UI.hashPass(np, function (h) {
          if (h.sha) ss.pinSha = h.sha;
          ss.pinFnv = h.fnv;
          document.getElementById('pinIn').value = '';
          Store.save(); UI.toast(T('pin_saved'));
        });
        return;
      }
      Store.save(); UI.toast('✔');
    };
    document.getElementById('expBtn').onclick = function () {
      var blob = new Blob([JSON.stringify(st(), null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'sales-dna-data.json'; a.click();
    };
    document.getElementById('impBtn').onclick = function () { document.getElementById('impFile').click(); };
    document.getElementById('impFile').onchange = function (ev) {
      var f = ev.target.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        var data;
        try { data = JSON.parse(r.result); } catch (e) { return UI.toast('JSON ✗', 'bad'); }
        if (!data || typeof data !== 'object') return UI.toast('JSON ✗', 'bad');

        /* In server mode writing to localStorage would change nothing that
           anyone else can see, so the file goes to the database instead. */
        if (srv()) {
          return push(API.importState(data).then(function (res) {
            var n = (res && res.report) || {};
            UI.toast('✔ ' + LL('مرشحون جدد: ', 'new candidates: ') + (n.candidatesAdded || 0) +
                     ' · ' + LL('موظفون محدَّثون: ', 'employees updated: ') + (n.employeesUpdated || 0));
          }), null);
        }
        localStorage.setItem(Store.KEY, JSON.stringify(data)); Store.load();
        UI.toast('✔'); body();
      };
      r.readAsText(f);
    };
    document.getElementById('resetBtn').onclick = function () {
      if (srv()) return UI.toast(LL('غير متاح في وضع السيرفر — البيانات مركزية.',
                                    'Not available in server mode — the data is centralised.'), 'bad');
      Store.reset(); UI.toast('✔'); body();
    };
    document.getElementById('wipeBtn').onclick = function () {
      if (srv()) return UI.toast(LL('غير متاح في وضع السيرفر — البيانات مركزية.',
                                    'Not available in server mode — the data is centralised.'), 'bad');
      Store.wipe(); UI.toast('✔'); body();
    };
  }

  root.SDNA.Manager = { open: open };
})(window);
