/* ============================================================
   SALES DNA — STATE / STORAGE / SEED DATA  (V3)
   employees → 12-trait behaviour model (36 scenarios)
   candidates → fixed 25-question model + FOCUS bonus level
   ============================================================ */
(function (root) {
  'use strict';

  var KEY = 'sdna_state_v5';
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
      v: 5,
      settings: {
        lang: 'ar',
        /* manager passphrase — hash only, the passphrase is never stored */
        pinSha: 'b2a90bf588df3cde30f7eba65edf369da0f75db3232c56e3c3490a6e6e20b768',
        pinFnv: '098d0b680da954ced7119f6a200b563c',
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
  var serverMode = false;      /* true once the backend answered the health probe */

  function setServerMode(on) { serverMode = !!on; }
  function isServerMode() { return serverMode; }

  /* replace the in-memory state with what the server sent */
  function hydrate(payload) {
    state = state || defaults();
    if (payload.settings) state.settings = Object.assign(defaults().settings, payload.settings);
    if (payload.employees) state.employees = payload.employees;
    if (payload.candidates) state.candidates = payload.candidates;
    return state;
  }

  /* a single subject (employee or candidate) instead of the whole roster */
  function hydrateOne(kind, record, settings) {
    state = state || defaults();
    if (settings) state.settings = Object.assign(defaults().settings, settings);
    if (kind === 'employee') state.employees = [record];
    else state.candidates = [record];
    return record;
  }

  /* in server mode nothing is read from the browser: start from an empty
     state and let the API fill it in */
  function loadEmpty() {
    state = defaults();
    state.employees = [];
    state.candidates = [];
    return state;
  }

  function load() {
    if (serverMode) return state || loadEmpty();
    try {
      var raw = localStorage.getItem(KEY);
      state = raw ? JSON.parse(raw) : null;
    } catch (e) { state = null; }
    if (!state || state.v !== 5) { state = defaults(); seed(); save(); }
    if (state.settings.focusEnabled === undefined) state.settings.focusEnabled = true;
    /* migrate away from any legacy plaintext pin */
    if (state.settings.pin !== undefined) { delete state.settings.pin; save(); }
    if (!state.settings.pinSha && !state.settings.pinFnv) {
      state.settings.pinSha = 'b2a90bf588df3cde30f7eba65edf369da0f75db3232c56e3c3490a6e6e20b768';
      state.settings.pinFnv = '098d0b680da954ced7119f6a200b563c';
      save();
    }
    return state;
  }
  function save() {
    if (serverMode) return;            /* the server is the source of truth */
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
  function get() { return state || load(); }
  function reset() { state = defaults(); seed(); save(); return state; }
  function wipe() { state = defaults(); save(); return state; }

  /* ---------- real roster (no demo data ships any more) ----------
     Each employee has a private login code stored ONLY as a hash, so the
     codes cannot be read out of this file, out of the page, or out of the
     saved state. They are handed to the manager out of band.            */
  var ROSTER = [
    { id: 'EMP01', name: 'Enas Ibrahim', branch: 'مصر',
      codeSha: '400b61369bc491f4b93002fdda342c46524053ff1a481ea188f68a423b75af92',
      codeFnv: '5b50e148e07a9eee7b1933ca05627ecc' },
    { id: 'EMP02', name: 'Hajar Hilal', branch: 'مصر',
      codeSha: '661046bb15c5770007495c6c54c70f99c46fd0544588952988058284550ff432',
      codeFnv: 'c0a9503271677038caf5b01cb1db4a7e' },
    { id: 'EMP03', name: 'Salma Fathy', branch: 'مصر',
      codeSha: 'e037dcdceb2316219e59a67716c219e64789f8dc9599fef2103149900ca85533',
      codeFnv: '8881133d5be8a63f9f38d3db60887361' },
    { id: 'EMP04', name: 'Esraa Hamed', branch: 'مصر',
      codeSha: '253a428a3db291001026c0ee62e679d38bcde49f70b827793550a422a94a817d',
      codeFnv: 'ba37f0d22204af88ec73393c9dc0739e' },
    { id: 'EMP05', name: 'Abdullah Fadl', branch: 'مصر',
      codeSha: '541c428c4c0773d50b0cf6a947b80580c60bf08827987b2ca5c895843914d25d',
      codeFnv: '34f1df7b352485a1a0ff312dc4f4298f' },
    { id: 'EMP06', name: 'Esraa Mohammed', branch: 'مصر',
      codeSha: '0c60e4b2f7cbcaabc1e2ccb6092e176c038c646e757c981f8a86ce651011683f',
      codeFnv: '31ed463eafb63f9c7aafd1507076241a' },
    { id: 'EMP07', name: 'Rodina Waleed', branch: 'مصر',
      codeSha: '1773aed591144e6726f4ebf64a9d72583e188b76d0185b21a8be99e90807d1ff',
      codeFnv: 'd6d16894b8ba5882c22718162df77bf0' },
    { id: 'EMP08', name: 'Israa El Feki', branch: 'مصر',
      codeSha: '60f8bb3da5d50b306fd2856ab9d04ff276c1b83ba2ea7a2a9fc07862c520273c',
      codeFnv: '03dcb423331ff4598385463501b31c17' },
    { id: 'EMP09', name: 'Shimaa Saad', branch: 'مصر',
      codeSha: '7940d251c27caac505a692eb3e9a0d5f9418f18c2e477c48bbcd38ca13f10598',
      codeFnv: 'd0bb56ebda4d45b9367483156e14a82f' },
    { id: 'EMP10', name: 'Salma Salah', branch: 'مصر',
      codeSha: 'b52911fcad155f3310f88c7d2e20590c56927eb98f2722b31b1b26f81cc351ab',
      codeFnv: 'fb12361e07ea8858170e6194119dc252' },
    { id: 'EMP11', name: 'Heba ELdesouki', branch: 'مصر',
      codeSha: 'c351dc3f0164c31acd8a1c3faeb316b283729b7f6317b67f4d0a388716f4e27a',
      codeFnv: '3e12b19208e78f58154be14c3ec0861e' },
    { id: 'EMP12', name: 'Mallak Hefny', branch: 'مصر',
      codeSha: 'ba71012c8207c63f984afc452663707a3bf89eca3af9c81c2ed23679b1fcd7b8',
      codeFnv: 'e0855bed44f44acb7aafd657aa84ee71' },
    { id: 'EMP13', name: 'Doaa Abdelhamed', branch: 'مصر',
      codeSha: '0a7f8aa0fee830f814081fa054277053c4e4858e3738ca5b1be9fdcf18d9a265',
      codeFnv: '96ae90b34eba054dd9e6b9014b5e3f8f' },
    { id: 'EMP14', name: 'Bilal Ahmed', branch: 'مصر',
      codeSha: '30abf0326876f413c1e022de5262969b487a52cdf294b512a4e151414857b8e4',
      codeFnv: 'c01138da3d36399429bfa5d8b16e0f96' },
    { id: 'EMP15', name: 'Mohamed Hegazy', branch: 'مصر',
      codeSha: '753acc26d23c2f0e4336a17f97234e117d2f21af53898b58d2d80c109ef66e96',
      codeFnv: '32c1d77691dc7228801e7a6c61dc09e2' },
    { id: 'EMP16', name: 'Manar Ashraf', branch: 'مصر',
      codeSha: 'bf33ec3458f3153b0d8e379ccdfb23807f16b508030d41c9906b587653486ef1',
      codeFnv: '058ba22945699faf56dcb61349a8e155' },
    { id: 'EMP17', name: 'Abeer AbuAlrob', branch: 'رام الله',
      codeSha: '4232c61c3916f4be2247f62e032d1537a5c3800b2abb11315dc400174042c207',
      codeFnv: '56cb704e598142e0f8fa2e8c44e31652' },
    { id: 'EMP18', name: 'Sondos Radi', branch: 'رام الله',
      codeSha: '17ee62bd501b9d17e67e6375ff7567dcbe1c194e203bd51630e3804697fd60d5',
      codeFnv: '11eb757a1ff4900c1136d6d80ef6c6fe' },
    { id: 'EMP19', name: 'Shoroq Abualhof', branch: 'فلسطين',
      codeSha: 'f5370ae6abf1686eec3f43937dc40dcad2f39f3f14da2e870351a92931c2ced8',
      codeFnv: '4d5c3b0697b013c8d1d672f4b5c6bc1a' },
    { id: 'EMP20', name: 'Noor Shehadeh', branch: 'فلسطين',
      codeSha: '5f3a4e3a66dadb292255844a2791e270ff90dbe7bc5d65596bc845e87245904c',
      codeFnv: '4922884f057c1245451438014eaca263' },
    { id: 'EMP21', name: 'Naseem Zbidat', branch: 'فلسطين',
      codeSha: '3d628c8e35cd1c1eca92effdd2d9c2c3c9221673dc4ea471f783f3479800fd4e',
      codeFnv: 'a7485e09ac4b069333e978cf52e7737d' },
    { id: 'EMP22', name: 'Firas Ahmed', branch: 'فلسطين',
      codeSha: '53ed2383838ad9694a385c7e523215ce75d5cb3d67848c39283061fb46f7f477',
      codeFnv: 'b7c5e42c696504d21208d48ef0347a50' },
    { id: 'EMP23', name: 'Lina Zbeidat', branch: 'فلسطين',
      codeSha: '6426cde3d2cb78fff46061402980ea60b7eb4e166b7a5aa4f824bf062698f5c3',
      codeFnv: 'eed98c2c4b0723024fbcf76616a18c18' },
    { id: 'EMP24', name: 'Omar Masri', branch: 'فلسطين',
      codeSha: 'a3f8c0623899390c7e8bd3ffa9a0ecc6c53fe3e65568a71df1bc560a825cbe08',
      codeFnv: 'de81b2b34ce4d72954392615bd4440d7' }
  ];

  function blankEmployee(r) {
    return {
      id: r.id, name: r.name, branch: r.branch || '',
      codeSha: r.codeSha || null, codeFnv: r.codeFnv || null,
      dept: '', startDate: '',
      targetPct: null, monthsAbove: null, monthsTotal: 12,
      attendance: null, lateDays: null, managerScore: null,
      group: null,              /* the manager classifies once real data exists */
      assessment: null, nc22: null, focus: null,
      history: [], followups: []
    };
  }

  function seed() {
    state.employees = ROSTER.map(blankEmployee);
    state.candidates = [];
  }

  /* ---------- CRUD ---------- */
  function addEmployee(e) {
    var rec = blankEmployee({ id: e.id || uid('E'), name: e.name || '' });
    Object.keys(e).forEach(function (k) { if (e[k] !== undefined) rec[k] = e[k]; });
    get().employees.push(rec); save(); return rec;
  }
  function updateEmployee(id, patch) {
    var e = get().employees.filter(function (x) { return x.id === id; })[0];
    if (e) { Object.keys(patch).forEach(function (k) { e[k] = patch[k]; }); save(); }
    return e;
  }
  function removeEmployee(id) {
    var s = get(); s.employees = s.employees.filter(function (x) { return x.id !== id; }); save();
  }
  /* login by hashed code — the plain code is never stored anywhere */
  function findByCodeHash(h) {
    return get().employees.filter(function (e) {
      return (h.sha && e.codeSha && h.sha === e.codeSha) ||
             (h.fnv && e.codeFnv && h.fnv === e.codeFnv);
    })[0];
  }

  function setEmployeeCode(id, code, cb) {
    root.SDNA.UI.hashPass(String(code).trim().toUpperCase(), function (h) {
      var e = get().employees.filter(function (x) { return x.id === id; })[0];
      if (!e) return cb && cb(null);
      if (h.sha) e.codeSha = h.sha;
      e.codeFnv = h.fnv;
      save();
      if (cb) cb(e);
    });
  }

  /* readable, unambiguous, not guessable: LLLL-DDDD */
  function randomCode() {
    var L = 'ABCDEFGHJKLMNPQRSTUVWXYZ', D = '23456789', out = '';
    var buf = new Uint32Array(8);
    if (root.crypto && root.crypto.getRandomValues) root.crypto.getRandomValues(buf);
    else for (var k = 0; k < 8; k++) buf[k] = Math.floor(Math.random() * 4294967296);
    for (var i = 0; i < 4; i++) out += L[buf[i] % L.length];
    out += '-';
    for (var j = 4; j < 8; j++) out += D[buf[j] % D.length];
    return out;
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
    setServerMode: setServerMode, isServerMode: isServerMode,
    hydrate: hydrate, hydrateOne: hydrateOne, loadEmpty: loadEmpty,
    buildPlan: buildPlan, shuffle: shuffle, uid: uid, rng: mulberry32,
    addEmployee: addEmployee, updateEmployee: updateEmployee, removeEmployee: removeEmployee,
    findByCodeHash: findByCodeHash, setEmployeeCode: setEmployeeCode, randomCode: randomCode,
    addCandidate: addCandidate, updateCandidate: updateCandidate, removeCandidate: removeCandidate,
    KEY: KEY, BLUEPRINT: BLUEPRINT
  };
})(window);
