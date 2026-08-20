<?php
/* ============================================================
   SALES DNA — API
   Every call goes to  api/index.php?r=<route>  (no rewrite rules,
   nothing depends on .htaccess).

   public   : health · auth/employee · auth/manager · candidate/register
   employee : submit/assessment · submit/focus · auth/me · auth/logout
   candidate: submit/assessment · submit/focus · auth/logout
   manager  : state · employee/save · employee/code · candidate/decision
              candidate/review · settings/save · manager/pass · auth/logout
   ============================================================ */

define('SDNA', 1);
require __DIR__ . '/lib.php';

header('Referrer-Policy: same-origin');

/* any uncaught problem still answers with JSON the client can show */
set_exception_handler(function ($e) { fail('server_error', 500); });
register_shutdown_function(function () {
  $e = error_get_last();
  if ($e && in_array($e['type'], array(E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR), true)) {
    if (!headers_sent()) {
      http_response_code(500);
      header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode(array('ok' => false, 'error' => 'fatal'));
  }
});

$r = isset($_GET['r']) ? preg_replace('/[^a-z0-9\/_-]/i', '', $_GET['r']) : '';
$method = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';

function need_post() {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('method_not_allowed', 405);
}

switch ($r) {

/* ============================================================
   HEALTH
   ============================================================ */
case 'health':
  $info = array('ok' => true, 'php' => PHP_VERSION, 'db' => false, 'employees' => null, 'candidates' => null);
  try {
    migrate();
    $info['db'] = true;
    $info['employees'] = (int) db()->query('SELECT COUNT(*) c FROM employees')->fetch()['c'];
    $info['candidates'] = (int) db()->query('SELECT COUNT(*) c FROM candidates')->fetch()['c'];
    $info['with_code'] = (int) db()->query('SELECT COUNT(*) c FROM employees WHERE code_hash IS NOT NULL OR code_sha IS NOT NULL')->fetch()['c'];
    $info['manager_pass_set'] = (setting_get('manager_pass_hash') || setting_get('manager_pass_sha')) ? true : false;
  } catch (Exception $e) {
    $info['ok'] = false;
    $info['detail'] = 'db_error';
  }
  out($info);

/* ============================================================
   AUTH — employee logs in with the private code
   ============================================================ */
case 'auth/employee':
  need_post();
  migrate();
  throttle('employee');
  $code = mb_strtoupper(s(inp('code'), 40));
  if ($code === '') { log_attempt('employee', false); fail('code_required'); }

  /* fast path: HMAC lookup (never brute-forceable without the server key) */
  $st = db()->prepare('SELECT * FROM employees WHERE code_lookup = ? LIMIT 1');
  $st->execute(array(code_lookup($code)));
  $emp = $st->fetch();

  $verified = false;
  if ($emp && !empty($emp['code_hash']) && password_verify($code, $emp['code_hash'])) $verified = true;

  /* legacy path: seeded sha256 codes get upgraded to bcrypt on first use */
  if (!$verified) {
    $sha = hash('sha256', $code);
    $st = db()->prepare('SELECT * FROM employees WHERE code_sha = ? LIMIT 1');
    $st->execute(array($sha));
    $legacy = $st->fetch();
    if ($legacy) {
      $up = db()->prepare('UPDATE employees SET code_hash = ?, code_lookup = ?, code_sha = NULL, updated_at = NOW() WHERE id = ?');
      $up->execute(array(password_hash($code, PASSWORD_DEFAULT), code_lookup($code), $legacy['id']));
      $emp = $legacy;
      $verified = true;
    }
  }

  if (!$verified || !$emp) { log_attempt('employee', false); fail('not_found', 404); }
  log_attempt('employee', true);
  session_start_for('employee', $emp['id']);

  $one = array($emp['id'] => employee_row_to_client($emp));
  $none = array();
  load_history($one);
  load_assessments($one, $none);
  load_focus($one, $none);
  out(array('ok' => true, 'employee' => array_values($one)[0], 'settings' => load_settings()));

/* ============================================================
   AUTH — manager
   ============================================================ */
case 'auth/manager':
  need_post();
  migrate();
  throttle('manager', 8, 15);
  $pass = (string) inp('pass', '');
  if ($pass === '') { log_attempt('manager', false); fail('pass_required'); }

  $hash = setting_get('manager_pass_hash');
  $ok = false;
  if ($hash && password_verify($pass, $hash)) $ok = true;
  if (!$ok) {
    $sha = setting_get('manager_pass_sha');
    if ($sha && hash_equals($sha, hash('sha256', $pass))) {
      setting_set('manager_pass_hash', password_hash($pass, PASSWORD_DEFAULT));
      setting_set('manager_pass_sha', '');
      $ok = true;
    }
  }
  if (!$ok) { log_attempt('manager', false); fail('wrong_pass', 401); }
  log_attempt('manager', true);
  session_start_for('manager', null);
  out(array('ok' => true));

case 'auth/me':
  $s = current_session();
  out(array('ok' => true, 'scope' => $s ? $s['scope'] : null, 'subject' => $s ? $s['subject_id'] : null));

case 'auth/logout':
  session_end();
  out(array('ok' => true));

/* ============================================================
   CANDIDATE — public registration
   ============================================================ */
case 'candidate/register':
  need_post();
  migrate();
  throttle('register', 30, 60);
  $name = s(inp('name'), 120);
  if (mb_strlen($name) < 2) { log_attempt('register', false); fail('name_required'); }
  $set = load_settings();
  $phone = s(inp('phone'), 40);
  $email = s(inp('email'), 120);
  if (!empty($set['requirePhone']) && $phone === '') fail('phone_required');
  if (!empty($set['requireEmail']) && $email === '') fail('email_required');

  $id = 'C' . date('ymd') . strtoupper(bin2hex(random_bytes(3)));
  $st = db()->prepare('INSERT INTO candidates (id, name, phone, email, stage) VALUES (?, ?, ?, ?, 1)');
  $st->execute(array($id, $name, $phone, $email));
  log_attempt('register', true);
  session_start_for('candidate', $id);
  out(array('ok' => true, 'candidate' => array(
    'id' => $id, 'name' => $name, 'phone' => $phone, 'email' => $email,
    'stage' => 1, 'createdAt' => date('Y-m-d'), 'nc' => null, 'focus' => null,
    'decision' => null, 'followups' => array(), 'reviews' => array()
  ), 'settings' => $set));

/* ============================================================
   SUBMIT — results, written only for the logged-in subject
   ============================================================ */
case 'submit/assessment':
  need_post();
  $s = require_scope(array('employee', 'candidate'));
  $model = s(inp('model'), 16);
  if (!in_array($model, array('emp36', 'nc22', 'nc25'), true)) fail('bad_model');
  if ($s['scope'] === 'candidate' && $model !== 'nc25') fail('bad_model_for_candidate');
  if ($s['scope'] === 'employee' && $model === 'nc25') fail('bad_model_for_employee');

  $answers = inp('answers');
  if (!is_array($answers) || count($answers) < 1 || count($answers) > 200) fail('bad_answers');
  $clean = clean_answers($answers);
  if (!count($clean)) fail('bad_answers');

  $st = db()->prepare('INSERT INTO assessments (subject_type, subject_id, model, answers, xp, badges)
                       VALUES (?, ?, ?, ?, ?, ?)');
  $st->execute(array($s['scope'], $s['subject_id'], $model,
    json_encode($clean, JSON_UNESCAPED_UNICODE),
    intOrNull(inp('xp')) ?: 0,
    json_encode(is_array(inp('badges')) ? inp('badges') : array())));

  if ($s['scope'] === 'candidate') {
    $u = db()->prepare('UPDATE candidates SET stage = GREATEST(stage, 2) WHERE id = ?');
    $u->execute(array($s['subject_id']));
  }
  out(array('ok' => true, 'saved' => count($clean)));

case 'submit/focus':
  need_post();
  $s = require_scope(array('employee', 'candidate'));
  $res = inp('result');
  if (!is_array($res) || !isset($res['focus'])) fail('bad_result');
  $payload = clean_focus($res);
  if ($payload === null) fail('bad_focus');
  $payload['completedAt'] = date('Y-m-d');   /* a live run is always dated today */
  $st = db()->prepare('INSERT INTO focus_results (subject_type, subject_id, focus, payload) VALUES (?, ?, ?, ?)');
  $st->execute(array($s['scope'], $s['subject_id'], $payload['focus'], json_encode($payload, JSON_UNESCAPED_UNICODE)));
  if ($s['scope'] === 'candidate') {
    $u = db()->prepare('UPDATE candidates SET stage = GREATEST(stage, 3) WHERE id = ?');
    $u->execute(array($s['subject_id']));
  }
  out(array('ok' => true));

/* ============================================================
   MANAGER — read everything
   ============================================================ */
case 'state':
  require_scope('manager');
  migrate();
  $employees = array();
  foreach (db()->query('SELECT * FROM employees ORDER BY id ASC')->fetchAll() as $row) {
    $employees[$row['id']] = employee_row_to_client($row, true);
  }
  $candidates = array();
  foreach (db()->query('SELECT * FROM candidates ORDER BY created_at DESC')->fetchAll() as $row) {
    $candidates[$row['id']] = array(
      'id' => $row['id'], 'name' => $row['name'], 'phone' => $row['phone'], 'email' => $row['email'],
      'createdAt' => mb_substr($row['created_at'], 0, 10),
      'stage' => (int) $row['stage'], 'decision' => $row['decision'], 'hiredAt' => $row['hired_at'],
      'nc' => null, 'focus' => null, 'followups' => array(), 'reviews' => array()
    );
  }
  load_history($employees);
  load_assessments($employees, $candidates);
  load_focus($employees, $candidates);
  load_reviews($candidates);
  out(array('ok' => true,
    'employees' => array_values($employees),
    'candidates' => array_values($candidates),
    'settings' => load_settings()));

/* ============================================================
   MANAGER — employee data
   ============================================================ */
case 'employee/save':
  need_post();
  require_scope('manager');
  $id = s(inp('id'), 24);
  $name = s(inp('name'), 120);
  if ($name === '') fail('name_required');
  $fields = array(
    'branch' => s(inp('branch'), 60),
    'dept' => s(inp('dept'), 60),
    'start_date' => s(inp('startDate'), 20),
    'target_pct' => intOrNull(inp('targetPct')),
    'months_above' => intOrNull(inp('monthsAbove')),
    'months_total' => intOrNull(inp('monthsTotal')) ?: 12,
    'attendance' => intOrNull(inp('attendance')),
    'late_days' => intOrNull(inp('lateDays')),
    'manager_score' => intOrNull(inp('managerScore'))
  );
  $grp = s(inp('group'), 10);
  if (!in_array($grp, array('strong', 'medium', 'low'), true)) $grp = null;

  if ($id === '') {
    $id = 'EMP' . strtoupper(bin2hex(random_bytes(4)));
    $st = db()->prepare('INSERT INTO employees (id, name, branch, dept, start_date, target_pct, months_above,
                          months_total, attendance, late_days, manager_score, grp, updated_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())');
    $st->execute(array($id, $name, $fields['branch'], $fields['dept'], $fields['start_date'],
      $fields['target_pct'], $fields['months_above'], $fields['months_total'],
      $fields['attendance'], $fields['late_days'], $fields['manager_score'], $grp));
  } else {
    $st = db()->prepare('UPDATE employees SET name = ?, branch = ?, dept = ?, start_date = ?, target_pct = ?,
                          months_above = ?, months_total = ?, attendance = ?, late_days = ?, manager_score = ?,
                          grp = ?, updated_at = NOW() WHERE id = ?');
    $st->execute(array($name, $fields['branch'], $fields['dept'], $fields['start_date'], $fields['target_pct'],
      $fields['months_above'], $fields['months_total'], $fields['attendance'], $fields['late_days'],
      $fields['manager_score'], $grp, $id));
  }

  /* optional monthly history: [{m:'2025-01', pct:118}, ...] */
  $hist = inp('history');
  if (is_array($hist)) {
    $del = db()->prepare('DELETE FROM employee_history WHERE emp_id = ?');
    $del->execute(array($id));
    $ins = db()->prepare('INSERT INTO employee_history (emp_id, ym, pct) VALUES (?, ?, ?)
                          ON DUPLICATE KEY UPDATE pct = VALUES(pct)');
    foreach ($hist as $h) {
      if (!is_array($h) || !isset($h['m'])) continue;
      $ym = s($h['m'], 7);
      $pct = intOrNull(isset($h['pct']) ? $h['pct'] : null);
      if (!preg_match('/^\d{4}-\d{2}$/', $ym) || $pct === null) continue;
      $ins->execute(array($id, $ym, max(0, min(400, $pct))));
    }
  }
  out(array('ok' => true, 'id' => $id));

case 'employee/delete':
  need_post();
  require_scope('manager');
  $id = s(inp('id'), 24);
  if ($id === '') fail('id_required');
  foreach (array('DELETE FROM employee_history WHERE emp_id = ?',
                 'DELETE FROM assessments WHERE subject_type = "employee" AND subject_id = ?',
                 'DELETE FROM focus_results WHERE subject_type = "employee" AND subject_id = ?',
                 'DELETE FROM employees WHERE id = ?') as $q) {
    $st = db()->prepare($q);
    $st->execute(array($id));
  }
  out(array('ok' => true));

case 'employee/code':
  need_post();
  require_scope('manager');
  $id = s(inp('id'), 24);
  $code = mb_strtoupper(s(inp('code'), 40));
  if ($id === '' || mb_strlen($code) < 6) fail('bad_input');
  /* a code must be unique across the roster */
  $st = db()->prepare('SELECT id FROM employees WHERE code_lookup = ? AND id <> ? LIMIT 1');
  $st->execute(array(code_lookup($code), $id));
  if ($st->fetch()) fail('code_taken', 409);
  $up = db()->prepare('UPDATE employees SET code_hash = ?, code_lookup = ?, code_sha = NULL, updated_at = NOW() WHERE id = ?');
  $up->execute(array(password_hash($code, PASSWORD_DEFAULT), code_lookup($code), $id));
  out(array('ok' => true));

/* ============================================================
   MANAGER — candidates
   ============================================================ */
case 'candidate/decision':
  need_post();
  require_scope('manager');
  $id = s(inp('id'), 24);
  $dec = s(inp('decision'), 16);
  if (!in_array($dec, array('interview', 'hired', 'reject'), true)) fail('bad_decision');
  $stage = $dec === 'hired' ? 7 : ($dec === 'interview' ? 5 : 6);
  $st = db()->prepare('UPDATE candidates SET decision = ?, stage = ?, hired_at = ? WHERE id = ?');
  $st->execute(array($dec, $stage, $dec === 'hired' ? date('Y-m-d') : null, $id));
  out(array('ok' => true));

case 'candidate/review':
  need_post();
  require_scope('manager');
  $id = s(inp('id'), 24);
  $day = intOrNull(inp('day'));
  if ($id === '' || !in_array($day, array(30, 90, 180), true)) fail('bad_input');
  $data = inp('data');
  if (!is_array($data)) $data = array();
  $clean = array();
  foreach (array('targetPct', 'attendance', 'discipline', 'learning', 'coachability', 'effort', 'managerRating', 'sales', 'persistence') as $k) {
    if (isset($data[$k])) $clean[$k] = intOrNull($data[$k]);
  }
  $st = db()->prepare('INSERT INTO candidate_reviews (cand_id, day, payload) VALUES (?, ?, ?)
                       ON DUPLICATE KEY UPDATE payload = VALUES(payload)');
  $st->execute(array($id, $day, json_encode($clean)));
  out(array('ok' => true));

case 'candidate/delete':
  need_post();
  require_scope('manager');
  $id = s(inp('id'), 24);
  if ($id === '') fail('id_required');
  foreach (array('DELETE FROM candidate_reviews WHERE cand_id = ?',
                 'DELETE FROM assessments WHERE subject_type = "candidate" AND subject_id = ?',
                 'DELETE FROM focus_results WHERE subject_type = "candidate" AND subject_id = ?',
                 'DELETE FROM candidates WHERE id = ?') as $q) {
    $st = db()->prepare($q);
    $st->execute(array($id));
  }
  out(array('ok' => true));

/* ============================================================
   MANAGER — settings and own passphrase
   ============================================================ */
case 'settings/save':
  need_post();
  require_scope('manager');
  $in = inp('settings');
  if (!is_array($in)) fail('bad_settings');
  $cur = load_settings();
  $allowed = array_keys(default_settings());
  foreach ($in as $k => $v) {
    if (in_array($k, $allowed, true)) $cur[$k] = $v;
  }
  setting_set('app_settings', json_encode($cur, JSON_UNESCAPED_UNICODE));
  out(array('ok' => true, 'settings' => $cur));

case 'manager/focus':
  need_post();
  require_scope('manager');
  $type = s(inp('subjectType'), 12);
  $sid = s(inp('subjectId'), 24);
  if (!in_array($type, array('employee', 'candidate'), true) || $sid === '') fail('bad_input');
  $res = inp('result');
  if (!is_array($res) || !isset($res['focus'])) fail('bad_result');
  $focus = intOrNull($res['focus']);
  if ($focus === null || $focus < 0 || $focus > 100) fail('bad_focus');
  $payload = array(
    'focus' => $focus,
    'sub' => isset($res['sub']) && is_array($res['sub']) ? $res['sub'] : array(),
    'raw' => isset($res['raw']) && is_array($res['raw']) ? $res['raw'] : array(),
    'completedAt' => date('Y-m-d')
  );
  $st = db()->prepare('INSERT INTO focus_results (subject_type, subject_id, focus, payload) VALUES (?, ?, ?, ?)');
  $st->execute(array($type, $sid, $focus, json_encode($payload, JSON_UNESCAPED_UNICODE)));
  out(array('ok' => true));

case 'manager/pass':
  need_post();
  require_scope('manager');
  $new = (string) inp('pass', '');
  if (mb_strlen($new) < 8) fail('too_short');
  setting_set('manager_pass_hash', password_hash($new, PASSWORD_DEFAULT));
  setting_set('manager_pass_sha', '');
  out(array('ok' => true));

/* ============================================================
   MANAGER — import a local-mode export into the database

   The app runs per-browser until the backend is live, so a manager can
   arrive with candidates that exist only in one browser. This takes that
   exported JSON and writes it centrally.

   Deliberately narrow: it never reads login codes, code hashes or the
   manager passphrase out of the file, and it never deletes a central
   record. Employees are matched by id and only their metrics are
   updated — the roster itself is not created from a file.
   ============================================================ */
case 'import/state':
  need_post();
  require_scope('manager');
  migrate();

  $emps = inp('employees');
  $cands = inp('candidates');
  if (!is_array($emps)) $emps = array();
  if (!is_array($cands)) $cands = array();
  if (count($emps) > 300 || count($cands) > 2000) fail('payload_too_large', 413);

  $rep = array(
    'employeesUpdated' => 0, 'employeesSkipped' => 0,
    'candidatesAdded' => 0, 'candidatesExisting' => 0,
    'assessments' => 0, 'focus' => 0, 'reviews' => 0, 'history' => 0
  );

  /* ---------- employees: metrics only, matched by id ---------- */
  $find = db()->prepare('SELECT id FROM employees WHERE id = ? LIMIT 1');
  $upd = db()->prepare('UPDATE employees SET branch = ?, dept = ?, start_date = ?, target_pct = ?,
                         months_above = ?, months_total = ?, attendance = ?, late_days = ?,
                         manager_score = ?, grp = ?, updated_at = NOW() WHERE id = ?');
  $histDel = db()->prepare('DELETE FROM employee_history WHERE emp_id = ?');
  $histIns = db()->prepare('INSERT INTO employee_history (emp_id, ym, pct) VALUES (?, ?, ?)
                            ON DUPLICATE KEY UPDATE pct = VALUES(pct)');
  foreach ($emps as $e) {
    if (!is_array($e) || empty($e['id'])) continue;
    $id = s($e['id'], 24);
    $find->execute(array($id));
    if (!$find->fetch()) { $rep['employeesSkipped']++; continue; }

    $grp = s(isset($e['group']) ? $e['group'] : '', 10);
    if (!in_array($grp, array('strong', 'medium', 'low'), true)) $grp = null;
    $upd->execute(array(
      s(isset($e['branch']) ? $e['branch'] : '', 60),
      s(isset($e['dept']) ? $e['dept'] : '', 60),
      s(isset($e['startDate']) ? $e['startDate'] : '', 20),
      intOrNull(isset($e['targetPct']) ? $e['targetPct'] : null),
      intOrNull(isset($e['monthsAbove']) ? $e['monthsAbove'] : null),
      intOrNull(isset($e['monthsTotal']) ? $e['monthsTotal'] : null) ?: 12,
      intOrNull(isset($e['attendance']) ? $e['attendance'] : null),
      intOrNull(isset($e['lateDays']) ? $e['lateDays'] : null),
      intOrNull(isset($e['managerScore']) ? $e['managerScore'] : null),
      $grp, $id));
    $rep['employeesUpdated']++;

    if (isset($e['history']) && is_array($e['history']) && count($e['history'])) {
      $histDel->execute(array($id));
      foreach ($e['history'] as $h) {
        if (!is_array($h) || !isset($h['m'])) continue;
        $ym = s($h['m'], 7);
        $pct = intOrNull(isset($h['pct']) ? $h['pct'] : null);
        if (!preg_match('/^\d{4}-\d{2}$/', $ym) || $pct === null) continue;
        $histIns->execute(array($id, $ym, max(0, min(400, $pct))));
        $rep['history']++;
      }
    }
    if (isset($e['assessment']) && is_array($e['assessment'])
        && put_assessment('employee', $id, 'emp36', $e['assessment'])) $rep['assessments']++;
    if (isset($e['nc22']) && is_array($e['nc22'])
        && put_assessment('employee', $id, 'nc22', $e['nc22'])) $rep['assessments']++;
    if (isset($e['focus']) && is_array($e['focus'])
        && put_focus('employee', $id, $e['focus'])) $rep['focus']++;
  }

  /* ---------- candidates: inserted when the id is new ---------- */
  $findC = db()->prepare('SELECT id FROM candidates WHERE id = ? LIMIT 1');
  $insC = db()->prepare('INSERT INTO candidates (id, name, phone, email, stage, decision, hired_at, created_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  $insR = db()->prepare('INSERT INTO candidate_reviews (cand_id, day, payload) VALUES (?, ?, ?)
                         ON DUPLICATE KEY UPDATE payload = VALUES(payload)');
  foreach ($cands as $c) {
    if (!is_array($c) || empty($c['id'])) continue;
    $id = s($c['id'], 24);
    $name = s(isset($c['name']) ? $c['name'] : '', 120);
    if ($name === '') continue;

    $findC->execute(array($id));
    if ($findC->fetch()) {
      $rep['candidatesExisting']++;
    } else {
      $dec = s(isset($c['decision']) ? $c['decision'] : '', 16);
      if (!in_array($dec, array('interview', 'hired', 'reject'), true)) $dec = null;
      $stage = intOrNull(isset($c['stage']) ? $c['stage'] : null);
      if ($stage === null || $stage < 1 || $stage > 8) $stage = 1;
      $created = ymd_or_null(isset($c['createdAt']) ? $c['createdAt'] : null) ?: date('Y-m-d');
      $insC->execute(array($id, $name,
        s(isset($c['phone']) ? $c['phone'] : '', 40),
        s(isset($c['email']) ? $c['email'] : '', 120),
        $stage, $dec, ymd_or_null(isset($c['hiredAt']) ? $c['hiredAt'] : null),
        $created . ' 00:00:00'));
      $rep['candidatesAdded']++;
    }

    if (isset($c['nc']) && is_array($c['nc'])
        && put_assessment('candidate', $id, 'nc25', $c['nc'])) $rep['assessments']++;
    if (isset($c['focus']) && is_array($c['focus'])
        && put_focus('candidate', $id, $c['focus'])) $rep['focus']++;

    if (isset($c['reviews']) && is_array($c['reviews'])) {
      foreach ($c['reviews'] as $rv) {
        if (!is_array($rv)) continue;
        $day = intOrNull(isset($rv['day']) ? $rv['day'] : null);
        if (!in_array($day, array(30, 90, 180), true)) continue;
        $clean = array();
        foreach (array('targetPct', 'attendance', 'discipline', 'learning', 'coachability',
                       'effort', 'managerRating', 'sales', 'persistence') as $k) {
          if (isset($rv[$k])) $clean[$k] = intOrNull($rv[$k]);
        }
        $insR->execute(array($id, $day, json_encode($clean)));
        $rep['reviews']++;
      }
    }
  }

  out(array('ok' => true, 'report' => $rep));

default:
  fail('unknown_route: ' . $r, 404);
}
