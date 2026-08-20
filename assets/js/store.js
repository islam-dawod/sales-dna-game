/* ============================================================
   SALES DNA — STATE / STORAGE / SEED DATA  (V3)
   employees → 12-trait behaviour model (36 scenarios)
   candidates → fixed 25-question model + FOCUS bonus level
   ============================================================ */
(function (root) {
  'use strict';

  var KEY = 'sdna_state_v4';
  var Q = root.SDNA.Q, NC = root.SDNA.NC;

  /* ---------- deterministic RNG (stable demo data) ---------- */
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
  function uid(p) { return (p || 'id') + '_' + Math.random().toString(36).slice(2, 9); }

  /* ---------- employee blueprint (behaviour only) ---------- */
  var BLUEPRINT = {
    employee: { aud: 'emp', blocks: [
      { zone: 'tower', n: 5 }, { zone: 'arena', n: 5 }, { zone: 'hq', n: 5 },
      { zone: 'lab', n: 4 }, { zone: 'trust', n: 4 }, { zone: 'street', n: 4 },
      { zone: 'battle', n: 5 }, { zone: 'final', n: 4 }
    ]}
  };

  function buildPlan(mode, rnd, exclude) {
    rnd = rnd || Math.random;
    var spec = BLUEPRINT[mode], aud = spec.aud;
    var used = {}; (exclude || []).forEach(function (id) { used[id] = 1; });
    return spec.blocks.map(function (b) {
      var chosen = [];
      (b.must || []).forEach(function (id) {
        var q = Q.get(id);
        if (q && !used[id] && Q.allowed(q, aud)) { chosen.push(id); used[id] = 1; }
      });
      var rest = shuffle(Q.pool({ zone: b.zone, aud: aud, maxDiff: b.maxDiff }), rnd)
        .filter(function (q) { return !used[q.id]; });
      rest.slice(0, Math.max(0, b.n - chosen.length)).forEach(function (q) {
        chosen.push(q.id); used[q.id] = 1;
      });
      return { zone: b.zone, qs: shuffle(chosen, rnd) };
    }).filter(function (b) { return b.qs.length; });
  }

  /* ---------- default state ---------- */
  function defaults() {
    return {
      v: 4,
      settings: {
        lang: 'ar',
        pin: '1234',
        thresholds: { high: 80, mid: 65 },
        weights: null,          // employee 12-trait weights (null => learned)
        ncWeights: null,        // candidate 6-dimension weights (null => spec defaults)
        focusEnabled: true,     // bonus focus level
        focusInDecision: false, // never part of the match score unless proven
        focusWeight: 0,         // stays 0 until company data proves it separates
        spotDebug: false,       // show hitboxes (manager / developer only)
        spotValidated: null,    // {ok, found, total, at} from the calibration test
        sound: true,
        requirePhone: false,
        requireEmail: false
      },
      employees: [],
      candidates: []
    };
  }

  var state = null;

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      state = raw ? JSON.parse(raw) : null;
    } catch (e) { state = null; }
    if (!state || state.v !== 4) { state = defaults(); seed(); save(); }
    if (state.settings.focusEnabled === undefined) state.settings.focusEnabled = true;
    return state;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
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

  /* --- employee behaviour simulation (12-trait model) ---
     Demo realism: in real companies only part of the traits separate the
     strong from the weak. SEP = how much this trait separates (0..1).
     Traits with a low SEP end up similar in all three groups, which is
     exactly the case the DIFFERENTIATORS screen has to expose.          */
  var SEP = {
    target: 1, persistence: 1, resilience: 0.95, accountability: 0.9,
    commitment: 0.85, motivation: 0.8,
    discipline: 0.15, learning: 0.1, coachability: 0.12,
    customer: 0.25, closing: 0.2, initiative: 0.3
  };
  var COMMON = 0.74;
  function biasFor(group, trait) {
    var g = group === 'strong' ? 0.88 : group === 'medium' ? 0.62 : 0.34;
    var sep = SEP[trait] == null ? 0.6 : SEP[trait];
    return COMMON + (g - COMMON) * sep;
  }

  function simAnswer(q, group, rnd) {
    var bias = biasFor(group, q.trait);
    var want = Math.max(0, Math.min(1, bias + (rnd() - 0.5) * 0.4)) * 100;
    var best = 0, bd = 1e9;
    q.a.forEach(function (o, i) {
      var d = Math.abs(o.s - want);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }
  function planAnswers(plan, group, rnd) {
    var answers = [];
    plan.forEach(function (blk) {
      blk.qs.forEach(function (qid) {
        var q = Q.get(qid);
        var oi = simAnswer(q, group, rnd);
        answers.push({ qid: qid, opt: oi, s: q.a[oi].s, f: q.a[oi].f || null, zone: q.zone, trait: q.trait });
        var fu = q.a[oi].fu;
        if (fu && Q.get(fu)) {
          var fq = Q.get(fu), fi = simAnswer(fq, group, rnd);
          answers.push({ qid: fu, opt: fi, s: fq.a[fi].s, f: fq.a[fi].f || null, zone: fq.zone, trait: fq.trait });
        }
      });
    });
    return answers;
  }

  /* --- candidate 25-question simulation --- */
  function optQuality(q, oi) {
    var opt = q.a[oi], sum = 0, max = 0;
    NC.DIM_KEYS.forEach(function (k) {
      var m = 0;
      q.a.forEach(function (o) { if (o.p[k] != null && o.p[k] > m) m = o.p[k]; });
      max += m;
      sum += opt.p[k] || 0;
    });
    return max ? sum / max : 0.5;
  }
  /* 12 months of target achievement — strong staff are also more consistent */
  function monthly(group, rnd) {
    var base = group === 'strong' ? 118 : group === 'medium' ? 92 : 66;
    var spread = group === 'strong' ? 12 : group === 'medium' ? 20 : 34;
    var out = [];
    for (var m = 0; m < 12; m++) {
      var pct = Math.round(base + (rnd() - 0.5) * 2 * spread);
      out.push({ m: '2025-' + String(m + 1).padStart(2, '0'), pct: Math.max(18, pct) });
    }
    return out;
  }

  var NC_SEP = { target: 1, persist: 1, account: 0.9, commit: 0.85, discipline: 0.15, learn: 0.1 };
  function mainDim(q) {
    var best = null, bv = -1;
    NC.DIM_KEYS.forEach(function (k) {
      var tot = 0;
      q.a.forEach(function (o) { tot += o.p[k] || 0; });
      if (tot > bv) { bv = tot; best = k; }
    });
    return best;
  }
  function ncBias(group, dim) {
    var g = group === 'strong' ? 0.86 : group === 'medium' ? 0.6 : 0.32;
    var sep = NC_SEP[dim] == null ? 0.6 : NC_SEP[dim];
    return 0.72 + (g - 0.72) * sep;
  }

  function simNc(group, rnd, aud) {
    var answers = [];
    NC.plan(aud || 'cand').forEach(function (blk) {
      blk.qs.forEach(function (qid) {
        var q = NC.get(qid);
        var want = Math.max(0, Math.min(1, ncBias(group, mainDim(q)) + (rnd() - 0.5) * 0.42));
        var best = 0, bd = 1e9;
        q.a.forEach(function (o, i) {
          var d = Math.abs(optQuality(q, i) - want);
          if (d < bd) { bd = d; best = i; }
        });
        answers.push({ qid: qid, opt: best, lvl: q.lvl });
        var fu = q.a[best].fu;
        if (fu && NC.get(fu)) {
          var fq = NC.get(fu), fb = 0, fbd = 1e9;
          fq.a.forEach(function (o, i) {
            var d = Math.abs(optQuality(fq, i) - want);
            if (d < fbd) { fbd = d; fb = i; }
          });
          answers.push({ qid: fu, opt: fb, lvl: fq.lvl, extra: true });
        }
      });
    });
    return answers;
  }

  /* --- focus mini-game simulation (deliberately only loosely tied to group) --- */
  function simFocus(group, rnd) {
    var skill = 0.5 + rnd() * 0.45 + (group === 'strong' ? 0.1 : group === 'low' ? -0.06 : 0);
    skill = Math.max(0.2, Math.min(1, skill));
    var found = Math.max(1, Math.min(4, Math.round(2 + skill * 2.2)));
    var wrong = Math.max(0, Math.round((1 - skill) * 4 * rnd()));
    var times = [];
    var t = 3 + (1 - skill) * 6;
    for (var i = 0; i < found; i++) { t += 3 + (1 - skill) * 8 * rnd(); times.push(Math.round(t * 10) / 10); }
    var scanTotal = 6, scanCorrect = Math.max(1, Math.min(scanTotal, Math.round(scanTotal * (0.45 + skill * 0.55))));
    var scanAvg = Math.round((2 + (1 - skill) * 5) * 10) / 10;
    return root.SDNA.Focus.scoreFrom({
      spot: { found: found, total: 4, wrong: wrong, times: times, elapsed: Math.min(45, times[times.length - 1] + 3), limit: 45 },
      scan: { correct: scanCorrect, total: scanTotal, avg: scanAvg, rounds: 3 }
    });
  }

  function seed() {
    var rnd = mulberry32(20260818);
    var groups = [], i;
    for (i = 0; i < 7; i++) groups.push('strong');
    for (i = 0; i < 11; i++) groups.push('medium');
    for (i = 0; i < 6; i++) groups.push('low');

    state.employees = groups.map(function (g, i) {
      var perf = g === 'strong' ? 108 + rnd() * 42 : g === 'medium' ? 82 + rnd() * 22 : 48 + rnd() * 28;
      var e = {
        id: 'E' + (101 + i), code: 'E' + (101 + i),
        name: FIRST[i % FIRST.length] + ' ' + LAST[(i * 3) % LAST.length],
        dept: DEPTS[i % DEPTS.length],
        startDate: (2019 + Math.floor(rnd() * 6)) + '-' + String(1 + Math.floor(rnd() * 12)).padStart(2, '0') + '-01',
        targetPct: Math.round(perf),
        monthsAbove: g === 'strong' ? 8 + Math.floor(rnd() * 5) : g === 'medium' ? 4 + Math.floor(rnd() * 4) : Math.floor(rnd() * 3),
        monthsTotal: 12,
        attendance: Math.round(g === 'strong' ? 95 + rnd() * 5 : g === 'medium' ? 88 + rnd() * 8 : 78 + rnd() * 10),
        lateDays: Math.round(g === 'strong' ? rnd() * 3 : g === 'medium' ? 3 + rnd() * 6 : 8 + rnd() * 12),
        managerScore: Math.round(g === 'strong' ? 8 + rnd() * 2 : g === 'medium' ? 6 + rnd() * 2 : 3 + rnd() * 3),
        group: g, assessment: null, nc22: null, focus: null, followups: [],
        history: monthly(g, rnd)
      };
      if (i % 8 !== 7) {
        e.assessment = {
          answers: planAnswers(buildPlan('employee', rnd), g, rnd),
          completedAt: '2026-0' + (1 + (i % 8)) + '-1' + (i % 9), xp: 0, badges: []
        };
      }
      /* two deliberate classification conflicts for the ⚠ REVIEW CLASSIFICATION case */
      if (i === 2) {            /* manager says STRONG, the numbers say otherwise */
        e.history = monthly('low', rnd);
        e.targetPct = 74; e.attendance = 86; e.lateDays = 9; e.managerScore = 8;
      }
      if (i === 19) {           /* manager says LOW, the numbers are good */
        e.history = monthly('strong', rnd);
        e.targetPct = 121; e.attendance = 97; e.lateDays = 1; e.managerScore = 5;
      }
      if (i % 8 !== 7) e.nc22 = { answers: simNc(g, rnd, 'emp'), completedAt: '2026-08-01' };
      if (i % 3 !== 2) e.focus = simFocus(g, rnd);      // ~2/3 of the team played the mini-games
      return e;
    });

    var cNames = ['صالح مرعي', 'يوسف حداد', 'مروان زيدان', 'أنس قاسم', 'هيثم صبري', 'لؤي أبو صالح',
                  'ربيع ناصر', 'إياد شحادة', 'تامر بدير', 'أمير خوري', 'سيف الدين عمار', 'نادر حلبي'];
    var stages = [7, 5, 3, 3, 3, 3, 3, 3, 2, 2, 1, 1];
    state.candidates = cNames.map(function (nm, i) {
      var g = i < 4 ? 'strong' : i < 8 ? 'medium' : 'low';
      var st = stages[i];
      var c = {
        id: 'C' + (201 + i), name: nm,
        phone: '05' + (2 + i % 8) + '-' + (1000000 + Math.floor(rnd() * 8999999)),
        email: 'cand' + (201 + i) + '@mail.com',
        createdAt: '2026-08-0' + (1 + (i % 9)),
        stage: st, nc: null, focus: null,
        decision: st >= 7 ? 'hired' : st === 5 ? 'interview' : null,
        followups: []
      };
      if (st >= 2) c.nc = { answers: simNc(g, rnd), completedAt: c.createdAt, xp: 25 * 50 + 5 * 500 };
      if (st >= 3) c.focus = simFocus(g, rnd);
      if (st >= 7) {
        c.followups = [{ day: 90, targetPct: 118 }];
        c.reviews = [
          { day: 30, attendance: 96, discipline: 88, learning: 90, coachability: 92, effort: 94 },
          { day: 90, targetPct: 121, sales: 121000, persistence: 90, managerRating: 9 }
        ];
        c.hiredAt = '2026-03-01';
      }
      return c;
    });
  }

  /* ---------- CRUD ---------- */
  function addEmployee(e) {
    e.id = e.id || uid('E'); e.code = e.code || e.id; e.followups = e.followups || [];
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
    buildPlan: buildPlan, shuffle: shuffle, uid: uid, rng: mulberry32,
    addEmployee: addEmployee, updateEmployee: updateEmployee, removeEmployee: removeEmployee,
    findEmployeeByCode: findEmployeeByCode,
    addCandidate: addCandidate, updateCandidate: updateCandidate, removeCandidate: removeCandidate,
    KEY: KEY, BLUEPRINT: BLUEPRINT
  };
})(window);
