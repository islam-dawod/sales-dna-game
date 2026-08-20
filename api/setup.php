<?php
/* ============================================================
   SALES DNA — setup wizard  (removes itself once you are done)

   Open it in a browser:  https://<domain>/dna/api/setup.php

   It replaces the by-hand steps: it asks for the MySQL details,
   tests them, writes config.php itself, creates the tables, seeds
   the 24 employees, then locks installation and deletes the
   installer files.

   The database password is typed into this page and written
   straight into config.php on the server. It is never logged,
   echoed back, or stored anywhere else.
   ============================================================ */

define('SDNA', 1);
require __DIR__ . '/lib.php';   /* defines functions only — reads no config */
require __DIR__ . '/seed.php';

$CFG    = __DIR__ . '/config.php';
$OWNER  = __DIR__ . '/.setup-owner';
$action = isset($_POST['action']) ? $_POST['action'] : '';

/* ---------------- helpers ---------------- */
function h($v) { return htmlspecialchars((string) $v, ENT_QUOTES, 'UTF-8'); }

function field($name, $default = '') {
  $v = isset($_POST[$name]) ? $_POST[$name] : $default;
  if (!is_string($v)) $v = '';
  $v = preg_replace('/[\x00-\x1F\x7F]/', '', $v);
  return trim(substr($v, 0, 190));
}

function write_config($file, $c) {
  $php = "<?php\n/* SALES DNA — written by setup.php.\n"
       . "   Holds the database password: never commit or share this file. */\n\nreturn array(\n";
  foreach ($c as $k => $v) {
    $php .= '  ' . var_export((string) $k, true) . ' => ' . var_export($v, true) . ",\n";
  }
  $php .= ");\n";
  if (@file_put_contents($file, $php, LOCK_EX) === false) return false;
  @chmod($file, 0640);
  return true;
}

/* connection test that reports the real reason, not a generic failure */
function try_connect($c, &$err) {
  $dsn = 'mysql:host=' . $c['db_host'] . ';port=' . (int) $c['db_port'] .
         ';dbname=' . $c['db_name'] . ';charset=utf8mb4';
  try {
    new PDO($dsn, $c['db_user'], $c['db_pass'], array(
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_TIMEOUT => 6
    ));
    return true;
  } catch (Exception $e) {
    $err = $e->getMessage();
    return false;
  }
}

function page_open($title) {
  header('Content-Type: text/html; charset=utf-8');
  header('X-Robots-Tag: noindex, nofollow');
  header('Cache-Control: no-store');
  echo '<!doctype html><html dir="rtl" lang="ar"><meta charset="utf-8">';
  echo '<meta name="viewport" content="width=device-width,initial-scale=1">';
  echo '<meta name="robots" content="noindex,nofollow">';
  echo '<title>' . h($title) . '</title>';
  echo '<style>'
    . '*{box-sizing:border-box}'
    . 'body{font-family:Tahoma,Arial,sans-serif;background:#0b1220;color:#e8eeff;padding:24px;line-height:1.9;margin:0}'
    . '.wrap{max-width:760px;margin:0 auto}'
    . 'h1{color:#7dd3fc;font-size:21px;margin:0 0 6px}'
    . '.step{color:#8fa6c8;font-size:13.5px;margin:0 0 18px}'
    . '.ok{color:#6ee7b7}.bad{color:#fca5a5}.warn{color:#fbbf24}'
    . 'code{background:#16223a;padding:2px 6px;border-radius:4px;font-family:Consolas,monospace;'
    . 'direction:ltr;display:inline-block}'
    . '.box{background:#111a2c;border:1px solid #22304a;border-radius:12px;padding:14px 18px;margin:12px 0}'
    . '.box.err{border-color:#7f1d1d;background:#1a1015}'
    . '.box.good{border-color:#14532d;background:#0d1a14}'
    . 'label{display:block;margin:12px 0}'
    . 'label span{display:block;font-size:13px;color:#a9bede;margin-bottom:5px}'
    . 'input{width:100%;padding:10px 12px;border-radius:9px;border:1px solid #2b3c5c;background:#0d1729;'
    . 'color:#e8eeff;font-size:15px;font-family:Consolas,monospace;direction:ltr;text-align:left}'
    . 'input:focus{outline:none;border-color:#38bdf8}'
    . 'button{background:#0ea5e9;color:#04121e;border:0;padding:12px 22px;border-radius:10px;font-size:15px;'
    . 'font-weight:bold;cursor:pointer;font-family:inherit;margin-top:14px}'
    . 'button:hover{background:#38bdf8}'
    . 'button.danger{background:#f59e0b}button.danger:hover{background:#fbbf24}'
    . 'a{color:#7dd3fc}'
    . '.grid{display:grid;grid-template-columns:1fr 1fr;gap:0 14px}'
    . '@media(max-width:560px){.grid{grid-template-columns:1fr}}'
    . '.hint{font-size:12.5px;color:#8fa6c8}'
    . 'pre{background:#0d1729;border:1px solid #22304a;border-radius:9px;padding:12px;overflow-x:auto;'
    . 'direction:ltr;text-align:left;font-size:13px;white-space:pre-wrap}'
    . '</style><div class="wrap">';
  echo '<h1>SALES DNA — تشغيل قاعدة البيانات</h1>';
}
function page_close() { echo '</div>'; exit; }

