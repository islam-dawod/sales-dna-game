<?php
/* ============================================================
   SALES DNA — database, schema, auth, helpers
   No framework, no composer: PHP 7.4+ / 8.x with PDO MySQL.
   ============================================================ */

if (!defined('SDNA')) { http_response_code(403); exit('forbidden'); }

/* production hygiene: warnings must never leak into a JSON body */
@ini_set('display_errors', '0');
@ini_set('log_errors', '1');
error_reporting(E_ALL);

/* mbstring is normally present on Plesk; degrade gracefully if it is not */
if (!function_exists('mb_substr')) {
  function mb_substr($str, $start, $len = null, $enc = null) {
    return $len === null ? substr($str, $start) : substr($str, $start, $len);
  }
}
if (!function_exists('mb_strlen')) {
  function mb_strlen($str, $enc = null) { return strlen($str); }
}
if (!function_exists('mb_strtoupper')) {
  function mb_strtoupper($str, $enc = null) { return strtoupper($str); }
}

/* ---------------- output ---------------- */
function out($data, $code = 200) {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  header('X-Content-Type-Options: nosniff');
  header('Cache-Control: no-store');
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}
function fail($msg, $code = 400, $extra = array()) {
  out(array_merge(array('ok' => false, 'error' => $msg), $extra), $code);
}

/* ---------------- input ---------------- */
function body() {
  static $cache = null;
  if ($cache !== null) return $cache;
  $raw = file_get_contents('php://input');
  $j = json_decode($raw, true);
  $cache = is_array($j) ? $j : array();
  return $cache;
}
function inp($key, $default = null) {
  $b = body();
  if (array_key_exists($key, $b)) return $b[$key];
  if (isset($_GET[$key])) return $_GET[$key];
  return $default;
}
function s($v, $max = 190) {
  $v = is_string($v) ? trim($v) : '';
  $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', $v);
  return mb_substr($v, 0, $max);
}
function intOrNull($v) {
  if ($v === null || $v === '' || $v === false) return null;
  if (!is_numeric($v)) return null;
  return (int) round((float) $v);
}
function clientIp() {
  $ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '0.0.0.0';
  return mb_substr($ip, 0, 45);
}

/* ---------------- config + database ---------------- */
function cfg() {
  static $c = null;
  if ($c !== null) return $c;
  $file = __DIR__ . '/config.php';
  if (!is_file($file)) {
    fail('config_missing: copy config.sample.php to config.php and fill in the database details', 500);
  }
  $c = require $file;
  return $c;
}

function db_dsn() {
  $c = cfg();
  return 'mysql:host=' . $c['db_host'] . ';port=' . (isset($c['db_port']) ? $c['db_port'] : 3306) .
         ';dbname=' . $c['db_name'] . ';charset=utf8mb4';
}

/* Connection test that hands back the reason instead of dying, so install.php
   and health can say what is actually wrong. */
function db_probe() {
  $c = cfg();
  try {
    new PDO(db_dsn(), $c['db_user'], $c['db_pass'], array(
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_TIMEOUT => 6
    ));
    return array('ok' => true, 'error' => '');
  } catch (Exception $e) {
    return array('ok' => false, 'error' => $e->getMessage());
  }
}

/* The real MySQL message is only ever exposed while installation is still
   open. Once allow_install is false nothing is revealed. */
function db_diag($msg) {
  $c = cfg();
  if (empty($c['allow_install'])) return array();
  return array(
    'detail' => $msg,
    'tried'  => array(
      'host' => $c['db_host'],
      'port' => isset($c['db_port']) ? (int) $c['db_port'] : 3306,
      'database' => $c['db_name'],
      'user' => $c['db_user'],
      'password_length' => strlen((string) $c['db_pass'])
    )
  );
}

function db() {
  static $pdo = null;
  if ($pdo !== null) return $pdo;
  $c = cfg();
  try {
    $pdo = new PDO(db_dsn(), $c['db_user'], $c['db_pass'], array(
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_EMULATE_PREPARES => false
    ));
  } catch (Exception $e) {
    fail('db_connect_failed', 500, db_diag($e->getMessage()));
  }
  return $pdo;
}

