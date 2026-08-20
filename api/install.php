<?php
/* ============================================================
   SALES DNA — one-time installer
   Creates the tables and seeds the roster of 24 employees.
   Run it once:  https://<your-domain>/dna/api/install.php
   Then set  'allow_install' => false  in config.php and delete this file.
   ============================================================ */

define('SDNA', 1);
require __DIR__ . '/lib.php';

header('Content-Type: text/html; charset=utf-8');
$c = cfg();
$force = isset($_GET['force']) && $_GET['force'] === '1';

echo '<!doctype html><html dir="rtl" lang="ar"><meta charset="utf-8">';
echo '<title>SALES DNA — التثبيت</title>';
echo '<style>body{font-family:Tahoma,Arial;background:#0b1220;color:#e8eeff;padding:24px;line-height:1.9}
 h1{color:#7dd3fc;font-size:20px} .ok{color:#6ee7b7} .bad{color:#fca5a5} .warn{color:#fbbf24}
 code{background:#16223a;padding:2px 6px;border-radius:4px} .box{background:#111a2c;border:1px solid #22304a;
 border-radius:12px;padding:14px 18px;max-width:820px;margin:14px 0}</style>';
echo '<h1>SALES DNA — تثبيت قاعدة البيانات</h1>';

if (empty($c['allow_install']) && !$force) {
  echo '<div class="box"><span class="bad">التثبيت مغلق.</span> إن كنت تحتاجه فعّل <code>allow_install</code> في config.php مؤقتاً.</div>';
  exit;
}

/* ---------- 1. schema ---------- */
try {
  migrate();
  echo '<div class="box"><span class="ok">✔</span> تم إنشاء/التحقق من الجداول.</div>';
} catch (Exception $e) {
  echo '<div class="box"><span class="bad">✗ فشل إنشاء الجداول:</span> ' . htmlspecialchars($e->getMessage()) . '</div>';
  exit;
}

/* ---------- 2. server key ---------- */
$key = app_key();
echo '<div class="box"><span class="ok">✔</span> مفتاح السيرفر جاهز (يُستخدم للبحث المشفّر عن الأكواد).</div>';

/* ---------- 3. roster ---------- */
$roster = array(
  array('EMP01', 'Enas Ibrahim', 'مصر', '400b61369bc491f4b93002fdda342c46524053ff1a481ea188f68a423b75af92'),
  array('EMP02', 'Hajar Hilal', 'مصر', '661046bb15c5770007495c6c54c70f99c46fd0544588952988058284550ff432'),
  array('EMP03', 'Salma Fathy', 'مصر', 'e037dcdceb2316219e59a67716c219e64789f8dc9599fef2103149900ca85533'),
  array('EMP04', 'Esraa Hamed', 'مصر', '253a428a3db291001026c0ee62e679d38bcde49f70b827793550a422a94a817d'),
  array('EMP05', 'Abdullah Fadl', 'مصر', '541c428c4c0773d50b0cf6a947b80580c60bf08827987b2ca5c895843914d25d'),
  array('EMP06', 'Esraa Mohammed', 'مصر', '0c60e4b2f7cbcaabc1e2ccb6092e176c038c646e757c981f8a86ce651011683f'),
  array('EMP07', 'Rodina Waleed', 'مصر', '1773aed591144e6726f4ebf64a9d72583e188b76d0185b21a8be99e90807d1ff'),
  array('EMP08', 'Israa El Feki', 'مصر', '60f8bb3da5d50b306fd2856ab9d04ff276c1b83ba2ea7a2a9fc07862c520273c'),
  array('EMP09', 'Shimaa Saad', 'مصر', '7940d251c27caac505a692eb3e9a0d5f9418f18c2e477c48bbcd38ca13f10598'),
  array('EMP10', 'Salma Salah', 'مصر', 'b52911fcad155f3310f88c7d2e20590c56927eb98f2722b31b1b26f81cc351ab'),
  array('EMP11', 'Heba ELdesouki', 'مصر', 'c351dc3f0164c31acd8a1c3faeb316b283729b7f6317b67f4d0a388716f4e27a'),
  array('EMP12', 'Mallak Hefny', 'مصر', 'ba71012c8207c63f984afc452663707a3bf89eca3af9c81c2ed23679b1fcd7b8'),
  array('EMP13', 'Doaa Abdelhamed', 'مصر', '0a7f8aa0fee830f814081fa054277053c4e4858e3738ca5b1be9fdcf18d9a265'),
  array('EMP14', 'Bilal Ahmed', 'مصر', '30abf0326876f413c1e022de5262969b487a52cdf294b512a4e151414857b8e4'),
  array('EMP15', 'Mohamed Hegazy', 'مصر', '753acc26d23c2f0e4336a17f97234e117d2f21af53898b58d2d80c109ef66e96'),
  array('EMP16', 'Manar Ashraf', 'مصر', 'bf33ec3458f3153b0d8e379ccdfb23807f16b508030d41c9906b587653486ef1'),
  array('EMP17', 'Abeer AbuAlrob', 'رام الله', '4232c61c3916f4be2247f62e032d1537a5c3800b2abb11315dc400174042c207'),
  array('EMP18', 'Sondos Radi', 'رام الله', '17ee62bd501b9d17e67e6375ff7567dcbe1c194e203bd51630e3804697fd60d5'),
  array('EMP19', 'Shoroq Abualhof', 'فلسطين', 'f5370ae6abf1686eec3f43937dc40dcad2f39f3f14da2e870351a92931c2ced8'),
  array('EMP20', 'Noor Shehadeh', 'فلسطين', '5f3a4e3a66dadb292255844a2791e270ff90dbe7bc5d65596bc845e87245904c'),
  array('EMP21', 'Naseem Zbidat', 'فلسطين', '3d628c8e35cd1c1eca92effdd2d9c2c3c9221673dc4ea471f783f3479800fd4e'),
  array('EMP22', 'Firas Ahmed', 'فلسطين', '53ed2383838ad9694a385c7e523215ce75d5cb3d67848c39283061fb46f7f477'),
  array('EMP23', 'Lina Zbeidat', 'فلسطين', '6426cde3d2cb78fff46061402980ea60b7eb4e166b7a5aa4f824bf062698f5c3'),
  array('EMP24', 'Omar Masri', 'فلسطين', 'a3f8c0623899390c7e8bd3ffa9a0ecc6c53fe3e65568a71df1bc560a825cbe08')
);

$existing = (int) db()->query('SELECT COUNT(*) c FROM employees')->fetch()['c'];
$added = 0; $skipped = 0;
$ins = db()->prepare('INSERT INTO employees (id, name, branch, code_sha, months_total) VALUES (?, ?, ?, ?, 12)');
$has = db()->prepare('SELECT id FROM employees WHERE id = ?');
foreach ($roster as $row) {
  $has->execute(array($row[0]));
  if ($has->fetch()) { $skipped++; continue; }
  $ins->execute(array($row[0], $row[1], $row[2], $row[3]));
  $added++;
}
echo '<div class="box"><span class="ok">✔</span> الموظفون: أُضيف <b>' . $added . '</b> · موجود مسبقاً <b>' . $skipped .
     '</b> · الإجمالي الآن <b>' . (int) db()->query('SELECT COUNT(*) c FROM employees')->fetch()['c'] . '</b></div>';

/* ---------- 4. manager passphrase ---------- */
if (!setting_get('manager_pass_hash') && !setting_get('manager_pass_sha')) {
  setting_set('manager_pass_sha', 'b2a90bf588df3cde30f7eba65edf369da0f75db3232c56e3c3490a6e6e20b768');
  echo '<div class="box"><span class="ok">✔</span> كلمة سر المدير مثبّتة (نفس الكلمة الحالية). ستتحوّل تلقائياً إلى تشفير bcrypt عند أول دخول.</div>';
} else {
  echo '<div class="box"><span class="ok">✔</span> كلمة سر المدير معرّفة مسبقاً — لم تُلمس.</div>';
}

/* ---------- 5. settings ---------- */
if (!setting_get('app_settings')) {
  setting_set('app_settings', json_encode(default_settings(), JSON_UNESCAPED_UNICODE));
  echo '<div class="box"><span class="ok">✔</span> الإعدادات الافتراضية مكتوبة.</div>';
}

echo '<div class="box"><b>الخطوة الأخيرة المهمة:</b><br>1. افتح <code>config.php</code> وغيّر
 <code>allow_install</code> إلى <code>false</code>.<br>2. احذف الملف <code>install.php</code> من السيرفر.<br>
 3. افحص <a style="color:#7dd3fc" href="index.php?r=health">index.php?r=health</a> — يجب أن يظهر
 <code>"db": true</code> و<code>"employees": 24</code>.</div>';

echo '<div class="box"><span class="warn">ملاحظة:</span> أكواد الموظفين مثبّتة كبصمات SHA-256 (نفس الموجودة في الواجهة)،
 وتتحوّل تلقائياً إلى bcrypt عند أول دخول لكل موظف. الأكواد نفسها غير مخزّنة في أي مكان.</div>';
