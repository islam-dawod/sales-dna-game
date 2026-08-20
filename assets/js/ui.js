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
    quick_note:     { ar: '5 مستويات · 25 موقفاً · 6–8 دقائق · + تحدي تركيز قصير', he: '5 שלבים · 25 תרחישים · 6–8 דקות · + אתגר ריכוז קצר' },
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
    challenge:      { ar: 'تحدٍ', he: 'אתגר' },
    challenges:     { ar: 'تحديات', he: 'אתגרים' },
    next_level:     { ar: 'المستوى التالي', he: 'השלב הבא' },
    level_done:     { ar: 'اكتمل المستوى', he: 'השלב הושלם' },
    sales_part_done:{ ar: 'اكتمل تحدي المبيعات', he: 'אתגר המכירות הושלם' },
    one_more:       { ar: 'تحدٍ أخير', he: 'אתגר אחרון' },
    skip:           { ar: 'تخطّي', he: 'דילוג' },
    bravo_name:     { ar: 'أحسنت يا {n}!', he: 'כל הכבוד {n}!' },
    cand_done_1:    { ar: 'لقد أكملت تحدي Sales DNA بنجاح.', he: 'השלמת את אתגר ה-Sales DNA בהצלחה.' },
    cand_done_2:    { ar: 'تم إرسال نتائجك للفريق.', he: 'התוצאות נשלחו לצוות.' },
    focus_title:    { ar: 'تحدي التركيز', he: 'אתגר הריכוז' },
    focus_score:    { ar: 'نتيجة التركيز', he: 'ציון ריכוז' },
    focus_note:     { ar: 'مهمة قصيرة للانتباه والمعالجة — ليست اختبار ذكاء ولا تدخل في نسبة التطابق.',
                      he: 'משימת קשב ועיבוד קצרה — לא מבחן אינטליגנציה ואינה נכללת בציון ההתאמה.' },
    focus_bench:    { ar: 'مقارنة بمعيار الفريق', he: 'מול הבנצ׳מרק של הצוות' },
    focus_below:    { ar: 'أقل من معيار الفريق الحالي', he: 'מתחת לבנצ׳מרק הנוכחי' },
    focus_at:       { ar: 'ضمن معيار الفريق', he: 'בתוך טווח הבנצ׳מרק' },
    focus_above:    { ar: 'أعلى من معيار الفريق', he: 'מעל הבנצ׳מרק' },
    focus_nodata:   { ar: 'لم يتم لعب تحدي التركيز', he: 'אתגר הריכוז לא בוצע' },
    focus_corr:     { ar: 'ارتباط التركيز بالأداء', he: 'קשר בין ריכוז לביצועים' },
    focus_corr_none:{ ar: 'لا توجد بيانات كافية لتحديد ما إذا كان التركيز مرتبطاً بالنجاح في المبيعات لديكم — لا يُستخدم في القرار.',
                      he: 'אין מספיק נתונים כדי לקבוע אם ריכוז קשור להצלחה במכירות אצלכם — לא בשימוש בהחלטה.' },
    play_focus:     { ar: 'تشغيل تحدي التركيز', he: 'הפעל את אתגר הריכוז' },
    run_25:         { ar: 'نموذج 25 سؤالاً', he: 'מודל 25 שאלות' },
    dna_dims:       { ar: 'الأبعاد الستة', he: 'ששת המדדים' },
    consistency_idx:{ ar: 'مؤشر الاتساق', he: 'מדד עקביות' },
    recommendation: { ar: 'توصية النظام', he: 'המלצת המערכת' },
    rec_proceed:    { ar: 'الانتقال إلى مقابلة', he: 'מעבר לראיון' },
    rec_review:     { ar: 'مراجعة مع تركيز على النقاط الضعيفة', he: 'בדיקה עם דגש על החולשות' },
    rec_low:        { ar: 'تطابق منخفض — القرار للمدير', he: 'התאמה נמוכה — החלטת המנהל' },
    calibrate:      { ar: 'معايرة الأوزان من الموظفين الأقوياء', he: 'כיול משקלים מהעובדים החזקים' },
    weights_25:     { ar: 'أوزان نموذج المرشّح', he: 'משקלי מודל המועמד' },
    sim_strong:     { ar: 'تشابه مع الأقوياء', he: 'דמיון לחזקים' },
    mode_quick:     { ar: 'التحدي المقارن', he: 'האתגר המשווה' },
    mode_quick_note:{ ar: '22 موقفاً · نفس مقياس المرشحين · 5–6 دقائق', he: '22 תרחישים · אותו מדד כמו המועמדים · 5–6 דק׳' },
    mode_full:      { ar: 'تحدي SALES CITY الكامل', he: 'אתגר SALES CITY המלא' },
    mode_full_note: { ar: '8 مناطق · 36 موقفاً · 10–12 دقيقة', he: '8 אזורים · 36 תרחישים · 10–12 דק׳' },
    thanks_emp_quick:{ ar: 'إجاباتك تساعد المنظومة على تعلّم ما يميّز البائع الناجح لدينا.',
                       he: 'התשובות שלך עוזרות למערכת ללמוד מה מאפיין איש מכירות מצליח אצלנו.' },
    nav_focus:      { ar: 'تحليل التركيز', he: 'ניתוח פוקוס' },
    nav_predict:    { ar: 'دقة التنبؤ والمتابعة', he: 'חיזוי ומעקב' },
    common_dna:     { ar: 'ما المشترك بين أفضل الموظفين؟', he: 'מה משותף לעובדים הטובים?' },
    differentiators:{ ar: 'ما يفرّق الأقوياء عن غيرهم', he: 'מה מבדיל את החזקים' },
    q_quality:      { ar: 'جودة الأسئلة', he: 'איכות השאלות' },
    confidence:     { ar: 'ثقة النموذج', he: 'ביטחון המודל' },
    conf_low:       { ar: 'منخفضة', he: 'נמוך' },
    conf_medium:    { ar: 'متوسطة', he: 'בינוני' },
    conf_high:      { ar: 'عالية', he: 'גבוה' },
    common_strong:  { ar: 'الأقرب لدفعة الأقوياء', he: 'הדמיון לחזקים' },
    differences:    { ar: 'الفروقات المهمة', he: 'הפערים החשובים' },
    perf_history:   { ar: 'سجل الأداء الشهري', he: 'היסטוריית ביצועים' },
    perf_consist:   { ar: 'ثبات الأداء', he: 'עקביות ביצועים' },
    data_class:     { ar: 'تصنيف حسب البيانات', he: 'סיווג לפי נתונים' },
    review_class:   { ar: 'مراجعة التصنيف', he: 'בדיקת סיווג' },
    post_hire:      { ar: 'متابعة ما بعد التوظيف', he: 'מעקב לאחר קליטה' },
    verdict_good:   { ar: 'تنبؤ صحيح', he: 'חיזוי נכון' },
    verdict_missed: { ar: 'تنبؤ خاطئ', he: 'חיזוי שגוי' },
    verdict_pending:{ ar: 'بانتظار البيانات', he: 'ממתין לנתונים' },
    calibrate_spot: { ar: 'اختبار معايرة اللعبة', he: 'בדיקת כיול המשחק' },
    show_hitboxes:  { ar: 'إظهار مناطق الضغط', he: 'הצג אזורי לחיצה' },
    validated:      { ar: 'تم التحقق', he: 'אומת' },
    not_validated:  { ar: 'لم يتم التحقق', he: 'לא אומת' },
    focus_weight:   { ar: 'وزن التركيز في القرار', he: 'משקל הפוקוס בהחלטה' },
    group_unclassified:{ ar: 'غير مصنّف', he: 'לא מסווג' },
    branch_col:     { ar: 'الفرع', he: 'סניף' },
    save_failed:    { ar: 'لم يتم حفظ النتيجة على السيرفر', he: 'התוצאה לא נשמרה בשרת' },
    too_many:       { ar: 'محاولات كثيرة — انتظر قليلاً', he: 'יותר מדי נסיונות — המתן מעט' },
    server_on:      { ar: 'متصل بالسيرفر', he: 'מחובר לשרת' },
    server_off:     { ar: 'وضع محلي (بدون سيرفر)', he: 'מצב מקומי (ללא שרת)' },
    emp_code_note:  { ar: 'أدخل الكود الذي استلمته من مديرك', he: 'הזן את הקוד שקיבלת מהמנהל' },
    set_code:       { ar: 'تعيين كود دخول', he: 'הגדרת קוד כניסה' },
    code_col:       { ar: 'كود الدخول', he: 'קוד כניסה' },
    code_set:       { ar: 'معيّن', he: 'מוגדר' },
    code_none:      { ar: 'بلا كود', he: 'ללא קוד' },
    code_once:      { ar: 'انسخ الكود الآن وأرسله للموظف — لن يظهر مرة أخرى لأنه يُخزَّن مشفّراً.',
                      he: 'העתק עכשיו ושלח לעובד — לא יוצג שוב כי הוא נשמר מוצפן.' },
    code_saved:     { ar: 'تم تعيين الكود', he: 'הקוד הוגדר' },
    copy:           { ar: 'نسخ', he: 'העתקה' },
    copied:         { ar: 'تم النسخ', he: 'הועתק' },
    regenerate:     { ar: 'توليد كود آخر', he: 'צור קוד אחר' },
    no_emp_data:    { ar: 'لا توجد بيانات أداء بعد — أدخلها من زر التعديل.',
                      he: 'אין עדיין נתוני ביצועים — הזן אותם בכפתור העריכה.' },
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
    pin_hint:       { ar: 'الدخول للمدير فقط', he: 'כניסה למנהל בלבד' },
    pin_new:        { ar: 'كلمة سر جديدة (اتركها فارغة لعدم التغيير)', he: 'סיסמה חדשה (השאר ריק כדי לא לשנות)' },
    pin_saved:      { ar: 'تم تحديث كلمة السر', he: 'הסיסמה עודכנה' },
    pin_short:      { ar: 'كلمة السر قصيرة جداً (6 أحرف على الأقل)', he: 'הסיסמה קצרה מדי (6 תווים לפחות)' },
    pin_stored:     { ar: 'مخزّنة كبصمة SHA-256 — لا تظهر في أي شاشة ولا في الكود.',
                      he: 'נשמרת כ-hash SHA-256 — לא מוצגת בשום מסך ולא בקוד.' },
    pin_note:       { ar: 'تنبيه: هذه حماية عرض فقط لأن التطبيق يعمل داخل المتصفح. للحماية الحقيقية يلزم قفل المجلد من السيرفر أو Backend.',
                      he: 'לתשומת לב: זו הגנת תצוגה בלבד כי האפליקציה רצה בדפדפן. להגנה אמיתית נדרש נעילה בשרת או Backend.' },
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
    date:           { ar: 'التاريخ', he: 'תאריך' },
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

  /* ---------------- passphrase hashing ----------------
     The passphrase itself is never stored or shipped — only its hash.
     SHA-256 through the Web Crypto API on any https/localhost origin,
     with a deterministic fallback for insecure contexts (file://).      */
  function fnvHash(str) {
    var out = '';
    [0x811c9dc5, 0x01000193, 0x7fffffff, 0x9e3779b9].forEach(function (seed) {
      var h = seed >>> 0;
      for (var i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
      }
      out += ('00000000' + h.toString(16)).slice(-8);
    });
    return out;
  }

  function hashPass(str, cb) {
    var enc = new TextEncoder().encode(String(str));
    if (root.crypto && root.crypto.subtle && root.crypto.subtle.digest) {
      root.crypto.subtle.digest('SHA-256', enc).then(function (buf) {
        var hex = Array.prototype.map.call(new Uint8Array(buf), function (b) {
          return ('0' + b.toString(16)).slice(-2);
        }).join('');
        cb({ sha: hex, fnv: fnvHash(String(str)) });
      })['catch'](function () { cb({ sha: null, fnv: fnvHash(String(str)) }); });
    } else {
      cb({ sha: null, fnv: fnvHash(String(str)) });
    }
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
    var dict = opts.dict || Q.TRAITS;
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
        dict[k].icon + ' ' + esc(lang === 'he' ? dict[k].he : dict[k].ar) + '</text>');
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
    hashPass: hashPass, fnvHash: fnvHash,
    el: el, $: $, $$: $$, esc: esc, toast: toast, confetti: confetti, countUp: countUp,
    radar: radar, bars: bars, ring: ring, tone: tone
  };
})(window);
