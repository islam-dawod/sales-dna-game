<?php
/* ============================================================
   SALES DNA — one-time installer (tables + roster)

   Prefer setup.php: it also asks for the database details and
   writes config.php for you. This file is the fallback for when
   config.php has already been created by hand.

   Run once:  https://<your-domain>/dna/api/install.php
   Then set 'allow_install' => false and delete both installers.
   ============================================================ */

define('SDNA', 1);
require __DIR__ . '/lib.php';
require __DIR__ . '/seed.php';

header('Content-Type: text/html; charset=utf-8');
header('X-Robots-Tag: noindex, nofollow');

echo '<!doctype html><html dir="rtl" lang="ar"><meta charset="utf-8">';
echo '<meta name="viewport" content="width=device-width,initial-scale=1">';
echo '<meta name="robots" content="noindex,nofollow">';
echo '<title>SALES DNA — التثبيت</title>';
echo '<style>body{font-family:Tahoma,Arial;background:#0b1220;color:#e8eeff;padding:24px;line-height:1.9}
 h1{color:#7dd3fc;font-size:20px} .ok{color:#6ee7b7} .bad{color:#fca5a5} .warn{color:#fbbf24} a{color:#7dd3fc}
 code{background:#16223a;padding:2px 6px;border-radius:4px;direction:ltr;display:inline-block}
 .box{background:#111a2c;border:1px solid #22304a;border-radius:12px;padding:14px 18px;max-width:820px;margin:14px 0}
 pre{background:#0d1729;border:1px solid #22304a;border-radius:9px;padding:12px;overflow-x:auto;direction:ltr;
     text-align:left;font-size:13px;white-space:pre-wrap}</style>';
echo '<h1>SALES DNA — تثبيت قاعدة البيانات</h1>';

/* ---------- config.php must exist before anything else ---------- */
if (!is_file(__DIR__ . '/config.php')) {
  echo '<div class="box"><span class="bad">✗</span> الملف <code>config.php</code> غير موجود، '
     . 'فلا توجد بيانات قاعدة بيانات بعد.<br><br>'
     . '<b>الأسهل:</b> افتح <a href="setup.php">setup.php</a> — يسألك عن بيانات القاعدة، '
     . 'يتحقّق منها، ويكتب <code>config.php</code> بنفسه ثم يُكمل التثبيت.<br><br>'
     . '<b>أو يدوياً:</b> انسخ <code>config.sample.php</code> إلى <code>config.php</code> '
     . 'وضع كلمة المرور في <code>db_pass</code>، ثم أعد تحميل هذه الصفحة.</div>';
  exit;
}

$c = cfg();
$force = isset($_GET['force']) && $_GET['force'] === '1';

if (empty($c['allow_install']) && !$force) {
  echo '<div class="box"><span class="bad">التثبيت مغلق.</span> إن كنت تحتاجه فعّل '
     . '<code>allow_install</code> في config.php مؤقتاً.</div>';
  exit;
}

/* ---------- 0. can we even reach the database? ---------- */
$probe = db_probe();
if (!$probe['ok']) {
  $d = db_diag($probe['error']);
  $t = isset($d['tried']) ? $d['tried'] : array();
  echo '<div class="box"><span class="bad">✗ فشل الاتصال بقاعدة البيانات.</span><br>رسالة MySQL:<pre>'
     . htmlspecialchars($probe['error'], ENT_QUOTES, 'UTF-8') . '</pre>'
     . 'القيم المقروءة من <code>config.php</code>:<pre>'
     . 'db_host = ' . htmlspecialchars(isset($t['host']) ? $t['host'] : '?', ENT_QUOTES, 'UTF-8') . "\n"
     . 'db_port = ' . (isset($t['port']) ? (int) $t['port'] : 0) . "\n"
     . 'db_name = ' . htmlspecialchars(isset($t['database']) ? $t['database'] : '?', ENT_QUOTES, 'UTF-8') . "\n"
     . 'db_user = ' . htmlspecialchars(isset($t['user']) ? $t['user'] : '?', ENT_QUOTES, 'UTF-8') . "\n"
     . 'db_pass = ' . (isset($t['password_length']) ? $t['password_length'] . ' حرفاً' : '?')
     . '</pre>'
     . '<span class="warn">قارن هذه القيم بما يعرضه Plesk بالضبط.</span> '
     . 'الرقم <code>1045</code> يعني كلمة مرور أو مستخدماً خاطئاً، و<code>1049</code> يعني أن اسم القاعدة غير موجود '
     . '(وهو حسّاس لحالة الأحرف: <code>DNA</code> ليست <code>dna</code>).</div>';
  exit;
}

/* ---------- 1. schema ---------- */
try {
  migrate();
  echo '<div class="box"><span class="ok">✔</span> تم إنشاء/التحقق من الجداول.</div>';
} catch (Exception $e) {
  echo '<div class="box"><span class="bad">✗ فشل إنشاء الجداول:</span><pre>'
     . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8') . '</pre>'
     . 'المستخدم يحتاج صلاحية CREATE على هذه القاعدة.</div>';
  exit;
}

/* ---------- 2. server key + roster + manager passphrase + settings ---------- */
try {
  $rep = sdna_seed();
} catch (Exception $e) {
  echo '<div class="box"><span class="bad">✗ فشل الزرع:</span><pre>'
     . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8') . '</pre></div>';
  exit;
}

echo '<div class="box"><span class="ok">✔</span> مفتاح السيرفر جاهز (يُستخدم للبحث المشفّر عن الأكواد).</div>';
echo '<div class="box"><span class="ok">✔</span> الموظفون: أُضيف <b>' . (int) $rep['added'] .
     '</b> · موجود مسبقاً <b>' . (int) $rep['skipped'] .
     '</b> · الإجمالي الآن <b>' . (int) $rep['total'] . '</b></div>';
echo '<div class="box"><span class="ok">✔</span> كلمة سر المدير ' .
     ($rep['manager'] === 'set'
      ? 'مثبّتة (نفس الكلمة الحالية). ستتحوّل تلقائياً إلى تشفير bcrypt عند أول دخول.'
      : 'معرّفة مسبقاً — لم تُلمس.') . '</div>';
if ($rep['settings']) {
  echo '<div class="box"><span class="ok">✔</span> الإعدادات الافتراضية مكتوبة.</div>';
}

echo '<div class="box"><b>الخطوة الأخيرة المهمة:</b><br>1. افتح <code>config.php</code> وغيّر
 <code>allow_install</code> إلى <code>false</code>.<br>2. احذف <code>install.php</code> و<code>setup.php</code>
 من السيرفر.<br>3. افحص <a href="index.php?r=health">index.php?r=health</a> — يجب أن يظهر
 <code>"db": true</code> و<code>"employees": 24</code>.</div>';

echo '<div class="box"><span class="warn">ملاحظة:</span> أكواد الموظفين مثبّتة كبصمات SHA-256 (نفس الموجودة
 في الواجهة)، وتتحوّل تلقائياً إلى bcrypt عند أول دخول لكل موظف. الأكواد نفسها غير مخزّنة في أي مكان.</div>';
