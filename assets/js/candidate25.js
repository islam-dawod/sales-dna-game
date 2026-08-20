/* ============================================================
   SALES DNA — NEW CANDIDATE MODEL (fixed 25 questions)
   5 levels × 5 challenges · 6–8 minutes
   ------------------------------------------------------------
   Scoring is NOT A=4/B=3/C=2/D=1.
   Every answer maps to several traits with different points,
   so the pattern cannot be guessed or passed between candidates.

   traits: target | persist | discipline | commit | learn | account
   x     : cross-check value used by the CONSISTENCY INDEX
   f     : flag raised for the manager
   fu    : adaptive follow-up (extra question, not one of the 25)
   ============================================================ */
(function (root) {
  'use strict';

  var DIMS = {
    target:     { ar: 'الدافع نحو الهدف',        en: 'TARGET DRIVE',            icon: '🎯', color: '#3b82f6', w: 25 },
    persist:    { ar: 'الإصرار وتحمّل الرفض',  en: 'PERSISTENCE & RESILIENCE',icon: '🔥', color: '#f97316', w: 20 },
    discipline: { ar: 'الانضباط',           en: 'DISCIPLINE',              icon: '⏱', color: '#22d3ee', w: 10 },
    commit:     { ar: 'الجدّية والالتزام',  en: 'WORK COMMITMENT',         icon: '🤝', color: '#ec4899', w: 10 },
    learn:      { ar: 'التعلّم وتقبّل التوجيه', en: 'LEARNING & COACHABILITY', icon: '🧠', color: '#10b981', w: 10 },
    account:    { ar: 'المسؤولية الشخصية',    en: 'ACCOUNTABILITY',          icon: '🛡', color: '#ef4444', w: 15 }
  };
  var CONSISTENCY_W = 10;              // 6 dimensions = 90% · consistency = 10%
  var DIM_KEYS = Object.keys(DIMS);

  /* 5 levels — each one changes the environment and the guide character */
  var LEVELS = [
    { n: 1, key: 'tower',  code: 'TARGET DRIVE',            ar: 'الدافع نحو الهدف',    en: 'Target Drive',        icon: '🎯', color: '#3b82f6', mentor: 'REX',  hue: 0 },
    { n: 2, key: 'arena',  code: 'REJECTION ARENA',         ar: 'ساحة الرفض',          en: 'Rejection Arena',     icon: '🔥', color: '#f97316', mentor: 'ZEN',  hue: -35 },
    { n: 3, key: 'hq',     code: 'COMMITMENT & DISCIPLINE', ar: 'الالتزام والانضباط',  en: 'Commitment and Discipline',  icon: '⏱', color: '#22d3ee', mentor: 'MAX',  hue: 25 },
    { n: 4, key: 'lab',    code: 'ACCOUNTABILITY & LEARNING', ar: 'المسؤولية والتعلّم', en: 'Accountability and Learning',  icon: '🧠', color: '#10b981', mentor: 'NOVA', hue: 60 },
    { n: 5, key: 'final',  code: 'SALES DNA',               ar: 'بصمة المبيعات',       en: 'Your Sales DNA',       icon: '🏆', color: '#f59e0b', mentor: 'LEO',  hue: -70 }
  ];

  var Q = [
    /* ================= LEVEL 1 — 🎯 TARGET DRIVE ================= */
    { id:'NC01', lvl:1, q:'وصلت إلى منتصف الشهر وحققت 40% فقط من الهدف. ما أول شيء تقوم به؟', q_en: 'You are halfway through the month and have reached only 40% of target. What is the first thing you do?', a:[
      { t:'أراجع أرقامي وأغيّر ما لا يعمل وأزيد المحاولات', t_en: 'Review my numbers, change what is not working, and make more attempts', p:{ target:5, account:4, learn:3, persist:3 } },
      { t:'أركّز على العملاء الأقرب للإغلاق', t_en: 'Focus on the customers closest to closing',               p:{ target:3, persist:2, discipline:1 } },
      { t:'أستمر بنفس الأسلوب وأعطيه وقتاً', t_en: 'Carry on the same way and give it time',                p:{ target:1, learn:1 } },
      { t:'أعتبر أن الشهر صعب وأركّز على عدم تكراره', t_en: 'Accept it is a hard month and focus on not repeating it',        p:{ target:0, account:1 } }
    ]},
    { id:'NC02', lvl:1, q:'حققت هدفك الشهري قبل نهاية الشهر بأسبوع. ماذا تفعل؟', q_en: 'You hit your monthly target a week before the month ends. What do you do?', a:[
      { t:'أضع لنفسي رقماً أعلى وأحاول الوصول إليه', t_en: 'Set myself a higher number and go after it', p:{ target:5, commit:3 } },
      { t:'أحاول أن أكون الأول في الفريق', t_en: 'Try to be number one on the team',           p:{ target:4, commit:2 } },
      { t:'أستمر بنفس وتيرة العمل', t_en: 'Carry on at the same pace',                  p:{ target:2, commit:2, discipline:2 } },
      { t:'أخفّف الضغط لأنني أنجزت المطلوب', t_en: 'Ease off, I have done what was asked',          p:{ target:0, commit:0 } }
    ]},
    { id:'NC03', lvl:1, q:'أعطاك المدير هدفاً أعلى بـ20% من الشهر الماضي. ما أول رد فعل لك؟', q_en: 'Your manager set a target 20% higher than last month. What is your first reaction?', a:[
      { t:'أبدأ بالتفكير كيف أصل إليه', t_en: 'Start working out how to reach it',        p:{ target:5, account:3 } },
      { t:'أعتبره تحدياً وأتحمّس له', t_en: 'Treat it as a challenge and get fired up',           p:{ target:4, account:1 } },
      { t:'أريد أن أفهم لماذا تم رفعه', t_en: 'I want to understand why it was raised',        p:{ target:2, account:2, learn:2 } },
      { t:'أشعر أن الهدف السابق كان كافياً', t_en: 'I feel the previous target was enough',   p:{ target:0 } }
    ]},
    { id:'NC04', lvl:1, q:'أي نتيجة تعطيك أكبر شعور بالإنجاز؟', q_en: 'Which result gives you the biggest sense of achievement?', a:[
      { t:'تجاوز الهدف الذي وُضع لي', t_en: 'Beating the target that was set for me',              p:{ target:5, account:2 } },
      { t:'تحقيق عمولة مرتفعة', t_en: 'Earning a high commission',                    p:{ target:3, commit:1 } },
      { t:'أن أكون من أفضل أفراد الفريق', t_en: 'Being one of the best on the team',          p:{ target:4, persist:1 } },
      { t:'أن أنهي الشهر وقد أنجزت المطلوب مني', t_en: 'Finishing the month having done what was asked of me',   p:{ target:1, commit:2 } }
    ]},
    { id:'NC05', lvl:1, q:'لديك ساعتان فقط لنهاية يوم مبيعات سيئ جداً.', q_en: 'You have only two hours left in a very bad sales day.', a:[
      { t:'أحاول تغيير نتيجة اليوم حتى آخر فرصة', t_en: 'Try to change the day right up to the last chance', p:{ target:5, persist:4, discipline:2 } },
      { t:'أركّز على العملاء الأقرب للبيع', t_en: 'Focus on the customers closest to buying',        p:{ target:3, persist:3 } },
      { t:'أستمر بشكل طبيعي حتى نهاية الدوام', t_en: 'Carry on normally until the end of the shift',     p:{ target:2, discipline:2 } },
      { t:'أبدأ بالتفكير في خطة الغد', t_en: 'Start thinking about tomorrow plan',            p:{ target:1, discipline:2, learn:1 } }
    ]},

    /* ================= LEVEL 2 — 🔥 REJECTION ARENA ================= */
    { id:'NC06', lvl:2, who:'skeptical', line:'سمعت كل شي… شكراً، لكن الجواب لا.', line_en: 'I have heard it all… thanks, but the answer is no.',
      q:'تحدثت مع عميل لمدة طويلة وفي النهاية رفض الشراء.', q_en: 'You spoke with a customer for a long time and in the end they refused to buy.', a:[
      { t:'أحاول فهم أين خسرت الصفقة ثم أنتقل لغيره', t_en: 'Work out where I lost the deal, then move on', p:{ persist:4, learn:5, account:3 } },
      { t:'أعود إليه لاحقاً بأسلوب مختلف', t_en: 'Go back to them later with a different approach',            p:{ persist:5, learn:3, target:2 } },
      { t:'أنتقل فوراً للعميل التالي', t_en: 'Move straight to the next customer',                p:{ persist:2, target:2 } },
      { t:'أعتبر أنه لم يكن عميلاً مناسباً', t_en: 'Decide they were never the right customer',           p:{ persist:0, account:0 } }
    ]},
    { id:'NC07', lvl:2, q:'تلقّيت عدة رفضات متتالية في بداية اليوم.', q_en: 'You have had several rejections in a row at the start of the day.', a:[
      { t:'أستمر وأراجع أسلوبي إذا تكرر الأمر', t_en: 'Keep going, and review my approach if it keeps happening', p:{ persist:5, learn:4 } },
      { t:'أزيد عدد المحاولات', t_en: 'Increase the number of attempts',                 p:{ persist:4, target:3 } },
      { t:'آخذ استراحة قصيرة ثم أعود', t_en: 'Take a short break, then come back',          p:{ persist:3, discipline:1 } },
      { t:'أشعر أن اليوم قد لا يكون جيداً للمبيعات', t_en: 'Feel that today may not be a good day for selling', p:{ persist:0 } }
    ]},
    { id:'NC08', lvl:2, who:'hesitant', line:'والله لسا بفكّر… بس بحاجة وقت كمان.', line_en: 'Honestly I am still thinking… I need a bit more time.',
      q:'عميل قال لك للمرة الثانية: "سأفكر وأرجع لك."', q_en: 'For the second time, a customer told you: I will think about it and get back to you.', a:[
      { t:'أحاول معرفة ما الذي يمنعه فعلياً من اتخاذ القرار', t_en: 'Try to find out what is really stopping them from deciding', p:{ persist:5, learn:3 } },
      { t:'أحدّد معه موعداً واضحاً للمتابعة', t_en: 'Agree a clear follow-up date with them',                 p:{ persist:4, discipline:4 } },
      { t:'أنتظر أن يعود لي', t_en: 'Wait for them to come back to me',                                p:{ persist:1 } },
      { t:'أنتقل لعميل آخر', t_en: 'Move on to another customer',                                 p:{ persist:2, target:2 } }
    ]},
    { id:'NC09', lvl:2, q:'بقيت ثلاثة أيام لنهاية الشهر والوصول للهدف أصبح صعباً جداً.', q_en: 'Three days are left in the month and reaching the target has become very hard.', a:[
      { t:'أعمل للوصول لأعلى نتيجة ممكنة حتى آخر يوم', t_en: 'Work for the highest result possible right to the last day', p:{ persist:5, target:5, commit:3 } },
      { t:'أركّز فقط على الصفقات القريبة من الإغلاق', t_en: 'Focus only on the deals close to closing',   p:{ persist:3, target:3 } },
      { t:'أستمر بوتيرتي المعتادة', t_en: 'Carry on at my usual pace',                    p:{ persist:1, target:1, discipline:2 } },
      { t:'أبدأ التحضير للشهر القادم', t_en: 'Start preparing for next month',                 p:{ persist:0, target:0 } }
    ]},
    { id:'NC10', lvl:2, q:'ما الذي يحدث لك عادةً بعد خسارة صفقة كنت متأكداً أنك ستغلقها؟', q_en: 'What usually happens to you after losing a deal you were sure you would close?', a:[
      { t:'أحلّل السبب وأكمل', t_en: 'Analyse the reason and carry on',                    p:{ persist:5, learn:4, account:3 } },
      { t:'أحاول تعويضها بصفقة أخرى', t_en: 'Try to make it up with another deal',             p:{ persist:4, target:4 } },
      { t:'أحتاج بعض الوقت لاستعادة تركيزي', t_en: 'I need some time to get my focus back',      p:{ persist:2 } },
      { t:'تؤثر على أدائي لبقية اليوم', t_en: 'It affects my performance for the rest of the day',           p:{ persist:0 } }
    ]},

    /* ================= LEVEL 3 — ⏱ COMMITMENT & DISCIPLINE ================= */
    { id:'NC11', lvl:3, q:'الدوام يبدأ الساعة 9:00. متى تعتبر نفسك ملتزماً بالوقت؟', q_en: 'Work starts at 9:00. When do you consider yourself on time?', a:[
      { t:'أكون جاهزاً للعمل قبل بداية الدوام', t_en: 'Ready to work before the shift starts', p:{ discipline:5, commit:3 } },
      { t:'أصل الساعة 9:00 تماماً', t_en: 'Arriving at exactly 9:00',             p:{ discipline:4, commit:2 } },
      { t:'تأخير عدة دقائق ليس مشكلة', t_en: 'A few minutes late is not a problem',          p:{ discipline:1 } },
      { t:'الأهم بالنسبة لي هو تحقيق النتائج', t_en: 'What matters to me is delivering results',   p:{ discipline:1, target:2, account:1 } }
    ]},
    { id:'NC12', lvl:3, q:'استيقظت متعباً ولا يوجد لديك مرض يمنعك من العمل.', q_en: 'You woke up tired, with no illness stopping you from working.', a:[
      { t:'أذهب للعمل بشكل طبيعي', t_en: 'Go to work as normal',                    p:{ discipline:5, commit:5 } },
      { t:'أبدأ يومي وأرى كيف أشعر لاحقاً', t_en: 'Start my day and see how I feel later',            p:{ discipline:3, commit:3 } },
      { t:'أطلب التأخير قليلاً', t_en: 'Ask to come in a bit later',                       p:{ discipline:1, commit:1 } },
      { t:'أفضّل أخذ يوم راحة حتى أعود بطاقة أفضل', t_en: 'I would rather take a rest day and come back with more energy',    p:{ discipline:0, commit:0 }, f:'attendance' }
    ]},
    { id:'NC13', lvl:3, aud:'cand', q:'هل يوجد حالياً التزام ثابت قد يؤثر على قدرتك على العمل بدوام كامل؟', q_en: 'Is there currently a fixed commitment that could affect your ability to work full time?', a:[
      { t:'لا', t_en: 'No',                p:{ commit:5 } },
      { t:'دراسة', t_en: 'Study',             p:{ commit:2 }, f:'study',      fu:'FU_STUDY' },
      { t:'عمل آخر', t_en: 'Another job',           p:{ commit:1 }, f:'second_job', fu:'FU_JOB' },
      { t:'التزام ثابت آخر', t_en: 'Another fixed commitment',   p:{ commit:2 }, f:'commitment_other', fu:'FU_OTHER' }
    ]},
    { id:'NC14', lvl:3, aud:'cand', q:'إذا بدأت دراسة أو دورة تتعارض مع ساعتين من الدوام، ماذا ستفعل؟', q_en: 'If you started a course or programme that clashed with two hours of your shift, what would you do?', a:[
      { t:'أبحث عن طريقة لتنظيم الدراسة خارج ساعات العمل', t_en: 'Find a way to arrange the study outside working hours', p:{ commit:5, discipline:3 } },
      { t:'أحاول تغيير موعد الدورة', t_en: 'Try to move the time of the course',                       p:{ commit:4, discipline:2 } },
      { t:'أطلب تغيير ساعات عملي', t_en: 'Ask to change my working hours',                         p:{ commit:2 }, f:'schedule' },
      { t:'أختار حسب أهمية الدراسة في ذلك الوقت', t_en: 'Decide based on how important the study is at the time',          p:{ commit:0 }, f:'schedule' }
    ]},
    { id:'NC15', lvl:3, aud:'cand', q:'بعد ثلاثة أشهر في العمل اكتشفت أن الوظيفة أصعب مما توقعت.', q_en: 'Three months into the job you find the role is harder than you expected.', a:[
      { t:'أحاول معرفة ما ينقصني وأعمل على تحسينه', t_en: 'Work out what I am missing and improve it', p:{ commit:5, learn:5, account:4 } },
      { t:'أطلب تدريباً أو مساعدة إضافية', t_en: 'Ask for training or extra help',           p:{ commit:4, learn:4 } },
      { t:'أبدأ بالنظر إلى خيارات عمل أخرى', t_en: 'Start looking at other job options',        p:{ commit:1 }, f:'retention' },
      { t:'إذا استمر الضغط أفضّل المغادرة', t_en: 'If the pressure continues I would rather leave',          p:{ commit:0 }, f:'retention' }
    ]},

    /* ================= LEVEL 4 — 🧠 ACCOUNTABILITY & LEARNING ================= */
    { id:'NC16', lvl:4, q:'نتائجك أقل بكثير من بقية الفريق هذا الشهر. أين تبدأ البحث عن السبب؟', q_en: 'Your results are well below the rest of the team this month. Where do you start looking for the reason?', a:[
      { t:'في أدائي وطريقة عملي أولاً', t_en: 'In my own performance and the way I work, first',                p:{ account:5, learn:3 } },
      { t:'أقارن طريقتي بطريقة الموظفين الناجحين', t_en: 'By comparing my approach with the people who are succeeding',     p:{ account:4, learn:5 } },
      { t:'أفحص جودة العملاء الذين حصلت عليهم', t_en: 'By checking the quality of the leads I was given',        p:{ account:1 } },
      { t:'أنتظر فترة أطول قبل الحكم', t_en: 'I wait longer before judging',                 p:{ account:0 } }
    ]},
    { id:'NC17', lvl:4, who:'coach', line:'سمعت مكالمتك… أسلوبك بحاجة لتغيير.', line_en: 'I listened to your call… your approach needs to change.',
      q:'استمع المدير لمكالمة لك وقال إن طريقتك تحتاج للتغيير، وأنت غير مقتنع تماماً.', q_en: 'Your manager listened to one of your calls and said your approach needs to change, and you are not fully convinced.', a:[
      { t:'أجرّب اقتراحه وأقارن النتائج', t_en: 'Try their suggestion and compare the results',            p:{ learn:5, account:2 } },
      { t:'أطلب منه أن يشرح لي أين المشكلة', t_en: 'Ask them to explain exactly where the problem is',        p:{ learn:4, account:3 } },
      { t:'أغيّر فقط الأشياء التي اقتنعت بها', t_en: 'Change only the things I agree with',       p:{ learn:2 } },
      { t:'أستمر بطريقتي طالما أنها حققت نتائج سابقاً', t_en: 'Carry on my way, it has produced results before', p:{ learn:0 } }
    ]},
    { id:'NC18', lvl:4, q:'موظف بدأ بعدك وأصبح يحقق نتائج أعلى منك.', q_en: 'Someone who started after you is now getting better results than you.', a:[
      { t:'أحاول معرفة ماذا يفعل بشكل مختلف وأتعلم منه', t_en: 'Find out what they do differently and learn from them', p:{ learn:5, account:3 } },
      { t:'يصبح لديّ دافع قوي للتفوّق عليه', t_en: 'It gives me a strong drive to outperform them',             p:{ target:4, persist:3, learn:1 } },
      { t:'أركّز على نتائجي فقط', t_en: 'Focus only on my own results',                        p:{ learn:1, account:1 } },
      { t:'أفترض أن العملاء الذين يحصل عليهم أفضل', t_en: 'Assume the leads they get are better',      p:{ learn:0, account:0 } }
    ]},
    { id:'NC19', lvl:4, q:'ارتكبت خطأ تسبّب بخسارة صفقة ولم ينتبه المدير للخطأ.', q_en: 'You made a mistake that cost a deal, and your manager did not notice it.', a:[
      { t:'أخبره وأشرح ما حدث وما سأغيّره', t_en: 'Tell them, explain what happened and what I will change',      p:{ account:5, learn:3 } },
      { t:'أتعلّم من الخطأ وأتأكد ألّا يتكرر', t_en: 'Learn from the mistake and make sure it does not happen again',    p:{ account:3, learn:4 } },
      { t:'لا أذكر الموضوع طالما انتهى', t_en: 'Not mention it, since it is over',        p:{ account:0 } },
      { t:'يعتمد على حجم الصفقة', t_en: 'It depends on the size of the deal',               p:{ account:1 } }
    ]},
    { id:'NC20', lvl:4, q:'تعلّمت طريقة بيع جديدة تختلف عمّا اعتدت عليه.', q_en: 'You have learned a new way of selling that differs from what you are used to.', a:[
      { t:'أجرّبها مباشرة وأقيس النتيجة', t_en: 'Try it straight away and measure the result',            p:{ learn:5, account:2, target:2 } },
      { t:'أشاهد شخصاً ناجحاً يستخدمها أولاً', t_en: 'Watch someone successful use it first',       p:{ learn:4 } },
      { t:'أستخدم منها فقط ما يناسب أسلوبي', t_en: 'Use only the parts that suit my style',        p:{ learn:2 } },
      { t:'أفضّل الاستمرار بالطريقة التي أعرفها', t_en: 'I would rather stick with the way I know',    p:{ learn:0 } }
    ]},

    /* ================= LEVEL 5 — 🏆 SALES DNA (cross-checks) ================= */
    { id:'NC21', lvl:5, x:'target',
      q:'لو كان راتبك الأساسي جيداً حتى بدون عمولة، كيف سيؤثر ذلك على أدائك؟', q_en: 'If your base salary were good even without commission, how would that affect your performance?', a:[
      { t:'سأستمر بمحاولة تحقيق أعلى أرقام ممكنة', t_en: 'I would still push for the highest numbers I can',       p:{ target:5, commit:5 }, x:95 },
      { t:'سأبقى ملتزماً بالهدف لكن الضغط سيكون أقل', t_en: 'I would stay committed to the target, but with less pressure',    p:{ target:3, commit:4 }, x:70 },
      { t:'جهدي الإضافي سيتأثر لأن العمولة مهمة', t_en: 'My extra effort would drop, because commission matters',        p:{ target:1, commit:2 }, x:38 },
      { t:'بدون عمولة لا يوجد سبب قوي لتجاوز المطلوب', t_en: 'Without commission there is no strong reason to go beyond what is asked',   p:{ target:0, commit:0 }, x:10 }
    ]},
    { id:'NC22', lvl:5, x:'discipline',
      q:'المدير غير موجود اليوم وأنجزت المهام الأساسية المطلوبة منك.', q_en: 'Your manager is away today and you have finished the core tasks asked of you.', a:[
      { t:'أستمر بالبحث عن فرص بيع جديدة', t_en: 'Carry on looking for new sales opportunities',       p:{ discipline:5, target:4 }, x:95 },
      { t:'أتابع العملاء الذين لم يحسموا قرارهم', t_en: 'Follow up the customers who have not decided yet', p:{ discipline:4, persist:4 }, x:85 },
      { t:'أستمر بوتيرة العمل العادية', t_en: 'Carry on at the normal work pace',           p:{ discipline:3 }, x:62 },
      { t:'أستغل الوقت لإنجاز أمور أخرى', t_en: 'Use the time to get other things done',         p:{ discipline:1 }, x:28 }
    ]},
    { id:'NC23', lvl:5, x:'account',
      q:'أخبرك زميل أن الهدف هذا الشهر غير واقعي وأن أغلب الفريق لن يصل إليه.', q_en: 'A colleague tells you this month target is unrealistic and most of the team will not reach it.', a:[
      { t:'لا يغيّر ذلك خطتي وأحاول الوصول إليه', t_en: 'It does not change my plan, and I go for it',            p:{ account:5, target:5 }, x:95 },
      { t:'أريد رؤية أرقامي قبل أن أحكم', t_en: 'I want to see my own numbers before I judge',                   p:{ account:4, target:3 }, x:80 },
      { t:'ربما يكون معه حق', t_en: 'They may well be right',                               p:{ account:1 }, x:35 },
      { t:'إذا كان الجميع بعيداً عن الهدف فالمشكلة في الهدف', t_en: 'If everyone is far off the target, the target is the problem', p:{ account:0 }, x:10 }
    ]},
    { id:'NC24', lvl:5, x:'commit',
      q:'أي جملة أقرب لطريقتك الحقيقية في العمل؟', q_en: 'Which sentence is closest to how you actually work?', a:[
      { t:'أريد أن أعرف إلى أي مستوى أستطيع الوصول', t_en: 'I want to find out how far I can go',           p:{ target:5, commit:4 }, x:90 },
      { t:'أحب وجود هدف واضح أعمل للوصول إليه', t_en: 'I like having a clear target to work towards',                p:{ target:4, commit:4, discipline:2 }, x:80 },
      { t:'أفضّل العمل باستقرار دون ضغط مستمر', t_en: 'I prefer working steadily without constant pressure',                p:{ target:1, commit:2 }, x:40 },
      { t:'العمل جزء من حياتي ولا أحب أن يأخذ أكثر من حجمه', t_en: 'Work is part of my life and I do not want it to take more than its share',   p:{ commit:1 }, x:25 }
    ]},
    { id:'NC25', lvl:5, x:'persist',
      q:'لو طلبنا من مديرك السابق أن يصفك بجملة واحدة، ما الأقرب لما تتوقع أن يقوله؟', q_en: 'If we asked your previous manager to describe you in one sentence, what would you expect them to say?', a:[
      { t:'لا يستسلم بسهولة', t_en: 'Does not give up easily',                       p:{ persist:5, target:3 }, x:95 },
      { t:'ملتزم ويمكن الاعتماد عليه', t_en: 'Committed and dependable',              p:{ commit:5, discipline:4 }, x:72 },
      { t:'جيد في التعامل مع الناس', t_en: 'Good with people',                p:{ learn:2, persist:1 }, x:52 },
      { t:'يعمل جيداً عندما تكون الظروف مناسبة', t_en: 'Works well when conditions suit them',    p:{ persist:0, commit:1 }, x:22, f:'conditional' }
    ]},

    /* ---------- adaptive follow-ups (extra, not part of the 25) ---------- */
    { id:'FU_STUDY', lvl:3, extra:true, aud:'cand', q:'ذكرت أن لديك دراسة. ما هي ساعات الدراسة؟', q_en: 'You mentioned you are studying. What are the study hours?', a:[
      { t:'مساءً بالكامل بعد ساعات العمل', t_en: 'Entirely in the evening, after working hours', p:{ commit:4, discipline:3 } },
      { t:'عن بُعد ومرنة تماماً', t_en: 'Remote and fully flexible',           p:{ commit:4, discipline:2 } },
      { t:'يومان في الأسبوع صباحاً', t_en: 'Two mornings a week',        p:{ commit:1 }, f:'schedule' },
      { t:'تتغيّر حسب الفصل الدراسي', t_en: 'They change with each semester',       p:{ commit:1 }, f:'schedule' }
    ]},
    { id:'FU_JOB', lvl:3, extra:true, aud:'cand', q:'ذكرت أن لديك عمل آخر. كم ساعة يأخذ منك أسبوعياً؟', q_en: 'You mentioned you have another job. How many hours a week does it take?', a:[
      { t:'أقل من 5 ساعات وفي نهاية الأسبوع', t_en: 'Under five hours, and at the weekend', p:{ commit:4 } },
      { t:'من 5 إلى 10 ساعات', t_en: 'Five to ten hours',                p:{ commit:2 } },
      { t:'أكثر من 10 ساعات', t_en: 'More than ten hours',                 p:{ commit:0 }, f:'schedule' },
      { t:'يتغيّر من أسبوع لآخر', t_en: 'It changes from week to week',              p:{ commit:1 }, f:'schedule' }
    ]},
    { id:'FU_OTHER', lvl:3, extra:true, aud:'cand', q:'هل يمكن تعديل هذا الالتزام ليكون خارج ساعات العمل؟', q_en: 'Can this commitment be moved outside working hours?', a:[
      { t:'نعم، بشكل كامل', t_en: 'Yes, completely',            p:{ commit:5 } },
      { t:'نعم، بشكل جزئي', t_en: 'Yes, partly',            p:{ commit:3 } },
      { t:'صعب لكنني سأحاول', t_en: 'Hard, but I would try',          p:{ commit:1 }, f:'schedule' },
      { t:'لا، هو ثابت', t_en: 'No, it is fixed',               p:{ commit:0 }, f:'schedule' }
    ]}
  ];

  var byId = {};
  Q.forEach(function (q) { byId[q.id] = q; });

  /* the fixed plan: 5 levels × 5 challenges
     aud 'cand' → the full 25
     aud 'emp'  → the 22 questions that are legitimate for existing staff
                  (no studies / other job / thinking about leaving)          */
  function plan(aud) {
    aud = aud || 'cand';
    return LEVELS.map(function (l) {
      return {
        lvl: l.n, key: l.key,
        qs: Q.filter(function (q) {
          if (q.extra || q.lvl !== l.n) return false;
          return aud === 'cand' || !q.aud || q.aud === 'all';
        }).map(function (q) { return q.id; })
      };
    }).filter(function (b) { return b.qs.length; });
  }
  function countFor(aud) {
    return plan(aud).reduce(function (n, b) { return n + b.qs.length; }, 0);
  }
  /* questions an existing employee is allowed to answer */
  function empSafe(id) {
    var q = byId[id];
    return !!q && (!q.aud || q.aud === 'all');
  }

  /* ---------- flags ---------- */
  var FLAG_META = {
    study:            { ar: 'دراسة حالية',                en: 'Currently studying',         sev: 2 },
    second_job:       { ar: 'عمل آخر',                    en: 'Another job',            sev: 2 },
    commitment_other: { ar: 'التزام ثابت آخر',            en: 'Another fixed commitment',    sev: 2 },
    schedule:         { ar: 'تعارض محتمل مع ساعات العمل', en: 'Possible clash with working hours',  sev: 3 },
    attendance:       { ar: 'مؤشر غياب/حضور',             en: 'Attendance risk',           sev: 3 },
    retention:        { ar: 'مؤشر ترك العمل تحت الضغط',   en: 'Risk of leaving under pressure',       sev: 3 },
    conditional:      { ar: 'أداء مرهون بالظروف',         en: 'Performance depends on conditions',    sev: 2 }
  };

  /* ---------- scoring ---------- */
  function score(answers, state) {
    var earned = {}, max = {}, preEarned = {}, preMax = {}, flags = {}, crosses = [];
    DIM_KEYS.forEach(function (k) { earned[k] = 0; max[k] = 0; preEarned[k] = 0; preMax[k] = 0; });

    var asked = 0, scored = 0;
    answers.forEach(function (ans) {
      var q = byId[ans.qid]; if (!q) return;
      asked++;
      /* A question the timer ran out on carries opt null and unanswered true.
         Skipping it here keeps it out of BOTH earned and max, so the trait is
         scored only on what was actually answered — an unanswered question is
         never a zero. How much was answered is reported as completeness. */
      var opt = (ans.unanswered || ans.opt === null || ans.opt === undefined) ? null : q.a[ans.opt];
      if (!opt) return;
      scored++;
      var isCross = q.lvl === 5;

      /* max achievable per trait for this question */
      DIM_KEYS.forEach(function (k) {
        var m = 0;
        q.a.forEach(function (o) { if (o.p[k] != null && o.p[k] > m) m = o.p[k]; });
        if (!m) return;
        max[k] += m;
        if (!isCross) preMax[k] += m;
      });
      Object.keys(opt.p).forEach(function (k) {
        earned[k] += opt.p[k];
        if (!isCross) preEarned[k] += opt.p[k];
      });
      if (opt.f) flags[opt.f] = (flags[opt.f] || 0) + 1;
      if (q.x && opt.x != null) crosses.push({ dim: q.x, implied: opt.x, qid: q.id });
    });

    var dims = {}, pre = {};
    DIM_KEYS.forEach(function (k) {
      dims[k] = max[k] ? Math.round(100 * earned[k] / max[k]) : null;
      pre[k] = preMax[k] ? Math.round(100 * preEarned[k] / preMax[k]) : null;
    });

    /* CONSISTENCY INDEX — level 5 answers vs the profile built in levels 1–4 */
    var diffs = crosses.filter(function (c) { return pre[c.dim] != null; })
                       .map(function (c) { return { qid: c.qid, dim: c.dim, diff: Math.abs(c.implied - pre[c.dim]) }; });
    var consistency = diffs.length
      ? Math.max(0, Math.min(100, Math.round(100 - (diffs.reduce(function (s, d) { return s + d.diff; }, 0) / diffs.length) * 0.9)))
      : null;

    /* weighted match — weights are calibratable, consistency is always 10% */
    var w = (state && state.settings && state.settings.ncWeights) || defaultWeights();
    var num = 0, den = 0;
    DIM_KEYS.forEach(function (k) {
      if (dims[k] == null) return;
      num += dims[k] * w[k]; den += w[k];
    });
    var dimPart = den ? num / den : 0;
    var match = consistency == null
      ? Math.round(dimPart)
      : Math.round(dimPart * (100 - CONSISTENCY_W) / 100 + consistency * CONSISTENCY_W / 100);

    return {
      dims: dims, pre: pre, consistency: consistency, match: match,
      crossDiffs: diffs,
      flags: Object.keys(flags).map(function (k) {
        return { key: k, n: flags[k], sev: FLAG_META[k].sev, ar: FLAG_META[k].ar, en: FLAG_META[k].en };
      }).sort(function (a, b) { return b.sev - a.sev; }),
      answered: scored,
      asked: asked,
      unanswered: asked - scored,
      /* kept as its own number — never folded into match */
      completeness: asked ? Math.round(100 * scored / asked) : null
    };
  }

  function defaultWeights() {
    var w = {};
    DIM_KEYS.forEach(function (k) { w[k] = DIMS[k].w; });
    return w;
  }

  root.SDNA = root.SDNA || {};
  root.SDNA.NC = {
    DIMS: DIMS, DIM_KEYS: DIM_KEYS, LEVELS: LEVELS, CONSISTENCY_W: CONSISTENCY_W,
    all: Q, get: function (id) { return byId[id]; }, plan: plan,
    score: score, defaultWeights: defaultWeights, FLAG_META: FLAG_META,
    countFor: countFor, empSafe: empSafe,
    count: Q.filter(function (q) { return !q.extra; }).length
  };
})(window);
