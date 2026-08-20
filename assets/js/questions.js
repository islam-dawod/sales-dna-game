/* ============================================================
   SALES DNA — QUESTION ENGINE V2 / بنك الأسئلة
   ------------------------------------------------------------
   aud : 'all' | 'emp' | 'cand'
         'emp'  → existing employees only
         'cand' → candidates only (commitment / availability)
   ⚠ HARD RULE: an existing employee is NEVER asked about other
     job offers, leaving, future studies or personal plans.
     Those questions are all aud:'cand'.

   zone  : tower | arena | hq | lab | trust | street | battle | final
   trait : target persistence resilience discipline learning
           coachability accountability commitment initiative
           customer closing motivation
   who   : customer character for scenario scenes
   line  : what the customer says (shown in a speech bubble)
   mirror: id of a question measuring the same thing (consistency)
   ============================================================ */
(function (root) {
  'use strict';

  var TRAITS = {
    target:        { ar: 'الدافع نحو الهدف',        en: 'Target Drive',      icon: '🎯', color: '#3b82f6' },
    persistence:   { ar: 'الإصرار والمتابعة',           en: 'Persistence',       icon: '🔥', color: '#f97316' },
    resilience:    { ar: 'تحمّل الرفض',          en: 'Resilience',        icon: '⚡', color: '#a855f7' },
    discipline:    { ar: 'الانضباط',           en: 'Discipline',        icon: '⏱', color: '#22d3ee' },
    learning:      { ar: 'التعلّم والتطوّر',           en: 'Learning',          icon: '🧠', color: '#10b981' },
    coachability:  { ar: 'تقبّل التوجيه',     en: 'Coachability',      icon: '🎓', color: '#eab308' },
    accountability:{ ar: 'تحمّل المسؤولية',          en: 'Accountability',    icon: '🛡', color: '#ef4444' },
    commitment:    { ar: 'الالتزام',         en: 'Commitment',        icon: '🤝', color: '#ec4899' },
    initiative:    { ar: 'المبادرة',           en: 'Initiative',        icon: '🚀', color: '#8b5cf6' },
    customer:      { ar: 'أسلوب التعامل',      en: 'Customer Approach', icon: '🤝', color: '#06b6d4' },
    closing:       { ar: 'أسلوب الإغلاق',    en: 'Closing Style',     icon: '💼', color: '#f59e0b' },
    motivation:    { ar: 'الدافع الذاتي',  en: 'Self Motivation',   icon: '🔋', color: '#84cc16' }
  };

  /* SALES CITY zones */
  var ZONES = [
    { key: 'tower',  n: 1, code: 'TARGET TOWER',    ar: 'برج الأهداف',    en: 'Target Tower',    color: '#3b82f6', mentor: 'REX'  },
    { key: 'arena',  n: 2, code: 'REJECTION ARENA', ar: 'ساحة الرفض',     en: 'Rejection Arena',    color: '#f97316', mentor: 'ZEN'  },
    { key: 'hq',     n: 3, code: 'DISCIPLINE HQ',   ar: 'مركز الانضباط',  en: 'Discipline HQ',     color: '#22d3ee', mentor: 'MAX'  },
    { key: 'lab',    n: 4, code: 'LEARNING LAB',    ar: 'مختبر التعلّم',   en: 'Learning Lab',   color: '#10b981', mentor: 'NOVA' },
    { key: 'trust',  n: 5, code: 'TRUST DISTRICT',  ar: 'حي المسؤولية',   en: 'Trust District',   color: '#ef4444', mentor: 'LEO'  },
    { key: 'street', n: 6, code: 'PRESSURE STREET', ar: 'شارع الضغط',     en: 'Pressure Street',      color: '#ec4899', mentor: 'MAX'  },
    { key: 'battle', n: 7, code: 'SALES BATTLE',    ar: 'معركة المبيعات', en: 'Sales Battle',    color: '#8b5cf6', mentor: 'LEO'  },
    { key: 'final',  n: 8, code: 'FINAL ARENA',     ar: 'الساحة النهائية', en: 'Final Arena', color: '#f59e0b', mentor: 'REX'  }
  ];

  /* mentor characters that talk to the player */
  var CHARACTERS = {
    REX:  { ar: 'ريكس',  en: 'Rex',  role: 'TARGET',     icon: '🦾', color: '#3b82f6', line_ar: 'الأرقام لا تكذب. أرني كيف تفكّر.', line_en: 'Numbers do not lie. Show me how you think.' },
    NOVA: { ar: 'نوفا',  en: 'Nova', role: 'LEARNING',   icon: '🧬', color: '#10b981', line_ar: 'كل خطأ هو معلومة. لنتعلّم منه.', line_en: 'Every mistake is information. Let us learn from it.' },
    MAX:  { ar: 'ماكس',  en: 'Max',  role: 'DISCIPLINE', icon: '⚙️', color: '#22d3ee', line_ar: 'الانضباط يهزم الموهبة كل يوم.', line_en: 'Discipline beats talent every single day.' },
    ZEN:  { ar: 'زين',   en: 'Zen',   role: 'RESILIENCE', icon: '🛡️', color: '#a855f7', line_ar: 'الرفض ليس النهاية، إنه البداية.', line_en: 'Rejection is not the end, it is the beginning.' },
    LEO:  { ar: 'ليو',   en: 'Leo', role: 'SALES DRIVE',icon: '🔥', color: '#f97316', line_ar: 'البائع الحقيقي يظهر تحت الضغط.', line_en: 'A real salesperson shows up under pressure.' }
  };

  var Q = [
    /* ================= TARGET TOWER — target / motivation ================= */
    { id:'T01', trait:'target', zone:'tower', diff:1, aud:'all',
      q:'وصلت إلى منتصف الشهر ونتيجتك أقل بكثير من المتوقع. ما أول شيء تفعله؟', q_en: 'You are halfway through the month and well below where you should be. What do you do first?', a:[
      {t:'أراجع أرقامي ومكالماتي وأغيّر طريقتي', t_en: 'Review my numbers and my calls, then change my approach', s:95},
      {t:'أزيد عدد المحاولات اليومية', t_en: 'Increase the number of attempts I make each day', s:88},
      {t:'أركّز على العملاء الأقرب للشراء فقط', t_en: 'Focus only on the customers closest to buying', s:62},
      {t:'أستمر بنفس الأسلوب، الشهر لم ينتهِ', t_en: 'Carry on the same way, the month is not over', s:25}]},

    { id:'T02', trait:'target', zone:'tower', diff:1, aud:'all',
      q:'حققت الهدف الشهري قبل نهاية الشهر بأسبوع. ماذا تفعل؟', q_en: 'You hit the monthly target a week before the month ends. What do you do?', a:[
      {t:'أضع لنفسي هدفاً جديداً أعلى', t_en: 'Set myself a new, higher target', s:98},
      {t:'أحاول أن أصبح الأول في الفريق', t_en: 'Try to become number one on the team', s:92},
      {t:'أستمر بنفس المستوى', t_en: 'Keep going at the same level', s:60},
      {t:'أخفّف الضغط قليلاً', t_en: 'Ease off the pressure a little', s:25}]},

    { id:'T03', trait:'target', zone:'tower', diff:1, aud:'all',
      q:'ما الذي يحمّسك أكثر في العمل بالمبيعات؟', q_en: 'What excites you most about working in sales?', a:[
      {t:'تجاوز الرقم والوصول إلى المركز الأول', t_en: 'Beating the number and reaching first place', s:95},
      {t:'العمولة والدخل غير المحدود', t_en: 'Commission and uncapped income', s:82},
      {t:'التعامل مع الناس والعلاقات', t_en: 'Dealing with people and building relationships', s:50},
      {t:'الاستقرار وقلة الضغط', t_en: 'Stability and low pressure', s:18}]},

    { id:'T04', trait:'target', zone:'tower', diff:2, aud:'all',
      q:'مديرك رفع الهدف الشهري بنسبة 20%. ما هو شعورك الأول؟', q_en: 'Your manager raised the monthly target by 20%. What is your first reaction?', a:[
      {t:'تحدٍّ ممتاز، أريد أن أثبت أنني قادر', t_en: 'A great challenge, I want to prove I can do it', s:95},
      {t:'أقبله لكن أطلب دعماً إضافياً', t_en: 'I accept it but ask for extra support', s:75},
      {t:'أشعر أنه غير عادل لكنني سأحاول', t_en: 'It feels unfair, but I will try', s:40},
      {t:'الهدف غير واقعي وأتوقع عدم تحقيقه', t_en: 'The target is unrealistic and I expect to miss it', s:12}]},

    { id:'T05', trait:'target', zone:'tower', diff:2, aud:'all',
      q:'زميلك تجاوزك في لوحة المبيعات هذا الأسبوع. ماذا تفعل؟', q_en: 'A colleague passed you on the sales board this week. What do you do?', a:[
      {t:'أراجع ما يفعله بشكل مختلف وأشتغل أكثر لأستعيد مكاني', t_en: 'Look at what they do differently and work harder to take my place back', s:95},
      {t:'أهنّئه وأكمل بأسلوبي الخاص', t_en: 'Congratulate them and carry on my own way', s:60},
      {t:'الترتيب لا يهمني، كل واحد وظروفه', t_en: 'The ranking does not matter to me, everyone has their own situation', s:30},
      {t:'أشعر أن توزيع العملاء غير عادل', t_en: 'I feel the customer allocation is unfair', s:15}]},

    { id:'T06', trait:'target', zone:'tower', diff:1, aud:'all',
      q:'كيف تبدأ يوم عملك عادةً؟', q_en: 'How do you usually start your working day?', a:[
      {t:'أحدّد عدد المكالمات والاجتماعات المطلوب اليوم قبل أن أبدأ', t_en: 'I set the number of calls and meetings for the day before I start', s:95},
      {t:'أرتّب المهام العاجلة أولاً', t_en: 'I sort the urgent tasks first', s:70},
      {t:'أبدأ بالمتابعات التي وصلتني', t_en: 'I start with the follow-ups that came in', s:45},
      {t:'حسب ما يفرضه اليوم', t_en: 'It depends on what the day throws at me', s:20}]},

    { id:'T07', trait:'target', zone:'tower', diff:2, aud:'all',
      q:'بقي يومان على نهاية الشهر وأنت على 92% من الهدف.', q_en: 'Two days are left in the month and you are at 92% of target.', a:[
      {t:'أعمل ساعات إضافية وأتواصل مع كل عميل محتمل متبقٍّ', t_en: 'Work extra hours and contact every remaining prospect', s:98},
      {t:'أركّز على صفقة كبيرة واحدة قد تغطي الفرق', t_en: 'Focus on one big deal that could cover the gap', s:72},
      {t:'92% رقم جيد ومقبول', t_en: '92% is a good, acceptable number', s:35},
      {t:'أؤجّل الصفقات القريبة للشهر القادم لأبدأ قوياً', t_en: 'Push the near-closing deals into next month to start strong', s:20}]},

    { id:'T08', trait:'target', zone:'tower', diff:1, aud:'all',
      q:'ما تعريفك للنجاح في نهاية السنة؟', q_en: 'How do you define success at the end of the year?', a:[
      {t:'أن أكون ضمن أفضل ثلاثة في الفريق', t_en: 'Being one of the top three on the team', s:95},
      {t:'تحقيق الهدف في كل شهر بدون استثناء', t_en: 'Hitting the target every single month, no exceptions', s:88},
      {t:'أداء مقبول وبدون مشاكل', t_en: 'Acceptable performance and no problems', s:40},
      {t:'الاستمرار في العمل بدون ضغط', t_en: 'Staying in the job without pressure', s:15}]},

    { id:'T09', trait:'target', zone:'tower', diff:2, aud:'all',
      q:'عندما تحقق نتيجة ممتازة، ما أول ما يخطر في بالك؟', q_en: 'When you deliver an excellent result, what is the first thing that comes to mind?', a:[
      {t:'كيف أكرّر هذا الشهر القادم وأزيد عليه', t_en: 'How do I repeat this next month and go beyond it', s:95},
      {t:'أستحق مكافأة على هذا الجهد', t_en: 'I deserve a reward for this effort', s:62},
      {t:'أرتاح قليلاً، بذلت جهداً كبيراً', t_en: 'I will rest a little, I worked hard', s:35},
      {t:'الحظ ساعدني هذه المرة', t_en: 'Luck was on my side this time', s:20}]},

    { id:'T10', trait:'target', zone:'tower', diff:3, aud:'all', mirror:'T01',
      q:'مضى 20 يوماً من الشهر وأنت الأبعد عن الهدف في الفريق، ومديرك لم يتحدث معك بعد.', q_en: 'Twenty days into the month you are the furthest from target on the team, and your manager has not spoken to you yet.', a:[
      {t:'أذهب إليه بنفسي بخطة واضحة لبقية الشهر', t_en: 'Go to them myself with a clear plan for the rest of the month', s:98},
      {t:'أضاعف نشاطي بصمت وأحاول التعويض', t_en: 'Quietly double my activity and try to make it up', s:82},
      {t:'أنتظر أن يفتح هو الموضوع معي', t_en: 'Wait for them to raise it with me', s:35},
      {t:'أعتبر أن الشهر ضاع وأركّز على الشهر القادم', t_en: 'Write the month off and focus on the next one', s:12}]},

    { id:'T11', trait:'target', zone:'tower', diff:1, aud:'all',
      q:'كم مرة تتابع أرقامك خلال الشهر؟', q_en: 'How often do you check your numbers during the month?', a:[
      {t:'يومياً، أعرف رقمي في أي لحظة', t_en: 'Daily, I know my number at any moment', s:95},
      {t:'أسبوعياً', t_en: 'Weekly', s:70},
      {t:'عند اقتراب نهاية الشهر', t_en: 'As the end of the month approaches', s:40},
      {t:'عندما يسألني المدير', t_en: 'When my manager asks me', s:15}]},

    { id:'MO01', trait:'motivation', zone:'tower', diff:1, aud:'all',
      q:'ما الذي يجعلك تكمل في يوم سيء؟', q_en: 'What keeps you going on a bad day?', a:[
      {t:'هدفي الشخصي والرقم الذي وضعته لنفسي', t_en: 'My personal goal and the number I set for myself', s:95},
      {t:'مسؤوليتي تجاه الفريق', t_en: 'My responsibility to the team', s:82},
      {t:'العمولة في نهاية الشهر', t_en: 'The commission at the end of the month', s:78},
      {t:'لا شيء، اليوم السيء يبقى سيئاً', t_en: 'Nothing, a bad day stays a bad day', s:15}]},

    { id:'MO02', trait:'motivation', zone:'tower', diff:1, aud:'all',
      q:'من يضع لك أهدافك اليومية؟', q_en: 'Who sets your daily targets?', a:[
      {t:'أنا، وأضعها أعلى من المطلوب', t_en: 'I do, and I set them higher than required', s:98},
      {t:'أنا، بمستوى المطلوب تماماً', t_en: 'I do, exactly at the required level', s:80},
      {t:'المدير هو من يحددها', t_en: 'My manager sets them', s:45},
      {t:'لا أضع أهدافاً يومية', t_en: 'I do not set daily targets', s:15}]},

    { id:'MO03', trait:'motivation', zone:'tower', diff:2, aud:'all',
      q:'عندما لا يراقبك أحد، كيف يكون أداؤك؟', q_en: 'When nobody is watching, how do you perform?', a:[
      {t:'نفسه تماماً', t_en: 'Exactly the same', s:95},
      {t:'قريب جداً من المعتاد', t_en: 'Very close to usual', s:80},
      {t:'أقل قليلاً', t_en: 'A little less', s:40},
      {t:'أرتاح أكثر', t_en: 'I take it easier', s:15}]},

    { id:'MO04', trait:'motivation', zone:'tower', diff:1, aud:'all',
      q:'ما شعورك في صباح أول يوم عمل بالأسبوع؟', q_en: 'How do you feel on the first working morning of the week?', a:[
      {t:'متحمّس لأبدأ وأرى ما يمكنني تحقيقه', t_en: 'Excited to start and see what I can achieve', s:95},
      {t:'عادي، أبدأ يومي بشكل طبيعي', t_en: 'Normal, I just start my day', s:65},
      {t:'ثقيل عليّ لكنني أبدأ', t_en: 'It feels heavy, but I get going', s:40},
      {t:'أفضّل تأجيل كل شيء ممكن', t_en: 'I would rather postpone everything I can', s:15}]},

    { id:'MO05', trait:'motivation', zone:'tower', diff:2, aud:'all', mirror:'MO01',
      q:'مرّ عليك أسبوعان بدون أي تقدير أو ملاحظة إيجابية من أحد.', q_en: 'Two weeks have gone by with no recognition or positive feedback from anyone.', a:[
      {t:'لا يؤثر عليّ، أنا أقيس نفسي بأرقامي', t_en: 'It does not affect me, I measure myself by my numbers', s:95},
      {t:'أستمر بنفس القوة لكنني أفضّل التقدير', t_en: 'I keep the same intensity, though I do prefer recognition', s:80},
      {t:'يقل حماسي تدريجياً', t_en: 'My drive gradually drops', s:40},
      {t:'أقلل جهدي، لا أحد يلاحظ', t_en: 'I put in less effort, nobody notices anyway', s:15}]},

    { id:'MO06', trait:'motivation', zone:'tower', diff:2, aud:'all',
      q:'من أين تستمد طاقتك في العمل؟', q_en: 'Where do you draw your energy at work from?', a:[
      {t:'من تحدّي نفسي وتحسين رقمي الشخصي', t_en: 'From challenging myself and improving my own number', s:95},
      {t:'من المنافسة مع الفريق', t_en: 'From competing with the team', s:85},
      {t:'من أجواء المكان والزملاء', t_en: 'From the atmosphere and my colleagues', s:50},
      {t:'من اقتراب نهاية الدوام', t_en: 'From the end of the shift getting closer', s:15}]},

    /* ================= REJECTION ARENA — persistence / resilience ================= */
    { id:'P01', trait:'persistence', zone:'arena', diff:1, aud:'all', who:'skeptical',
      line:'شكراً، لكن الجواب لا. ما بيناسبني.', line_en: 'Thanks, but the answer is no. It is not for me.',
      q:'عميل قال لك "لا" بعد اجتماع طويل ومجهود كبير. ماذا يحدث بعد ذلك؟', q_en: 'A customer said no after a long meeting and a lot of effort. What happens next?', a:[
      {t:'أحاول أن أفهم أين فقدت الصفقة بالضبط', t_en: 'Try to understand exactly where I lost the deal', s:95},
      {t:'أعود إليه لاحقاً بطريقة مختلفة', t_en: 'Go back to them later with a different approach', s:90},
      {t:'أنتقل فوراً إلى العميل التالي', t_en: 'Move straight on to the next customer', s:55},
      {t:'أعتبره غير مناسب وأغلق الملف', t_en: 'Decide they are not a fit and close the file', s:18}]},

    { id:'P02', trait:'persistence', zone:'arena', diff:1, aud:'all',
      q:'كم مرة تتابع عميلاً محتملاً لم يرد على اتصالك؟', q_en: 'How many times do you follow up on a prospect who has not returned your call?', a:[
      {t:'5 مرات أو أكثر وبطرق مختلفة', t_en: 'Five times or more, through different channels', s:95},
      {t:'3 إلى 4 مرات', t_en: 'Three or four times', s:80},
      {t:'مرتين', t_en: 'Twice', s:50},
      {t:'مرة واحدة، إذا لم يرد فهو غير مهتم', t_en: 'Once, if they do not answer they are not interested', s:20}]},

    { id:'P03', trait:'persistence', zone:'arena', diff:2, aud:'all',
      q:'خمسة عملاء متتالين رفضوا عرضك اليوم، والساعة الآن 3 عصراً.', q_en: 'Five customers in a row turned down your offer today, and it is only 3pm.', a:[
      {t:'أكمل الاتصالات، الرفض جزء طبيعي من العمل', t_en: 'Keep making calls, rejection is a normal part of the job', s:95},
      {t:'آخذ 10 دقائق راحة ثم أكمل بنفس القوة', t_en: 'Take ten minutes, then carry on just as strong', s:88},
      {t:'أنتقل لمهام إدارية لبقية اليوم', t_en: 'Switch to admin tasks for the rest of the day', s:40},
      {t:'أنهي يومي، اليوم ليس يومي', t_en: 'End my day, today is not my day', s:12}]},

    { id:'P04', trait:'persistence', zone:'arena', diff:2, aud:'all',
      q:'عميل رفض عرضك قبل 6 أشهر. ما موقفك منه اليوم؟', q_en: 'A customer rejected your offer six months ago. Where do you stand with them today?', a:[
      {t:'أعاود التواصل معه، ظروفه قد تكون تغيّرت', t_en: 'Reach out again, their circumstances may have changed', s:95},
      {t:'أتواصل فقط إذا كان لديّ عرض جديد', t_en: 'Only get in touch if I have something new to offer', s:75},
      {t:'أتركه، هو رفض سابقاً', t_en: 'Leave them, they already said no', s:35},
      {t:'لا أعود أبداً لعميل رفضني', t_en: 'I never go back to a customer who rejected me', s:12}]},

    { id:'P05', trait:'persistence', zone:'arena', diff:2, aud:'all', who:'hesitant',
      line:'ما زلت أفكّر… خليني أرجعلك بعدين.', line_en: 'I am still thinking about it… let me get back to you.',
      q:'عميل يماطل ولا يعطي جواباً نهائياً منذ 3 أسابيع.', q_en: 'A customer has been stalling with no final answer for three weeks.', a:[
      {t:'أطلب منه قراراً واضحاً وأحدد معه موعداً محدداً', t_en: 'Ask them for a clear decision and agree a specific date', s:95},
      {t:'أستمر بالمتابعة اللطيفة بدون ضغط', t_en: 'Keep following up gently, with no pressure', s:65},
      {t:'أنتظر أن يتواصل هو عندما يجهز', t_en: 'Wait for them to reach out when they are ready', s:30},
      {t:'أعتبره صفقة خاسرة', t_en: 'Treat it as a lost deal', s:20}]},

    { id:'P06', trait:'persistence', zone:'arena', diff:1, aud:'all',
      q:'ما شعورك عندما يُغلق العميل الهاتف في وجهك؟', q_en: 'How do you feel when a customer hangs up on you?', a:[
      {t:'عادي تماماً، أتصل بالعميل التالي مباشرة', t_en: 'Completely fine, I call the next customer straight away', s:95},
      {t:'يزعجني قليلاً لكنني أكمل', t_en: 'It bothers me a little, but I carry on', s:78},
      {t:'أحتاج وقتاً قبل المكالمة التالية', t_en: 'I need a moment before the next call', s:40},
      {t:'يؤثر على مزاجي لبقية اليوم', t_en: 'It affects my mood for the rest of the day', s:15}]},

    { id:'P07', trait:'persistence', zone:'arena', diff:2, aud:'all', mirror:'P02',
      q:'بعد كم محاولة تعتبر أن العميل غير مهتم فعلاً؟', q_en: 'After how many attempts do you decide a customer really is not interested?', a:[
      {t:'بعد 5 محاولات على قنوات مختلفة', t_en: 'After five attempts across different channels', s:95},
      {t:'بعد 3 محاولات', t_en: 'After three attempts', s:75},
      {t:'بعد محاولتين', t_en: 'After two attempts', s:45},
      {t:'إذا لم يرد من أول مرة', t_en: 'If they do not answer the first time', s:15}]},

    { id:'P08', trait:'persistence', zone:'arena', diff:3, aud:'all',
      q:'فكّر بأصعب شهر مررت به في العمل. ماذا فعلت فعلياً؟', q_en: 'Think of the hardest month you have had at work. What did you actually do?', a:[
      {t:'زدت نشاطي اليومي حتى تغيّرت النتيجة', t_en: 'Increased my daily activity until the result changed', s:95},
      {t:'طلبت مساعدة مديري وغيّرت أسلوبي', t_en: 'Asked my manager for help and changed my approach', s:88},
      {t:'انتظرت أن تتحسن ظروف السوق', t_en: 'Waited for market conditions to improve', s:35},
      {t:'شعرت أن الشهر ضاع وانتظرت الشهر التالي', t_en: 'Felt the month was lost and waited for the next one', s:15}]},

    { id:'R01', trait:'resilience', zone:'arena', diff:2, aud:'all',
      q:'خسرت أكبر صفقة في الشهر في اللحظة الأخيرة.', q_en: 'You lost the biggest deal of the month at the very last moment.', a:[
      {t:'أحلّل ما حدث خلال ساعة وأعود للعمل', t_en: 'Analyse what happened within the hour and get back to work', s:95},
      {t:'أخبر مديري وأطلب رأيه فيما حصل', t_en: 'Tell my manager and ask what they make of it', s:82},
      {t:'أحتاج يوماً كاملاً لأستوعب', t_en: 'I need a full day to take it in', s:40},
      {t:'يؤثر عليّ لأسبوع تقريباً', t_en: 'It affects me for about a week', s:15}]},

    { id:'R02', trait:'resilience', zone:'arena', diff:2, aud:'all', who:'skeptical',
      line:'أنتم كلكم بتضيّعوا وقتي! لا تتصل فيّي مرة ثانية.', line_en: 'You people are all wasting my time! Do not call me again.',
      q:'عميل تحدث معك بأسلوب سيئ وأهانك شخصياً.', q_en: 'A customer spoke to you rudely and insulted you personally.', a:[
      {t:'أبقى مهنياً، أنهي المكالمة باحترام وأكمل يومي', t_en: 'Stay professional, end the call respectfully, and carry on with my day', s:95},
      {t:'أنهي المكالمة وأبلغ مديري بما حدث', t_en: 'End the call and tell my manager what happened', s:78},
      {t:'أشعر بالإحباط وأتوقف عن الاتصال قليلاً', t_en: 'Feel discouraged and stop calling for a while', s:35},
      {t:'أرد عليه بنفس الأسلوب', t_en: 'Answer back the same way', s:12}]},

    { id:'R03', trait:'resilience', zone:'arena', diff:3, aud:'all',
      q:'ضغط نهاية الشهر يتزامن مع يوم صعب جداً بالنسبة لك.', q_en: 'End-of-month pressure lands on the same day as something personally very hard for you.', a:[
      {t:'أفصل تماماً بين الاثنين خلال ساعات العمل', t_en: 'Keep the two completely separate during working hours', s:92},
      {t:'أخبر مديري وأطلب تنظيماً مختلفاً لكنني أكمل', t_en: 'Tell my manager and ask for a different arrangement, but carry on', s:85},
      {t:'أدائي ينخفض بشكل طبيعي في هذا اليوم', t_en: 'My performance naturally drops that day', s:40},
      {t:'أفضّل عدم العمل في مثل هذه الأيام', t_en: 'I would rather not work on days like that', s:20}]},

    { id:'R04', trait:'resilience', zone:'arena', diff:2, aud:'all',
      q:'كيف تتعامل مع شهر لم تحقق فيه الهدف؟', q_en: 'How do you handle a month where you missed the target?', a:[
      {t:'أحلّل الأرقام وأحدّد سببين محددين وأغيّرهما', t_en: 'Analyse the numbers, pin down two specific causes, and change them', s:95},
      {t:'أعمل أكثر في الشهر القادم', t_en: 'Work harder next month', s:75},
      {t:'أعتبرها ظروفاً وأكمل', t_en: 'Put it down to circumstances and move on', s:35},
      {t:'أشعر أن المشكلة في المنتج أو السوق', t_en: 'I feel the problem is the product or the market', s:15}]},

    { id:'R05', trait:'resilience', zone:'arena', diff:2, aud:'all', mirror:'R01',
      q:'بعد خسارة قوية، متى تعود إلى مستوى أدائك الطبيعي؟', q_en: 'After a heavy loss, when do you get back to your normal level?', a:[
      {t:'في نفس اليوم', t_en: 'The same day', s:95},
      {t:'في اليوم التالي', t_en: 'The next day', s:75},
      {t:'خلال أسبوع', t_en: 'Within a week', s:40},
      {t:'يأخذ مني وقتاً طويلاً', t_en: 'It takes me a long time', s:15}]},

    { id:'R06', trait:'resilience', zone:'arena', diff:3, aud:'all',
      q:'زميلك حصل على العميل الذي كنت تعمل عليه بسبب قرار إداري.', q_en: 'A management decision handed the customer you were working on to a colleague.', a:[
      {t:'أتحدث مع مديري بهدوء لأفهم سبب القرار', t_en: 'Speak to my manager calmly to understand the reason', s:95},
      {t:'أتقبّل القرار وأركّز على فرصي القادمة', t_en: 'Accept the decision and focus on my next opportunities', s:85},
      {t:'أعبّر عن غضبي أمام الفريق', t_en: 'Show my anger in front of the team', s:20},
      {t:'أقلّل من نشاطي، لا فائدة من الاجتهاد', t_en: 'Cut back my effort, there is no point trying', s:10}]},

    /* ================= DISCIPLINE HQ — discipline / initiative ================= */
    { id:'D01', trait:'discipline', zone:'hq', diff:1, aud:'all',
      q:'ساعات العمل تبدأ 9:00. متى تصل عادةً؟', q_en: 'The working day starts at 9:00. When do you usually arrive?', a:[
      {t:'قبل 8:50 وأكون جاهزاً تماماً', t_en: 'Before 8:50, fully ready to go', s:95},
      {t:'بين 8:58 و 9:00', t_en: 'Between 8:58 and 9:00', s:80},
      {t:'9:05 – 9:15 أحياناً', t_en: 'Sometimes 9:05 to 9:15', s:45},
      {t:'أتأخر أحياناً، المهم النتيجة في النهاية', t_en: 'I am late sometimes, what matters is the result', s:20}]},

    { id:'D02', trait:'discipline', zone:'hq', diff:1, aud:'all',
      q:'كيف تدير قائمة عملائك ومتابعاتك؟', q_en: 'How do you manage your customer list and follow-ups?', a:[
      {t:'نظام أو ملف محدّث يومياً بكل التفاصيل', t_en: 'A system or file updated daily with every detail', s:95},
      {t:'ملف أحدّثه أسبوعياً', t_en: 'A file I update weekly', s:72},
      {t:'ملاحظات في هاتفي', t_en: 'Notes on my phone', s:40},
      {t:'أعتمد على ذاكرتي', t_en: 'I rely on my memory', s:15}]},

    { id:'D03', trait:'discipline', zone:'hq', diff:2, aud:'all',
      q:'وعدت عميلاً بالاتصال الساعة 11، لكنك دخلت في اجتماع طارئ.', q_en: 'You promised a customer a call at 11:00, but an urgent meeting started.', a:[
      {t:'أرسل له رسالة قبل الساعة 11 لتأجيل الموعد', t_en: 'Message them before 11:00 to move the time', s:95},
      {t:'أتصل به فور انتهاء الاجتماع وأعتذر', t_en: 'Call as soon as the meeting ends and apologise', s:85},
      {t:'أتصل عندما أتذكّر', t_en: 'Call when I remember', s:35},
      {t:'أنتظر أن يتصل هو', t_en: 'Wait for them to call me', s:15}]},

    { id:'D04', trait:'discipline', zone:'hq', diff:2, aud:'all',
      q:'انتهى يوم العمل والمهام لم تكتمل.', q_en: 'The working day is over and the tasks are not finished.', a:[
      {t:'أنهي الأهم وأنقل الباقي بخطة واضحة لليوم التالي', t_en: 'Finish the most important ones and carry the rest over with a clear plan', s:95},
      {t:'أبقى حتى أنهي كل شيء مهم', t_en: 'Stay until everything important is done', s:88},
      {t:'أخرج في الوقت المحدد دائماً', t_en: 'I always leave exactly on time', s:45},
      {t:'أترك كل شيء للغد', t_en: 'Leave it all for tomorrow', s:25}]},

    { id:'D05', trait:'discipline', zone:'hq', diff:2, aud:'all',
      q:'كم مكالمة أو محاولة تعتبرها الحد الأدنى اليومي لك؟', q_en: 'How many calls or attempts do you treat as your daily minimum?', a:[
      {t:'لديّ رقم ثابت ألتزم به يومياً مهما حدث', t_en: 'I have a fixed number I stick to every day, whatever happens', s:95},
      {t:'رقم تقريبي أحاول الوصول إليه', t_en: 'A rough number I try to reach', s:70},
      {t:'حسب طبيعة اليوم', t_en: 'It depends on the day', s:40},
      {t:'لا أحسب، المهم النتيجة', t_en: 'I do not count, the result is what matters', s:25}]},

    { id:'D06', trait:'discipline', zone:'hq', diff:1, aud:'all',
      q:'التقارير اليومية أو الأسبوعية المطلوبة منك:', q_en: 'The daily or weekly reports you are asked for:', a:[
      {t:'أرسلها في وقتها دائماً وبدون تذكير', t_en: 'I always send them on time, without being reminded', s:95},
      {t:'أرسلها غالباً في وقتها', t_en: 'I usually send them on time', s:72},
      {t:'أتأخر أحياناً', t_en: 'I am late sometimes', s:40},
      {t:'أرسلها عند الطلب فقط', t_en: 'I send them only when asked', s:15}]},

    { id:'D07', trait:'discipline', zone:'hq', diff:1, aud:'all', mirror:'D01',
      q:'كم مرة تأخرت عن الدوام في آخر 3 أشهر؟', q_en: 'How many times were you late for work in the last three months?', a:[
      {t:'ولا مرة', t_en: 'Not once', s:95},
      {t:'مرة أو مرتين', t_en: 'Once or twice', s:75},
      {t:'من 3 إلى 5 مرات', t_en: 'Three to five times', s:40},
      {t:'أكثر من 5 مرات', t_en: 'More than five times', s:15}]},

    { id:'D08', trait:'discipline', zone:'hq', diff:2, aud:'all',
      q:'ما رأيك بالعمل ضمن نظام CRM صارم يسجّل كل خطوة؟', q_en: 'How do you feel about working inside a strict CRM that logs every step?', a:[
      {t:'ممتاز، يساعدني على تنظيم نفسي والتحسّن', t_en: 'Excellent, it helps me organise myself and improve', s:92},
      {t:'مقبول، هذا جزء من العمل', t_en: 'Fine, it is part of the job', s:75},
      {t:'مزعج لكنني أتعامل معه', t_en: 'Annoying, but I deal with it', s:45},
      {t:'يعطّلني عن البيع الحقيقي', t_en: 'It gets in the way of actually selling', s:20}]},

    { id:'D09', trait:'discipline', zone:'hq', diff:2, aud:'all',
      q:'آخر يوم عمل في الأسبوع بعد الظهر، والفريق بدأ يهدأ.', q_en: 'It is the afternoon of the last working day of the week and the team is winding down.', a:[
      {t:'أستغل الوقت، العملاء متاحون أكثر في هذا الوقت', t_en: 'Make use of the time, customers are more reachable now', s:95},
      {t:'أكمل بنفس الوتيرة', t_en: 'Carry on at the same pace', s:82},
      {t:'أنهي المهام الإدارية المتبقية', t_en: 'Finish the remaining admin tasks', s:55},
      {t:'أهدأ مثل بقية الفريق', t_en: 'Wind down like the rest of the team', s:20}]},

    { id:'D10', trait:'discipline', zone:'hq', diff:1, aud:'all',
      q:'كيف تخطّط أسبوع عملك؟', q_en: 'How do you plan your working week?', a:[
      {t:'أخطّط في بداية الأسبوع وأراجع الخطة يومياً', t_en: 'I plan at the start of the week and review the plan daily', s:95},
      {t:'أخطّط بشكل عام للأسبوع', t_en: 'I plan the week in broad terms', s:70},
      {t:'أخطّط يوماً بيوم', t_en: 'I plan day by day', s:45},
      {t:'لا أخطّط، أتعامل مع ما يأتي', t_en: 'I do not plan, I deal with what comes', s:15}]},

    { id:'IN01', trait:'initiative', zone:'hq', diff:1, aud:'all',
      q:'يوم هادئ ولا توجد لديك متابعات مجدولة. ماذا تفعل؟', q_en: 'A quiet day with no scheduled follow-ups. What do you do?', a:[
      {t:'أبني قائمة عملاء جديدة وأبدأ بالاتصال', t_en: 'Build a new prospect list and start calling', s:95},
      {t:'أراجع الصفقات الخاسرة القديمة وأعيد فتحها', t_en: 'Go back through old lost deals and reopen them', s:90},
      {t:'أنظّم ملفاتي وأنهي التقارير', t_en: 'Organise my files and finish reports', s:55},
      {t:'أنتظر أن تصلني عملاء جدد', t_en: 'Wait for new leads to come to me', s:15}]},

    { id:'IN02', trait:'initiative', zone:'hq', diff:2, aud:'all',
      q:'لاحظت أن أسلوب المكالمة المعتمد لا يعمل جيداً مع نوع معيّن من العملاء.', q_en: 'You noticed the standard call script does not work well with a certain type of customer.', a:[
      {t:'أجرّب صيغة جديدة، أقيس النتيجة، ثم أعرضها على مديري', t_en: 'Try a new version, measure the result, then take it to my manager', s:95},
      {t:'أخبر مديري وأنتظر التوجيه', t_en: 'Tell my manager and wait for direction', s:68},
      {t:'أستمر كما هو، هذا ما طُلب مني', t_en: 'Carry on as it is, this is what I was told to do', s:35},
      {t:'لا ألاحظ عادةً هذه التفاصيل', t_en: 'I do not usually notice details like that', s:15}]},

    { id:'IN03', trait:'initiative', zone:'hq', diff:2, aud:'all',
      q:'عدد العملاء المحتملين الذي يصلك من الشركة قلّ هذا الشهر.', q_en: 'The number of leads the company sends you dropped this month.', a:[
      {t:'أبحث بنفسي عن مصادر: توصيات، عملاء قدامى، شبكة معارف', t_en: 'Find my own sources: referrals, past customers, my network', s:95},
      {t:'أطلب من الإدارة زيادة عدد العملاء', t_en: 'Ask management to increase the number of leads', s:55},
      {t:'أعمل على الموجود فقط', t_en: 'Work only with what I have', s:35},
      {t:'أتوقع أن يكون الشهر ضعيفاً', t_en: 'Expect a weak month', s:12}]},

    { id:'IN04', trait:'initiative', zone:'hq', diff:2, aud:'all',
      q:'رأيت فرصة بيع لمنتج ليس ضمن مسؤوليتك المباشرة.', q_en: 'You spotted a sales opportunity for a product that is not your direct responsibility.', a:[
      {t:'أتابعها، أوصلها للشخص المناسب، وأتابع النتيجة', t_en: 'Follow it up, pass it to the right person, and track the outcome', s:95},
      {t:'أخبر زميلي المسؤول بها', t_en: 'Tell the colleague responsible for it', s:78},
      {t:'ليست من مهامي', t_en: 'It is not part of my job', s:30},
      {t:'أتجاهلها', t_en: 'Ignore it', s:15}]},

    { id:'IN05', trait:'initiative', zone:'hq', diff:2, aud:'all',
      q:'كم فكرة تحسين قدّمتها في آخر 6 أشهر؟', q_en: 'How many improvement ideas have you put forward in the last six months?', a:[
      {t:'أكثر من ثلاث أفكار', t_en: 'More than three ideas', s:95},
      {t:'فكرة أو فكرتين', t_en: 'One or two ideas', s:75},
      {t:'لا أتذكّر', t_en: 'I do not remember', s:40},
      {t:'لا شيء، هذا دور الإدارة', t_en: 'None, that is management work', s:15}]},

    { id:'IN06', trait:'initiative', zone:'hq', diff:2, aud:'all', mirror:'IN01',
      q:'انتهى الدوام الرسمي وأمامك عميل يحتاج متابعة سريعة.', q_en: 'The official day is over and a customer in front of you needs a quick follow-up.', a:[
      {t:'أنهي المتابعة قبل أن أغادر', t_en: 'Finish the follow-up before I leave', s:92},
      {t:'أرسل له رسالة الآن وأتصل صباحاً كأول مهمة', t_en: 'Message them now and call first thing in the morning', s:88},
      {t:'أتركها لليوم التالي', t_en: 'Leave it to the next day', s:45},
      {t:'أنتظر أن يتذكّرني هو', t_en: 'Wait for them to remember me', s:15}]},

    /* ================= LEARNING LAB — learning / coachability ================= */
    { id:'L01', trait:'learning', zone:'lab', diff:1, aud:'all',
      q:'قال لك مديرك إن أسلوبك في عرض المنتج ضعيف.', q_en: 'Your manager told you your product pitch is weak.', a:[
      {t:'أطلب منه أن يسمع مكالماتي مباشرة ويصحّح لي', t_en: 'Ask them to listen to my calls directly and correct me', s:95},
      {t:'أشكره وأجرّب أسلوباً جديداً', t_en: 'Thank them and try a new approach', s:85},
      {t:'أستمع لكنني أكمل بأسلوبي، فهو ناجح معي', t_en: 'Listen, but carry on my way since it works for me', s:35},
      {t:'أعتبره انتقاداً شخصياً', t_en: 'Take it as a personal attack', s:10}]},

    { id:'L02', trait:'learning', zone:'lab', diff:1, aud:'all',
      q:'متى آخر مرة تعلّمت فيها شيئاً جديداً في المبيعات؟', q_en: 'When did you last learn something new about selling?', a:[
      {t:'هذا الأسبوع، أتابع محتوى وكتباً باستمرار', t_en: 'This week, I follow content and books constantly', s:95},
      {t:'خلال هذا الشهر', t_en: 'Some time this month', s:80},
      {t:'في آخر تدريب أقامته الشركة', t_en: 'At the last training the company ran', s:45},
      {t:'لا أتذكّر', t_en: 'I do not remember', s:15}]},

    { id:'L03', trait:'learning', zone:'lab', diff:2, aud:'all',
      q:'زميل جديد حقق نتائج أفضل منك بأسلوب مختلف تماماً.', q_en: 'A new colleague is getting better results than you with a completely different approach.', a:[
      {t:'أجلس معه وأتعلّم منه مباشرة', t_en: 'Sit with them and learn from them directly', s:95},
      {t:'أراقب أسلوبه عن قرب', t_en: 'Watch their approach closely', s:80},
      {t:'أسلوبي يناسبني أكثر', t_en: 'My approach suits me better', s:35},
      {t:'نتائجه مؤقتة وسيعود إلى الواقع', t_en: 'Their results are temporary, they will come back down', s:15}]},

    { id:'L04', trait:'learning', zone:'lab', diff:2, aud:'all',
      q:'تدريب مبيعات مكثّف ليومين.', q_en: 'A two-day intensive sales training.', a:[
      {t:'أشارك بحماس، هذا استثمار في نفسي', t_en: 'Take part enthusiastically, it is an investment in myself', s:95},
      {t:'أشارك بشكل عادي', t_en: 'Take part normally', s:75},
      {t:'أشارك إذا كان إلزامياً', t_en: 'Take part if it is mandatory', s:40},
      {t:'أفضّل استغلال الوقت في البيع', t_en: 'I would rather spend the time selling', s:30}]},

    { id:'L05', trait:'learning', zone:'lab', diff:2, aud:'all',
      q:'بعد كل مكالمة فاشلة، ماذا تفعل؟', q_en: 'After every failed call, what do you do?', a:[
      {t:'أسجّل السبب وأراجع الأنماط المتكررة أسبوعياً', t_en: 'Log the reason and review the recurring patterns weekly', s:95},
      {t:'أفكّر بما يمكن تحسينه', t_en: 'Think about what could be improved', s:80},
      {t:'أنتقل للمكالمة التالية مباشرة', t_en: 'Move straight to the next call', s:50},
      {t:'لا أفكّر بها أبداً', t_en: 'I never think about it again', s:25}]},

    { id:'L06', trait:'learning', zone:'lab', diff:3, aud:'all', mirror:'L01',
      q:'مدير جديد طلب منك تغيير طريقة عملك بالكامل.', q_en: 'A new manager asked you to change the way you work completely.', a:[
      {t:'أجرّب طريقته بجدّية شهراً كاملاً ثم نقيّم النتائج', t_en: 'Give their way a serious try for a full month, then review the results together', s:95},
      {t:'أجرّب أجزاء منها', t_en: 'Try parts of it', s:65},
      {t:'أطبّقها شكلياً وأكمل بطريقتي', t_en: 'Apply it on the surface and carry on my own way', s:25},
      {t:'أعارض، طريقتي أثبتت نجاحها', t_en: 'Push back, my way has proven itself', s:15}]},

    { id:'K01', trait:'coachability', zone:'lab', diff:1, aud:'all',
      q:'مديرك يستمع إلى مكالماتك ويعطيك ملاحظات أسبوعياً.', q_en: 'Your manager listens to your calls and gives you feedback every week.', a:[
      {t:'هذا أفضل شيء ممكن، أستفيد كثيراً', t_en: 'That is the best thing possible, I get a lot out of it', s:95},
      {t:'مفيد بشكل عام', t_en: 'Useful on the whole', s:75},
      {t:'مزعج لكنني أتقبّله', t_en: 'Annoying, but I accept it', s:45},
      {t:'يخلق ضغطاً ولا أحبّه', t_en: 'It creates pressure and I do not like it', s:15}]},

    { id:'K02', trait:'coachability', zone:'lab', diff:2, aud:'all',
      q:'تلقيت ملاحظة من مديرك لا تتفق معها.', q_en: 'You received feedback from your manager that you do not agree with.', a:[
      {t:'أطبّقها فترة ثم أناقش النتائج بالأرقام', t_en: 'Apply it for a while, then discuss the results with numbers', s:95},
      {t:'أناقشها فوراً وبهدوء', t_en: 'Discuss it straight away, calmly', s:80},
      {t:'أطبّقها أمام المدير فقط', t_en: 'Apply it only in front of my manager', s:25},
      {t:'أتجاهلها', t_en: 'Ignore it', s:10}]},

    { id:'K03', trait:'coachability', zone:'lab', diff:1, aud:'all',
      q:'هل طلبت يوماً من أحد أن يقيّم أداءك بصراحة؟', q_en: 'Have you ever asked someone to assess your performance honestly?', a:[
      {t:'نعم، بشكل دوري وبمبادرة مني', t_en: 'Yes, regularly and on my own initiative', s:95},
      {t:'نعم، مرة أو مرتين', t_en: 'Yes, once or twice', s:70},
      {t:'فقط في التقييم الرسمي', t_en: 'Only in the formal review', s:40},
      {t:'لا', t_en: 'No', s:20}]},

    { id:'K04', trait:'coachability', zone:'lab', diff:2, aud:'all',
      q:'زميل أقل خبرة منك أعطاك ملاحظة على طريقة بيعك.', q_en: 'A colleague less experienced than you gave you feedback on how you sell.', a:[
      {t:'أستمع بجدّية، الفكرة الجيدة ليس لها عمر', t_en: 'Listen seriously, a good idea has no age', s:95},
      {t:'أستمع بأدب', t_en: 'Listen politely', s:65},
      {t:'لا آخذها بجدّية', t_en: 'I do not take it seriously', s:25},
      {t:'أشعر أنه تجاوز حدوده', t_en: 'I feel they overstepped', s:10}]},

    { id:'K05', trait:'coachability', zone:'lab', diff:1, aud:'all',
      q:'تدريب على منتج تعرفه جيداً منذ سنوات.', q_en: 'Training on a product you have known well for years.', a:[
      {t:'أحضر وأبحث عن تفصيلة جديدة أستفيد منها', t_en: 'Attend and look for one new detail I can use', s:92},
      {t:'أحضر بشكل عادي', t_en: 'Attend as normal', s:70},
      {t:'أحضر جسدياً فقط', t_en: 'Attend in body only', s:30},
      {t:'أطلب إعفاءً من الحضور', t_en: 'Ask to be excused', s:20}]},

    { id:'K06', trait:'coachability', zone:'lab', diff:3, aud:'all', mirror:'K02',
      q:'مديرك طلب منك استخدام أسلوب محدد في كل مكالمة.', q_en: 'Your manager asked you to use one specific approach on every call.', a:[
      {t:'ألتزم به تماماً ثم أقترح تحسينات مدعومة بالأرقام', t_en: 'Stick to it fully, then suggest improvements backed by numbers', s:95},
      {t:'ألتزم به غالباً', t_en: 'Stick to it most of the time', s:75},
      {t:'أستخدمه عندما يراقبني أحد', t_en: 'Use it when someone is watching', s:25},
      {t:'لا أستخدم أساليب جاهزة', t_en: 'I do not use ready-made scripts', s:20}]},

    /* ================= TRUST DISTRICT — accountability ================= */
    { id:'A01', trait:'accountability', zone:'trust', diff:2, aud:'all',
      q:'لم تحقق الهدف هذا الشهر، وسألك المدير: لماذا؟', q_en: 'You missed the target this month and your manager asks why.', a:[
      {t:'أعرض ما قصّرت فيه بالتحديد وخطتي للتصحيح', t_en: 'Show exactly where I fell short and my plan to fix it', s:95},
      {t:'أعرض الأرقام والعوامل الخارجية معاً', t_en: 'Present the numbers and the external factors together', s:70},
      {t:'أشرح ظروف السوق والمنافسة', t_en: 'Explain the market and the competition', s:30},
      {t:'العملاء هذا الشهر لم يكونوا جادّين', t_en: 'The customers this month were not serious', s:10}]},

    { id:'A02', trait:'accountability', zone:'trust', diff:2, aud:'all',
      q:'خطأ منك تسبّب بخسارة عميل مهم.', q_en: 'A mistake of yours cost the company an important customer.', a:[
      {t:'أبلغ مديري فوراً وأقترح حلاً', t_en: 'Tell my manager immediately and propose a fix', s:95},
      {t:'أحاول إصلاح الأمر أولاً ثم أخبره', t_en: 'Try to repair it first, then tell them', s:78},
      {t:'أخبره إذا سأل', t_en: 'Tell them if they ask', s:30},
      {t:'لا داعي، الأمر انتهى', t_en: 'No need, it is over', s:10}]},

    { id:'A03', trait:'accountability', zone:'trust', diff:2, aud:'all',
      q:'الفريق كله لم يحقق الهدف هذا الشهر.', q_en: 'The whole team missed the target this month.', a:[
      {t:'أنظر إلى رقمي أنا وما كان بإمكاني تغييره', t_en: 'Look at my own number and what I could have changed', s:95},
      {t:'أناقش الموضوع مع الفريق', t_en: 'Discuss it with the team', s:65},
      {t:'إذن المشكلة ليست مني', t_en: 'So the problem is not mine', s:25},
      {t:'هذا دليل أن الهدف غير واقعي', t_en: 'That proves the target is unrealistic', s:15}]},

    { id:'A04', trait:'accountability', zone:'trust', diff:2, aud:'all',
      q:'عميل اشتكى منك مباشرة إلى مديرك.', q_en: 'A customer complained about you directly to your manager.', a:[
      {t:'أطلب تفاصيل الشكوى وأتحمّل مسؤوليتي إن أخطأت', t_en: 'Ask for the details and own my part if I was wrong', s:95},
      {t:'أشرح وجهة نظري للمدير', t_en: 'Explain my side to my manager', s:60},
      {t:'بعض العملاء يشتكون دائماً', t_en: 'Some customers always complain', s:25},
      {t:'أشعر أن المدير لم يدافع عني', t_en: 'I feel my manager did not defend me', s:15}]},

    { id:'A05', trait:'accountability', zone:'trust', diff:1, aud:'all',
      q:'ما نسبة تأثيرك أنت على نتيجتك الشهرية؟', q_en: 'How much of your monthly result is down to you?', a:[
      {t:'90% أو أكثر', t_en: '90% or more', s:95},
      {t:'حوالي 70%', t_en: 'Around 70%', s:80},
      {t:'حوالي 50%', t_en: 'Around 50%', s:45},
      {t:'الظروف والسوق هي الأساس', t_en: 'Circumstances and the market are the main thing', s:15}]},

    { id:'A06', trait:'accountability', zone:'trust', diff:3, aud:'all', mirror:'A01',
      q:'شهران متتاليان تحت الهدف. ما أول ما تفعله؟', q_en: 'Two months in a row below target. What is the first thing you do?', a:[
      {t:'أراجع أرقامي بالتفصيل وأحدّد أين أنا مقصّر', t_en: 'Review my numbers in detail and pin down where I am falling short', s:95},
      {t:'أطلب اجتماعاً عاجلاً مع مديري', t_en: 'Ask for an urgent meeting with my manager', s:85},
      {t:'أطلب تعديل الهدف', t_en: 'Ask for the target to be adjusted', s:30},
      {t:'أنتظر تحسّن السوق', t_en: 'Wait for the market to pick up', s:10}]},

    { id:'A07', trait:'accountability', zone:'trust', diff:2, aud:'all',
      q:'وعدت مديرك برقم معيّن وأصبح واضحاً أنك لن تصله.', q_en: 'You promised your manager a specific number and it is now clear you will not reach it.', a:[
      {t:'أخبره قبل نهاية الشهر بوقت كافٍ ومعي خطة', t_en: 'Tell them well before the month ends, with a plan in hand', s:95},
      {t:'أخبره في الاجتماع الشهري', t_en: 'Tell them at the monthly meeting', s:60},
      {t:'أنتظر أن يلاحظ بنفسه', t_en: 'Wait for them to notice', s:25},
      {t:'أبرّر بالظروف', t_en: 'Explain it away with circumstances', s:15}]},

    { id:'A08', trait:'accountability', zone:'trust', diff:2, aud:'all',
      q:'زميلك في الفريق يقصّر ويؤثر على نتيجة الفريق المشتركة.', q_en: 'A teammate is underperforming and it affects the shared team result.', a:[
      {t:'أتحدث معه مباشرة أولاً', t_en: 'Talk to them directly first', s:90},
      {t:'أبلغ المدير بالموضوع', t_en: 'Raise it with the manager', s:70},
      {t:'لا شأن لي، كل واحد ورقمه', t_en: 'Not my business, everyone has their own number', s:35},
      {t:'أقلّل جهدي أنا أيضاً', t_en: 'Cut back my own effort too', s:10}]},

    { id:'A09', trait:'accountability', zone:'trust', diff:2, aud:'all',
      q:'نسيت متابعة عميل وضاعت الصفقة.', q_en: 'You forgot to follow up a customer and the deal was lost.', a:[
      {t:'أسجّلها كدرس وأبني نظاماً يمنع تكرارها', t_en: 'Log it as a lesson and build a system so it cannot happen again', s:95},
      {t:'أنتبه أكثر في المرة القادمة', t_en: 'Pay more attention next time', s:70},
      {t:'يحدث للجميع', t_en: 'It happens to everyone', s:35},
      {t:'ضغط العمل والنظام هما السبب', t_en: 'The workload and the system are to blame', s:15}]},

    { id:'A10', trait:'accountability', zone:'trust', diff:1, aud:'all',
      q:'ما رأيك بجملة: "النتيجة مسؤولية البائع وحده"؟', q_en: 'What do you make of the statement: the result is the salesperson\'s responsibility alone?', a:[
      {t:'صحيحة تماماً', t_en: 'Completely true', s:92},
      {t:'صحيحة في معظمها', t_en: 'True for the most part', s:85},
      {t:'صحيحة جزئياً', t_en: 'Partly true', s:50},
      {t:'غير صحيحة، عوامل كثيرة تؤثر', t_en: 'Not true, many factors play a role', s:20}]},

    /* ================= PRESSURE STREET =================
       employees → التزام بالهدف والنتيجة (سلوك عمل فقط)
       candidates → التزام وتوفّر ودراسة (مواقف، لا أسئلة مباشرة) */
    { id:'TC01', trait:'commitment', zone:'street', diff:2, aud:'emp',
      q:'الهدف الشهري أصبح أصعب بعد ظرف خارجي في السوق.', q_en: 'The monthly target got harder after an external shift in the market.', a:[
      {t:'ألتزم بالرقم وأعدّل خطتي للوصول إليه', t_en: 'Commit to the number and adjust my plan to reach it', s:95},
      {t:'أطلب دعماً إضافياً لكنني أبقى ملتزماً بالرقم', t_en: 'Ask for extra support but stay committed to the number', s:85},
      {t:'أطلب تخفيض الهدف', t_en: 'Ask for the target to be lowered', s:35},
      {t:'أتعامل معه كهدف غير قابل للتحقيق', t_en: 'Treat it as a target that cannot be met', s:15}]},

    { id:'TC02', trait:'commitment', zone:'street', diff:2, aud:'emp',
      q:'نهاية الشهر تحتاج ساعات إضافية لإغلاق الأرقام.', q_en: 'The end of the month needs extra hours to close the numbers.', a:[
      {t:'أبقى حتى أنهي، هذا جزء من العمل', t_en: 'Stay until it is done, that is part of the job', s:95},
      {t:'أبقى في معظم الأحيان', t_en: 'Stay most of the time', s:78},
      {t:'أحياناً حسب الظروف', t_en: 'Sometimes, depending on circumstances', s:45},
      {t:'أخرج في وقتي المحدد دائماً', t_en: 'I always leave at my set time', s:25}]},

    { id:'TC03', trait:'commitment', zone:'street', diff:2, aud:'emp',
      q:'ما مدى التزامك بالرقم الذي تعد به مديرك؟', q_en: 'How committed are you to the number you promise your manager?', a:[
      {t:'أعد برقم وأحققه أو أزيد عليه', t_en: 'I promise a number and hit it or beat it', s:95},
      {t:'أحققه في معظم الأشهر', t_en: 'I hit it most months', s:78},
      {t:'رقم تقريبي وليس وعداً', t_en: 'It is an estimate, not a promise', s:45},
      {t:'لا أحب الوعد بأرقام', t_en: 'I do not like promising numbers', s:20}]},

    { id:'TC04', trait:'commitment', zone:'street', diff:2, aud:'emp',
      q:'حققت هدفك، وزميلك يحتاج مساعدة في آخر يومين من الشهر.', q_en: 'You have hit your target, and a colleague needs help in the last two days of the month.', a:[
      {t:'أساعده، نتيجة الفريق تهمّني أيضاً', t_en: 'Help them, the team result matters to me too', s:92},
      {t:'أساعده إذا توفّر لديّ وقت', t_en: 'Help if I have time', s:70},
      {t:'كل واحد ورقمه', t_en: 'Everyone has their own number', s:40},
      {t:'لا، هذا يشتّت تركيزي', t_en: 'No, it breaks my focus', s:25}]},

    { id:'TC05', trait:'commitment', zone:'street', diff:2, aud:'emp', mirror:'TC03',
      q:'كيف تتعامل مع هدف سنوي طويل المدى؟', q_en: 'How do you handle a long-range annual target?', a:[
      {t:'أقسّمه إلى أرقام شهرية وأسبوعية وأتابعها', t_en: 'Break it into monthly and weekly numbers and track them', s:95},
      {t:'أتابعه شهرياً', t_en: 'Track it monthly', s:78},
      {t:'أتذكّره عند التقييم السنوي', t_en: 'Remember it at the annual review', s:40},
      {t:'لا أفكّر بالسنة، أفكّر باليوم', t_en: 'I do not think in years, I think in days', s:30}]},

    { id:'AV01', trait:'commitment', zone:'street', diff:3, aud:'cand',
      q:'تم قبولك في وظيفة 8 ساعات يومياً، وبعد شهر بدأت دورة تعليمية تتعارض مع ساعتين من الدوام. ماذا تفعل؟', q_en: 'You were hired for an eight-hour day. A month in, a course starts that clashes with two hours of your shift. What do you do?', a:[
      {t:'أنظّم الدورة خارج ساعات الدوام', t_en: 'Arrange the course outside working hours', s:95},
      {t:'أطلب تغيير ساعات عملي', t_en: 'Ask to change my working hours', s:40, f:'schedule'},
      {t:'أغيب في الأيام التي فيها دورة', t_en: 'Be absent on the days the course runs', s:10, f:'schedule'},
      {t:'أبحث عن عمل أكثر مرونة', t_en: 'Look for a more flexible job', s:15, f:'stability'}]},

    { id:'AV02', trait:'commitment', zone:'street', diff:3, aud:'cand',
      q:'بعد 3 أشهر من العمل عُرض عليك برنامج تدريبي مسائي 3 أيام في الأسبوع ينتهي الساعة 9 مساءً.', q_en: 'Three months in, you are offered an evening training programme, three days a week, ending at 9pm.', a:[
      {t:'أؤجّله حتى أستقر تماماً في العمل', t_en: 'Postpone it until I am fully settled in the job', s:92},
      {t:'أقبله فقط إذا لم يؤثر على أدائي وساعاتي', t_en: 'Accept it only if it does not affect my performance or my hours', s:85},
      {t:'أطلب تخفيف ساعات عملي لأجله', t_en: 'Ask to reduce my working hours for it', s:35, f:'schedule'},
      {t:'أقبله فوراً، الفرصة لا تتكرر', t_en: 'Accept immediately, the chance will not come again', s:25, f:'study_plan'}]},

    { id:'AV03', trait:'commitment', zone:'street', diff:2, aud:'cand',
      q:'الدوام يبدأ 9:00 ووسيلة مواصلاتك تتأخر أحياناً 20 دقيقة.', q_en: 'Work starts at 9:00 and your transport is sometimes 20 minutes late.', a:[
      {t:'أخرج مبكراً بما يضمن وصولي في الوقت دائماً', t_en: 'Leave early enough to always arrive on time', s:95},
      {t:'أبحث عن وسيلة بديلة مضمونة', t_en: 'Find a reliable alternative', s:88},
      {t:'أخبر المدير أنني قد أتأخر أحياناً', t_en: 'Tell my manager I may be late sometimes', s:40, f:'commute'},
      {t:'أطلب تعديل ساعة البداية', t_en: 'Ask to move my start time', s:25, f:'schedule'}]},

    { id:'AV04', trait:'commitment', zone:'street', diff:2, aud:'cand',
      q:'لديك التزام شخصي أسبوعي ثابت يقع داخل ساعات الدوام.', q_en: 'You have a fixed weekly personal commitment that falls inside working hours.', a:[
      {t:'أنسّقه في يوم إجازتي', t_en: 'Move it to my day off', s:95},
      {t:'أنقله إلى ما بعد ساعات العمل', t_en: 'Move it to after working hours', s:92},
      {t:'أطلب الخروج مبكراً مرة كل أسبوع', t_en: 'Ask to leave early once a week', s:40, f:'schedule'},
      {t:'لا يمكن تغييره إطلاقاً', t_en: 'It cannot be changed at all', s:15, f:'schedule'}]},

    { id:'AV05', trait:'commitment', zone:'street', diff:2, aud:'cand', mirror:'C03',
      q:'خلال 12 شهراً القادمة، ما الأقرب إلى خطتك؟', q_en: 'Over the next 12 months, what is closest to your plan?', a:[
      {t:'التركيز الكامل على النجاح في هذا العمل', t_en: 'Full focus on succeeding in this job', s:95},
      {t:'العمل مع تطوير مهاراتي في المبيعات', t_en: 'Working while developing my sales skills', s:90},
      {t:'العمل مع دراسة مسائية', t_en: 'Working alongside evening study', s:50, f:'study_plan'},
      {t:'لا أعرف بعد', t_en: 'I do not know yet', s:35, f:'stability'}]},

    { id:'C01', trait:'commitment', zone:'street', diff:1, aud:'cand',
      q:'هل لديك دراسة حالياً؟', q_en: 'Are you studying at the moment?', a:[
      {t:'لا، لا أدرس حالياً', t_en: 'No, I am not studying', s:95},
      {t:'أنهيت دراستي', t_en: 'I have finished my studies', s:92},
      {t:'نعم، دراسة مسائية أو جزئية', t_en: 'Yes, evening or part-time study', s:55, f:'study', fu:'C02'},
      {t:'نعم، دراسة بدوام كامل', t_en: 'Yes, full-time study', s:20, f:'study', fu:'C02'}]},

    { id:'C02', trait:'commitment', zone:'street', diff:2, aud:'cand', hidden:true,
      q:'ذكرت أن لديك دراسة. ما هي ساعات الدراسة؟', q_en: 'You mentioned you are studying. What are the study hours?', a:[
      {t:'مساءً بعد ساعات العمل بالكامل', t_en: 'Evenings, entirely after working hours', s:78},
      {t:'عن بُعد ومرنة تماماً', t_en: 'Remote and fully flexible', s:82},
      {t:'يومان في الأسبوع في ساعات الصباح', t_en: 'Two days a week in the morning', s:28, f:'schedule'},
      {t:'ساعات متغيّرة حسب الفصل الدراسي', t_en: 'Hours change with each semester', s:35, f:'schedule'}]},

    { id:'C03', trait:'commitment', zone:'street', diff:2, aud:'cand',
      q:'هل تخطّط لبدء دراسة خلال الـ 12 شهراً القادمة؟', q_en: 'Are you planning to start studying in the next 12 months?', a:[
      {t:'لا، لا توجد أي خطة دراسة', t_en: 'No, no study plans at all', s:95},
      {t:'أفكّر بالموضوع لكن بدون خطة محددة', t_en: 'I am thinking about it, but with no specific plan', s:55, f:'study_plan'},
      {t:'نعم، دراسة مسائية', t_en: 'Yes, evening study', s:50, f:'study_plan'},
      {t:'نعم، دراسة بدوام كامل', t_en: 'Yes, full-time study', s:15, f:'study_plan'}]},

    { id:'C04', trait:'commitment', zone:'street', diff:2, aud:'cand',
      q:'هل لديك عمل آخر أو مشروع جانبي حالياً؟', q_en: 'Do you have another job or a side project at the moment?', a:[
      {t:'لا، لا يوجد', t_en: 'No, none', s:95},
      {t:'عمل بسيط في عطلة نهاية الأسبوع', t_en: 'Something light at the weekend', s:65},
      {t:'مشروع جانبي يأخذ وقتاً يومياً', t_en: 'A side project that takes time every day', s:30, f:'second_job'},
      {t:'عمل آخر بدوام جزئي', t_en: 'Another part-time job', s:20, f:'second_job'}]},

    { id:'C05', trait:'commitment', zone:'street', diff:3, aud:'cand', mirror:'AV01',
      q:'إذا تعارض أي التزام خارجي مع ساعات العمل، ما قرارك؟', q_en: 'If any outside commitment clashes with working hours, what do you decide?', a:[
      {t:'العمل أولاً بدون تردد', t_en: 'Work first, without hesitation', s:95},
      {t:'أحاول تعديل الالتزام الآخر ليناسب العمل', t_en: 'Try to move the other commitment to fit work', s:85},
      {t:'أطلب تعديل ساعات العمل', t_en: 'Ask to adjust my working hours', s:35, f:'schedule'},
      {t:'الالتزام الآخر أولاً', t_en: 'The other commitment comes first', s:10, f:'schedule'}]},

    { id:'C06', trait:'commitment', zone:'street', diff:1, aud:'cand',
      q:'كم سنة تتوقع أن تبقى في هذا العمل إذا كانت النتائج جيدة؟', q_en: 'How many years do you expect to stay in this job if the results are good?', a:[
      {t:'أكثر من 3 سنوات', t_en: 'More than three years', s:95},
      {t:'من سنتين إلى 3 سنوات', t_en: 'Two to three years', s:82},
      {t:'حوالي سنة', t_en: 'About a year', s:40},
      {t:'لا أعرف، حسب الفرص التي تأتي', t_en: 'I do not know, it depends what comes along', s:20, f:'stability'}]},

    { id:'C07', trait:'commitment', zone:'street', diff:2, aud:'cand',
      q:'ساعات العمل قد تمتد أحياناً حتى المساء في نهاية الشهر.', q_en: 'Working hours may sometimes run into the evening at the end of the month.', a:[
      {t:'لا مشكلة إطلاقاً', t_en: 'No problem at all', s:95},
      {t:'مقبول من وقت لآخر', t_en: 'Fine from time to time', s:75},
      {t:'صعب عليّ لكنني سأحاول', t_en: 'Hard for me, but I will try', s:40},
      {t:'غير ممكن بالنسبة لي', t_en: 'Not possible for me', s:15, f:'schedule'}]},

    { id:'C08', trait:'commitment', zone:'street', diff:1, aud:'cand',
      q:'كم تبعد عن مكان العمل وكيف تصل إليه؟', q_en: 'How far do you live from work and how do you get there?', a:[
      {t:'قريب جداً ومواصلاتي مضمونة', t_en: 'Very close, and my transport is reliable', s:95},
      {t:'حوالي نصف ساعة', t_en: 'About half an hour', s:82},
      {t:'أكثر من ساعة', t_en: 'More than an hour', s:45, f:'commute'},
      {t:'المواصلات غير مضمونة لديّ', t_en: 'My transport is not reliable', s:20, f:'commute'}]},

    { id:'C09', trait:'commitment', zone:'street', diff:3, aud:'cand', mirror:'C03',
      q:'عُرض عليك برنامج دراسي ممتاز يبدأ خلال شهرين وساعاته تتقاطع جزئياً مع العمل.', q_en: 'You are offered an excellent study programme starting in two months, with hours that partly overlap work.', a:[
      {t:'أرفضه أو أؤجّله', t_en: 'Turn it down or postpone it', s:92},
      {t:'أبحث عن نسخة مسائية منه', t_en: 'Look for an evening version of it', s:80},
      {t:'أنسّق مع الشركة لتقليل ساعات عملي', t_en: 'Arrange with the company to cut my hours', s:35, f:'study_plan'},
      {t:'أقبله، الفرصة لا تتكرر', t_en: 'Accept it, the chance will not come again', s:10, f:'study_plan'}]},

    { id:'C10', trait:'commitment', zone:'street', diff:2, aud:'cand',
      q:'ما أهم شيء بالنسبة لك في عملك القادم؟', q_en: 'What matters most to you in your next job?', a:[
      {t:'النمو والدخل المرتبط بالنتائج', t_en: 'Growth and income tied to results', s:95},
      {t:'بيئة عمل جيدة وفريق محترم', t_en: 'A good environment and a decent team', s:65},
      {t:'الاستقرار والساعات الثابتة', t_en: 'Stability and fixed hours', s:35},
      {t:'مرونة عالية في الحضور', t_en: 'A lot of flexibility about attendance', s:20, f:'schedule'}]},

    { id:'C11', trait:'commitment', zone:'street', diff:1, aud:'cand',
      q:'كم مرة غيّرت عملك في آخر 3 سنوات؟', q_en: 'How many times have you changed jobs in the last three years?', a:[
      {t:'لم أغيّر، أو مرة واحدة فقط', t_en: 'Never, or only once', s:95},
      {t:'مرتين', t_en: 'Twice', s:65},
      {t:'ثلاث مرات', t_en: 'Three times', s:40, f:'stability'},
      {t:'أكثر من ثلاث مرات', t_en: 'More than three times', s:20, f:'stability'}]},

    { id:'C12', trait:'commitment', zone:'street', diff:2, aud:'cand', mirror:'C05',
      q:'آخر يوم في الشهر ولديك التزام شخصي غير طارئ في نفس الوقت.', q_en: 'It is the last day of the month and you have a non-urgent personal commitment at the same time.', a:[
      {t:'أؤجّل الالتزام الشخصي', t_en: 'Postpone the personal commitment', s:95},
      {t:'أنسّق ليكون بعد ساعات الدوام', t_en: 'Move it to after working hours', s:88},
      {t:'أطلب المغادرة مبكراً', t_en: 'Ask to leave early', s:40},
      {t:'الالتزام الشخصي أولاً', t_en: 'The personal commitment comes first', s:15, f:'schedule'}]},

    /* ================= SALES BATTLE — customer approach / closing ================= */
    { id:'CU01', trait:'customer', zone:'battle', diff:2, aud:'all', who:'skeptical',
      line:'ما بثق بهالشركات، كلهم بيوعدوا وما بينفذوا.', line_en: 'I do not trust these companies, they all promise and never deliver.',
      q:'كيف ترد؟', q_en: 'How do you respond?', a:[
      {t:'أسأله عن تجربته السابقة وأستمع كاملاً قبل أن أرد', t_en: 'Ask about their past experience and listen fully before I answer', s:95},
      {t:'أعطيه أمثلة عملاء ونتائج ملموسة', t_en: 'Give them customer examples and concrete results', s:85},
      {t:'أدافع عن الشركة وأشرح الفرق', t_en: 'Defend the company and explain the difference', s:50},
      {t:'أقول له إن هذا رأي غير عادل', t_en: 'Tell them that view is unfair', s:12}]},

    { id:'CU02', trait:'customer', zone:'battle', diff:2, aud:'all', who:'busy',
      line:'أنا مستعجل كثير… عندك دقيقتين.', line_en: 'I am in a real rush… you have two minutes.',
      q:'ماذا تفعل بالدقيقتين؟', q_en: 'What do you do with the two minutes?', a:[
      {t:'أسأله سؤالاً واحداً يحدد احتياجه ثم أقرر', t_en: 'Ask one question that pins down their need, then decide', s:95},
      {t:'أختصر لأهم نقطة وأطلب موعداً أطول', t_en: 'Cut to the single most important point and ask for a longer slot', s:92},
      {t:'أحاول أن أقول كل شيء بسرعة', t_en: 'Try to say everything, quickly', s:38},
      {t:'أعتذر وأتصل في وقت آخر', t_en: 'Apologise and call another time', s:35}]},

    { id:'CU03', trait:'customer', zone:'battle', diff:2, aud:'all', who:'hesitant',
      line:'ما بعرف… لازم أستشير شريكي بالموضوع.', line_en: 'I am not sure… I need to check with my partner.',
      q:'ماذا تفعل؟', q_en: 'What do you do?', a:[
      {t:'أسأله ما الذي يحتاجه شريكه ليقرر، وأجهّزه له', t_en: 'Ask what their partner needs in order to decide, and prepare it for them', s:95},
      {t:'أعرض حضور اجتماع قصير مع الاثنين', t_en: 'Offer a short meeting with both of them', s:90},
      {t:'أعطيه وقتاً ولا أضغط عليه', t_en: 'Give them time and apply no pressure', s:50},
      {t:'أضغط لإغلاق الصفقة اليوم', t_en: 'Push to close the deal today', s:25}]},

    { id:'CU04', trait:'customer', zone:'battle', diff:1, aud:'all',
      q:'قبل أن تعرض المنتج، كم سؤالاً تسأل العميل عادةً؟', q_en: 'Before you present the product, how many questions do you usually ask the customer?', a:[
      {t:'خمسة أسئلة أو أكثر لأفهم وضعه', t_en: 'Five or more, to understand their situation', s:95},
      {t:'ثلاثة إلى أربعة أسئلة', t_en: 'Three or four questions', s:85},
      {t:'سؤال أو اثنين', t_en: 'One or two', s:45},
      {t:'أبدأ بالعرض مباشرة', t_en: 'I go straight into the pitch', s:15}]},

    { id:'CU05', trait:'customer', zone:'battle', diff:2, aud:'all', who:'price',
      line:'أعطيني أفضل سعر عندك وبس، ما بدي تفاصيل.', line_en: 'Just give me your best price, I do not want the details.',
      q:'ماذا تفعل؟', q_en: 'What do you do?', a:[
      {t:'أسأله ما الأهم عنده غير السعر قبل أن أتكلم بالرقم', t_en: 'Ask what matters to them besides price before I name a number', s:95},
      {t:'أعرض السعر مع القيمة المقابلة له', t_en: 'Present the price together with the value behind it', s:85},
      {t:'أقول له إن السعر ثابت ولا يتغير', t_en: 'Tell them the price is fixed and does not change', s:45},
      {t:'أعطيه أقل سعر ممكن فوراً', t_en: 'Give them the lowest price straight away', s:25}]},

    { id:'CU06', trait:'customer', zone:'battle', diff:2, aud:'all',
      q:'تحدث العميل 10 دقائق عن مشكلته. ماذا تفعل بعدها مباشرة؟', q_en: 'The customer has talked about their problem for ten minutes. What do you do immediately after?', a:[
      {t:'ألخّص كلامه بجملة وأتأكد أنني فهمت', t_en: 'Sum up what they said in one sentence and check I understood', s:95},
      {t:'أبدأ بعرض الحل المناسب', t_en: 'Start presenting the right solution', s:75},
      {t:'أشكره وأعرض المنتج كاملاً', t_en: 'Thank them and present the full product', s:40},
      {t:'أعيد التركيز على وقتي المحدود', t_en: 'Steer things back to my limited time', s:20}]},

    { id:'CU07', trait:'customer', zone:'battle', diff:2, aud:'all', mirror:'CU04',
      q:'كيف تعرف أن العميل جاهز للشراء؟', q_en: 'How do you know a customer is ready to buy?', a:[
      {t:'من أسئلته وإشاراته، وأختبر ذلك بسؤال مباشر', t_en: 'From their questions and signals, and I test it with a direct question', s:95},
      {t:'عندما يبدأ بالسؤال عن السعر', t_en: 'When they start asking about price', s:70},
      {t:'عندما يقول إنه مهتم', t_en: 'When they say they are interested', s:50},
      {t:'لا أعرف، أنتظر قراره', t_en: 'I do not know, I wait for their decision', s:20}]},

    { id:'CL01', trait:'closing', zone:'battle', diff:2, aud:'all',
      q:'انتهيت من عرض ممتاز والعميل صامت. ماذا تفعل؟', q_en: 'You finished an excellent pitch and the customer is silent. What do you do?', a:[
      {t:'أسأله مباشرة: ما رأيك، نبدأ؟', t_en: 'Ask them directly: what do you think, shall we start?', s:95},
      {t:'أسأله ما الذي يمنعه من القرار الآن', t_en: 'Ask what is stopping them from deciding now', s:92},
      {t:'أعرض عليه معلومات إضافية', t_en: 'Offer them more information', s:52},
      {t:'أنتظر حتى يتكلم هو', t_en: 'Wait until they speak', s:35}]},

    { id:'CL02', trait:'closing', zone:'battle', diff:3, aud:'all', who:'price',
      line:'السعر غالي… خليني أفكّر وبرجعلك.', line_en: 'The price is high… let me think and get back to you.',
      q:'ماذا تفعل؟', q_en: 'What do you do?', a:[
      {t:'أسأله: غالٍ مقارنة بماذا؟ وأحدد معه موعد رد', t_en: 'Ask: high compared to what? and agree a date to hear back', s:95},
      {t:'أشرح مميزات المنتج من جديد', t_en: 'Explain the product benefits again', s:55},
      {t:'أعرض عليه خصماً فورياً', t_en: 'Offer an immediate discount', s:30},
      {t:'أشكره وأنتظر أن يرجع لي', t_en: 'Thank them and wait for them to come back', s:18}]},

    { id:'CL03', trait:'closing', zone:'battle', diff:2, aud:'all',
      q:'العميل وافق شفهياً. ما الخطوة التالية؟', q_en: 'The customer agreed verbally. What is the next step?', a:[
      {t:'أثبّت الاتفاق كتابياً وأحدد الخطوة القادمة بتاريخ', t_en: 'Confirm the agreement in writing and set the next step with a date', s:98},
      {t:'أشكره وأرسل له التفاصيل لاحقاً', t_en: 'Thank them and send the details later', s:62},
      {t:'أحتفل وأنتقل إلى عميل آخر', t_en: 'Celebrate and move to another customer', s:35},
      {t:'أنتظر أن يرسل هو التأكيد', t_en: 'Wait for them to send confirmation', s:20}]},

    { id:'CL04', trait:'closing', zone:'battle', diff:2, aud:'all',
      q:'كم مرة تطلب الإغلاق في اللقاء الواحد؟', q_en: 'How many times do you ask for the close in a single meeting?', a:[
      {t:'أكثر من مرة وبأساليب مختلفة', t_en: 'More than once, in different ways', s:95},
      {t:'مرة واحدة بوضوح', t_en: 'Once, clearly', s:80},
      {t:'فقط إذا شعرت أنه مهتم', t_en: 'Only if I sense they are interested', s:50},
      {t:'لا أطلب، أترك القرار له', t_en: 'I do not ask, I leave the decision to them', s:15}]},

    { id:'CL05', trait:'closing', zone:'battle', diff:3, aud:'all', who:'hesitant',
      line:'أنا موافق… بس بعد شهر إن شاء الله.', line_en: 'I am in… but in a month, hopefully.',
      q:'ماذا تفعل؟', q_en: 'What do you do?', a:[
      {t:'أحدد موعداً ملموساً وأتفق على خطوة تحضيرية الآن', t_en: 'Set a concrete date and agree one preparatory step now', s:95},
      {t:'أضع تذكيراً وأتابع بعد شهر', t_en: 'Set a reminder and follow up in a month', s:68},
      {t:'أوافق وأنتظر اتصاله', t_en: 'Agree and wait for their call', s:38},
      {t:'أضغط عليه ليقرر اليوم', t_en: 'Press them to decide today', s:32}]},

    { id:'CL06', trait:'closing', zone:'battle', diff:2, aud:'all',
      q:'ما رأيك بالخصم كأداة إغلاق؟', q_en: 'What is your view of discounting as a closing tool?', a:[
      {t:'آخر أداة، وبمقابل واضح من العميل', t_en: 'A last resort, and only for something clear in return', s:95},
      {t:'أداة جيدة عند الحاجة', t_en: 'A good tool when needed', s:65},
      {t:'أسرع طريقة لإغلاق الصفقة', t_en: 'The fastest way to close a deal', s:30},
      {t:'أستخدمه في كل صفقة تقريباً', t_en: 'I use it on almost every deal', s:15}]},

    { id:'CL07', trait:'closing', zone:'battle', diff:3, aud:'all', mirror:'CL04',
      q:'صفقة كبيرة تحتاج 3 اجتماعات إضافية، مقابل صفقة صغيرة تُغلق اليوم.', q_en: 'A big deal needs three more meetings, against a small deal that closes today.', a:[
      {t:'أدير الاثنتين: الصغيرة اليوم والكبيرة بجدول واضح', t_en: 'Run both: the small one today and the big one on a clear schedule', s:95},
      {t:'أركّز على الصفقة الكبيرة', t_en: 'Focus on the big deal', s:80},
      {t:'أختار الصغيرة المضمونة', t_en: 'Take the small, guaranteed one', s:50},
      {t:'أختار حسب مزاجي في ذلك اليوم', t_en: 'Decide based on how I feel that day', s:18}]},

    /* ================= FINAL ARENA — boss battle ================= */
    { id:'B01', trait:'target', zone:'final', diff:3, aud:'all', mirror:'T01',
      q:'بقي يومان على نهاية الشهر وأنت على 60% من الهدف.', q_en: 'Two days are left in the month and you are at 60% of target.', a:[
      {t:'أراجع كل الصفقات المفتوحة وأتصل بها كلها اليوم', t_en: 'Go through every open deal and call all of them today', s:95},
      {t:'أركّز على أكبر صفقتين', t_en: 'Focus on the two biggest deals', s:78},
      {t:'أحضّر أرضية قوية للشهر القادم', t_en: 'Build a strong base for next month', s:30},
      {t:'أعمل بشكل طبيعي، الوصول شبه مستحيل', t_en: 'Work normally, reaching it is near impossible', s:15}]},

    { id:'B02', trait:'persistence', zone:'final', diff:3, aud:'all', who:'boss',
      line:'قلتلك رح فكّر… وبعدين اختفيت أسبوع. شو بدك كمان؟', line_en: 'I told you I would think about it… then you vanished for a week. What else do you want?',
      q:'عميل كبير قال "نعم مبدئياً" ثم اختفى أسبوعاً كاملاً.', q_en: 'A major customer said yes in principle, then disappeared for a whole week.', a:[
      {t:'أتواصل عبر قناة أخرى وأحدد له مهلة واضحة', t_en: 'Reach out on another channel and give them a clear deadline', s:95},
      {t:'أرسل رسالة كل يومين بقيمة مضافة مختلفة', t_en: 'Send something of different added value every two days', s:90},
      {t:'أنتظر أسبوعاً آخر', t_en: 'Wait another week', s:32},
      {t:'أعتبر الصفقة ضائعة', t_en: 'Treat the deal as lost', s:15}]},

    { id:'B03', trait:'accountability', zone:'final', diff:3, aud:'all', who:'boss',
      line:'خلينا نتفاهم… سوّيلي هالشي وأنا بوقّع اليوم.', line_en: 'Let us come to an understanding… do this for me and I sign today.',
      q:'العميل الكبير طلب منك شيئاً يخالف سياسة الشركة مقابل إغلاق الصفقة.', q_en: 'A major customer asked you for something against company policy in return for closing the deal.', a:[
      {t:'أرفض بأدب، أعرض البديل، وأبلغ مديري', t_en: 'Politely refuse, offer the alternative, and tell my manager', s:98},
      {t:'أرفض فقط وأكمل بدون إبلاغ', t_en: 'Just refuse and carry on without telling anyone', s:72},
      {t:'أستشير زميلاً وأتصرف', t_en: 'Ask a colleague and act on that', s:48},
      {t:'أوافق لأغلق الصفقة', t_en: 'Agree, to close the deal', s:6}]},

    { id:'B04', trait:'customer', zone:'final', diff:3, aud:'all', who:'skeptical',
      line:'أنا مرتاح كثير مع المورّد الحالي، ليش أغيّر؟', line_en: 'I am very happy with my current supplier, why would I change?',
      q:'ماذا تفعل؟', q_en: 'What do you do?', a:[
      {t:'أسأله ما الذي قد يجعله يفكّر بالتغيير مستقبلاً', t_en: 'Ask what might make them consider changing in future', s:95},
      {t:'أطلب فرصة تجربة صغيرة جداً', t_en: 'Ask for a very small trial', s:88},
      {t:'أعرض مقارنة سعرية مباشرة', t_en: 'Offer a straight price comparison', s:52},
      {t:'أشكره وأغلق الملف', t_en: 'Thank them and close the file', s:18}]},

    { id:'B05', trait:'resilience', zone:'final', diff:3, aud:'all',
      q:'أسبوع كامل بدون أي صفقة مغلقة.', q_en: 'A whole week with no deal closed.', a:[
      {t:'أحلّل الوضع مع مديري وأزيد نشاطي 50%', t_en: 'Analyse it with my manager and raise my activity by 50%', s:95},
      {t:'أكمل بنفس الروتين اليومي', t_en: 'Carry on with the same daily routine', s:55},
      {t:'أخفّف الضغط عن نفسي قليلاً', t_en: 'Take some of the pressure off myself', s:30},
      {t:'أشعر أن المشكلة في المنتج أو التسعير', t_en: 'I feel the problem is the product or the pricing', s:15}]},

    { id:'B06', trait:'discipline', zone:'final', diff:3, aud:'all',
      q:'لديك 3 مواعيد مؤكدة اليوم، وفجأة ظهر عميل جديد "ساخن".', q_en: 'You have three confirmed appointments today, and a hot new lead suddenly appears.', a:[
      {t:'ألتزم بمواعيدي وأجدول العميل الجديد بعد الدوام', t_en: 'Keep my appointments and schedule the new lead after hours', s:95},
      {t:'أؤجّل أقل موعد أهمية بعد تنسيق مسبق معه', t_en: 'Move the least important appointment, agreed with them in advance', s:82},
      {t:'أؤجّل العميل الجديد إلى الغد', t_en: 'Push the new lead to tomorrow', s:52},
      {t:'ألغي موعداً وأذهب للعميل الجديد', t_en: 'Cancel an appointment and go to the new lead', s:28}]},

    { id:'B07', trait:'accountability', zone:'final', diff:3, aud:'all', who:'boss',
      line:'في شي صغير بيني وبينك… وبكون سعيد كثير.', line_en: 'There is a little something between us… and I would be very happy.',
      q:'العميل عرض عليك عمولة شخصية مقابل تسريع صفقته.', q_en: 'A customer offered you a personal commission to speed up their deal.', a:[
      {t:'أرفض وأبلغ مديري فوراً', t_en: 'Refuse and tell my manager immediately', s:100},
      {t:'أرفض بدون إبلاغ أحد', t_en: 'Refuse without telling anyone', s:70},
      {t:'أتجاهل الموضوع وأكمل الصفقة', t_en: 'Ignore it and carry on with the deal', s:28},
      {t:'أقبل، هذا شائع في السوق', t_en: 'Accept, it is common in this market', s:0}]},

    { id:'B08', trait:'closing', zone:'final', diff:3, aud:'all', who:'busy',
      line:'ابعتلي إيميل وأنا برد عليك… يمكن.', line_en: 'Email me and I will reply… maybe.',
      q:'ماذا تفعل؟', q_en: 'What do you do?', a:[
      {t:'أتفق معه على موعد محدد للرد قبل أن أنهي المكالمة', t_en: 'Agree a specific date for their reply before I end the call', s:95},
      {t:'أرسل الإيميل وأتصل بعد يومين', t_en: 'Send the email and call in two days', s:85},
      {t:'أرسل الإيميل وأنتظر رده', t_en: 'Send the email and wait for their reply', s:35},
      {t:'أعتبره غير مهتم', t_en: 'Treat them as not interested', s:18}]},

    { id:'B09', trait:'motivation', zone:'final', diff:3, aud:'all',
      q:'أنت الأول في الفريق منذ 3 أشهر. ما الذي يحدث في الشهر الرابع؟', q_en: 'You have been top of the team for three months. What happens in the fourth?', a:[
      {t:'أرفع سقف رقمي وأحاول تحطيمه من جديد', t_en: 'Raise my own ceiling and try to break it again', s:95},
      {t:'أحافظ على نفس المستوى', t_en: 'Hold the same level', s:65},
      {t:'أرتاح قليلاً، بنيت رصيداً جيداً', t_en: 'Ease off a little, I have built up credit', s:30},
      {t:'أنتظر أن تلاحظ الإدارة إنجازي', t_en: 'Wait for management to notice what I have done', s:22}]},

    { id:'B10', trait:'initiative', zone:'final', diff:3, aud:'all',
      q:'اكتشفت أن منافساً أطلق عرضاً قوياً هذا الأسبوع.', q_en: 'You discovered a competitor launched a strong offer this week.', a:[
      {t:'أدرسه، أجهّز رداً واضحاً، وأخبر الفريق والإدارة', t_en: 'Study it, prepare a clear response, and brief the team and management', s:95},
      {t:'أخبر مديري وأنتظر التوجيه', t_en: 'Tell my manager and wait for direction', s:68},
      {t:'أتعامل معه إذا سألني عميل', t_en: 'Deal with it if a customer asks me', s:42},
      {t:'ليست مشكلتي، هذا شأن الإدارة', t_en: 'Not my problem, that is for management', s:15}]}
  ];

  /* ---------- helpers ---------- */
  var byId = {};
  Q.forEach(function (q) { byId[q.id] = q; });
  function get(id) { return byId[id]; }
  function zone(key) { return ZONES.filter(function (z) { return z.key === key; })[0]; }

  /* audience filter — this is where the "never ask employees" rule lives */
  function allowed(q, aud) {
    if (q.aud === 'all') return true;
    return q.aud === aud;
  }

  function pool(filter) {
    filter = filter || {};
    return Q.filter(function (q) {
      if (q.hidden && !filter.includeHidden) return false;
      if (filter.zone && q.zone !== filter.zone) return false;
      if (filter.aud && !allowed(q, filter.aud)) return false;
      if (filter.trait && q.trait !== filter.trait) return false;
      if (filter.maxDiff && q.diff > filter.maxDiff) return false;
      return true;
    });
  }

  root.SDNA = root.SDNA || {};
  root.SDNA.Q = {
    TRAITS: TRAITS, ZONES: ZONES, CHARACTERS: CHARACTERS,
    all: Q, get: get, zone: zone, pool: pool, allowed: allowed,
    traitKeys: Object.keys(TRAITS),
    /* traits used for the quick match (core) */
    coreTraits: ['target', 'persistence', 'resilience', 'discipline', 'accountability', 'commitment']
  };
})(window);
