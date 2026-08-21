<?php
/* ============================================================
   SALES DNA — AI / SIMILARITY LAYER
   Implements AI-LAYER.md §1.2, §5, §6 and §8.

   Two deliberate departures from the original proposal, both argued in
   AI-LAYER.md §1:

   1. No pgvector. That is PostgreSQL only and this runs MariaDB 10.6,
      whose own VECTOR type arrived in 11.7. Vectors are stored as JSON
      and cosine is computed here in PHP. At this scale that is the same
      mathematics: 24 employees against one candidate is 24 dot products.

   2. Nothing leaves this server unless a key is configured. The trait
      vector the assessment already produces is a usable embedding on its
      own, so similarity, neighbours and the predictive layer all work
      with no external call, no cost and no employee data in transit.
      An OpenAI text embedding is an optional upgrade, not a dependency.
   ============================================================ */

if (!defined('SDNA')) { http_response_code(403); exit('forbidden'); }

/* ---------------- schema (AI-LAYER §1.2 · §5 · §8) ---------------- */
function ai_migrate() {
  $d = db();

  $d->exec("CREATE TABLE IF NOT EXISTS embeddings (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      subject_type  VARCHAR(12) NOT NULL,
      subject_id    VARCHAR(24) NOT NULL,
      model         VARCHAR(40) NOT NULL,
      dims          SMALLINT NOT NULL,
      vec           LONGTEXT NOT NULL,
      norm          DOUBLE NOT NULL,
      source_text   TEXT NULL,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_subject_model (subject_type, subject_id, model),
      KEY idx_model (model)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $d->exec("CREATE TABLE IF NOT EXISTS prediction_results (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      candidate_id    VARCHAR(24) NOT NULL,
      employee_id     VARCHAR(24) NULL,
      predicted_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      predicted_match SMALLINT NOT NULL,
      predicted_tier  VARCHAR(16) NOT NULL,
      horizon_days    SMALLINT NOT NULL,
      actual_pct      SMALLINT NULL,
      verdict         VARCHAR(12) NULL,
      reviewed_at     DATETIME NULL,
      UNIQUE KEY uniq_cand_horizon (candidate_id, horizon_days),
      KEY idx_verdict (verdict)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  /* every AI call is recorded: who asked, what was sent, what it cost */
  $d->exec("CREATE TABLE IF NOT EXISTS ai_audit_log (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      at           DATETIME DEFAULT CURRENT_TIMESTAMP,
      action       VARCHAR(32) NOT NULL,
      subject_type VARCHAR(12) NULL,
      subject_id   VARCHAR(24) NULL,
      model        VARCHAR(40) NULL,
      sent_chars   INT NULL,
      tokens       INT NULL,
      ok           TINYINT DEFAULT 1,
      detail       VARCHAR(500) NULL,
      ip           VARCHAR(45) NULL,
      KEY idx_at (at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

function ai_audit($action, $type, $id, $model, $sentChars, $tokens, $ok, $detail) {
  try {
    $st = db()->prepare('INSERT INTO ai_audit_log
      (action, subject_type, subject_id, model, sent_chars, tokens, ok, detail, ip)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $st->execute(array($action, $type, $id, $model, $sentChars, $tokens,
      $ok ? 1 : 0, mb_substr((string) $detail, 0, 500), clientIp()));
  } catch (Exception $e) { /* auditing must never break the request */ }
}

/* ---------------- vector maths (AI-LAYER §6.2) ---------------- */
function ai_norm(array $v) {
  $s = 0.0;
  foreach ($v as $x) $s += $x * $x;
  return sqrt($s);
}

function ai_cosine(array $a, array $b, $na, $nb) {
  if (!$na || !$nb) return 0.0;
  $n = min(count($a), count($b));
  $dot = 0.0;
  for ($i = 0; $i < $n; $i++) $dot += $a[$i] * $b[$i];
  return $dot / ($na * $nb);
}

/* Mean absolute difference, scaled the same way Engine.similarity6() scales it
   in the browser, so the figure here and the figure the console already shows
   for the same pair are the same number. */
function ai_distance_similarity(array $a, array $b) {
  $n = min(count($a), count($b));
  if (!$n) return 0.0;
  $sum = 0.0;
  for ($i = 0; $i < $n; $i++) $sum += abs($a[$i] - $b[$i]);
  $mean = ($sum / $n) * 100.0;                 /* vectors are stored 0..1 */
  $sim = 100.0 - $mean * 1.35;
  return max(0.0, min(100.0, $sim)) / 100.0;
}

/* Which metric fits which vector.

   Cosine is the right measure for a high-dimensional text embedding, where
   direction carries the meaning. It is the wrong measure for the six trait
   dimensions: every value is positive and of similar magnitude, so every pair
   points almost the same way and cosine returns 0.98-1.00 for everyone —
   arithmetically correct and useless for ranking. Measured on real profiles:
   three strong and three weak employees all scored 98-99% against the same
   candidate. Distance separates them; angle does not. */
function ai_similarity(array $a, array $b, $na, $nb, $model) {
  if ($model === 'trait-v1' || count($a) <= 24) {
    return ai_distance_similarity($a, $b);
  }
  return ai_cosine($a, $b, $na, $nb);
}

function ai_clean_vector($v, $max = 3072) {
  if (!is_array($v)) return null;
  $out = array();
  foreach ($v as $x) {
    if (count($out) >= $max) break;
    if (!is_numeric($x)) return null;
    $f = (float) $x;
    if (!is_finite($f)) return null;
    $out[] = $f;
  }
  return count($out) >= 2 ? $out : null;
}

function ai_store_vector($type, $id, $model, array $vec, $text) {
  $norm = ai_norm($vec);
  if ($norm <= 0) return false;
  $st = db()->prepare('INSERT INTO embeddings
      (subject_type, subject_id, model, dims, vec, norm, source_text)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE dims = VALUES(dims), vec = VALUES(vec),
        norm = VALUES(norm), source_text = VALUES(source_text),
        created_at = CURRENT_TIMESTAMP');
  $st->execute(array($type, $id, $model, count($vec),
    json_encode($vec), $norm, mb_substr((string) $text, 0, 2000)));
  return true;
}

function ai_load_vectors($model, $type = null) {
  if ($type) {
    $st = db()->prepare('SELECT * FROM embeddings WHERE model = ? AND subject_type = ?');
    $st->execute(array($model, $type));
  } else {
    $st = db()->prepare('SELECT * FROM embeddings WHERE model = ?');
    $st->execute(array($model));
  }
  $out = array();
  foreach ($st->fetchAll() as $r) {
    $v = json_decode($r['vec'], true);
    if (!is_array($v)) continue;
    $out[] = array('type' => $r['subject_type'], 'id' => $r['subject_id'],
                   'vec' => $v, 'norm' => (float) $r['norm'], 'text' => $r['source_text']);
  }
  return $out;
}

/* ---------------- profile text (AI-LAYER §6.1) ----------------
   Deliberately carries no identifier, no name, no age, no gender and no
   nationality. Those are not statistically neutral for this question, and
   including them would let the system discriminate while looking objective. */
function ai_profile_text($subjectType, $subjectId, $traits, $perf) {
  $parts = array(ucfirst($subjectType) . ' ' . $subjectId . '.');
  if (is_array($traits)) {
    $named = array();
    foreach ($traits as $k => $v) {
      if ($v === null || !is_numeric($v)) continue;
      $band = $v >= 88 ? 'very high' : $v >= 78 ? 'high' : $v >= 65 ? 'mid' : 'low';
      $named[] = s($k, 24) . ' ' . (int) $v . ' (' . $band . ')';
    }
    if (count($named)) $parts[] = 'Traits: ' . implode(', ', $named) . '.';
  }
  if (is_array($perf)) {
    $bits = array();
    if (isset($perf['months']) && $perf['months'] !== null) $bits[] = intOrNull($perf['months']) . ' months of data';
    if (isset($perf['avg']) && $perf['avg'] !== null) $bits[] = 'average attainment ' . intOrNull($perf['avg']) . '%';
    if (isset($perf['streak']) && $perf['streak'] !== null) $bits[] = 'longest streak above target ' . intOrNull($perf['streak']);
    if (isset($perf['trend']) && $perf['trend'] !== null) $bits[] = 'trend ' . intOrNull($perf['trend']);
    if (count($bits)) $parts[] = 'Performance: ' . implode(', ', $bits) . '.';
  }
  return implode(' ', $parts);
}

/* ---------------- optional OpenAI embedding (AI-LAYER §9.1) ----------------
   Only ever attempted when a key is present in config.php. Without one the
   layer runs on the trait vector and nothing leaves this server. */
function ai_key() {
  $c = cfg();
  return isset($c['openai_key']) && $c['openai_key'] ? $c['openai_key'] : null;
}

function ai_openai_embed($text, $model, &$err) {
  $key = ai_key();
  if (!$key) { $err = 'no_key'; return null; }
  if (!function_exists('curl_init')) { $err = 'no_curl'; return null; }

  $ch = curl_init('https://api.openai.com/v1/embeddings');
  curl_setopt_array($ch, array(
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 20,
    CURLOPT_HTTPHEADER => array('Content-Type: application/json',
                                'Authorization: Bearer ' . $key),
    CURLOPT_POSTFIELDS => json_encode(array('input' => $text, 'model' => $model))
  ));
  $raw = curl_exec($ch);
  $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $cerr = curl_error($ch);
  curl_close($ch);

  if ($raw === false) { $err = 'curl: ' . $cerr; return null; }
  $j = json_decode($raw, true);
  if ($code !== 200 || !isset($j['data'][0]['embedding'])) {
    $err = 'http_' . $code . (isset($j['error']['message']) ? ': ' . $j['error']['message'] : '');
    return null;
  }
  return array('vec' => $j['data'][0]['embedding'],
               'tokens' => isset($j['usage']['total_tokens']) ? (int) $j['usage']['total_tokens'] : null);
}

/* ---------------- neighbours + predictive layer (AI-LAYER §5) ----------------
   The predictive number is a count, not an opinion: of the k most similar
   employees who have real performance data, how many actually cleared target.
   It is always returned with the raw fraction so "13 of 18" can be shown
   instead of a bare percentage. */
function ai_neighbours($model, $type, $id, $k, $minPct) {
  $all = ai_load_vectors($model);
  $self = null;
  foreach ($all as $row) {
    if ($row['type'] === $type && $row['id'] === $id) { $self = $row; break; }
  }
  if (!$self) return array('ok' => false, 'error' => 'no_vector_for_subject');

  /* performance per employee, straight from the monthly history */
  $perf = array();
  foreach (db()->query('SELECT emp_id, COUNT(*) n, AVG(pct) avg_pct
                        FROM employee_history GROUP BY emp_id')->fetchAll() as $r) {
    $perf[$r['emp_id']] = array('months' => (int) $r['n'], 'avg' => (int) round($r['avg_pct']));
  }

  $scored = array();
  foreach ($all as $row) {
    if ($row['type'] !== 'employee') continue;
    if ($row['type'] === $type && $row['id'] === $id) continue;
    $sim = ai_similarity($self['vec'], $row['vec'], $self['norm'], $row['norm'], $model);
    $p = isset($perf[$row['id']]) ? $perf[$row['id']] : null;
    $scored[] = array(
      'employee_id' => $row['id'],
      'similarity' => round($sim, 4),
      'attainment' => $p ? $p['avg'] : null,
      'months' => $p ? $p['months'] : null
    );
  }
  usort($scored, function ($a, $b) {
    return ($b['similarity'] < $a['similarity']) ? -1 : (($b['similarity'] > $a['similarity']) ? 1 : 0);
  });

  $neighbours = array_slice($scored, 0, max(1, min(50, (int) $k)));

  /* only neighbours with real numbers can carry a prediction */
  $withPerf = array();
  foreach ($neighbours as $n) if ($n['attainment'] !== null) $withPerf[] = $n;
  $hit = 0;
  foreach ($withPerf as $n) if ($n['attainment'] >= $minPct) $hit++;
  $of = count($withPerf);

  /* AI-LAYER §4: the tier decides whether this may carry weight at all */
  $tier = $of < 10 ? 'insufficient' : ($of < 30 ? 'preliminary' : ($of < 100 ? 'medium' : 'strong'));

  return array(
    'ok' => true,
    'model' => $model,
    'subject' => array('type' => $type, 'id' => $id),
    'neighbours' => $neighbours,
    'predictive' => array(
      'value' => $of ? (int) round(100 * $hit / $of) : null,
      'hit' => $hit, 'of' => $of, 'tier' => $tier,
      /* zero weight until the dataset can carry it */
      'counts_toward_match' => ($tier === 'medium' || $tier === 'strong')
    ),
    'confidence' => $tier === 'strong' ? 'high' : ($tier === 'medium' ? 'medium' : 'low'),
    'confidence_reason' => $of . ' employees with performance data; 30 needed for medium'
  );
}