/* ============================================================
   GUARD 1 — installed and locked: this page must not run at all
   ============================================================ */
if (is_file($CFG)) {
  $cur = require $CFG;
  if (is_array($cur) && empty($cur['allow_install'])) {
    page_open('مغلق');
    echo '<div class="box good"><span class="ok">✔</span> التثبيت مكتمل ومغلق — لا حاجة لهذه الصفحة.<br>'
       . 'احذف <code>setup.php</code> و<code>install.php</code> من السيرفر إن كانا موجودين.<br><br>'
       . 'فحص الحالة: <a href="index.php?r=health">index.php?r=health</a></div>';
    page_close();
  }
}

/* ============================================================
   GUARD 2 — the first visitor owns the wizard
   The URL is public until installation is locked, so the first IP
   that opens it is remembered and nobody else can drive it.
   ============================================================ */
$ip = clientIp();
if (!is_file($OWNER)) {
  @file_put_contents($OWNER, $ip);
} else {
  $owner = trim((string) @file_get_contents($OWNER));
  if ($owner !== '' && $owner !== $ip) {
    page_open('محجوز');
    echo '<div class="box err"><span class="bad">✗</span> هذه الصفحة محجوزة للجهاز الذي بدأ التثبيت '
       . '(<code>' . h($owner) . '</code>) وعنوانك الحالي <code>' . h($ip) . '</code>.<br><br>'
       . 'إن كان هذا جهازك وتغيّر عنوان الإنترنت، احذف الملف <code>api/.setup-owner</code> '
       . 'من مدير الملفات في Plesk ثم أعد تحميل الصفحة.</div>';
    page_close();
  }
}

/* ============================================================
   ACTION — lock: close installation, delete the installers
   ============================================================ */
if ($action === 'lock') {
  page_open('إغلاق التثبيت');
  if (!is_file($CFG)) {
    echo '<div class="box err"><span class="bad">✗</span> لا يوجد <code>config.php</code> بعد. '
       . '<a href="setup.php">رجوع</a></div>';
    page_close();
  }
  $c = require $CFG;
  if (!is_array($c)) $c = array();
  $c['allow_install'] = false;
  if (!write_config($CFG, $c)) {
    echo '<div class="box err"><span class="bad">✗</span> تعذّر تعديل <code>config.php</code>. '
       . 'افتحه يدوياً واجعل <code>allow_install</code> يساوي <code>false</code>.</div>';
    page_close();
  }
  echo '<div class="box good"><span class="ok">✔</span> التثبيت مغلق: <code>allow_install = false</code>.</div>';

  $left = array();
  foreach (array('install.php', '.setup-owner', 'setup.php') as $f) {
    $p = __DIR__ . '/' . $f;
    if (is_file($p) && !@unlink($p)) $left[] = $f;
  }
  if ($left) {
    echo '<div class="box"><span class="warn">⚠</span> احذف هذه الملفات يدوياً من مدير الملفات في Plesk: <code>'
       . implode('</code> · <code>', array_map('h', $left)) . '</code></div>';
  } else {
    echo '<div class="box good"><span class="ok">✔</span> حُذفت ملفات التثبيت من السيرفر.</div>';
  }
  echo '<div class="box"><b>انتهى.</b><br>'
     . '· الحالة: <a href="index.php?r=health">index.php?r=health</a> — يجب أن ترى '
     . '<code>"db":true</code> و<code>"employees":24</code><br>'
     . '· التطبيق: <a href="../">افتح SALES DNA</a><br><br>'
     . 'جرّب الآن: دخول موظف بكوده · كود خاطئ عدة مرات · دخول المدير · '
     . 'إكمال تقييم ثم فتح كونسول المدير من جهاز آخر.</div>';
  page_close();
}

