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
    { k: 'pattern', i: '🤖', t: 'nav_pattern' },
    { k: 'compare', i: '⚖️', t: 'nav_compare' },
    { k: 'questions', i: '❓', t: 'nav_questions' },
    { k: 'settings', i: '⚙️', t: 'nav_settings' }
  ];

  function st() { return Store.get(); }
  function empDNA(e) { return e.assessment ? Engine.dna(e.assessment.answers) : null; }
  function candDNA(c) { var a = Engine.candAnswers(c); return a.length ? Engine.dna(a) : null; }
  function lname(t) { return UI.getLang() === 'he' ? Q.TRAITS[t].he : Q.TRAITS[t].ar; }
  function gname(g) { return T(g === 'strong' ? 'group_strong' : g === 'medium' ? 'group_medium' : 'group_low'); }
  function gcolor(g) { return g === 'strong' ? '#10b981' : g === 'medium' ? '#3b82f6' : '#ef4444'; }

  function open() { app = document.getElementById('app'); tab = 'dash'; view = null; render(); }

  function render() {
    app.innerHTML =
      '<div class="mgr">' +
        '<aside class="mgr-nav">' +
          '<div class="mgr-logo"><b>SALES<span>DNA</span></b><small>INTELLIGENCE</small></div>' +
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
    var fns = { dash: dash, emp: employees, cand: candidates, dna: companyDNA, pattern: patterns, questions: questions, compare: compare, settings: settings };
    m.innerHTML = fns[tab]();
    ({ emp: bindEmployees, cand: bindCandidates, pattern: bindPatterns, compare: bindCompare, settings: bindSettings, dash: bindDash })[tab] &&
      ({ emp: bindEmployees, cand: bindCandidates, pattern: bindPatterns, compare: bindCompare, settings: bindSettings, dash: bindDash })[tab](m);
  }

  function head(title, sub, extra) {
    return '<div class="mgr-head"><div><h1>' + esc(title) + '</h1>' +
      (sub ? '<p class="muted">' + esc(sub) + '</p>' : '') + '</div>' + (extra || '') + '</div>';
  }

  /* ================= DASHBOARD ================= */
  function dash() {
    var s = st();
    var tested = s.employees.filter(function (e) { return e.assessment; }).length;
    var g = { strong: 0, medium: 0, low: 0 };
    s.employees.forEach(function (e) { g[e.group]++; });
    var cands = s.candidates;
    var high = cands.filter(function (c) {
      var r = c.nc ? Engine.candidateReport(c, s) : null; return r && r.band === 'high';
    }).length;
    var gs = Engine.groupStats(s.employees);
    var pred = Engine.predictions(s);

    var funnel = [
      { l: UI.getLang() === 'he' ? 'מועמדים' : 'مرشحون', v: cands.length },
      { l: UI.getLang() === 'he' ? 'סיימו 25 שאלות' : 'أكملوا 25 سؤالاً', v: cands.filter(function (c) { return c.nc; }).length },
      { l: UI.getLang() === 'he' ? 'סיימו Focus' : 'أكملوا تحدي التركيز', v: cands.filter(function (c) { return c.focus; }).length },
      { l: UI.getLang() === 'he' ? 'התאמה בינונית+' : 'تطابق متوسط فأعلى', v: cands.filter(function (c) { var r = c.nc ? Engine.candidateReport(c, s) : null; return r && r.band !== 'low'; }).length },
      { l: UI.getLang() === 'he' ? 'ראיון' : 'مقابلة', v: cands.filter(function (c) { return c.stage >= 5; }).length },
      { l: UI.getLang() === 'he' ? 'התקבלו' : 'تم توظيفهم', v: cands.filter(function (c) { return c.decision === 'hired'; }).length }
    ];
    var maxF = funnel[0].v || 1;

    return head('SALES INTELLIGENCE', UI.getLang() === 'he' ? 'תמונת מצב של הצוות והמועמדים' : 'صورة عامة عن الفريق والمرشحين') +
      '<div class="kpis">' +
        kpi('👥', tested + '/' + s.employees.length, T('kpi_tested'), '#3b82f6') +
        kpi('🔥', g.strong, T('kpi_strong'), '#10b981') +
        kpi('⚡', g.medium, T('kpi_medium'), '#3b82f6') +
        kpi('⬇', g.low, T('kpi_low'), '#ef4444') +
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
            : '<p class="muted">' + esc(UI.getLang() === 'he' ? 'אין עדיין נתוני מעקב לאחר קליטה. הוסף מעקב בכרטיס מועמד שהתקבל.' : 'لا توجد بيانات متابعة بعد التوظيف. أضف متابعة من بطاقة مرشّح تم توظيفه.') + '</p>') +
        '</div>' +
      '</div>';
  }
  function bindDash() {}

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
  function employees() {
    var s = st();
    var rows = s.employees.map(function (e) {
      var d = empDNA(e);
      var bc = Engine.benchmarkCheck(e);
      return '<tr data-emp="' + e.id + '">' +
        '<td><b>' + esc(e.name) + '</b><small class="muted"> · ' + esc(e.code) + '</small></td>' +
        '<td>' + esc(e.dept) + '</td>' +
        '<td><span class="pill" style="--c:' + gcolor(e.group) + '">' + esc(gname(e.group)) + '</span>' +
          (bc.mismatch ? ' <span class="warn" title="' + esc(T('data_conflict')) + '">⚠</span>' : '') + '</td>' +
        '<td>' + e.targetPct + '%</td>' +
        '<td>' + e.attendance + '%</td>' +
        '<td>' + e.lateDays + '</td>' +
        '<td>' + e.managerScore + '/10</td>' +
        '<td>' + (d ? '<b style="color:' + UI.tone(d.overall) + '">' + d.overall + '</b>' : '<span class="muted">' + esc(T('no_assessment')) + '</span>') + '</td>' +
        '<td><button class="btn btn-xs" data-open="' + e.id + '">' + esc(T('view')) + '</button></td></tr>';
    }).join('');

    return head(T('nav_emp'), UI.getLang() === 'he' ? 'סיווג מנהל + נתונים אובייקטיביים + DNA' : 'تصنيف المدير + بيانات موضوعية + DNA',
      '<button class="btn btn-primary" id="addEmp">+ ' + esc(T('add_emp')) + '</button>') +
      '<div class="card"><table class="tbl"><thead><tr>' +
      ['name', 'dept', 'perf', 'target_pct', 'attendance', 'late', 'mgr_score', 'dna_score', ''].map(function (k) {
        return '<th>' + (k ? esc(T(k)) : '') + '</th>';
      }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  function bindEmployees(m) {
    UI.$$('[data-open]', m).forEach(function (b) {
      b.onclick = function () { view = { type: 'emp', id: b.dataset.open }; body(); };
    });
    var add = document.getElementById('addEmp');
    if (add) add.onclick = function () { empForm(null); };
  }

  function empForm(e) {
    var isNew = !e;
    e = e || { name: '', code: '', dept: 'B2B', targetPct: 100, attendance: 95, lateDays: 0, managerScore: 7, monthsAbove: 6, monthsTotal: 12, group: 'medium', startDate: '2026-01-01' };
    var h = '<div class="modal-bg"><div class="modal"><h3>' + esc(isNew ? T('add_emp') : e.name) + '</h3>' +
      '<div class="form">' +
      f('name', T('full_name'), e.name) + f('code', T('emp_code'), e.code || '') +
      f('dept', T('dept'), e.dept) + f('startDate', UI.getLang() === 'he' ? 'תאריך תחילה' : 'تاريخ البدء', e.startDate, 'date') +
      f('targetPct', T('target_pct'), e.targetPct, 'number') +
      f('monthsAbove', UI.getLang() === 'he' ? 'חודשים מעל היעד' : 'أشهر فوق الهدف', e.monthsAbove, 'number') +
      f('attendance', T('attendance'), e.attendance, 'number') +
      f('lateDays', T('late'), e.lateDays, 'number') +
      f('managerScore', T('mgr_score'), e.managerScore, 'number') +
      '<label class="fld"><span>' + esc(T('perf')) + '</span><select data-k="group">' +
        ['strong', 'medium', 'low'].map(function (g) {
          return '<option value="' + g + '"' + (e.group === g ? ' selected' : '') + '>' + esc(gname(g)) + '</option>';
        }).join('') + '</select></label>' +
      '</div><div class="modal-actions">' +
      '<button class="btn btn-primary" id="mSave">' + esc(T('save')) + '</button>' +
      (isNew ? '' : '<button class="btn btn-danger" id="mDel">' + esc(T('delete_')) + '</button>') +
      '<button class="btn btn-ghost" id="mCancel">' + esc(T('cancel')) + '</button></div></div></div>';
    var node = UI.el(h);
    document.body.appendChild(node);
    node.querySelector('#mCancel').onclick = function () { node.remove(); };
    var del = node.querySelector('#mDel');
    if (del) del.onclick = function () { Store.removeEmployee(e.id); node.remove(); view = null; body(); };
    node.querySelector('#mSave').onclick = function () {
      var patch = {};
      UI.$$('[data-k]', node).forEach(function (i) {
        var v = i.value;
        patch[i.dataset.k] = i.type === 'number' ? Number(v) : v;
      });
      if (!patch.name) return UI.toast(T('fill_all'), 'bad');
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
      head(e.name, e.dept + ' · ' + e.code + ' · ' + e.startDate,
        '<div><button class="btn" id="editEmp">✎</button> <button class="btn" onclick="window.print()">' + esc(T('print')) + '</button></div>');
    out += '<div class="grid2">';
    out += '<div class="card"><h3>PERFORMANCE</h3>' +
      '<div class="kpis sm">' + kpi('🎯', e.targetPct + '%', T('target_pct'), '#3b82f6') +
      kpi('📅', e.monthsAbove + '/' + e.monthsTotal, UI.getLang() === 'he' ? 'חודשים מעל היעד' : 'أشهر فوق الهدف', '#10b981') +
      kpi('🕘', e.attendance + '%', T('attendance'), '#22d3ee') +
      kpi('⏰', e.lateDays, T('late'), '#f59e0b') +
      kpi('⭐', e.managerScore + '/10', T('mgr_score'), '#8b5cf6') + '</div>' +
      '<div class="split"><div><small class="muted">' + esc(T('manager_says')) + '</small><br><span class="pill" style="--c:' + gcolor(e.group) + '">' + esc(gname(e.group)) + '</span></div>' +
      '<div><small class="muted">' + esc(T('data_says')) + '</small><br><span class="pill" style="--c:' + gcolor(bc.dataGroup) + '">' + esc(gname(bc.dataGroup)) + '</span></div></div>' +
      (bc.mismatch ? '<div class="alert warn-box">⚠ ' + esc(T('data_conflict')) + '</div>' : '') +
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
        '<p class="muted sm">' + esc(UI.getLang() === 'he' ? 'העובד יכול להיכנס למשחק עם הקוד שלו מהמסך הראשי.' : 'يستطيع الموظف الدخول إلى التحدي باستخدام كوده من الشاشة الرئيسية.') + '</p></div>';
    }
    out += '</div>';
    out += '<div class="card"><h3>🧠 ' + esc(T('focus_title')) + '</h3>' +
      (e.focus ? '<div class="focus-head">' + UI.ring(e.focus.focus, 'FOCUS', 110) +
        '<div class="focus-subs">' + ['visual', 'speed', 'accuracy', 'recall'].map(function (k) {
          var SUB = root.SDNA.Focus.SUB;
          return '<div class="fsub"><small>' + esc(UI.getLang() === 'he' ? SUB[k].he : SUB[k].ar) + '</small>' +
            '<b style="color:' + UI.tone(e.focus.sub[k]) + '">' + e.focus.sub[k] + '</b></div>';
        }).join('') + '</div></div>'
        : '<p class="muted">' + esc(T('focus_nodata')) + '</p>') +
      '<button class="btn" data-focus-emp="' + e.id + '">▶ ' + esc(T('play_focus')) + '</button></div>';
    return out;
  }

  function bindEmp(m) {
    var b = document.getElementById('back'); if (b) b.onclick = function () { view = null; body(); };
    var ed = document.getElementById('editEmp');
    if (ed) ed.onclick = function () { empForm(st().employees.filter(function (x) { return x.id === view.id; })[0]); };
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
        '<td>' + (rep && rep.sims.strong != null ? '<b style="color:' + UI.tone(rep.sims.strong) + '">' + rep.sims.strong + '%</b>' : '—') + '</td>' +
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
      }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  function stageTag(c) {
    var lang = UI.getLang();
    var txt = c.decision === 'hired' ? (lang === 'he' ? 'התקבל' : 'تم التوظيف')
            : c.decision === 'interview' ? (lang === 'he' ? 'ראיון' : 'مقابلة')
            : c.decision === 'reject' ? (lang === 'he' ? 'נעצר' : 'متوقف')
            : c.focus ? (lang === 'he' ? 'הושלם + פוקוס' : 'مكتمل + التركيز')
            : c.nc ? (lang === 'he' ? 'הושלם' : 'مكتمل')
            : (lang === 'he' ? 'נרשם' : 'مسجّل');
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
    var dn = function (k) { return lang === 'he' ? D[k].he : D[k].ar; };
    var strong = rep.groups.strong.dims;
    var rec = rep.band === 'high' ? T('rec_proceed') : rep.band === 'mid' ? T('rec_review') : T('rec_low');

    out += head(c.name, c.phone + ' · ' + c.email + ' · ' + c.createdAt,
      '<button class="btn" onclick="window.print()">' + esc(T('print')) + '</button>');

    /* hero */
    out += '<div class="match-hero ' + rep.band + '">' +
      '<div>' + UI.ring(sc.match, 'SALES DNA', 140) + '</div>' +
      '<div class="mh-info"><b>' + esc(T('band_' + rep.band)) + '</b>' +
        '<div class="mh-sims">' +
          simChip(T('group_strong'), rep.sims.strong, '#10b981') +
          simChip(T('group_medium'), rep.sims.medium, '#3b82f6') +
          simChip(T('group_low'), rep.sims.low, '#ef4444') +
        '</div>' +
        '<div class="mh-sims"><span class="chip">' + esc(T('consistency_idx')) + ': <b style="color:' +
          UI.tone(sc.consistency || 0) + '">' + (sc.consistency == null ? '—' : sc.consistency + '%') + '</b></span>' +
          (c.focus ? '<span class="chip">🧠 ' + esc(T('focus_score')) + ': <b style="color:' + UI.tone(c.focus.focus) + '">' +
            c.focus.focus + '</b></span>' : '') +
          '<span class="chip">' + esc(T('run_25')) + '</span></div>' +
        '<div class="rec-box ' + rep.band + '">' + esc(T('recommendation')) + ': <b>' + esc(rec) + '</b></div>' +
      '</div></div>';

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
        '<p class="muted sm">▍ ' + esc(lang === 'he' ? 'הסימון האנכי = ממוצע העובדים החזקים' : 'الخط العمودي = متوسط الموظفين الأقوياء') + '</p>' +
      '</div>' +
      '<div class="card"><h3>' + esc(T('vs_strong')) + '</h3>' +
        UI.radar([{ name: c.name, color: '#8b5cf6', traits: sc.dims },
                  { name: T('group_strong'), color: '#10b981', traits: strong }],
                 { size: 340, keys: NC.DIM_KEYS, dict: D }) + '</div>' +
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
      '<label class="fld"><span>' + esc(UI.getLang() === 'he' ? 'יום' : 'اليوم') + '</span><select id="fuDay"><option>30</option><option>90</option><option>180</option></select></label>' +
      '<label class="fld"><span>' + esc(T('target_pct')) + '</span><input id="fuTarget" type="number" value="100"></label>' +
      '<button class="btn" id="fuAdd">' + esc(T('add_followup')) + '</button></div>' +
      (c.followups && c.followups.length ? '<table class="tbl sm"><tbody>' + c.followups.map(function (f) {
        return '<tr><td>' + f.day + ' ' + (UI.getLang() === 'he' ? 'ימים' : 'يوم') + '</td><td>' + f.targetPct + '%</td></tr>';
      }).join('') + '</tbody></table>' : '') +
      '</div></div>';
    return out;
  }

  /* 🟢 / 🟡 / 🔴 cards — benchmark wording, never a personal verdict */
  function flagCards(sc, strong, lang) {
    var D = NC.DIMS, out = [];
    var hard = sc.flags.map(function (f) {
      return { dot: f.sev >= 3 ? '🔴' : '🟡', txt: lang === 'he' ? f.he : f.ar, sev: f.sev };
    });
    if (!hard.length) {
      out.push({ dot: '🟢', txt: lang === 'he' ? 'לא זוהתה בעיית מחויבות מהותית' : 'لا توجد مشكلة التزام جوهرية', sev: 0 });
    }
    NC.DIM_KEYS.forEach(function (k) {
      var v = sc.dims[k], b = strong[k];
      if (v == null || b == null) return;
      var name = lang === 'he' ? D[k].he : D[k].ar;
      var d = v - b;
      if (d >= 6) out.push({ dot: '🟢', txt: (lang === 'he' ? 'גבוה מהבנצ׳מרק ב' : 'أعلى من معيار الأقوياء في ') + name + ' (' + v + ' / ' + b + ')', sev: 0 });
      else if (d >= -4) out.push({ dot: '🟢', txt: name + (lang === 'he' ? ' בקו עם העובדים החזקים' : ' بمستوى الموظفين الأقوياء') + ' (' + v + ' / ' + b + ')', sev: 0 });
      else if (d >= -14) out.push({ dot: '🟡', txt: name + (lang === 'he' ? ' מעט מתחת לבנצ׳מרק' : ' أقل قليلاً من معيار الأقوياء') + ' (' + v + ' / ' + b + ')', sev: 1 });
      else out.push({ dot: '🔴', txt: name + (lang === 'he' ? ' נמוך משמעותית מהבנצ׳מרק' : ' أقل بوضوح من معيار الأقوياء') + ' (' + v + ' / ' + b + ')', sev: 2 });
    });
    if (sc.consistency != null && sc.consistency < 70) {
      out.push({ dot: '🔴', txt: (lang === 'he' ? 'עקביות נמוכה בין שאלות ההצלבה' : 'اتساق منخفض في أسئلة التقاطع') + ' (' + sc.consistency + '%)', sev: 2 });
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
            return '<div class="fsub"><small>' + esc(lang === 'he' ? SUB[k].he : SUB[k].ar) + '</small>' +
              '<b style="color:' + UI.tone(f.sub[k]) + '">' + f.sub[k] + '</b></div>';
          }).join('') +
        '</div></div>' +
      '<div class="focus-raw">' +
        rawItem('👁 ' + (lang === 'he' ? 'הבדלים שנמצאו' : 'الاختلافات التي وُجدت'), f.raw.found + '/' + f.raw.total) +
        rawItem('⏱ ' + (lang === 'he' ? 'זיהוי ראשון' : 'أول اكتشاف'), (f.raw.first != null ? f.raw.first + 's' : '—')) +
        rawItem('⏳ ' + (lang === 'he' ? 'זמן כולל' : 'الوقت الكلي'), (f.raw.elapsed || 0) + 's') +
        rawItem('❌ ' + (lang === 'he' ? 'לחיצות שגויות' : 'ضغطات خاطئة'), f.raw.wrong) +
        rawItem('⚡ ' + (lang === 'he' ? 'תשובות נכונות (Quick Scan)' : 'إجابات صحيحة (Quick Scan)'), f.raw.scanCorrect + '/' + f.raw.scanTotal) +
        rawItem('🕒 ' + (lang === 'he' ? 'זמן תגובה ממוצע' : 'متوسط زمن الرد'), f.raw.scanAvg + 's') +
      '</div>' +
      (bench != null ? '<div class="alert ' + (verdict === 'focus_below' ? 'warn-box' : 'ok-box') + '">' +
        esc(T('focus_bench')) + ': <b>' + esc(T(verdict)) + '</b> — ' +
        esc(lang === 'he' ? 'ממוצע צוות ' : 'متوسط الفريق ') + bench + ' (' + fs.all.n + ')' +
        '</div>' : '') +
      '<table class="tbl sm"><thead><tr><th></th><th>FOCUS</th><th>n</th></tr></thead><tbody>' +
        ['strong', 'medium', 'low'].map(function (g) {
          return '<tr><td><span class="pill" style="--c:' + gcolor(g) + '">' + esc(gname(g)) + '</span></td>' +
            '<td>' + (fs[g].focus == null ? '—' : fs[g].focus) + '</td><td class="muted">' + fs[g].n + '</td></tr>';
        }).join('') + '</tbody></table>' +
      '<p class="muted sm">' + esc(fs.reliable
        ? (lang === 'he' ? 'קיים פער עקבי בין חזקים לחלשים במדד הזה — עדיין לא נכנס לציון ההתאמה.'
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
      var c = st().candidates.filter(function (x) { return x.id === view.id; })[0];
      c.followups = c.followups || [];
      c.followups.push({ day: Number(document.getElementById('fuDay').value), targetPct: Number(document.getElementById('fuTarget').value) });
      Store.save(); body();
    };
  }

  /* ================= COMPANY DNA ================= */
  function companyDNA() {
    var s = st(), gs = Engine.groupStats(s.employees);
    return head(T('company_dna'), UI.getLang() === 'he' ? 'הפרופיל שנבנה מכלל העובדים שנבדקו' : 'البروفايل المبني من كل الموظفين الذين تم فحصهم') +
      '<div class="grid2">' +
      '<div class="card"><h3>COMPANY SALES DNA <small class="muted">(n=' + gs.company.n + ')</small></h3>' +
        UI.bars(TK.map(function (t) { return { label: lname(t), icon: Q.TRAITS[t].icon, value: gs.company.traits[t], color: Q.TRAITS[t].color }; })) + '</div>' +
      '<div class="card"><h3>STRONG vs MEDIUM vs LOW</h3>' +
        UI.radar([
          { name: T('group_strong') + ' (' + gs.strong.n + ')', color: '#10b981', traits: gs.strong.traits },
          { name: T('group_medium') + ' (' + gs.medium.n + ')', color: '#3b82f6', traits: gs.medium.traits },
          { name: T('group_low') + ' (' + gs.low.n + ')', color: '#ef4444', traits: gs.low.traits }
        ], { size: 360 }) + '</div></div>' +
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

  /* ================= PATTERNS ================= */
  function patterns() {
    var s = st(), lw = Engine.learnWeights(s.employees);
    var order = TK.slice().sort(function (a, b) { return lw.separation[b] - lw.separation[a]; });
    var qp = Engine.questionPower(s.employees);
    return head('AI PATTERN DISCOVERY', UI.getLang() === 'he' ? 'מה באמת מבדיל בין חזקים לחלשים' : 'ما الذي يفرّق فعلاً بين الأقوياء والضعفاء',
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
          return '<span class="chip">' + NC.DIMS[k].icon + ' ' + esc(UI.getLang() === 'he' ? NC.DIMS[k].he : NC.DIMS[k].ar) + ' <b>' + w + '%</b></span>';
        }).join('') + '<span class="chip">' + esc(T('consistency_idx')) + ' <b>' + NC.CONSISTENCY_W + '%</b></span></div>' +
        '<div class="btn-row"><button class="btn" id="calW">⚖ ' + esc(T('calibrate')) + '</button>' +
        '<button class="btn btn-ghost" id="resetNcW">↺</button></div>' +
        (lw.learned ? '' : '<p class="muted sm">⚠ ' + esc(UI.getLang() === 'he' ? 'מעט מדי עובדים שנבדקו — המשקלים עדיין לא יציבים.' : 'عدد الموظفين المفحوصين قليل — الأوزان غير مستقرة بعد.') + '</p>') +
      '</div>' +
      '<div class="card"><h3>' + esc(T('top_questions')) + '</h3><table class="tbl sm"><thead><tr><th>Q</th><th>' + esc(T('group_strong')) + '</th><th>' + esc(T('group_low')) + '</th><th>Δ</th></tr></thead><tbody>' +
        qp.slice(0, 10).map(function (r) {
          return '<tr><td>' + r.qid + ' <small class="muted">' + esc(lname(r.trait)) + '</small></td><td>' + (r.strong == null ? '—' : r.strong) + '</td><td>' + (r.low == null ? '—' : r.low) + '</td>' +
            '<td><b style="color:' + (r.sep >= 18 ? '#10b981' : r.sep >= 8 ? '#f59e0b' : '#ef4444') + '">' + (r.sep == null ? '—' : r.sep) + '</b></td></tr>';
        }).join('') + '</tbody></table></div></div>' +
      '<div class="card"><h3>' + esc(T('weak_questions')) + '</h3><div class="chips">' +
        (qp.filter(function (r) { return r.verdict === 'weak'; }).map(function (r) {
          return '<span class="chip bad">' + r.qid + ' · ' + esc(lname(r.trait)) + ' · Δ' + r.sep + '</span>';
        }).join('') || '<span class="muted">—</span>') +
      '</div></div></div>';
  }

  function bindPatterns(m) {
    var run = document.getElementById('runPattern');
    if (run) run.onclick = function () {
      var out = document.getElementById('patternOut');
      out.style.opacity = '.25';
      run.disabled = true; run.textContent = '⏳ ...';
      setTimeout(function () {
        out.style.opacity = '1'; run.disabled = false; run.textContent = '⚡ ' + T('find_pattern');
        UI.confetti(30); UI.toast(UI.getLang() === 'he' ? 'הדפוסים חושבו מחדש' : 'تم إعادة حساب الأنماط');
        body();
      }, 900);
    };
    var ap = document.getElementById('applyW');
    if (ap) ap.onclick = function () {
      var s = st(); s.settings.weights = Engine.learnWeights(s.employees).weights; Store.save();
      UI.toast('✔ ' + T('apply_weights')); body();
    };
    var au = document.getElementById('autoW');
    if (au) au.onclick = function () { var s = st(); s.settings.weights = null; Store.save(); UI.toast('✔ ' + T('auto_weights')); body(); };
    var cal = document.getElementById('calW');
    if (cal) cal.onclick = function () {
      var s = st(), r = Engine.calibrate6(s.employees);
      if (!r.enough) return UI.toast(UI.getLang() === 'he' ? 'אין מספיק עובדים שנבדקו' : 'عدد الموظفين المفحوصين غير كافٍ', 'bad');
      s.settings.ncWeights = r.weights; Store.save();
      UI.confetti(30); UI.toast('✔ ' + T('calibrate')); body();
    };
    var rw = document.getElementById('resetNcW');
    if (rw) rw.onclick = function () { var s = st(); s.settings.ncWeights = null; Store.save(); UI.toast('✔'); body(); };
  }

  /* ================= QUESTION BANK ================= */
  function questions() {
    var qp = {}; Engine.questionPower(st().employees).forEach(function (r) { qp[r.qid] = r; });
    var byZone = {};
    Q.all.forEach(function (q) { (byZone[q.zone] = byZone[q.zone] || []).push(q); });
    var audTag = { emp: UI.getLang() === 'he' ? 'עובדים בלבד' : 'للموظفين فقط',
                   cand: UI.getLang() === 'he' ? 'מועמדים בלבד' : 'للمرشحين فقط' };
    return head(T('nav_questions'),
      Q.all.length + ' ' + (UI.getLang() === 'he' ? 'שאלות במאגר · ' : 'سؤال في المخزون · ') + T('q_bank_note')) +
      '<div class="card"><p class="muted sm">' +
        esc(UI.getLang() === 'he'
          ? '⚠ כלל מערכת: לעובד קיים לא מוצגות שאלות על לימודים, עבודה אחרת, מעבר עבודה או תוכניות עתידיות — הן מסומנות "למועמדים בלבד".'
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
              (q.line ? '<div class="qrow-q" style="color:#93c5fd">🗣 "' + esc(q.line) + '"</div>' : '') +
              '<div class="qrow-q">' + esc(q.q) + '</div>' +
              '<ol class="qrow-a">' + q.a.map(function (o) {
                return '<li><span class="sc" style="color:' + UI.tone(o.s) + '">' + o.s + '</span> ' + esc(o.t) +
                  (o.f ? ' <em class="fl">🚩' + esc(o.f) + '</em>' : '') + (o.fu ? ' <em class="fl">→' + o.fu + '</em>' : '') + '</li>';
              }).join('') + '</ol></div>';
          }).join('') + '</div>';
      }).join('');
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
        }).join('') + '</tbody></table></div></div>';
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
          '<option value="1"' + (s.settings.focusEnabled ? ' selected' : '') + '>' + esc(UI.getLang() === 'he' ? 'פעיל' : 'مفعّل') + '</option>' +
          '<option value="0"' + (s.settings.focusEnabled ? '' : ' selected') + '>' + esc(UI.getLang() === 'he' ? 'כבוי' : 'معطّل') + '</option></select></label>' +
        '<p class="muted sm">' + esc(T('open_anyway')) + ' · ' + esc(T('focus_note')) + '</p>' +
        '<button class="btn btn-primary" id="saveTh">' + esc(T('save')) + '</button></div>' +
      '<div class="card"><h3>PIN</h3>' +
        '<label class="fld"><span>' + esc(T('pin')) + '</span><input id="pinIn" value="' + esc(s.settings.pin) + '"></label>' +
        '<button class="btn btn-primary" id="savePin">' + esc(T('save')) + '</button>' +
        '<h3 style="margin-top:18px">' + esc(T('reg_title')) + '</h3>' +
        '<label class="fld"><span>' + esc(T('phone')) + '</span><select id="reqPhone">' +
          '<option value="0"' + (s.settings.requirePhone ? '' : ' selected') + '>' + esc(UI.getLang() === 'he' ? 'לא חובה' : 'اختياري') + '</option>' +
          '<option value="1"' + (s.settings.requirePhone ? ' selected' : '') + '>' + esc(UI.getLang() === 'he' ? 'חובה' : 'إلزامي') + '</option></select></label>' +
        '<label class="fld"><span>' + esc(T('email')) + '</span><select id="reqMail">' +
          '<option value="0"' + (s.settings.requireEmail ? '' : ' selected') + '>' + esc(UI.getLang() === 'he' ? 'לא חובה' : 'اختياري') + '</option>' +
          '<option value="1"' + (s.settings.requireEmail ? ' selected' : '') + '>' + esc(UI.getLang() === 'he' ? 'חובה' : 'إلزامي') + '</option></select></label>' +
        '<p class="muted sm">' + esc(UI.getLang() === 'he' ? 'שם מלא הוא תמיד שדה חובה למועמד.' : 'الاسم الكامل إلزامي دائماً للمرشح.') + '</p>' +
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
      Store.save(); UI.toast('✔'); body();
    };
    document.getElementById('savePin').onclick = function () {
      var ss = st().settings;
      ss.pin = document.getElementById('pinIn').value || '1234';
      ss.requirePhone = document.getElementById('reqPhone').value === '1';
      ss.requireEmail = document.getElementById('reqMail').value === '1';
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
        try {
          var data = JSON.parse(r.result);
          localStorage.setItem(Store.KEY, JSON.stringify(data)); Store.load();
          UI.toast('✔'); body();
        } catch (e) { UI.toast('JSON ✗', 'bad'); }
      };
      r.readAsText(f);
    };
    document.getElementById('resetBtn').onclick = function () { Store.reset(); UI.toast('✔'); body(); };
    document.getElementById('wipeBtn').onclick = function () { Store.wipe(); UI.toast('✔'); body(); };
  }

  root.SDNA.Manager = { open: open };
})(window);
