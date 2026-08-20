/* ============================================================
   SALES DNA — API CLIENT
   If a backend is reachable at ./api/index.php the app runs in
   SERVER MODE: logins, results and manager data all live in MySQL,
   so an employee answering on their phone shows up in the manager
   console on any device.
   If no backend answers, the app falls back to the local browser
   mode it has always had (useful for the public demo).
   ============================================================ */
(function (root) {
  'use strict';

  var BASE = (root.SDNA_API_BASE || 'api/index.php');
  var state = { mode: 'offline', checked: false, lastError: null };

  function url(route) {
    return BASE + '?r=' + encodeURIComponent(route);
  }

  function req(route, data, method) {
    var opts = {
      method: method || (data ? 'POST' : 'GET'),
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json' }
    };
    if (data) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(data);
    }
    return fetch(url(route), opts).then(function (res) {
      return res.text().then(function (txt) {
        var j = null;
        try { j = JSON.parse(txt); } catch (e) { j = null; }
        if (!res.ok || !j || j.ok === false) {
          var err = new Error((j && j.error) || ('http_' + res.status));
          err.status = res.status;
          err.payload = j;
          throw err;
        }
        return j;
      });
    });
  }

  /* ---------- probe once at boot ---------- */
  function probe() {
    if (state.checked) return Promise.resolve(state.mode);
    var timeout = new Promise(function (resolve) { setTimeout(function () { resolve(null); }, 4000); });
    return Promise.race([req('health').catch(function (e) { state.lastError = e.message; return null; }), timeout])
      .then(function (res) {
        state.checked = true;
        state.mode = (res && res.ok && res.db) ? 'server' : 'offline';
        state.health = res || null;
        return state.mode;
      });
  }

  function isServer() { return state.mode === 'server'; }

  /* ---------- auth ---------- */
  function loginEmployee(code) { return req('auth/employee', { code: code }); }
  function loginManager(pass) { return req('auth/manager', { pass: pass }); }
  function me() { return req('auth/me'); }
  function logout() { return req('auth/logout', {}); }

  /* ---------- candidate ---------- */
  function registerCandidate(c) {
    return req('candidate/register', { name: c.name, phone: c.phone, email: c.email });
  }

  /* ---------- results (written by the logged-in subject) ---------- */
  function saveAssessment(model, payload) {
    return req('submit/assessment', {
      model: model, answers: payload.answers, xp: payload.xp || 0, badges: payload.badges || []
    });
  }
  function saveFocus(result) { return req('submit/focus', { result: result }); }

  /* ---------- manager ---------- */
  function fetchState() { return req('state'); }
  function saveEmployee(e) {
    return req('employee/save', {
      id: e.id || '', name: e.name, branch: e.branch || '', dept: e.dept || '',
      startDate: e.startDate || '', targetPct: e.targetPct, monthsAbove: e.monthsAbove,
      monthsTotal: e.monthsTotal, attendance: e.attendance, lateDays: e.lateDays,
      managerScore: e.managerScore, group: e.group || '', history: e.history || null
    });
  }
  function deleteEmployee(id) { return req('employee/delete', { id: id }); }
  function setCode(id, code) { return req('employee/code', { id: id, code: code }); }
  function decision(id, dec) { return req('candidate/decision', { id: id, decision: dec }); }
  function review(id, day, data) { return req('candidate/review', { id: id, day: day, data: data }); }
  function deleteCandidate(id) { return req('candidate/delete', { id: id }); }
  function saveSettings(settings) { return req('settings/save', { settings: settings }); }
  function setManagerPass(pass) { return req('manager/pass', { pass: pass }); }
  function managerFocus(subjectType, subjectId, result) {
    return req('manager/focus', { subjectType: subjectType, subjectId: subjectId, result: result });
  }

  root.SDNA = root.SDNA || {};
  root.SDNA.API = {
    probe: probe, isServer: isServer, state: state, url: url, req: req,
    loginEmployee: loginEmployee, loginManager: loginManager, me: me, logout: logout,
    registerCandidate: registerCandidate,
    saveAssessment: saveAssessment, saveFocus: saveFocus,
    fetchState: fetchState, saveEmployee: saveEmployee, deleteEmployee: deleteEmployee,
    setCode: setCode, decision: decision, review: review, deleteCandidate: deleteCandidate,
    saveSettings: saveSettings, setManagerPass: setManagerPass, managerFocus: managerFocus
  };
})(window);