/* ============================================================
   ACTION — install: test, write config, migrate, seed
   ============================================================ */
if ($action === 'install') {
  page_open('التثبيت');

  $c = array(
    'db_host' => field('db_host', 'localhost'),
    'db_name' => field('db_name'),
    'db_user' => field('db_user'),
    'db_pass' => field('db_pass'),
    'db_port' => (int) field('db_port', '3306'),
    'allow_install' => true,
    'session_hours' => 12
  );
  if ($c['db_port'] < 1 || $c['db_port'] > 65535) $c['db_port'] = 3306;
  if ($c['db_host'] === '') $c['db_host'] = 'localhost';

  if ($c['db_name'] === '' || $c['db_user'] === '') {
    echo '<div class="box err"><span class="bad">✗</span> اسم قاعدة البيانات واسم المستخدم مطلوبان. '
       . '<a href="setup.php">رجوع</a></div>';
    page_close();
  }

  $err = '';
  if (!try_connect($c, $err)) {
    echo '<div class="box err"><span class="bad">✗ فشل الاتصال بقاعدة البيانات.</span><br>'
       . 'رسالة MySQL:<pre>' . h($err) . '</pre>'
       . '<span class="hint">الأسباب الشائعة: كلمة المرور غير مطابقة · اسم القاعدة أو المستخدم يحمل بادئة '
       . 'في Plesk (مثل <code>driftx_dna</code>) فاكتبه كما يظهر تماماً · المستخدم غير مربوط بالقاعدة.</span></div>'
       . '<div class="box"><a href="setup.php">← تعديل البيانات والمحاولة مرة أخرى</a></div>';
    page_close();
  }
  echo '<div class="box good"><span class="ok">✔</span> الاتصال بقاعدة البيانات ناجح.</div>';

  if (!write_config($CFG, $c)) {
    echo '<div class="box err"><span class="bad">✗</span> الاتصال ناجح لكن تعذّر كتابة <code>config.php</code> '
       . '— مجلد <code>api</code> غير قابل للكتابة.<br>أنشئ الملف يدوياً بهذا المحتوى '
       . '(ضع كلمة المرور مكان العلامة) ثم أعد تحميل هذه الصفحة:<pre>'
       . h("<?php\nreturn array(\n"
         . "  'db_host' => " . var_export($c['db_host'], true) . ",\n"
         . "  'db_name' => " . var_export($c['db_name'], true) . ",\n"
         . "  'db_user' => " . var_export($c['db_user'], true) . ",\n"
         . "  'db_pass' => '...',\n"
         . '  ' . "'db_port' => " . (int) $c['db_port'] . ",\n"
         . "  'allow_install' => true,\n"
         . "  'session_hours' => 12,\n"
         . ");\n")
       . '</pre></div>';
    page_close();
  }
  echo '<div class="box good"><span class="ok">✔</span> كُتب <code>config.php</code> على السيرفر.</div>';

  try {
    migrate();
    echo '<div class="box good"><span class="ok">✔</span> الجداول التسعة جاهزة.</div>';
    $rep = sdna_seed();
    echo '<div class="box good"><span class="ok">✔</span> الموظفون: أُضيف <b>' . (int) $rep['added']
       . '</b> · موجود مسبقاً <b>' . (int) $rep['skipped'] . '</b> · الإجمالي الآن <b>'
       . (int) $rep['total'] . '</b></div>';
    echo '<div class="box good"><span class="ok">✔</span> كلمة سر المدير '
       . ($rep['manager'] === 'set'
          ? 'مثبّتة — نفس الكلمة الحالية، وتتحوّل إلى bcrypt عند أول دخول.'
          : 'كانت معرّفة مسبقاً، لم تُلمس.') . '</div>';
    if ($rep['settings']) {
      echo '<div class="box good"><span class="ok">✔</span> الإعدادات الافتراضية مكتوبة.</div>';
    }
  } catch (Exception $e) {
    echo '<div class="box err"><span class="bad">✗ فشل إنشاء الجداول:</span><pre>' . h($e->getMessage()) . '</pre>'
       . '<span class="hint">المستخدم يحتاج صلاحية CREATE على هذه القاعدة.</span></div>';
    page_close();
  }

  echo '<form method="post"><input type="hidden" name="action" value="lock">'
     . '<div class="box"><b>الخطوة الأخيرة — لا تتخطَّها:</b><br>'
     . 'تضبط <code>allow_install = false</code> وتحذف <code>install.php</code> و<code>setup.php</code> '
     . 'من السيرفر. هذه الصفحة عامة إلى أن تُغلق.'
     . '<br><button class="danger" type="submit">أغلق التثبيت واحذف ملفاته</button></div></form>';
  page_close();
}