/* ---------------- schema ---------------- */
function migrate() {
  $d = db();
  $d->exec("CREATE TABLE IF NOT EXISTS employees (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      branch VARCHAR(60) DEFAULT '',
      dept VARCHAR(60) DEFAULT '',
      start_date VARCHAR(20) DEFAULT '',
      target_pct INT NULL, months_above INT NULL, months_total INT DEFAULT 12,
      attendance INT NULL, late_days INT NULL, manager_score INT NULL,
      grp VARCHAR(10) NULL,
      code_lookup CHAR(64) NULL, code_hash VARCHAR(255) NULL, code_sha CHAR(64) NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NULL,
      UNIQUE KEY uniq_lookup (code_lookup)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

  $d->exec("CREATE TABLE IF NOT EXISTS employee_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      emp_id VARCHAR(24) NOT NULL,
      ym CHAR(7) NOT NULL,
      pct INT NOT NULL,
      UNIQUE KEY uniq_emp_month (emp_id, ym),
      KEY idx_emp (emp_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $d->exec("CREATE TABLE IF NOT EXISTS candidates (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      phone VARCHAR(40) DEFAULT '',
      email VARCHAR(120) DEFAULT '',
      stage INT DEFAULT 1,
      decision VARCHAR(16) NULL,
      hired_at VARCHAR(20) NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

  $d->exec("CREATE TABLE IF NOT EXISTS assessments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      subject_type VARCHAR(12) NOT NULL,
      subject_id VARCHAR(24) NOT NULL,
      model VARCHAR(16) NOT NULL,
      answers LONGTEXT NOT NULL,
      xp INT DEFAULT 0,
      badges TEXT NULL,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      KEY idx_subject (subject_type, subject_id, model)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $d->exec("CREATE TABLE IF NOT EXISTS focus_results (
      id INT AUTO_INCREMENT PRIMARY KEY,
      subject_type VARCHAR(12) NOT NULL,
      subject_id VARCHAR(24) NOT NULL,
      focus INT NOT NULL,
      payload LONGTEXT NOT NULL,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      KEY idx_subject (subject_type, subject_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $d->exec("CREATE TABLE IF NOT EXISTS candidate_reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cand_id VARCHAR(24) NOT NULL,
      day INT NOT NULL,
      payload LONGTEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_cand_day (cand_id, day)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $d->exec("CREATE TABLE IF NOT EXISTS settings (
      k VARCHAR(48) NOT NULL PRIMARY KEY,
      v LONGTEXT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $d->exec("CREATE TABLE IF NOT EXISTS sessions (
      token_hash CHAR(64) NOT NULL PRIMARY KEY,
      scope VARCHAR(12) NOT NULL,
      subject_id VARCHAR(24) NULL,
      ip VARCHAR(45) NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      KEY idx_exp (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $d->exec("CREATE TABLE IF NOT EXISTS login_attempts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ip VARCHAR(45) NOT NULL,
      scope VARCHAR(12) NOT NULL,
      ok TINYINT DEFAULT 0,
      at DATETIME DEFAULT CURRENT_TIMESTAMP,
      KEY idx_ip_at (ip, at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  /* ---- additive migrations ----
     CREATE TABLE IF NOT EXISTS never alters an existing table, so a column
     added after a database was already installed needs its own guarded step. */
  add_column($d, 'assessments', 'timing', 'LONGTEXT NULL');
}

/* adds a column only when it is missing, so migrate() stays safe to re-run */
function add_column($d, $table, $column, $definition) {
  try {
    $st = $d->prepare('SELECT COUNT(*) c FROM information_schema.columns
                       WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?');
    $st->execute(array($table, $column));
    $row = $st->fetch();
    if ($row && (int) $row['c'] > 0) return false;
    $d->exec('ALTER TABLE `' . $table . '` ADD COLUMN `' . $column . '` ' . $definition);
    return true;
  } catch (Exception $e) {
    return false;   /* a locked-down grant must not break every request */
  }
}

/* ---------------- settings helpers ---------------- */
function setting_get($key, $default = null) {
  $st = db()->prepare('SELECT v FROM settings WHERE k = ?');
  $st->execute(array($key));
  $row = $st->fetch();
  if (!$row) return $default;
  return $row['v'];
}
function setting_set($key, $val) {
  $st = db()->prepare('INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)');
  $st->execute(array($key, $val));
}
function app_key() {
  $k = setting_get('app_key');
  if (!$k) {
    $k = bin2hex(random_bytes(32));
    setting_set('app_key', $k);
  }
  return $k;
}
function code_lookup($code) {
  return hash_hmac('sha256', mb_strtoupper(trim($code)), app_key());
}

/* ---------------- rate limiting ---------------- */
function throttle($scope, $maxFails = 10, $minutes = 15) {
  $mins = (int) $minutes;
  $st = db()->prepare('SELECT COUNT(*) AS c FROM login_attempts
                       WHERE ip = ? AND scope = ? AND ok = 0 AND at > (NOW() - INTERVAL ' . $mins . ' MINUTE)');
  $st->execute(array(clientIp(), $scope));
  $row = $st->fetch();
  if ($row && (int) $row['c'] >= $maxFails) {
    fail('too_many_attempts', 429, array('retry_after_minutes' => $minutes));
  }
}
function log_attempt($scope, $ok) {
  $st = db()->prepare('INSERT INTO login_attempts (ip, scope, ok) VALUES (?, ?, ?)');
  $st->execute(array(clientIp(), $scope, $ok ? 1 : 0));
  /* opportunistic cleanup */
  db()->exec('DELETE FROM login_attempts WHERE at < (NOW() - INTERVAL 2 DAY)');
}

/* ---------------- sessions ---------------- */
function session_start_for($scope, $subjectId = null) {
  $token = bin2hex(random_bytes(32));
  $conf = cfg();
  $hours = (int) (isset($conf['session_hours']) ? $conf['session_hours'] : 12);
  $st = db()->prepare('INSERT INTO sessions (token_hash, scope, subject_id, ip, expires_at)
                       VALUES (?, ?, ?, ?, (NOW() + INTERVAL ' . (int) $hours . ' HOUR))');
  $st->execute(array(hash('sha256', $token), $scope, $subjectId, clientIp()));
  db()->exec('DELETE FROM sessions WHERE expires_at < NOW()');

  $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
  $params = array(
    'expires'  => time() + $hours * 3600,
    'path'     => dirname(dirname($_SERVER['SCRIPT_NAME'])) ?: '/',
    'secure'   => $secure,
    'httponly' => true,
    'samesite' => 'Lax'
  );
  if (PHP_VERSION_ID >= 70300) setcookie('sdna_t', $token, $params);
  else setcookie('sdna_t', $token, $params['expires'], $params['path'], '', $secure, true);
  return $token;
}

function current_session() {
  static $sess = false;
  if ($sess !== false) return $sess;
  $token = null;
  if (!empty($_COOKIE['sdna_t'])) $token = $_COOKIE['sdna_t'];
  if (!$token && !empty($_SERVER['HTTP_AUTHORIZATION'])) {
    if (preg_match('/Bearer\s+([a-f0-9]{64})/i', $_SERVER['HTTP_AUTHORIZATION'], $m)) $token = $m[1];
  }
  if (!$token || !preg_match('/^[a-f0-9]{64}$/', $token)) { $sess = null; return null; }
  $st = db()->prepare('SELECT scope, subject_id FROM sessions WHERE token_hash = ? AND expires_at > NOW()');
  $st->execute(array(hash('sha256', $token)));
  $row = $st->fetch();
  $sess = $row ? $row : null;
  return $sess;
}
function require_scope($scopes) {
  $s = current_session();
  if (!$s) fail('unauthorized', 401);
  if (!in_array($s['scope'], (array) $scopes, true)) fail('forbidden_scope', 403);
  return $s;
}
function session_end() {
  if (!empty($_COOKIE['sdna_t']) && preg_match('/^[a-f0-9]{64}$/', $_COOKIE['sdna_t'])) {
    $st = db()->prepare('DELETE FROM sessions WHERE token_hash = ?');
    $st->execute(array(hash('sha256', $_COOKIE['sdna_t'])));
  }
  $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
  setcookie('sdna_t', '', time() - 3600, dirname(dirname($_SERVER['SCRIPT_NAME'])) ?: '/', '', $secure, true);
}

/* ---------------- shaping rows for the client ---------------- */
function employee_row_to_client($r, $withPrivate = false) {
  $e = array(
    'id' => $r['id'],
    'name' => $r['name'],
    'branch' => $r['branch'],
    'dept' => $r['dept'],
    'startDate' => $r['start_date'],
    'targetPct' => isset($r['target_pct']) ? intOrNull($r['target_pct']) : null,
    'monthsAbove' => isset($r['months_above']) ? intOrNull($r['months_above']) : null,
    'monthsTotal' => intOrNull($r['months_total']),
    'attendance' => isset($r['attendance']) ? intOrNull($r['attendance']) : null,
    'lateDays' => isset($r['late_days']) ? intOrNull($r['late_days']) : null,
    'managerScore' => isset($r['manager_score']) ? intOrNull($r['manager_score']) : null,
    'group' => $r['grp'] !== null && $r['grp'] !== '' ? $r['grp'] : null,
    'assessment' => null, 'nc22' => null, 'focus' => null,
    'history' => array(), 'followups' => array()
  );
  if ($withPrivate) $e['hasCode'] = !empty($r['code_hash']) || !empty($r['code_sha']);
  return $e;
}

function load_history(&$employees) {
  $rows = db()->query('SELECT emp_id, ym, pct FROM employee_history ORDER BY ym ASC')->fetchAll();
  foreach ($rows as $h) {
    if (isset($employees[$h['emp_id']])) {
      $employees[$h['emp_id']]['history'][] = array('m' => $h['ym'], 'pct' => (int) $h['pct']);
    }
  }
}

/* newest assessment per (subject, model) */
function load_assessments(&$employees, &$candidates) {
  $rows = db()->query('SELECT a.* FROM assessments a
                       JOIN (SELECT subject_type, subject_id, model, MAX(id) AS mid
                             FROM assessments GROUP BY subject_type, subject_id, model) t
                         ON a.id = t.mid')->fetchAll();
  foreach ($rows as $a) {
    $payload = array(
      'answers' => json_decode($a['answers'], true),
      'xp' => (int) $a['xp'],
      'badges' => $a['badges'] ? json_decode($a['badges'], true) : array(),
      'levels' => (isset($a['timing']) && $a['timing']) ? json_decode($a['timing'], true) : array(),
      'completedAt' => mb_substr($a['completed_at'], 0, 10)
    );
    if ($a['subject_type'] === 'employee' && isset($employees[$a['subject_id']])) {
      $key = ($a['model'] === 'nc22') ? 'nc22' : 'assessment';
      $employees[$a['subject_id']][$key] = $payload;
    } elseif ($a['subject_type'] === 'candidate' && isset($candidates[$a['subject_id']])) {
      $candidates[$a['subject_id']]['nc'] = $payload;
    }
  }
}

function load_focus(&$employees, &$candidates) {
  $rows = db()->query('SELECT f.* FROM focus_results f
                       JOIN (SELECT subject_type, subject_id, MAX(id) AS mid
                             FROM focus_results GROUP BY subject_type, subject_id) t
                         ON f.id = t.mid')->fetchAll();
  foreach ($rows as $f) {
    $payload = json_decode($f['payload'], true);
    if (!is_array($payload)) continue;
    if ($f['subject_type'] === 'employee' && isset($employees[$f['subject_id']])) $employees[$f['subject_id']]['focus'] = $payload;
    elseif ($f['subject_type'] === 'candidate' && isset($candidates[$f['subject_id']])) $candidates[$f['subject_id']]['focus'] = $payload;
  }
}

function load_reviews(&$candidates) {
  $rows = db()->query('SELECT cand_id, day, payload FROM candidate_reviews ORDER BY day ASC')->fetchAll();
  foreach ($rows as $r) {
    if (!isset($candidates[$r['cand_id']])) continue;
    $p = json_decode($r['payload'], true);
    if (!is_array($p)) $p = array();
    $p['day'] = (int) $r['day'];
    $candidates[$r['cand_id']]['reviews'][] = $p;
    if (isset($p['targetPct'])) {
      $candidates[$r['cand_id']]['followups'][] = array('day' => (int) $r['day'], 'targetPct' => intOrNull($p['targetPct']));
    }
  }
}

function default_settings() {
  return array(
    'lang' => 'ar',
    'thresholds' => array('high' => 80, 'mid' => 65, 'stage1' => 65),
    'weights' => null,
    'ncWeights' => null,
    'focusEnabled' => true,
    'timerEnabled' => true,
    'levelSeconds' => 180,
    'focusInDecision' => false,
    'focusWeight' => 0,
    'spotDebug' => false,
    'spotValidated' => null,
    'sound' => true,
    'requirePhone' => false,
    'requireEmail' => false
  );
}
function load_settings() {
  $raw = setting_get('app_settings');
  $s = $raw ? json_decode($raw, true) : array();
  if (!is_array($s)) $s = array();
  return array_merge(default_settings(), $s);
}

/* ---------------- payload cleaners ----------------
   Shared by submit/assessment, submit/focus and import/state so a record
   written by an import is validated exactly like one written by a player. */
function clean_answers($answers, $max = 200) {
  if (!is_array($answers)) return array();
  $clean = array();
  foreach ($answers as $a) {
    if (count($clean) >= $max) break;
    if (!is_array($a) || !isset($a['qid'])) continue;
    $row = array(
      'qid'   => s($a['qid'], 24),
      'opt'   => intOrNull(isset($a['opt']) ? $a['opt'] : null),
      's'     => isset($a['s']) ? intOrNull($a['s']) : null,
      'f'     => isset($a['f']) && $a['f'] ? s($a['f'], 24) : null,
      'zone'  => isset($a['zone']) ? s($a['zone'], 16) : null,
      'trait' => isset($a['trait']) ? s($a['trait'], 20) : null,
      'lvl'   => isset($a['lvl']) ? intOrNull($a['lvl']) : null
    );
    /* timed assessment: how long the answer took, and whether the clock ran
       out before it was given. An unanswered question is not a wrong one. */
    $ms = isset($a['ms']) ? intOrNull($a['ms']) : null;
    if ($ms !== null && $ms >= 0 && $ms <= 3600000) $row['ms'] = $ms;
    if (!empty($a['unanswered'])) { $row['unanswered'] = true; $row['opt'] = null; }
    $clean[] = $row;
  }
  return $clean;
}

/* per-level clock report: [{key,n,code,answered,total,seconds,limit,timedOut}] */
function clean_levels($levels, $max = 12) {
  if (!is_array($levels)) return array();
  $out = array();
  foreach ($levels as $b) {
    if (count($out) >= $max) break;
    if (!is_array($b)) continue;
    $out[] = array(
      'key'      => s(isset($b['key']) ? $b['key'] : '', 16),
      'n'        => intOrNull(isset($b['n']) ? $b['n'] : null),
      'code'     => s(isset($b['code']) ? $b['code'] : '', 40),
      'answered' => max(0, min(200, (int) intOrNull(isset($b['answered']) ? $b['answered'] : 0))),
      'total'    => max(0, min(200, (int) intOrNull(isset($b['total']) ? $b['total'] : 0))),
      'seconds'  => max(0, min(7200, (int) intOrNull(isset($b['seconds']) ? $b['seconds'] : 0))),
      'limit'    => max(0, min(7200, (int) intOrNull(isset($b['limit']) ? $b['limit'] : 0))),
      'timedOut' => !empty($b['timedOut'])
    );
  }
  return $out;
}

/* returns null when the payload is not a usable focus result */
function clean_focus($res) {
  if (!is_array($res) || !isset($res['focus'])) return null;
  $focus = intOrNull($res['focus']);
  if ($focus === null || $focus < 0 || $focus > 100) return null;
  return array(
    'focus' => $focus,
    'sub'   => isset($res['sub']) && is_array($res['sub']) ? $res['sub'] : array(),
    'raw'   => isset($res['raw']) && is_array($res['raw']) ? $res['raw'] : array(),
    'completedAt' => (isset($res['completedAt']) && preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $res['completedAt']))
                      ? $res['completedAt'] : date('Y-m-d')
  );
}

function ymd_or_null($v) {
  $v = is_string($v) ? trim($v) : '';
  return preg_match('/^\d{4}-\d{2}-\d{2}$/', $v) ? $v : null;
}

/* writes the newest assessment for a subject, replacing an earlier one for the
   same model so a repeated import does not stack duplicates */
function put_assessment($type, $id, $model, $payload) {
  $clean = clean_answers(isset($payload['answers']) ? $payload['answers'] : null);
  if (!count($clean)) return false;
  $del = db()->prepare('DELETE FROM assessments WHERE subject_type = ? AND subject_id = ? AND model = ?');
  $del->execute(array($type, $id, $model));
  $levels = clean_levels(isset($payload['levels']) ? $payload['levels'] : null);
  $st = db()->prepare('INSERT INTO assessments (subject_type, subject_id, model, answers, xp, badges, timing, completed_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  $st->execute(array($type, $id, $model,
    json_encode($clean, JSON_UNESCAPED_UNICODE),
    intOrNull(isset($payload['xp']) ? $payload['xp'] : 0) ?: 0,
    json_encode(isset($payload['badges']) && is_array($payload['badges']) ? $payload['badges'] : array()),
    count($levels) ? json_encode($levels, JSON_UNESCAPED_UNICODE) : null,
    (ymd_or_null(isset($payload['completedAt']) ? $payload['completedAt'] : null) ?: date('Y-m-d')) . ' 00:00:00'));
  return true;
}

function put_focus($type, $id, $res) {
  $payload = clean_focus($res);
  if ($payload === null) return false;
  $del = db()->prepare('DELETE FROM focus_results WHERE subject_type = ? AND subject_id = ?');
  $del->execute(array($type, $id));
  $st = db()->prepare('INSERT INTO focus_results (subject_type, subject_id, focus, payload) VALUES (?, ?, ?, ?)');
  $st->execute(array($type, $id, $payload['focus'], json_encode($payload, JSON_UNESCAPED_UNICODE)));
  return true;
}
