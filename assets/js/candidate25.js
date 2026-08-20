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
    target:     { ar: 'الدافع نحو الهدف',   he: 'דחף ליעד',        en: 'TARGET DRIVE',            icon: '🎯', color: '#3b82f6', w: 25 },
    persist:    { ar: 'الإصرار وتحمّل الرفض', he: 'התמדה ועמידות',  en: 'PERSISTENCE & RESILIENCE',icon: '🔥', color: '#f97316', w: 20 },
    discipline: { ar: 'الانضباط',            he: 'משמעת',           en: 'DISCIPLINE',              icon: '⏱', color: '#22d3ee', w: 10 },
    commit:     { ar: 'الجدّية والالتزام',    he: 'מחויבות לעבודה',  en: 'WORK COMMITMENT',         icon: '🤝', color: '#ec4899', w: 10 },
    learn:      { ar: 'التعلّم وتقبّل التوجيه', he: 'למידה וקבלת הכוונה', en: 'LEARNING & COACHABILITY', icon: '🧠', color: '#10b981', w: 10 },
    account:    { ar: 'المسؤولية الشخصية',   he: 'אחריות אישית',    en: 'ACCOUNTABILITY',          icon: '🛡', color: '#ef4444', w: 15 }
  };
  var CONSISTENCY_W = 10;              // 6 dimensions = 90% · consistency = 10%
  var DIM_KEYS = Object.keys(DIMS);

  /* 5 levels — each one changes the environment and the guide character */
  var LEVELS = [
    { n: 1, key: 'tower',  code: 'TARGET DRIVE',            ar: 'الدافع نحو الهدف',    he: 'דחף ליעד',        icon: '🎯', color: '#3b82f6', mentor: 'REX',  hue: 0 },
    { n: 2, key: 'arena',  code: 'REJECTION ARENA',         ar: 'ساحة الرفض',          he: 'זירת הדחייה',     icon: '🔥', color: '#f97316', mentor: 'ZEN',  hue: -35 },
    { n: 3, key: 'hq',     code: 'COMMITMENT & DISCIPLINE', ar: 'الالتزام والانضباط',  he: 'מחויבות ומשמעת',  icon: '⏱', color: '#22d3ee', mentor: 'MAX',  hue: 25 },
    { n: 4, key: 'lab',    code: 'ACCOUNTABILITY & LEARNING', ar: 'المسؤولية والتعلّم', he: 'אחריות ולמידה',  icon: '🧠', color: '#10b981', mentor: 'NOVA', hue: 60 },
    { n: 5, key: 'final',  code: 'SALES DNA',               ar: 'بصمة المبيعات',       he: 'ה-DNA שלך',       icon: '🏆', color: '#f59e0b', mentor: 'LEO',  hue: -70 }
  ];

  var Q = [
    /* ================= LEVEL 1 — 🎯 TARGET DRIVE ================= */
    { id:'NC01', lvl:1, q:'وصلت إلى منتصف الشهر وحققت 40% فقط من الهدف. ما أول شيء تقوم به؟', a:[
      { t:'أراجع أرقامي وأغيّر ما لا يعمل وأزيد المحاولات', p:{ target:5, account:4, learn:3, persist:3 } },
      { t:'أركّز على العملاء الأقرب للإغلاق',               p:{ target:3, persist:2, discipline:1 } },
      { t:'أستمر بنفس الأسلوب وأعطيه وقتاً',                p:{ target:1, learn:1 } },
      { t:'أعتبر أن الشهر صعب وأركّز على عدم تكراره',        p:{ target:0, account:1 } }
    ]},
    { id:'NC02', lvl:1, q:'حققت هدفك الشهري قبل نهاية الشهر بأسبوع. ماذا تفعل؟', a:[
      { t:'أضع لنفسي رقماً أعلى وأحاول الوصول إليه', p:{ target:5, commit:3 } },
      { t:'أحاول أن أكون الأول في الفريق',           p:{ target:4, commit:2 } },
      { t:'أستمر بنفس وتيرة العمل',                  p:{ target:2, commit:2, discipline:2 } },
      { t:'أخفّف الضغط لأنني أنجزت المطلوب',          p:{ target:0, commit:0 } }
    ]},
    { id:'NC03', lvl:1, q:'أعطاك المدير هدفاً أعلى بـ20% من الشهر الماضي. ما أول رد فعل لك؟', a:[
      { t:'أبدأ بالتفكير كيف أصل إليه',        p:{ target:5, account:3 } },
      { t:'أعتبره تحدياً وأتحمّس له',           p:{ target:4, account:1 } },
      { t:'أريد أن أفهم لماذا تم رفعه',        p:{ target:2, account:2, learn:2 } },
      { t:'أشعر أن الهدف السابق كان كافياً',   p:{ target:0 } }
    ]},
    { id:'NC04', lvl:1, q:'أي نتيجة تعطيك أكبر شعور بالإنجاز؟', a:[
      { t:'تجاوز الهدف الذي وُضع لي',              p:{ target:5, account:2 } },
      { t:'تحقيق عمولة مرتفعة',                    p:{ target:3, commit:1 } },
      { t:'أن أكون من أفضل أفراد الفريق',          p:{ target:4, persist:1 } },
      { t:'أن أنهي الشهر وقد أنجزت المطلوب مني',   p:{ target:1, commit:2 } }
    ]},
    { id:'NC05', lvl:1, q:'لديك ساعتان فقط لنهاية يوم مبيعات سيئ جداً.', a:[
      { t:'أحاول تغيير نتيجة اليوم حتى آخر فرصة', p:{ target:5, persist:4, discipline:2 } },
      { t:'أركّز على العملاء الأقرب للبيع',        p:{ target:3, persist:3 } },
      { t:'أستمر بشكل طبيعي حتى نهاية الدوام',     p:{ target:2, discipline:2 } },
      { t:'أبدأ بالتفكير في خطة الغد',            p:{ target:1, discipline:2, learn:1 } }
    ]},

    /* ================= LEVEL 2 — 🔥 REJECTION ARENA ================= */
    { id:'NC06', lvl:2, who:'skeptical', line:'سمعت كل شي… شكراً، لكن الجواب لا.',
      q:'تحدثت مع عميل لمدة طويلة وفي النهاية رفض الشراء.', a:[
      { t:'أحاول فهم أين خسرت الصفقة ثم أنتقل لغيره', p:{ persist:4, learn:5, account:3 } },
      { t:'أعود إليه لاحقاً بأسلوب مختلف',            p:{ persist:5, learn:3, target:2 } },
      { t:'أنتقل فوراً للعميل التالي',                p:{ persist:2, target:2 } },
      { t:'أعتبر أنه لم يكن عميلاً مناسباً',           p:{ persist:0, account:0 } }
    ]},
    { id:'NC07', lvl:2, q:'تلقّيت عدة رفضات متتالية في بداية اليوم.', a:[
      { t:'أستمر وأراجع أسلوبي إذا تكرر الأمر', p:{ persist:5, learn:4 } },
      { t:'أزيد عدد المحاولات',                 p:{ persist:4, target:3 } },
      { t:'آخذ استراحة قصيرة ثم أعود',          p:{ persist:3, discipline:1 } },
      { t:'أشعر أن اليوم قد لا يكون جيداً للمبيعات', p:{ persist:0 } }
    ]},
    { id:'NC08', lvl:2, who:'hesitant', line:'والله لسا بفكّر… بس بحاجة وقت كمان.',
      q:'عميل قال لك للمرة الثانية: "سأفكر وأرجع لك."', a:[
      { t:'أحاول معرفة ما الذي يمنعه فعلياً من اتخاذ القرار', p:{ persist:5, learn:3 } },
      { t:'أحدّد معه موعداً واضحاً للمتابعة',                 p:{ persist:4, discipline:4 } },
      { t:'أنتظر أن يعود لي',                                p:{ persist:1 } },
      { t:'أنتقل لعميل آخر',                                 p:{ persist:2, target:2 } }
    ]},
    { id:'NC09', lvl:2, q:'بقيت ثلاثة أيام لنهاية الشهر والوصول للهدف أصبح صعباً جداً.', a:[
      { t:'أعمل للوصول لأعلى نتيجة ممكنة حتى آخر يوم', p:{ persist:5, target:5, commit:3 } },
      { t:'أركّز فقط على الصفقات القريبة من الإغلاق',   p:{ persist:3, target:3 } },
      { t:'أستمر بوتيرتي المعتادة',                    p:{ persist:1, target:1, discipline:2 } },
      { t:'أبدأ التحضير للشهر القادم',                 p:{ persist:0, target:0 } }
    ]},
    { id:'NC10', lvl:2, q:'ما الذي يحدث لك عادةً بعد خسارة صفقة كنت متأكداً أنك ستغلقها؟', a:[
      { t:'أحلّل السبب وأكمل',                    p:{ persist:5, learn:4, account:3 } },
      { t:'أحاول تعويضها بصفقة أخرى',             p:{ persist:4, target:4 } },
      { t:'أحتاج بعض الوقت لاستعادة تركيزي',      p:{ persist:2 } },
      { t:'تؤثر على أدائي لبقية اليوم',           p:{ persist:0 } }
    ]},

    /* ================= LEVEL 3 — ⏱ COMMITMENT & DISCIPLINE ================= */
    { id:'NC11', lvl:3, q:'الدوام يبدأ الساعة 9:00. متى تعتبر نفسك ملتزماً بالوقت؟', a:[
      { t:'أكون جاهزاً للعمل قبل بداية الدوام', p:{ discipline:5, commit:3 } },
      { t:'أصل الساعة 9:00 تماماً',             p:{ discipline:4, commit:2 } },
      { t:'تأخير عدة دقائق ليس مشكلة',          p:{ discipline:1 } },
      { t:'الأهم بالنسبة لي هو تحقيق النتائج',   p:{ discipline:1, target:2, account:1 } }
    ]},
    { id:'NC12', lvl:3, q:'استيقظت متعباً ولا يوجد لديك مرض يمنعك من العمل.', a:[
      { t:'أذهب للعمل بشكل طبيعي',                    p:{ discipline:5, commit:5 } },
      { t:'أبدأ يومي وأرى كيف أشعر لاحقاً',            p:{ discipline:3, commit:3 } },
      { t:'أطلب التأخير قليلاً',                       p:{ discipline:1, commit:1 } },
      { t:'أفضّل أخذ يوم راحة حتى أعود بطاقة أفضل',    p:{ discipline:0, commit:0 }, f:'attendance' }
    ]},
    { id:'NC13', lvl:3, aud:'cand', q:'هل يوجد حالياً التزام ثابت قد يؤثر على قدرتك على العمل بدوام كامل؟', a:[
      { t:'لا',                p:{ commit:5 } },
      { t:'دراسة',             p:{ commit:2 }, f:'study',      fu:'FU_STUDY' },
      { t:'عمل آخر',           p:{ commit:1 }, f:'second_job', fu:'FU_JOB' },
      { t:'التزام ثابت آخر',   p:{ commit:2 }, f:'commitment_other', fu:'FU_OTHER' }
    ]},
    { id:'NC14', lvl:3, aud:'cand', q:'إذا بدأت دراسة أو دورة تتعارض مع ساعتين من الدوام، ماذا ستفعل؟', a:[
      { t:'أبحث عن طريقة لتنظيم الدراسة خارج ساعات العمل', p:{ commit:5, discipline:3 } },
      { t:'أحاول تغيير موعد الدورة',                       p:{ commit:4, discipline:2 } },
      { t:'أطلب تغيير ساعات عملي',                         p:{ commit:2 }, f:'schedule' },
      { t:'أختار حسب أهمية الدراسة في ذلك الوقت',          p:{ commit:0 }, f:'schedule' }
    ]},
    { id:'NC15', lvl:3, aud:'cand', q:'بعد ثلاثة أشهر في العمل اكتشفت أن الوظيفة أصعب مما توقعت.', a:[
      { t:'أحاول معرفة ما ينقصني وأعمل على تحسينه', p:{ commit:5, learn:5, account:4 } },
      { t:'أطلب تدريباً أو مساعدة إضافية',           p:{ commit:4, learn:4 } },
      { t:'أبدأ بالنظر إلى خيارات عمل أخرى',        p:{ commit:1 }, f:'retention' },
      { t:'إذا استمر الضغط أفضّل المغادرة',          p:{ commit:0 }, f:'retention' }
    ]},

    /* ================= LEVEL 4 — 🧠 ACCOUNTABILITY & LEARNING ================= */
    { id:'NC16', lvl:4, q:'نتائجك أقل بكثير من بقية الفريق هذا الشهر. أين تبدأ البحث عن السبب؟', a:[
      { t:'في أدائي وطريقة عملي أولاً',                p:{ account:5, learn:3 } },
      { t:'أقارن طريقتي بطريقة الموظفين الناجحين',     p:{ account:4, learn:5 } },
      { t:'أفحص جودة العملاء الذين حصلت عليهم',        p:{ account:1 } },
      { t:'أنتظر فترة أطول قبل الحكم',                 p:{ account:0 } }
    ]},
    { id:'NC17', lvl:4, who:'coach', line:'سمعت مكالمتك… أسلوبك بحاجة لتغيير.',
      q:'استمع المدير لمكالمة لك وقال إن طريقتك تحتاج للتغيير، وأنت غير مقتنع تماماً.', a:[
      { t:'أجرّب اقتراحه وأقارن النتائج',            p:{ learn:5, account:2 } },
      { t:'أطلب منه أن يشرح لي أين المشكلة',        p:{ learn:4, account:3 } },
      { t:'أغيّر فقط الأشياء التي اقتنعت بها',       p:{ learn:2 } },
      { t:'أستمر بطريقتي طالما أنها حققت نتائج سابقاً', p:{ learn:0 } }
    ]},
    { id:'NC18', lvl:4, q:'موظف بدأ بعدك وأصبح يحقق نتائج أعلى منك.', a:[
      { t:'أحاول معرفة ماذا يفعل بشكل مختلف وأتعلم منه', p:{ learn:5, account:3 } },
      { t:'يصبح لديّ دافع قوي للتفوّق عليه',             p:{ target:4, persist:3, learn:1 } },
      { t:'أركّز على نتائجي فقط',                        p:{ learn:1, account:1 } },
      { t:'أفترض أن العملاء الذين يحصل عليهم أفضل',      p:{ learn:0, account:0 } }
    ]},
    { id:'NC19', lvl:4, q:'ارتكبت خطأ تسبّب بخسارة صفقة ولم ينتبه المدير للخطأ.', a:[
      { t:'أخبره وأشرح ما حدث وما سأغيّره',      p:{ account:5, learn:3 } },
      { t:'أتعلّم من الخطأ وأتأكد ألّا يتكرر',    p:{ account:3, learn:4 } },
      { t:'لا أذكر الموضوع طالما انتهى',        p:{ account:0 } },
      { t:'يعتمد على حجم الصفقة',               p:{ account:1 } }
    ]},
    { id:'NC20', lvl:4, q:'تعلّمت طريقة بيع جديدة تختلف عمّا اعتدت عليه.', a:[
      { t:'أجرّبها مباشرة وأقيس النتيجة',            p:{ learn:5, account:2, target:2 } },
      { t:'أشاهد شخصاً ناجحاً يستخدمها أولاً',       p:{ learn:4 } },
      { t:'أستخدم منها فقط ما يناسب أسلوبي',        p:{ learn:2 } },
      { t:'أفضّل الاستمرار بالطريقة التي أعرفها',    p:{ learn:0 } }
    ]},

    /* ================= LEVEL 5 — 🏆 SALES DNA (cross-checks) ================= */
    { id:'NC21', lvl:5, x:'target',
      q:'لو كان راتبك الأساسي جيداً حتى بدون عمولة، كيف سيؤثر ذلك على أدائك؟', a:[
      { t:'سأستمر بمحاولة تحقيق أعلى أرقام ممكنة',       p:{ target:5, commit:5 }, x:95 },
      { t:'سأبقى ملتزماً بالهدف لكن الضغط سيكون أقل',    p:{ target:3, commit:4 }, x:70 },
      { t:'جهدي الإضافي سيتأثر لأن العمولة مهمة',        p:{ target:1, commit:2 }, x:38 },
      { t:'بدون عمولة لا يوجد سبب قوي لتجاوز المطلوب',   p:{ target:0, commit:0 }, x:10 }
    ]},
    { id:'NC22', lvl:5, x:'discipline',
      q:'المدير غير موجود اليوم وأنجزت المهام الأساسية المطلوبة منك.', a:[
      { t:'أستمر بالبحث عن فرص بيع جديدة',       p:{ discipline:5, target:4 }, x:95 },
      { t:'أتابع العملاء الذين لم يحسموا قرارهم', p:{ discipline:4, persist:4 }, x:85 },
      { t:'أستمر بوتيرة العمل العادية',           p:{ discipline:3 }, x:62 },
      { t:'أستغل الوقت لإنجاز أمور أخرى',         p:{ discipline:1 }, x:28 }
    ]},
    { id:'NC23', lvl:5, x:'account',
      q:'أخبرك زميل أن الهدف هذا الشهر غير واقعي وأن أغلب الفريق لن يصل إليه.', a:[
      { t:'لا يغيّر ذلك خطتي وأحاول الوصول إليه',            p:{ account:5, target:5 }, x:95 },
      { t:'أريد رؤية أرقامي قبل أن أحكم',                   p:{ account:4, target:3 }, x:80 },
      { t:'ربما يكون معه حق',                               p:{ account:1 }, x:35 },
      { t:'إذا كان الجميع بعيداً عن الهدف فالمشكلة في الهدف', p:{ account:0 }, x:10 }
    ]},
    { id:'NC24', lvl:5, x:'commit',
      q:'أي جملة أقرب لطريقتك الحقيقية في العمل؟', a:[
      { t:'أريد أن أعرف إلى أي مستوى أستطيع الوصول',           p:{ target:5, commit:4 }, x:90 },
      { t:'أحب وجود هدف واضح أعمل للوصول إليه',                p:{ target:4, commit:4, discipline:2 }, x:80 },
      { t:'أفضّل العمل باستقرار دون ضغط مستمر',                p:{ target:1, commit:2 }, x:40 },
      { t:'العمل جزء من حياتي ولا أحب أن يأخذ أكثر من حجمه',   p:{ commit:1 }, x:25 }
    ]},
    { id:'NC25', lvl:5, x:'persist',
      q:'لو طلبنا من مديرك السابق أن يصفك بجملة واحدة، ما الأقرب لما تتوقع أن يقوله؟', a:[
      { t:'لا يستسلم بسهولة',                       p:{ persist:5, target:3 }, x:95 },
      { t:'ملتزم ويمكن الاعتماد عليه',              p:{ commit:5, discipline:4 }, x:72 },
      { t:'جيد في التعامل مع الناس',                p:{ learn:2, persist:1 }, x:52 },
      { t:'يعمل جيداً عندما تكون الظروف مناسبة',    p:{ persist:0, commit:1 }, x:22, f:'conditional' }
    ]},

    /* ---------- adaptive follow-ups (extra, not part of the 25) ---------- */
    { id:'FU_STUDY', lvl:3, extra:true, aud:'cand', q:'ذكرت أن لديك دراسة. ما هي ساعات الدراسة؟', a:[
      { t:'مساءً بالكامل بعد ساعات العمل', p:{ commit:4, discipline:3 } },
      { t:'عن بُعد ومرنة تماماً',           p:{ commit:4, discipline:2 } },
      { t:'يومان في الأسبوع صباحاً',        p:{ commit:1 }, f:'schedule' },
      { t:'تتغيّر حسب الفصل الدراسي',       p:{ commit:1 }, f:'schedule' }
    ]},
    { id:'FU_JOB', lvl:3, extra:true, aud:'cand', q:'ذكرت أن لديك عمل آخر. كم ساعة يأخذ منك أسبوعياً؟', a:[
      { t:'أقل من 5 ساعات وفي نهاية الأسبوع', p:{ commit:4 } },
      { t:'من 5 إلى 10 ساعات',                p:{ commit:2 } },
      { t:'أكثر من 10 ساعات',                 p:{ commit:0 }, f:'schedule' },
      { t:'يتغيّر من أسبوع لآخر',              p:{ commit:1 }, f:'schedule' }
    ]},
    { id:'FU_OTHER', lvl:3, extra:true, aud:'cand', q:'هل يمكن تعديل هذا الالتزام ليكون خارج ساعات العمل؟', a:[
      { t:'نعم، بشكل كامل',            p:{ commit:5 } },
      { t:'نعم، بشكل جزئي',            p:{ commit:3 } },
      { t:'صعب لكنني سأحاول',          p:{ commit:1 }, f:'schedule' },
      { t:'لا، هو ثابت',               p:{ commit:0 }, f:'schedule' }
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
    study:            { ar: 'دراسة حالية',                he: 'לימודים פעילים',         sev: 2 },
    second_job:       { ar: 'عمل آخر',                    he: 'עבודה נוספת',            sev: 2 },
    commitment_other: { ar: 'التزام ثابت آخر',            he: 'התחייבות קבועה אחרת',    sev: 2 },
    schedule:         { ar: 'تعارض محتمل مع ساعات العمل', he: 'התנגשות עם שעות עבודה',  sev: 3 },
    attendance:       { ar: 'مؤشر غياب/حضور',             he: 'סיכון נוכחות',           sev: 3 },
    retention:        { ar: 'مؤشر ترك العمل تحت الضغط',   he: 'סיכון נשירה בלחץ',       sev: 3 },
    conditional:      { ar: 'أداء مرهون بالظروف',         he: 'ביצועים תלויי תנאים',    sev: 2 }
  };

  /* ---------- scoring ---------- */
  function score(answers, state) {
    var earned = {}, max = {}, preEarned = {}, preMax = {}, flags = {}, crosses = [];
    DIM_KEYS.forEach(function (k) { earned[k] = 0; max[k] = 0; preEarned[k] = 0; preMax[k] = 0; });

    answers.forEach(function (ans) {
      var q = byId[ans.qid]; if (!q) return;
      var opt = q.a[ans.opt]; if (!opt) return;
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
        return { key: k, n: flags[k], sev: FLAG_META[k].sev, ar: FLAG_META[k].ar, he: FLAG_META[k].he };
      }).sort(function (a, b) { return b.sev - a.sev; }),
      answered: answers.length
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
