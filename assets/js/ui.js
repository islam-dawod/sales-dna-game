/* ============================================================
   SALES DNA — UI TOOLKIT (i18n, charts, fx)
   ============================================================ */
(function (root) {
  'use strict';
  var Q = root.SDNA.Q, Store = root.SDNA.Store;

  /* ---------------- i18n ---------------- */
  var DICT = {
    app_sub:        { ar: 'اكتشف أسلوبك في المبيعات', en: 'Discover your sales style' },
    game_sub:       { ar: 'هل أنت جاهز لاكتشاف أسلوبك في المبيعات؟', en: 'Ready to discover your sales style?' },
    start_challenge:{ ar: 'ابدأ التحدي', en: 'Start the challenge' },
    next_zone:      { ar: 'المنطقة التالية', en: 'Next zone' },
    enter:          { ar: 'ادخل المنطقة', en: 'Enter zone' },
    zone_complete:  { ar: 'اكتملت المنطقة', en: 'Zone complete' },
    great_name:     { ar: 'ممتاز يا {n}، انتقلت للمرحلة التالية!', en: 'Great work {n}, you moved up to the next stage!' },
    map_hello:      { ar: '{n}، الطريق أمامك — افتح كل مناطق المدينة', en: '{n}, the road is ahead — unlock every zone in the city' },
    zone_hello:     { ar: '{n}، ', en: '{n}, ' },
    recorded_name:  { ar: 'تم تسجيل اختيارك يا {n}', en: 'Your choice is recorded, {n}' },
    stage1_done:    { ar: 'المرحلة الأولى اكتملت', en: 'Stage 1 complete' },
    finish:         { ar: 'إنهاء', en: 'Finish' },
    confirm_exit:   { ar: 'هل تريد الخروج من التحدي؟ لن يتم حفظ تقدمك.', en: 'Leave the challenge? Your progress will not be saved.' },
    before_start:   { ar: 'قبل أن نبدأ...', en: 'Before we start...' },
    name_required:  { ar: 'الاسم الكامل مطلوب للبدء', en: 'Full name is required to start' },
    hello_name:     { ar: 'أهلاً {n} 👋', en: 'Hello {n} 👋' },
    ready_challenge:{ ar: 'جاهز تدخل تحدي المبيعات؟', en: 'Ready to enter the sales challenge?' },
    quick_note:     { ar: '5 مستويات · 25 موقفاً · 6–8 دقائق · + تحدي تركيز قصير', en: '5 levels · 25 scenarios · 6–8 minutes · + a short focus challenge' },
    emp_note:       { ar: '8 مناطق · 36 موقفاً من عالم المبيعات', en: '8 zones · 36 scenarios from the world of sales' },
    stage1_th:      { ar: 'حد المرحلة الأولى للمرشح', en: 'Candidate stage 1 threshold' },
    continue_anyway:{ ar: 'متابعة رغم ذلك', en: 'Continue anyway' },
    status_continue:{ ar: 'متابعة', en: 'Proceed' },
    status_review:  { ar: 'مراجعة', en: 'Review' },
    status_low:     { ar: 'تطابق منخفض', en: 'Low match' },
    main_diff:      { ar: 'أبرز الفروقات عن الموظفين الأقوياء', en: 'Biggest gaps versus the strong employees' },
    open_stage2:    { ar: 'فتح المرحلة 2 للمرشح', en: 'Open stage 2 for the candidate' },
    play_stage2:    { ar: 'تشغيل المرحلة 2 الآن', en: 'Run stage 2 now' },
    sound:          { ar: 'الصوت', en: 'Sound' },
    challenge:      { ar: 'تحدٍ', en: 'Challenge' },
    challenges:     { ar: 'تحديات', en: 'Challenges' },
    next_level:     { ar: 'المستوى التالي', en: 'Next level' },
    level_done:     { ar: 'اكتمل المستوى', en: 'Level complete' },
    sales_part_done:{ ar: 'اكتمل تحدي المبيعات', en: 'Sales challenge complete' },
    one_more:       { ar: 'تحدٍ أخير', en: 'One last challenge' },
    skip:           { ar: 'تخطّي', en: 'Skip' },
    bravo_name:     { ar: 'أحسنت يا {n}!', en: 'Well done, {n}!' },
    cand_done_1:    { ar: 'لقد أكملت تحدي Sales DNA بنجاح.', en: 'You have completed the Sales DNA challenge.' },
    cand_done_2:    { ar: 'تم إرسال نتائجك للفريق.', en: 'Your results have been sent to the team.' },
    focus_title:    { ar: 'تحدي التركيز', en: 'Focus challenge' },
    focus_score:    { ar: 'نتيجة التركيز', en: 'Focus score' },
    focus_note:     { ar: 'مهمة قصيرة للانتباه والمعالجة — ليست اختبار ذكاء ولا تدخل في نسبة التطابق.',
                      en: 'A short attention and processing task — not an intelligence test, and it does not count toward the match score.' },
    focus_bench:    { ar: 'مقارنة بمعيار الفريق', en: 'Against the team benchmark' },
    focus_below:    { ar: 'أقل من معيار الفريق الحالي', en: 'Below the current team benchmark' },
    focus_at:       { ar: 'ضمن معيار الفريق', en: 'Within the team benchmark' },
    focus_above:    { ar: 'أعلى من معيار الفريق', en: 'Above the team benchmark' },
    focus_nodata:   { ar: 'لم يتم لعب تحدي التركيز', en: 'Focus challenge not played' },
    focus_corr:     { ar: 'ارتباط التركيز بالأداء', en: 'Focus versus performance' },
    focus_corr_none:{ ar: 'لا توجد بيانات كافية لتحديد ما إذا كان التركيز مرتبطاً بالنجاح في المبيعات لديكم — لا يُستخدم في القرار.',
                      en: 'Not enough data yet to tell whether focus is linked to sales success here — it is not used in the decision.' },
    play_focus:     { ar: 'تشغيل تحدي التركيز', en: 'Run the focus challenge' },
    run_25:         { ar: 'نموذج 25 سؤالاً', en: '25-question model' },
    dna_dims:       { ar: 'الأبعاد الستة', en: 'The six dimensions' },
    consistency_idx:{ ar: 'مؤشر الاتساق', en: 'Consistency index' },
    recommendation: { ar: 'توصية النظام', en: 'System recommendation' },
    rec_proceed:    { ar: 'الانتقال إلى مقابلة', en: 'Move to an interview' },
    rec_review:     { ar: 'مراجعة مع تركيز على النقاط الضعيفة', en: 'Review, focusing on the weak points' },
    rec_low:        { ar: 'تطابق منخفض — القرار للمدير', en: 'Low match — the manager decides' },
    calibrate:      { ar: 'معايرة الأوزان من الموظفين الأقوياء', en: 'Calibrate weights from the strong employees' },
    weights_25:     { ar: 'أوزان نموذج المرشّح', en: 'Candidate model weights' },
    sim_strong:     { ar: 'تشابه مع الأقوياء', en: 'Similarity to the strong employees' },
    mode_quick:     { ar: 'التحدي المقارن', en: 'Comparison challenge' },
    mode_quick_note:{ ar: '22 موقفاً · نفس مقياس المرشحين · 5–6 دقائق', en: '22 scenarios · the same scale as candidates · 5–6 minutes' },
    mode_full:      { ar: 'تحدي SALES CITY الكامل', en: 'The full SALES CITY challenge' },
    mode_full_note: { ar: '8 مناطق · 36 موقفاً · 10–12 دقيقة', en: '8 zones · 36 scenarios · 10–12 minutes' },
    thanks_emp_quick:{ ar: 'إجاباتك تساعد المنظومة على تعلّم ما يميّز البائع الناجح لدينا.',
                       en: 'Your answers help the system learn what sets a successful salesperson apart here.' },
    nav_focus:      { ar: 'تحليل التركيز', en: 'Focus analysis' },
    nav_predict:    { ar: 'دقة التنبؤ والمتابعة', en: 'Prediction accuracy and follow-up' },
    common_dna:     { ar: 'ما المشترك بين أفضل الموظفين؟', en: 'What do the best employees have in common?' },
    differentiators:{ ar: 'ما يفرّق الأقوياء عن غيرهم', en: 'What sets the strong employees apart' },
    q_quality:      { ar: 'جودة الأسئلة', en: 'Question quality' },
    confidence:     { ar: 'ثقة النموذج', en: 'Model confidence' },
    conf_low:       { ar: 'منخفضة', en: 'Low' },
    conf_medium:    { ar: 'متوسطة', en: 'Medium' },
    conf_high:      { ar: 'عالية', en: 'High' },
    common_strong:  { ar: 'الأقرب لدفعة الأقوياء', en: 'Closest to the strong cohort' },
    differences:    { ar: 'الفروقات المهمة', en: 'The differences that matter' },
    perf_history:   { ar: 'سجل الأداء الشهري', en: 'Monthly performance history' },
    perf_consist:   { ar: 'ثبات الأداء', en: 'Performance consistency' },
    data_class:     { ar: 'تصنيف حسب البيانات', en: 'Classified from the data' },
    review_class:   { ar: 'مراجعة التصنيف', en: 'Review the classification' },
    post_hire:      { ar: 'متابعة ما بعد التوظيف', en: 'Post-hire follow-up' },
    verdict_good:   { ar: 'تنبؤ صحيح', en: 'Correct prediction' },
    verdict_missed: { ar: 'تنبؤ خاطئ', en: 'Missed prediction' },
    verdict_pending:{ ar: 'بانتظار البيانات', en: 'Awaiting data' },
    calibrate_spot: { ar: 'اختبار معايرة اللعبة', en: 'Game calibration test' },
    show_hitboxes:  { ar: 'إظهار مناطق الضغط', en: 'Show the hit areas' },
    validated:      { ar: 'تم التحقق', en: 'Validated' },
    not_validated:  { ar: 'لم يتم التحقق', en: 'Not validated' },
    focus_weight:   { ar: 'وزن التركيز في القرار', en: 'Weight of focus in the decision' },
    group_unclassified:{ ar: 'غير مصنّف', en: 'Unclassified' },
    branch_col:     { ar: 'الفرع', en: 'Branch' },
    save_failed:    { ar: 'لم يتم حفظ النتيجة على السيرفر', en: 'The result was not saved on the server' },
    too_many:       { ar: 'محاولات كثيرة — انتظر قليلاً', en: 'Too many attempts — wait a moment' },
    server_on:      { ar: 'متصل بالسيرفر', en: 'Connected to the server' },
    server_off:     { ar: 'وضع محلي (بدون سيرفر)', en: 'Local mode (no server)' },
    emp_code_note:  { ar: 'أدخل الكود الذي استلمته من مديرك', en: 'Enter the code you received from your manager' },
    set_code:       { ar: 'تعيين كود دخول', en: 'Set a login code' },
    code_col:       { ar: 'كود الدخول', en: 'Login code' },
    code_set:       { ar: 'معيّن', en: 'Set' },
    code_none:      { ar: 'بلا كود', en: 'No code' },
    code_once:      { ar: 'انسخ الكود الآن وأرسله للموظف — لن يظهر مرة أخرى لأنه يُخزَّن مشفّراً.',
                      en: 'Copy the code now and send it to the employee — it will not be shown again because it is stored hashed.' },
    code_saved:     { ar: 'تم تعيين الكود', en: 'Code set' },
    copy:           { ar: 'نسخ', en: 'Copy' },
    copied:         { ar: 'تم النسخ', en: 'Copied' },
    regenerate:     { ar: 'توليد كود آخر', en: 'Generate another code' },
    no_emp_data:    { ar: 'لا توجد بيانات أداء بعد — أدخلها من زر التعديل.',
                      en: 'No performance data yet — enter it with the edit button.' },
    who_are_you:    { ar: 'من أنت؟', en: 'Who are you?' },
    role_emp:       { ar: 'أنا موظف في الشركة', en: 'I work at the company' },
    role_emp_s:     { ar: 'EXISTING EMPLOYEE', en: 'EXISTING EMPLOYEE' },
    role_cand:      { ar: 'أنا مرشّح جديد', en: 'I am a new candidate' },
    role_cand_s:    { ar: 'NEW CANDIDATE', en: 'NEW CANDIDATE' },
    role_mgr:       { ar: 'أنا مدير', en: 'I am a manager' },
    role_mgr_s:     { ar: 'MANAGER', en: 'MANAGER' },
    start:          { ar: 'ابدأ', en: 'Start' },
    back:           { ar: 'رجوع', en: 'Back' },
    next:           { ar: 'التالي', en: 'Next' },
    continue_:      { ar: 'متابعة', en: 'Continue' },
    emp_login:      { ar: 'أدخل رقم/كود الموظف', en: 'Enter your employee number or code' },
    emp_code:       { ar: 'كود الموظف', en: 'Employee code' },
    login:          { ar: 'دخول', en: 'Sign in' },
    not_found:      { ar: 'لم يتم العثور على الكود', en: 'That code was not found' },
    welcome:        { ar: 'أهلاً', en: 'Welcome' },
    dept:           { ar: 'القسم', en: 'Department' },
    seniority:      { ar: 'الأقدمية', en: 'Seniority' },
    ready:          { ar: 'جاهز للتحدي؟', en: 'Ready for the challenge?' },
    ready_sub:      { ar: '7 مراحل · لا يوجد إجابات صحيحة أو خاطئة · أجب بصدق', en: '7 stages · no right or wrong answers · answer honestly' },
    reg_title:      { ar: 'سجّل بياناتك', en: 'Register your details' },
    full_name:      { ar: 'الاسم الكامل', en: 'Full name' },
    phone:          { ar: 'رقم الهاتف', en: 'Phone number' },
    email:          { ar: 'البريد الإلكتروني', en: 'Email address' },
    fill_all:       { ar: 'يرجى تعبئة الاسم والهاتف على الأقل', en: 'Please fill in at least the name and phone number' },
    level:          { ar: 'المرحلة', en: 'Stage' },
    q_of:           { ar: 'سؤال', en: 'Question' },
    recorded:       { ar: 'تم تسجيل اختيارك', en: 'Your choice is recorded' },
    level_complete: { ar: 'اكتملت المرحلة', en: 'Stage complete' },
    next_challenge: { ar: 'التحدي التالي', en: 'Next challenge' },
    streak:         { ar: 'متتالية', en: 'Streak' },
    map_title:      { ar: 'خريطة التحدي', en: 'Challenge map' },
    locked:         { ar: 'مغلق', en: 'Locked' },
    done:           { ar: 'مكتمل', en: 'Done' },
    challenge_done: { ar: 'انتهى التحدي!', en: 'Challenge complete!' },
    thanks_cand:    { ar: 'شكراً لإكمال التقييم، تم تسجيل إجاباتك بنجاح.', en: 'Thank you for completing the assessment. Your answers were recorded.' },
    thanks_emp:     { ar: 'تم تسجيل بروفايلك بنجاح. النتائج تظهر لدى المدير.', en: 'Your profile was recorded. The results appear in the manager console.' },
    exit:           { ar: 'خروج', en: 'Exit' },
    /* manager */
    mgr_login:      { ar: 'دخول المدير', en: 'Manager sign in' },
    pin:            { ar: 'رمز الدخول', en: 'Passcode' },
    wrong_pin:      { ar: 'رمز غير صحيح', en: 'Wrong passcode' },
    pin_hint:       { ar: 'الدخول للمدير فقط', en: 'Managers only' },
    pin_new:        { ar: 'كلمة سر جديدة (اتركها فارغة لعدم التغيير)', en: 'New passphrase (leave empty to keep the current one)' },
    pin_saved:      { ar: 'تم تحديث كلمة السر', en: 'The passphrase was updated' },
    pin_short:      { ar: 'كلمة السر قصيرة جداً (6 أحرف على الأقل)', en: 'The passphrase is too short (6 characters minimum)' },
    pin_stored:     { ar: 'مخزّنة كبصمة SHA-256 — لا تظهر في أي شاشة ولا في الكود.',
                      en: 'Stored as a SHA-256 hash — it appears on no screen and in no file.' },
    pin_note:       { ar: 'تنبيه: هذه حماية عرض فقط لأن التطبيق يعمل داخل المتصفح. للحماية الحقيقية يلزم قفل المجلد من السيرفر أو Backend.',
                      en: 'Note: this is display-level protection only, because the app runs in the browser. Real protection needs a server-side lock or a backend.' },
    nav_dash:       { ar: 'لوحة القيادة', en: 'Dashboard' },
    nav_emp:        { ar: 'الموظفون', en: 'Employees' },
    nav_cand:       { ar: 'المرشحون', en: 'Candidates' },
    nav_dna:        { ar: 'DNA الشركة', en: 'Company DNA' },
    nav_pattern:    { ar: 'اكتشاف الأنماط', en: 'Pattern discovery' },
    nav_questions:  { ar: 'بنك الأسئلة', en: 'Question bank' },
    nav_compare:    { ar: 'مقارنة', en: 'Compare' },
    nav_settings:   { ar: 'إعدادات', en: 'Settings' },
    kpi_tested:     { ar: 'موظفون تم فحصهم', en: 'Employees assessed' },
    kpi_strong:     { ar: 'موظفون أقوياء', en: 'Strong employees' },
    kpi_medium:     { ar: 'متوسطون', en: 'Mid performers' },
    kpi_low:        { ar: 'ضعفاء', en: 'Low performers' },
    kpi_cand:       { ar: 'مرشحون', en: 'Candidates' },
    kpi_high_match: { ar: 'تطابق مرتفع', en: 'High match' },
    funnel:         { ar: 'مسار المرشحين', en: 'Candidate funnel' },
    name:           { ar: 'الاسم', en: 'Name' },
    date:           { ar: 'التاريخ', en: 'Date' },
    perf:           { ar: 'الأداء', en: 'Performance' },
    target_pct:     { ar: '% الهدف', en: 'Target %' },
    dna_score:      { ar: 'DNA', en: 'DNA' },
    attendance:     { ar: 'الحضور', en: 'Attendance' },
    late:           { ar: 'تأخيرات', en: 'Late days' },
    mgr_score:      { ar: 'تقييم المدير', en: 'Manager rating' },
    status:         { ar: 'الحالة', en: 'Status' },
    group_strong:   { ar: 'قوي', en: 'Strong' },
    group_medium:   { ar: 'متوسط', en: 'Medium' },
    group_low:      { ar: 'ضعيف', en: 'Low' },
    no_assessment:  { ar: 'لم يُفحص', en: 'Not assessed' },
    stage:          { ar: 'المرحلة', en: 'Stage' },
    initial_match:  { ar: 'تطابق أولي', en: 'Initial match' },
    full_match:     { ar: 'تطابق كامل', en: 'Full match' },
    flags:          { ar: 'إشارات', en: 'Flags' },
    decision:       { ar: 'القرار', en: 'Decision' },
    view:           { ar: 'عرض', en: 'View' },
    profile:        { ar: 'البروفايل', en: 'Profile' },
    strong_sig:     { ar: 'إشارات قوية', en: 'Strong signals' },
    risk_flags:     { ar: 'إشارات خطر', en: 'Risk flags' },
    ai_summary:     { ar: 'ملخّص للمدير', en: 'Summary for the manager' },
    ask_these:      { ar: 'أسئلة مقترحة للمقابلة', en: 'Suggested interview questions' },
    similar_emp:    { ar: 'أقرب الموظفين تشابهاً', en: 'The most similar employees' },
    consistency:    { ar: 'اتساق الإجابات', en: 'Answer consistency' },
    vs_strong:      { ar: 'مقابل الموظفين الأقوياء', en: 'Versus the strong employees' },
    find_pattern:   { ar: 'اكتشف نمط النجاح', en: 'Find the success pattern' },
    top_traits:     { ar: 'أهم صفات النجاح', en: 'The traits that matter most' },
    top_questions:  { ar: 'أقوى الأسئلة تنبؤاً', en: 'The most predictive questions' },
    weak_questions: { ar: 'أسئلة ضعيفة (مرشّحة للاستبدال)', en: 'Weak questions (candidates for replacement)' },
    apply_weights:  { ar: 'اعتماد الأوزان المقترحة', en: 'Apply the suggested weights' },
    auto_weights:   { ar: 'أوزان تلقائية (من بيانات الشركة)', en: 'Automatic weights (from company data)' },
    company_dna:    { ar: 'الحمض النووي للمبيعات في الشركة', en: 'The sales DNA of the company' },
    separation:     { ar: 'الفارق قوي/ضعيف', en: 'Strong versus low separation' },
    proceed:        { ar: 'انتقال إلى مقابلة', en: 'Move to an interview' },
    reject:         { ar: 'إيقاف', en: 'Stop' },
    hire:           { ar: 'تم التوظيف', en: 'Hired' },
    open_anyway:    { ar: 'المدير يستطيع فتح الملف يدوياً رغم التطابق المنخفض', en: 'The manager can still open the file despite the low match' },
    followup:       { ar: 'متابعة ما بعد التوظيف', en: 'Post-hire follow-up' },
    add_followup:   { ar: 'إضافة متابعة', en: 'Add a follow-up' },
    pred_acc:       { ar: 'دقة التنبؤ', en: 'Prediction accuracy' },
    thresholds:     { ar: 'حدود التطابق', en: 'Match thresholds' },
    reset_demo:     { ar: 'إعادة تعيين البيانات التجريبية', en: 'Reset the demo data' },
    clear_all:      { ar: 'مسح كل البيانات', en: 'Erase all data' },
    export_:        { ar: 'تصدير JSON', en: 'Export JSON' },
    import_:        { ar: 'استيراد JSON', en: 'Import JSON' },
    add_emp:        { ar: 'إضافة موظف', en: 'Add an employee' },
    save:           { ar: 'حفظ', en: 'Save' },
    cancel:         { ar: 'إلغاء', en: 'Cancel' },
    delete_:        { ar: 'حذف', en: 'Delete' },
    data_conflict:  { ar: 'تعارض بين تصنيف المدير والبيانات', en: 'The manager classification conflicts with the data' },
    manager_says:   { ar: 'تصنيف المدير', en: 'Manager classification' },
    data_says:      { ar: 'حسب البيانات', en: 'According to the data' },
    select_two:     { ar: 'اختر شخصين أو أكثر للمقارنة', en: 'Pick two people or more to compare' },
    print:          { ar: 'طباعة / PDF', en: 'Print / PDF' },
    band_high:      { ar: 'تطابق مرتفع', en: 'High match' },
    band_mid:       { ar: 'تطابق متوسط', en: 'Medium match' },
    band_low:       { ar: 'تطابق منخفض', en: 'Low match' },
    low_alert:      { ar: 'تنبيه: المرشح يختلف جوهرياً عن بروفايل البائع الناجح الحالي.', en: 'Alert: this candidate differs fundamentally from the profile of the successful sellers today.' },
    q_bank_note:    { ar: 'كل مرشّح يحصل على مجموعة أسئلة وترتيب مختلف من المخزون.', en: 'Every candidate gets a different set of questions in a different order from the bank.' },
    stage_names:    { ar: ['تسجيل', 'المرحلة 1', 'تطابق أولي', 'تقييم كامل', 'أسئلة مقابلة', 'مقابلة', 'قرار', 'تم التوظيف'],
                      en: ['Registered', 'Stage 1', 'Initial match', 'Full assessment', 'Interview questions', 'Interview', 'Decision', 'Hired'] }
  };

  var LANGS = ['ar', 'en'];                    /* Hebrew was removed — see store.load() */
  var lang = 'ar';
  function setLang(l) {
    if (LANGS.indexOf(l) < 0) l = 'ar';
    lang = l;
    var root = document.documentElement;
    root.lang = l;
    root.dir = (l === 'en') ? 'ltr' : 'rtl';   /* Arabic is RTL, English is LTR */
    save();
  }
  function getLang() { return lang; }
  function save() { var s = Store.get(); s.settings.lang = lang; Store.save(); }

  /* Content text that lives on a record rather than in DICT: question text,
     answer options, what the customer says. The Arabic field is the original
     ('q'), the English one carries an _en suffix ('q_en'), and Arabic is the
     fallback so an untranslated record still renders. */
  function qt(obj, key) {
    if (!obj) return '';
    var en = obj[key + '_en'];
    if (lang === 'en' && en) return en;
    return obj[key] || '';
  }
  /* Same idea for the { ar: , en: } records: traits, zones, dimensions. */
  function nm(obj) {
    if (!obj) return '';
    if (lang === 'en' && obj.en) return obj.en;
    return obj.ar || '';
  }
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
        dict[k].icon + ' ' + esc(lang === 'en' ? (dict[k].en || dict[k].ar) : dict[k].ar) + '</text>');
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
    T: T, qt: qt, nm: nm, setLang: setLang, getLang: getLang, DICT: DICT,
    hashPass: hashPass, fnvHash: fnvHash,
    el: el, $: $, $$: $$, esc: esc, toast: toast, confetti: confetti, countUp: countUp,
    radar: radar, bars: bars, ring: ring, tone: tone
  };
})(window);
