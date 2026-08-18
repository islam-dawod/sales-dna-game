/* ============================================================
   SALES DNA — STATE / STORAGE / SEED DATA
   Local-first: everything lives in localStorage (demo mode).
   ============================================================ */
(function (root) {
  'use strict';

  var KEY = 'sdna_state_v1';
  var Q = root.SDNA.Q;

  /* ---------- deterministic RNG (so demo data is stable) ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, rnd) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor((rnd ? rnd() : Math.random()) * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function pick(arr, n, rnd) { return shuffle(arr, rnd).slice(0, n); }
  function uid(p) { return (p || 'id') + '_' + Math.random().toString(36).slice(2, 9); }

  /* ---------- assessment blueprints ---------- */
  /* mode: employee | c1 (candidate stage 1) | c2 (candidate stage 2) */
  var BLUEPRINT = {
    employee: [
      { lvl: 1, n: 6 }, { lvl: 2, n: 6 }, { lvl: 3, n: 5 }, { lvl: 4, n: 5 },
      { lvl: 5, n: 5 }, { lvl: 6, n: 6, must: ['C01', 'C03', 'C04'] }, { lvl: 7, n: 5 }
    ],
    c1: [
      { lvl: 1, n: 3, maxDiff: 2 }, { lvl: 2, n: 3, maxDiff: 2 }, { lvl: 3, n: 2, maxDiff: 2 },
      { lvl: 4, n: 2, maxDiff: 2 }, { lvl: 5, n: 2, maxDiff: 2 },
      { lvl: 6, n: 4, must: ['C01', 'C03', 'C04'] }
    ],
    c2: [
      { lvl: 1, n: 2, prefMirror: true }, { lvl: 2, n: 3, prefMirror: true },
      { lvl: 3, n: 2, prefMirror: true }, { lvl: 4, n: 3, prefMirror: true },
      { lvl: 5, n: 3, prefMirror: true },
      { lvl: 6, n: 3, must: ['C05', 'C09', 'C12'] },
      { lvl: 7, n: 5 }
    ]
  };

  /* builds an ordered plan: [{lvl, qs:[qid,...]}] avoiding ids in `exclude` */
  function buildPlan(mode, rnd, exclude) {
    rnd = rnd || Math.random;
    exclude = exclude || [];
    var used = {}; exclude.forEach(function (id) { used[id] = 1; });
    return BLUEPRINT[mode].map(function (spec) {
      var avail = Q.pool({ lvl: spec.lvl, maxDiff: spec.maxDiff }).filter(function (q) { return !used[q.id]; });
      var chosen = [];
      (spec.must || []).forEach(function (id) {
        var q = Q.get(id);
        if (q && !used[id]) { chosen.push(id); used[id] = 1; }
      });
      var rest = avail.filter(function (q) { return !used[q.id]; });
      if (spec.prefMirror) {
        rest.sort(function (a, b) { return (b.mirror ? 1 : 0) - (a.mirror ? 1 : 0) || rnd() - 0.5; });
      } else {
        rest = shuffle(rest, rnd);
      }
      rest.slice(0, Math.max(0, spec.n - chosen.length)).forEach(function (q) {
        chosen.push(q.id); used[q.id] = 1;
      });
      return { lvl: spec.lvl, qs: shuffle(chosen, rnd) };
    }).filter(function (b) { return b.qs.length; });
  }

  /* ---------- default state ---------- */
  function defaults() {
    return {
      v: 1,
      settings: {
        lang: 'ar',
        managerLang: 'he',
        pin: '1234',
        thresholds: { high: 80, mid: 65 },
        weights: null,          // null => auto (learned from data), else {trait: w}
        sound: true
      },
      employees: [],
      candidates: [],
      log: []
    };
  }

  var state = null;

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      state = raw ? JSON.parse(raw) : null;
    } catch (e) { state = null; }
    if (!state || state.v !== 1) { state = defaults(); seed(); save(); }
    return state;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
  function get() { return state || load(); }
  function reset() { state = defaults(); seed(); save(); return state; }
  function wipe() { state = defaults(); save(); return state; }

  /* ---------- demo seed ---------- */
  var FIRST = ['سالم', 'أحمد', 'محمود', 'ياسين', 'خالد', 'إبراهيم', 'صالح', 'عمر', 'رامي', 'نور',
               'سامي', 'حسن', 'مجد', 'وليد', 'كريم', 'عادل', 'فادي', 'زياد', 'طارق', 'بلال',
               'ليان', 'سارة', 'دانا', 'ريما'];
  var LAST = ['خطيب', 'عثمان', 'حمدان', 'زعبي', 'شاهين', 'مرعي', 'أبو راس', 'سليم', 'عابد', 'حجازي',
              'صفدي', 'قاسم', 'نصار', 'دراوشة', 'بدران', 'عوض'];
  var DEPTS = ['B2B', 'Retail', 'Telesales', 'Field'];

  /* pick an option for a simulated employee: strong employees skew to high-score options */
  function simAnswer(q, group, rnd) {
    var bias = group === 'strong' ? 0.86 : group === 'medium' ? 0.62 : 0.36;
    var noise = (rnd() - 0.5) * 0.45;
    var want = Math.max(0, Math.min(1, bias + noise)) * 100;
    var best = 0, bd = 1e9;
    q.a.forEach(function (o, i) {
      var d = Math.abs(o.s - want);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }

  function simAssessment(group, rnd) {
    var plan = buildPlan('employee', rnd);
    var answers = [];
    plan.forEach(function (blk) {
      blk.qs.forEach(function (qid) {
        var q = Q.get(qid);
        var oi = simAnswer(q, group, rnd);
        answers.push({ qid: qid, opt: oi, s: q.a[oi].s, f: q.a[oi].f || null, lvl: q.lvl, trait: q.trait });
        // adaptive follow-up
        var fu = q.a[oi].fu;
        if (fu && Q.get(fu)) {
          var fq = Q.get(fu);
          var fi = simAnswer(fq, group, rnd);
          answers.push({ qid: fu, opt: fi, s: fq.a[fi].s, f: fq.a[fi].f || null, lvl: fq.lvl, trait: fq.trait });
        }
      });
    });
    return answers;
  }

  function seed() {
    var rnd = mulberry32(20260818);
    var groups = [];
    for (var i = 0; i < 7; i++) groups.push('strong');
    for (i = 0; i < 11; i++) groups.push('medium');
    for (i = 0; i < 6; i++) groups.push('low');

    state.employees = groups.map(function (g, i) {
      var perf = g === 'strong' ? 108 + rnd() * 42 : g === 'medium' ? 82 + rnd() * 22 : 48 + rnd() * 28;
      var months = 12;
      var above = g === 'strong' ? 8 + Math.floor(rnd() * 5) : g === 'medium' ? 4 + Math.floor(rnd() * 4) : Math.floor(rnd() * 3);
      var e = {
        id: 'E' + (101 + i),
        code: 'E' + (101 + i),
        name: FIRST[i % FIRST.length] + ' ' + LAST[(i * 3) % LAST.length],
        dept: DEPTS[i % DEPTS.length],
        startDate: (2019 + Math.floor(rnd() * 6)) + '-' + String(1 + Math.floor(rnd() * 12)).padStart(2, '0') + '-01',
        targetPct: Math.round(perf),
        monthsAbove: above,
        monthsTotal: months,
        attendance: Math.round(g === 'strong' ? 95 + rnd() * 5 : g === 'medium' ? 88 + rnd() * 8 : 78 + rnd() * 10),
        lateDays: Math.round(g === 'strong' ? rnd() * 3 : g === 'medium' ? 3 + rnd() * 6 : 8 + rnd() * 12),
        managerScore: Math.round(g === 'strong' ? 8 + rnd() * 2 : g === 'medium' ? 6 + rnd() * 2 : 3 + rnd() * 3),
        group: g,
        assessment: null,
        followups: []
      };
      // 21 of 24 have completed the assessment
      if (i % 8 !== 7) {
        e.assessment = { answers: simAssessment(g, rnd), completedAt: '2026-0' + (1 + (i % 8)) + '-1' + (i % 9) };
      }
      return e;
    });

    /* candidates across the funnel */
    var cNames = ['صالح مرعي', 'يوسف حداد', 'مروان زيدان', 'أنس قاسم', 'هيثم صبري', 'لؤي أبو صالح',
                  'ربيع ناصر', 'إياد شحادة', 'تامر بدير', 'أمير خوري', 'سيف الدين عمار', 'نادر حلبي'];
    var stages = [6, 5, 4, 4, 3, 3, 3, 2, 2, 2, 1, 1];
    state.candidates = cNames.map(function (nm, i) {
      var g = i < 4 ? 'strong' : i < 8 ? 'medium' : 'low';
      var st = stages[i];
      var c = {
        id: 'C' + (201 + i),
        name: nm,
        phone: '05' + (2 + i % 8) + '-' + (1000000 + Math.floor(rnd() * 8999999)),
        email: 'cand' + (201 + i) + '@mail.com',
        createdAt: '2026-08-0' + (1 + (i % 9)),
        stage: st,
        s1: null, s2: null,
        decision: st >= 6 ? 'hired' : st === 5 ? 'interview' : null,
        followups: []
      };
      if (st >= 2) {
        var p1 = buildPlan('c1', rnd);
        c.s1 = { answers: planAnswers(p1, g, rnd), completedAt: c.createdAt };
      }
      if (st >= 3) {
        var used = c.s1.answers.map(function (a) { return a.qid; });
        var p2 = buildPlan('c2', rnd, used);
        c.s2 = { answers: planAnswers(p2, g, rnd), completedAt: c.createdAt };
      }
      return c;
    });
  }

  function planAnswers(plan, group, rnd) {
    var answers = [];
    plan.forEach(function (blk) {
      blk.qs.forEach(function (qid) {
        var q = Q.get(qid);
        var oi = simAnswer(q, group, rnd);
        answers.push({ qid: qid, opt: oi, s: q.a[oi].s, f: q.a[oi].f || null, lvl: q.lvl, trait: q.trait });
        var fu = q.a[oi].fu;
        if (fu && Q.get(fu)) {
          var fq = Q.get(fu), fi = simAnswer(fq, group, rnd);
          answers.push({ qid: fu, opt: fi, s: fq.a[fi].s, f: fq.a[fi].f || null, lvl: fq.lvl, trait: fq.trait });
        }
      });
    });
    return answers;
  }

  /* ---------- CRUD ---------- */
  function addEmployee(e) {
    e.id = e.id || uid('E');
    e.code = e.code || e.id;
    e.followups = e.followups || [];
    get().employees.push(e); save(); return e;
  }
  function updateEmployee(id, patch) {
    var e = get().employees.filter(function (x) { return x.id === id; })[0];
    if (e) { Object.keys(patch).forEach(function (k) { e[k] = patch[k]; }); save(); }
    return e;
  }
  function removeEmployee(id) {
    var s = get(); s.employees = s.employees.filter(function (x) { return x.id !== id; }); save();
  }
  function findEmployeeByCode(code) {
    var c = String(code || '').trim().toUpperCase();
    return get().employees.filter(function (e) {
      return String(e.code).toUpperCase() === c || String(e.id).toUpperCase() === c;
    })[0];
  }
  function addCandidate(c) {
    c.id = c.id || uid('C');
    c.createdAt = c.createdAt || new Date().toISOString().slice(0, 10);
    c.stage = c.stage || 1; c.followups = c.followups || [];
    get().candidates.push(c); save(); return c;
  }
  function updateCandidate(id, patch) {
    var c = get().candidates.filter(function (x) { return x.id === id; })[0];
    if (c) { Object.keys(patch).forEach(function (k) { c[k] = patch[k]; }); save(); }
    return c;
  }
  function removeCandidate(id) {
    var s = get(); s.candidates = s.candidates.filter(function (x) { return x.id !== id; }); save();
  }

  root.SDNA.Store = {
    load: load, save: save, get: get, reset: reset, wipe: wipe,
    buildPlan: buildPlan, shuffle: shuffle, pick: pick, uid: uid, rng: mulberry32,
    addEmployee: addEmployee, updateEmployee: updateEmployee, removeEmployee: removeEmployee,
    findEmployeeByCode: findEmployeeByCode,
    addCandidate: addCandidate, updateCandidate: updateCandidate, removeCandidate: removeCandidate,
    KEY: KEY
  };
})(window);