/* ============================================================
   DEFAULT — environment check, then the form
   ============================================================ */
page_open('التثبيت');

$php_ok  = PHP_VERSION_ID >= 70400;
$pdo_ok  = extension_loaded('pdo_mysql');
$dir_ok  = is_writable(__DIR__);
$has_cfg = is_file($CFG);

echo '<p class="step">أنشئ قاعدة البيانات ومستخدمها في Plesk أولاً، ثم اكتب بياناتها هنا. '
   . 'كلمة المرور تُكتب في <code>config.php</code> على السيرفر ولا تُعرض ولا تُسجَّل في أي مكان آخر.</p>';

echo '<div class="box">'
   . ($php_ok
      ? '<span class="ok">✔</span> PHP ' . h(PHP_VERSION)
      : '<span class="bad">✗</span> PHP ' . h(PHP_VERSION) . ' — المطلوب 7.4 أو أحدث') . '<br>'
   . ($pdo_ok
      ? '<span class="ok">✔</span> إضافة <code>pdo_mysql</code> مفعّلة'
      : '<span class="bad">✗</span> إضافة <code>pdo_mysql</code> غير مفعّلة — فعّلها من Plesk ثم PHP Settings') . '<br>'
   . ($dir_ok
      ? '<span class="ok">✔</span> مجلد <code>api</code> قابل للكتابة'
      : '<span class="warn">⚠</span> مجلد <code>api</code> غير قابل للكتابة — سأعرض محتوى '
        . '<code>config.php</code> لتنسخه يدوياً')
   . '</div>';

if (!$pdo_ok) page_close();

$pre = array('db_host' => 'localhost', 'db_name' => 'dna', 'db_user' => 'dna', 'db_port' => '3306');
if ($has_cfg) {
  $old = require $CFG;
  if (is_array($old)) {
    echo '<div class="box"><span class="warn">⚠</span> يوجد <code>config.php</code> والتثبيت ما زال مفتوحاً. '
       . 'إن كان الاتصال يعمل فما عليك سوى <b>إغلاق التثبيت</b> من الأسفل.</div>';
    foreach (array('db_host', 'db_name', 'db_user', 'db_port') as $k) {
      if (!empty($old[$k])) $pre[$k] = (string) $old[$k];
    }
  }
}

echo '<form method="post" autocomplete="off"><input type="hidden" name="action" value="install">'
   . '<div class="box"><div class="grid">'
   . '<label><span>اسم قاعدة البيانات</span><input name="db_name" value="' . h($pre['db_name']) . '" required></label>'
   . '<label><span>مستخدم قاعدة البيانات</span><input name="db_user" value="' . h($pre['db_user']) . '" required></label>'
   . '</div>'
   . '<label><span>كلمة مرور قاعدة البيانات</span>'
   . '<input name="db_pass" type="password" autocomplete="new-password" required></label>'
   . '<div class="grid">'
   . '<label><span>المضيف</span><input name="db_host" value="' . h($pre['db_host']) . '"></label>'
   . '<label><span>المنفذ</span><input name="db_port" value="' . h($pre['db_port']) . '"></label>'
   . '</div>'
   . '<p class="hint">إن أظهر Plesk اسم القاعدة أو المستخدم ببادئة (مثل <code>driftx_dna</code>) '
   . 'فاكتبه كما يظهر تماماً.</p>'
   . '<button type="submit">تحقّق من الاتصال ثم ثبّت</button>'
   . '</div></form>';

if ($has_cfg) {
  echo '<form method="post"><input type="hidden" name="action" value="lock">'
     . '<div class="box">التثبيت جاهز مسبقاً؟ '
     . '<button class="danger" type="submit">أغلق التثبيت واحذف ملفاته</button></div></form>';
}
page_close();
