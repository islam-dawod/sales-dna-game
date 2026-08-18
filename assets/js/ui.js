/* ============================================================
   SALES DNA — UI TOOLKIT (i18n, charts, fx)
   ============================================================ */
(function (root) {
  'use strict';
  var Q = root.SDNA.Q, Store = root.SDNA.Store;

  /* ---------------- i18n ---------------- */
  var DICT = {
    app_sub:        { ar: 'اكتشف أسلوبك في المبيعات', he: 'גלה את ה-DNA שלך במכירות' },
    game_sub:       { ar: 'هل أنت جاهز لاكتشاف أسلوبك في المبيعات؟', he: 'מוכן לגלות את סגנון המכירה שלך?' },
    start_challenge:{ ar: 'ابدأ التحدي', he: 'התחל את האתגר' },
    next_zone:      { ar: 'المنطقة التالية', he: 'האזור הבא' },
    enter:          { ar: 'ادخل المنطقة', he: 'כניסה לאזור' },
    zone_complete:  { ar: 'اكتملت المنطقة', he: 'האזור הושלם' },
    great_name:     { ar: 'ممتاز يا {n}، انتقلت للمرحلة التالية!', he: 'מצוין {n}, עברת לשלב הבא!' },
    map_hello:      { ar: '{n}، الطريق أمامك — افتح كل مناطق المدينة', he: '{n}, הדרך לפניך — פתח את כל האזורים' },
    zone_hello:     { ar: '{n}، ', he: '{n}, ' },
    recorded_name:  { ar: 'تم تسجيل اختيارك يا {n}', he: 'הבחירה נרשמה, {n}' },
    stage1_done:    { ar: 'المرحلة الأولى اكتملت', he: 'השלב הראשון הושלם' },
    finish:         { ar: 'إنهاء', he: 'סיום' },
    confirm_exit:   { ar: 'هل تريد الخروج من التحدي؟ لن يتم حفظ تقدمك.', he: 'לצאת מהאתגר? ההתקדמות לא תישמר.' },
    before_start:   { ar: 'قبل أن نبدأ...', he: 'לפני שמתחילים...' },
    name_required:  { ar: 'الاسم الكامل مطلوب للبدء', he: 'שם מלא הוא שדה חובה' },
    hello_name:     { ar: 'أهلاً {n} 👋', he: 'שלום {n} 👋' },
    ready_challenge:{ ar: 'جاهز تدخل تحدي المبيعات؟', he: 'מוכן להיכנס לאתגר המכירות?' },
    quick_note:     { ar: 'المرحلة الأولى: 13 سؤالاً · 3–5 دقائق', he: 'שלב ראשון: 13 שאלות · 3–5 דקות' },
    emp_note:       { ar: '8 مناطق · 36 موقفاً من عالم المبيعات', he: '8 אזורים · 36 תרחישי מכירה' },
    stage1_th:      { ar: 'حد المرحلة الأولى للمرشح', he: 'סף שלב 1 למועמד' },
    continue_anyway:{ ar: 'متابعة رغم ذلك', he: 'המשך בכל זאת' },
    status_continue:{ ar: 'متابعة', he: 'המשך' },
    status_review:  { ar: 'مراجعة', he: 'בדיקה' },
    status_low:     { ar: 'تطابق منخفض', he: 'התאמה נמוכה' },
    main_diff:      { ar: 'أبرز الفروقات عن الموظفين الأقوياء', he: 'הפערים המרכזיים מול העובדים החזקים' },
    open_stage2:    { ar: 'فتح المرحلة 2 للمرشح', he: 'פתח שלב 2 למועמד' },
    play_stage2:    { ar: 'تشغيل المرحلة 2 الآن', he: 'הפעל שלב 2 עכשיו' },
    sound:          { ar: 'الصوت', he: 'סאונד' },
    who_are_you:    { ar: 'من أنت؟', he: 'מי אתה?' },
    role_emp:       { ar: 'أنا موظف في الشركة', he: 'אני עובד בחברה' },
    role_emp_s:     { ar: 'EXISTING EMPLOYEE', he: 'EXISTING EMPLOYEE' },
    role_cand:      { ar: 'أنا مرشّح جديد', he: 'אני מועמד חדש' },
    role_cand_s:    { ar: 'NEW CANDIDATE', he: 'NEW CANDIDATE' },
    role_mgr:       { ar: 'أنا مدير', he: 'אני מנהל' },
    role_mgr_s:     { ar: 'MANAGER', he: 'MANAGER' },
    start:          { ar: 'ابدأ', he: 'התחל' },
    back:           { ar: 'رجوع', he: 'חזרה' },
    next:           { ar: 'التالي', he: 'הבא' },
    continue_:      { ar: 'متابعة', he: 'המשך' },
    emp_login:      { ar: 'أدخل رقم/كود الموظف', he: 'הזן קוד עובד' },
    emp_code:       { ar: 'كود الموظف', he: 'קוד עובד' },
    login:          { ar: 'دخول', he: 'כניסה' },
    not_found:      { ar: 'لم يتم العثور على الكود', he: 'הקוד לא נמצא' },
    welcome:        { ar: 'أهلاً', he: 'שלום' },
    dept:           { ar: 'القسم', he: 'מחלקה' },
    seniority:      { ar: 'الأقدمية', he: 'ותק' },
    ready:          { ar: 'جاهز للتحدي؟', he: 'מוכן לאתגר?' },
    ready_sub:      { ar: '7 مراحل · لا يوجد إجابات صحيحة أو خاطئة · أجب بصدق', he: '7 שלבים · אין תשובות נכונות או שגויות · ענה בכנות' },
    reg_title:      { ar: 'سجّل بياناتك', he: 'הרשמה' },
    full_name:      { ar: 'الاسم الكامل', he: 'שם מלא' },
    phone:          { ar: 'رقم الهاتف', he: 'טלפון' },
    email:          { ar: 'البريد الإلكتروني', he: 'אימייל' },
    fill_all:       { ar: 'يرجى تعبئة الاسم والهاتف على الأقل', he: 'נא למלא לפחות שם וטלפון' },
    level:          { ar: 'المرحلة', he: 'שלב' },
    q_of:           { ar: 'سؤال', he: 'שאלה' },
    recorded:       { ar: 'تم تسجيل اختيارك', he: 'הבחירה נרשמה' },
    level_complete: { ar: 'اكتملت المرحلة', he: 'השלב הושלם' },
    next_challenge: { ar: 'التحدي التالي', he: 'האתגר הבא' },
    streak:         { ar: 'متتالية', he: 'רצף' },
    map_title:      { ar: 'خريطة التحدي', he: 'מפת האתגר' },
    locked:         { ar: 'مغلق', he: 'נעול' },
    done:           { ar: 'مكتمل', he: 'הושלם' },
    challenge_done: { ar: 'انتهى التحدي!', he: 'האתגר הושלם!' },
    thanks_cand:    { ar: 'شكراً لإكمال التقييم، تم تسجيل إجاباتك بنجاح.', he: 'תודה על השלמת ההערכה, התשובות נקלטו.' },
    thanks_emp:     { ar: 'تم تسجيل بروفايلك بنجاح. النتائج تظهر لدى المدير.', he: 'הפרופיל נשמר. התוצאות מוצגות למנהל.' },
    exit:           { ar: 'خروج', he: 'יציאה' },
    /* manager */
    mgr_login:      { ar: 'دخول المدير', he: 'כניסת מנהל' },
    pin:            { ar: 'رمز الدخول', he: 'קוד כניסה' },
    wrong_pin:      { ar: 'رمز غير صحيح', he: 'קוד שגוי' },
    demo_pin:       { ar: 'الرمز التجريبي: 1234', he: 'קוד דמו: 1234' },
    nav_dash:       { ar: 'لوحة القيادة', he: 'דאשבורד' },
    nav_emp:        { ar: 'الموظفون', he: 'עובדים' },
    nav_cand:       { ar: 'المرشحون', he: 'מועמדים' },
    nav_dna:        { ar: 'DNA الشركة', he: 'DNA החברה' },
    nav_pattern:    { ar: 'اكتشاف الأنماط', he: 'גילוי דפוסים' },
    nav_questions:  { ar: 'بنك الأسئلة', he: 'בנק שאלות' },
    nav_compare:    { ar: 'مقارنة', he: 'השוואה' },
    nav_settings:   { ar: 'إعدادات', he: 'הגדרות' },
    kpi_tested:     { ar: 'موظفون تم فحصهم', he: 'עובדים שנבדקו' },
    kpi_strong:     { ar: 'موظفون أقوياء', he: 'עובדים חזקים' },
    kpi_medium:     { ar: 'متوسطون', he: 'בינוניים' },
    kpi_low:        { ar: 'ضعفاء', he: 'חלשים' },
    kpi_cand:       { ar: 'مرشحون', he: 'מועמדים' },
    kpi_high_match: { ar: 'تطابق مرتفع', he: 'התאמה גבוהה' },
    funnel:         { ar: 'مسار المرشحين', he: 'משפך מועמדים' },
    name:           { ar: 'الاسم', he: 'שם' },
    perf:           { ar: 'الأداء', he: 'ביצועים' },
    target_pct:     { ar: '% الهدف', he: '% יעד' },
    dna_score:      { ar: 'DNA', he: 'DNA' },
    attendance:     { ar: 'الحضور', he: 'נוכחות' },
    late:           { ar: 'تأخيرات', he: 'איחורים' },
    mgr_score:      { ar: 'تقييم المدير', he: 'ציון מנהל' },
    status:         { ar: 'الحالة', he: 'סטטוס' },
    group_strong:   { ar: 'قوي', he: 'חזק' },
    group_medium:   { ar: 'متوسط', he: 'בינוני' },
    group_low:      { ar: 'ضعيف', he: 'חלש' },
    no_assessment:  { ar: 'لم يُفحص', he: 'לא נבדק' },
    stage:          { ar: 'المرحلة', he: 'שלב' },
    initial_match:  { ar: 'تطابق أولي', he: 'התאמה ראשונית' },
    full_match:     { ar: 'تطابق كامل', he: 'התאמה מלאה' },
    flags:          { ar: 'إشارات', he: 'דגלים' },
    decision:       { ar: 'القرار', he: 'החלטה' },
    view:           { ar: 'عرض', he: 'הצג' },
    profile:        { ar: 'البروفايل', he: 'פרופיל' },
    strong_sig:     { ar: 'إشارات قوية', he: 'סימנים חזקים' },
    risk_flags:     { ar: 'إشارات خطر', he: 'דגלים אדומים' },
    ai_summary:     { ar: 'ملخّص للمدير', he: 'סיכום למנהל' },
    ask_these:      { ar: 'أسئلة مقترحة للمقابلة', he: 'שאלות מומלצות לראיון' },
    similar_emp:    { ar: 'أقرب الموظفين تشابهاً', he: 'עובדים דומים ביותר' },
    consistency:    { ar: 'اتساق الإجابات', he: 'עקביות תשובות' },
    vs_strong:      { ar: 'مقابل الموظفين الأقوياء', he: 'מול העובדים החזקים' },
    find_pattern:   { ar: 'اكتشف نمط النجاح', he: 'מצא את דפוס ההצלחה' },
    top_traits:     { ar: 'أهم صفات النجاح', he: 'תכונות ההצלחה המובילות' },
    top_questions:  { ar: 'أقوى الأسئلة تنبؤاً', he: 'השאלות החזקות ביותר' },
    weak_questions: { ar: 'أسئلة ضعيفة (مرشّحة للاستبدال)', he: 'שאלות חלשות (להחלפה)' },
    apply_weights:  { ar: 'اعتماد الأوزان المقترحة', he: 'החל משקלים מוצעים' },
    auto_weights:   { ar: 'أوزان تلقائية (من بيانات الشركة)', he: 'משקלים אוטומטיים (מהנתונים)' },
    company_dna:    { ar: 'الحمض النووي للمبيعات في الشركة', he: 'ה-DNA של החברה' },
    separation:     { ar: 'الفارق قوي/ضعيف', he: 'פער חזק/חלש' },
    proceed:        { ar: 'انتقال إلى مقابلة', he: 'מעבר לראיון' },
    reject:         { ar: 'إيقاف', he: 'עצירה' },
    hire:           { ar: 'تم التوظيف', he: 'התקבל' },
    open_anyway:    { ar: 'المدير يستطيع فتح الملف يدوياً رغم التطابق المنخفض', he: 'המנהל יכול לפתוח ידנית למרות התאמה נמוכה' },
    followup:       { ar: 'متابعة ما بعد التوظيف', he: 'מעקב לאחר קליטה' },
    add_followup:   { ar: 'إضافة متابعة', he: 'הוסף מעקב' },
    pred_acc:       { ar: 'دقة التنبؤ', he: 'דיוק חיזוי' },
    thresholds:     { ar: 'حدود التطابق', he: 'ספי התאמה' },
    reset_demo:     { ar: 'إعادة تعيين البيانات التجريبية', he: 'איפוס נתוני דמו' },
    clear_all:      { ar: 'مسح كل البيانات', he: 'מחיקת כל הנתונים' },
    export_:        { ar: 'تصدير JSON', he: 'ייצוא JSON' },
    import_:        { ar: 'استيراد JSON', he: 'ייבוא JSON' },
    add_emp:        { ar: 'إضافة موظف', he: 'הוסף עובד' },
    save:           { ar: 'حفظ', he: 'שמירה' },
    cancel:         { ar: 'إلغاء', he: 'ביטול' },
    delete_:        { ar: 'حذف', he: 'מחיקה' },
    data_conflict:  { ar: 'تعارض بين تصنيف المدير والبيانات', he: 'פער בין סיווג המנהל לנתונים' },
    manager_says:   { ar: 'تصنيف المدير', he: 'סיווג מנהל' },
    data_says:      { ar: 'حسب البيانات', he: 'לפי הנתונים' },
    select_two:     { ar: 'اختر شخصين أو أكثر للمقارنة', he: 'בחר שניים או יותר להשוואה' },
    print:          { ar: 'طباعة / PDF', he: 'הדפסה / PDF' },
    band_high:      { ar: 'تطابق مرتفع', he: 'התאמה גבוהה' },
    band_mid:       { ar: 'تطابق متوسط', he: 'התאמה בינונית' },
    band_low:       { ar: 'تطابق منخفض', he: 'התאמה נמוכה' },
    low_alert:      { ar: 'تنبيه: المرشح يختلف جوهرياً عن بروفايل البائع الناجح الحالي.', he: 'התראה: המועמד שונה מהותית מפרופיל איש המכירות המצליח.' },
    q_bank_note:    { ar: 'كل مرشّح يحصل على مجموعة أسئلة وترتيب مختلف من المخزون.', he: 'כל מועמד מקבל שאלות וסדר שונים מתוך המאגר.' },
    stage_names:    { ar: ['تسجيل', 'المرحلة 1', 'تطابق أولي', 'تقييم كامل', 'أسئلة مقابلة', 'مقابلة', 'قرار', 'تم التوظيف'],
                      he: ['הרשמה', 'שלב 1', 'התאמה ראשונית', 'הערכה מלאה', 'שאלות ראיון', 'ראיון', 'החלטה', 'התקבל'] }
  };

  var lang = 'ar';
  function setLang(l) { lang = l; document.documentElement.lang = l; save(); }
  function getLang() { return lang; }
  function save() { var s = Store.get(); s.settings.lang = lang; Store.save(); }
  function T(k) {
    var d = DICT[k];
    if (!d) return k;
    return d[lang] !== undefined ? d[lang] : d.ar;
  }

  /* ---------------- dom helpers ---------------- */
  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  function $(sel, r) { return (r || document).querySelector(sel); }
  function $$(sel, r) { return Array.prototype.slice.call((r || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function toast(msg, kind) {
    var t = el('<div class="toast ' + (kind || '') + '">' + esc(msg) + '</div>');
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('show'); }, 10);
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 2600);
  }

  function confetti(n) {
    var host = el('<div class="confetti"></div>');
    document.body.appendChild(host);
    var colors = ['#3b82f6', '#8b5cf6', '#22d3ee', '#10b981', '#f59e0b', '#ec4899'];
    for (var i = 0; i < (n || 60); i++) {
      var p = document.createElement('i');
      p.style.left = Math.random() * 100 + '%';
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = (Math.random() * 0.5) + 's';
      p.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
      host.appendChild(p);
    }
    setTimeout(function () { host.remove(); }, 3200);
  }

  function countUp(node, to, dur) {
    var from = 0, t0 = performance.now(); dur = dur || 900;
    function step(t) {
      var k = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - k, 3);
      node.textContent = Math.round(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------------- charts ---------------- */
  /* radar: series = [{name, color, traits:{k:v}}] */
  function radar(series, opts) {
    opts = opts || {};
    var keys = opts.keys || Q.traitKeys;
    var size = opts.size || 320, cx = size / 2, cy = size / 2, r = size / 2 - 46;
    var n = keys.length, out = [];
    function pt(i, v) {
      var ang = -Math.PI / 2 + i * 2 * Math.PI / n;
      var rr = r * (v / 100);
      return [cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)];
    }
    // grid
    [0.25, 0.5, 0.75, 1].forEach(function (g) {
      var pts = keys.map(function (k, i) { return pt(i, g * 100).join(','); }).join(' ');
      out.push('<polygon points="' + pts + '" class="rg"/>');
    });
    keys.forEach(function (k, i) {
      var p = pt(i, 100);
      out.push('<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0] + '" y2="' + p[1] + '" class="ra"/>');
    });
    // series
    series.forEach(function (s) {
      var pts = keys.map(function (k, i) { return pt(i, s.traits[k] == null ? 0 : s.traits[k]).join(','); }).join(' ');
      out.push('<polygon points="' + pts + '" fill="' + s.color + '22" stroke="' + s.color + '" stroke-width="2.5" class="rs"/>');
      keys.forEach(function (k, i) {
        var p = pt(i, s.traits[k] == null ? 0 : s.traits[k]);
        out.push('<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.4" fill="' + s.color + '"/>');
      });
    });
    // labels
    keys.forEach(function (k, i) {
      var ang = -Math.PI / 2 + i * 2 * Math.PI / n;
      var lx = cx + (r + 26) * Math.cos(ang), ly = cy + (r + 26) * Math.sin(ang);
      var anchor = Math.abs(Math.cos(ang)) < 0.3 ? 'middle' : (Math.cos(ang) > 0 ? 'start' : 'end');
      out.push('<text x="' + lx + '" y="' + (ly + 4) + '" text-anchor="' + anchor + '" class="rl">' +
        Q.TRAITS[k].icon + ' ' + esc(lang === 'he' ? Q.TRAITS[k].he : Q.TRAITS[k].ar) + '</text>');
    });
    var legend = series.map(function (s) {
      return '<span class="lg"><i style="background:' + s.color + '"></i>' + esc(s.name) + '</span>';
    }).join('');
    return '<div class="radar-wrap"><svg viewBox="0 0 ' + size + ' ' + size + '" class="radar">' + out.join('') + '</svg>' +
           '<div class="legend">' + legend + '</div></div>';
  }

  function bars(items, opts) {
    opts = opts || {};
    return '<div class="bars">' + items.map(function (it) {
      var v = it.value == null ? 0 : it.value;
      var col = it.color || tone(v);
      return '<div class="bar-row"><div class="bar-lbl">' + (it.icon ? it.icon + ' ' : '') + esc(it.label) + '</div>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' + v + '%;background:' + col + '"></div></div>' +
        '<div class="bar-val">' + (it.value == null ? '—' : v + (opts.suffix || '')) + '</div></div>';
    }).join('') + '</div>';
  }

  function tone(v) {
    if (v >= 85) return '#10b981';
    if (v >= 70) return '#3b82f6';
    if (v >= 55) return '#f59e0b';
    return '#ef4444';
  }

  function ring(value, label, size) {
    size = size || 120;
    var r = size / 2 - 9, c = 2 * Math.PI * r;
    var off = c * (1 - value / 100);
    return '<div class="ring" style="width:' + size + 'px">' +
      '<svg viewBox="0 0 ' + size + ' ' + size + '">' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" class="ring-bg"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" class="ring-fg" stroke="' + tone(value) + '" ' +
      'stroke-dasharray="' + c + '" stroke-dashoffset="' + off + '"/></svg>' +
      '<div class="ring-txt"><b style="color:' + tone(value) + '">' + value + '</b>' +
      (label ? '<small>' + esc(label) + '</small>' : '') + '</div></div>';
  }

  root.SDNA.UI = {
    T: T, setLang: setLang, getLang: getLang, DICT: DICT,
    el: el, $: $, $$: $$, esc: esc, toast: toast, confetti: confetti, countUp: countUp,
    radar: radar, bars: bars, ring: ring, tone: tone
  };
})(window);
