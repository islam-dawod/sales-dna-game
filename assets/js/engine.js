/* ============================================================
   SALES DNA — ANALYTICS ENGINE
   DNA scoring · group centroids · similarity · pattern discovery
   · question power · flags · consistency · manager summary
   ============================================================ */
(function (root) {
  'use strict';
  var Q = root.SDNA.Q;
  var TK = Q.traitKeys;

  function avg(a) { return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : 0; }
  function round(x) { return Math.round(x); }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

  /* ---------- DNA from answers ---------- */
  function dna(answers) {
    answers = answers || [];
    var buckets = {}, out = { traits: {}, overall: 0, count: answers.length };
    TK.forEach(function (t) { buckets[t] = []; });
    answers.forEach(function (a) {
      var q = Q.get(a.qid); if (!q) return;
      buckets[q.trait].push(typeof a.s === 'number' ? a.s : q.a[a.opt].s);
    });
    var present = [];
    TK.forEach(function (t) {
      if (buckets[t].length) { out.traits[t] = round(avg(buckets[t])); present.push(out.traits[t]); }
      else out.traits[t] = null;
    });
    out.overall = round(avg(present));
    return out;
  }

  function mergeAnswers() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) if (arguments[i]) out = out.concat(arguments[i]);
    return out;
  }

  /* full answers of a candidate (stage1 + stage2) */
  function candAnswers(c) {
    return mergeAnswers(c.s1 && c.s1.answers, c.s2 && c.s2.answers);
  }

  /* ---------- sales character (cosmetic) ---------- */
  var CHARS = [
    { key: 'HUNTER',  need: ['target', 'persistence'],       ar: 'الصيّاد',     he: 'הצייד',     emoji: '🎯', desc_ar: 'يلاحق الهدف بلا توقف، أفضل نتائجه تحت ضغط الأرقام.' },
    { key: 'CLOSER',  need: ['target', 'resilience'],        ar: 'المُغلِق',    he: 'הסוגר',     emoji: '⚡', desc_ar: 'قوي في اللحظات الحاسمة، لا يتراجع أمام الاعتراضات.' },
    { key: 'GRINDER', need: ['discipline', 'persistence'],   ar: 'المثابر',     he: 'המתמיד',    emoji: '⛏', desc_ar: 'يكسب بالتكرار والانضباط اليومي وليس بالحظ.' },
    { key: 'BUILDER', need: ['commitment', 'accountability'],ar: 'الباني',      he: 'הבנאי',     emoji: '🏗', desc_ar: 'يبني علاقات ونتائج طويلة المدى ويتحمّل المسؤولية.' },
    { key: 'STUDENT', need: ['learning', 'coachability'],    ar: 'المتعلّم',    he: 'הלומד',     emoji: '🧠', desc_ar: 'يتحسّن بسرعة، يستفيد من كل ملاحظة ويطوّر أسلوبه.' }
  ];
  function character(d) {
    var best = CHARS[0], bs = -1;
    CHARS.forEach(function (c) {
      var s = avg(c.need.map(function (t) { return d.traits[t] || 0; }));
      if (s > bs) { bs = s; best = c; }
    });
    return best;
  }

  /* ---------- group centroids ---------- */
  function groupStats(employees) {
    var res = {};
    ['strong', 'medium', 'low'].forEach(function (g) {
      var list = employees.filter(function (e) { return e.group === g && e.assessment; });
      var t = {};
      TK.forEach(function (k) {
        var vals = list.map(function (e) { return dna(e.assessment.answers).traits[k]; })
                       .filter(function (v) { return v != null; });
        t[k] = vals.length ? round(avg(vals)) : null;
      });
      res[g] = { traits: t, n: list.length, overall: round(avg(TK.map(function (k) { return t[k]; }).filter(function (v) { return v != null; }))) };
    });
    var all = employees.filter(function (e) { return e.assessment; });
    var ct = {};
    TK.forEach(function (k) {
      var vals = all.map(function (e) { return dna(e.assessment.answers).traits[k]; }).filter(function (v) { return v != null; });
      ct[k] = vals.length ? round(avg(vals)) : null;
    });
    res.company = { traits: ct, n: all.length, overall: round(avg(TK.map(function (k) { return ct[k]; }).filter(function (v) { return v != null; }))) };
    return res;
  }

  /* ---------- learned weights (discriminative power strong vs low) ---------- */
  function learnWeights(employees) {
    var gs = groupStats(employees);
    var seps = {}, tot = 0;
    TK.forEach(function (k) {
      var s = gs.strong.traits[k], l = gs.low.traits[k];
      var sep = (s != null && l != null) ? Math.max(0, s - l) : 0;
      seps[k] = sep + 2;           // +2 floor so nothing collapses to zero
      tot += seps[k];
    });
    var w = {};
    TK.forEach(function (k) { w[k] = tot ? seps[k] / tot : 1 / TK.length; });
    return { weights: w, separation: seps, groups: gs, learned: gs.strong.n >= 3 && gs.low.n >= 2 };
  }

  function activeWeights(state) {
    if (state.settings.weights) return state.settings.weights;
    return learnWeights(state.employees).weights;
  }

  /* ---------- similarity between two trait vectors ---------- */
  function similarity(a, b, w) {
    var num = 0, den = 0;
    TK.forEach(function (k) {
      if (a[k] == null || b[k] == null) return;
      var wk = (w && w[k]) || 1 / TK.length;
      var d = Math.abs(a[k] - b[k]);
      num += wk * d; den += wk;
    });
    if (!den) return 0;
    var meanDiff = num / den;
    return round(clamp(100 - meanDiff * 1.35, 0, 100));
  }

  /* ---------- candidate match ---------- */
  function match(d, state) {
    var w = activeWeights(state);
    var gs = groupStats(state.employees);
    var simS = gs.strong.n ? similarity(d.traits, gs.strong.traits, w) : null;
    var simM = gs.medium.n ? similarity(d.traits, gs.medium.traits, w) : null;
    var simL = gs.low.n ? similarity(d.traits, gs.low.traits, w) : null;
    // weighted trait quality (how strong the profile is on its own)
    var quality = 0, dw = 0;
    TK.forEach(function (k) {
      if (d.traits[k] == null) return;
      var wk = w[k] || 1 / TK.length;
      quality += d.traits[k] * wk; dw += wk;
    });
    quality = dw ? quality / dw : 0;
    // 45% similarity to strong · 40% weighted profile quality · 15% distance from low profile
    var lowPenalty = simL == null ? 0 : clamp((simL - (simS == null ? simL : simS)), 0, 40);
    var m = simS == null ? quality : (0.45 * simS + 0.40 * quality + 0.15 * (100 - (simL || 50)));
    m = clamp(m - lowPenalty * 0.25, 0, 100);
    var th = state.settings.thresholds;
    return {
      match: round(m),
      quality: round(quality),
      simStrong: simS, simMedium: simM, simLow: simL,
      band: m >= th.high ? 'high' : m >= th.mid ? 'mid' : 'low'
    };
  }

  /* ---------- consistency (mirror pairs) ---------- */
  function consistency(answers) {
    var map = {}; answers.forEach(function (a) { map[a.qid] = (a.s != null ? a.s : (Q.get(a.qid) || { a: [] }).a[a.opt].s); });
    var diffs = [], pairs = [];
    answers.forEach(function (a) {
      var q = Q.get(a.qid);
      if (!q || !q.mirror) return;
      if (map[q.mirror] == null) return;
      var d = Math.abs(map[a.qid] - map[q.mirror]);
      diffs.push(d);
      pairs.push({ a: a.qid, b: q.mirror, diff: round(d) });
    });
    if (!diffs.length) return { score: null, pairs: [] };
    return { score: round(clamp(100 - avg(diffs) * 0.95, 0, 100)), pairs: pairs };
  }

  /* ---------- flags & signals ---------- */
  var FLAG_META = {
    study:       { ar: 'دراسة حالية',              he: 'לימודים פעילים',        sev: 2 },
    study_plan:  { ar: 'خطة دراسة قادمة',          he: 'תוכנית לימודים עתידית', sev: 2 },
    schedule:    { ar: 'تعارض في ساعات العمل',     he: 'קונפליקט בשעות עבודה',  sev: 3 },
    second_job:  { ar: 'عمل/مشروع آخر',            he: 'עבודה נוספת',           sev: 2 },
    commute:     { ar: 'صعوبة وصول/مواصلات',       he: 'קושי בהגעה',            sev: 1 },
    stability:   { ar: 'تنقّل وظيفي متكرر',        he: 'חוסר יציבות תעסוקתית',  sev: 2 },
    low_persistence:   { ar: 'إصرار منخفض',         he: 'התמדה נמוכה',           sev: 3 },
    low_accountability:{ ar: 'مسؤولية منخفضة',      he: 'אחריות נמוכה',          sev: 3 },
    low_discipline:    { ar: 'انضباط منخفض',        he: 'משמעת נמוכה',           sev: 2 },
    low_coachability:  { ar: 'صعوبة في تقبّل التوجيه', he: 'קושי בקבלת הכוונה',  sev: 2 },
    low_target:        { ar: 'دافع منخفض نحو الهدف', he: 'דחף נמוך ליעד',        sev: 3 },
    inconsistency:     { ar: 'تناقض في الإجابات',   he: 'חוסר עקביות בתשובות',   sev: 3 }
  };

  function flags(answers, d, cons) {
    var counts = {};
    answers.forEach(function (a) {
      var f = a.f || (Q.get(a.qid) && Q.get(a.qid).a[a.opt].f);
      if (f) counts[f] = (counts[f] || 0) + 1;
    });
    var out = [];
    Object.keys(counts).forEach(function (k) {
      if (FLAG_META[k]) out.push({ key: k, n: counts[k], sev: FLAG_META[k].sev, ar: FLAG_META[k].ar, he: FLAG_META[k].he });
    });
    var lowMap = { persistence: 'low_persistence', accountability: 'low_accountability', discipline: 'low_discipline', coachability: 'low_coachability', target: 'low_target' };
    Object.keys(lowMap).forEach(function (t) {
      if (d.traits[t] != null && d.traits[t] < 62) {
        var k = lowMap[t];
        out.push({ key: k, n: 1, sev: FLAG_META[k].sev, ar: FLAG_META[k].ar, he: FLAG_META[k].he, val: d.traits[t] });
      }
    });
    if (cons && cons.score != null && cons.score < 70) {
      out.push({ key: 'inconsistency', n: 1, sev: 3, ar: FLAG_META.inconsistency.ar, he: FLAG_META.inconsistency.he, val: cons.score });
    }
    // combined risk: study/plan + schedule conflict
    if (counts.schedule && (counts.study || counts.study_plan)) {
      out.push({ key: 'schedule', n: counts.schedule, sev: 3, ar: 'خطر جدولة مرتفع (دراسة + ساعات)', he: 'סיכון תזמון גבוה (לימודים + שעות)' });
    }
    var seen = {};
    return out.filter(function (f) { if (seen[f.key + f.ar]) return false; seen[f.key + f.ar] = 1; return true; })
              .sort(function (a, b) { return b.sev - a.sev; });
  }

  function signals(d) {
    return TK.filter(function (t) { return d.traits[t] != null && d.traits[t] >= 84; })
      .sort(function (a, b) { return d.traits[b] - d.traits[a]; })
      .map(function (t) { return { key: t, val: d.traits[t], ar: Q.TRAITS[t].ar, he: Q.TRAITS[t].he, icon: Q.TRAITS[t].icon }; });
  }

  /* ---------- similar employees ---------- */
  function similarEmployees(d, employees, w, limit) {
    return employees.filter(function (e) { return e.assessment; })
      .map(function (e) {
        return { emp: e, sim: similarity(d.traits, dna(e.assessment.answers).traits, w) };
      })
      .sort(function (a, b) { return b.sim - a.sim; })
      .slice(0, limit || 5);
  }

  /* ---------- per-question predictive power ---------- */
  function questionPower(employees) {
    var acc = {};
    employees.forEach(function (e) {
      if (!e.assessment) return;
      e.assessment.answers.forEach(function (a) {
        var q = Q.get(a.qid); if (!q) return;
        acc[a.qid] = acc[a.qid] || { qid: a.qid, trait: q.trait, lvl: q.lvl, strong: [], medium: [], low: [] };
        acc[a.qid][e.group].push(a.s);
      });
    });
    return Object.keys(acc).map(function (qid) {
      var r = acc[qid];
      var s = r.strong.length ? avg(r.strong) : null;
      var l = r.low.length ? avg(r.low) : null;
      var sep = (s != null && l != null) ? s - l : null;
      return {
        qid: qid, trait: r.trait, lvl: r.lvl,
        strong: s == null ? null : round(s),
        medium: r.medium.length ? round(avg(r.medium)) : null,
        low: l == null ? null : round(l),
        sep: sep == null ? null : round(sep),
        n: r.strong.length + r.medium.length + r.low.length,
        verdict: sep == null ? 'unknown' : sep >= 18 ? 'strong' : sep >= 8 ? 'ok' : 'weak'
      };
    }).sort(function (a, b) { return (b.sep == null ? -99 : b.sep) - (a.sep == null ? -99 : a.sep); });
  }

  /* ---------- prediction accuracy from follow-ups ---------- */
  function predictions(state) {
    var rows = [];
    state.candidates.forEach(function (c) {
      if (!c.followups || !c.followups.length) return;
      var d = dna(candAnswers(c));
      var m = match(d, state).match;
      var last = c.followups[c.followups.length - 1];
      var ok = (m >= state.settings.thresholds.high && last.targetPct >= 95) ||
               (m < state.settings.thresholds.mid && last.targetPct < 95) ||
               (m >= state.settings.thresholds.mid && m < state.settings.thresholds.high && last.targetPct >= 80 && last.targetPct < 120);
      rows.push({ name: c.name, match: m, day: last.day, actual: last.targetPct, ok: ok });
    });
    var acc = rows.length ? round(100 * rows.filter(function (r) { return r.ok; }).length / rows.length) : null;
    return { rows: rows, accuracy: acc };
  }

  /* ---------- manager summary (rule-based generator) ---------- */
  function summary(d, m, fl, cons, lang) {
    var he = lang === 'he';
    var sorted = TK.filter(function (t) { return d.traits[t] != null; })
                   .sort(function (a, b) { return d.traits[b] - d.traits[a]; });
    var top = sorted.slice(0, 3), weak = sorted.slice(-2).reverse();
    var nm = function (t) { return he ? Q.TRAITS[t].he : Q.TRAITS[t].ar; };
    var band = m.band;
    var p = [];
    if (he) {
      p.push('התאמה כוללת ' + m.match + '% (' + (band === 'high' ? 'התאמה גבוהה' : band === 'mid' ? 'התאמה בינונית' : 'התאמה נמוכה') + ')' +
             (m.simStrong != null ? ', דמיון לעובדים החזקים ' + m.simStrong + '%.' : '.'));
      p.push('נקודות חוזק בולטות: ' + top.map(function (t) { return nm(t) + ' (' + d.traits[t] + ')'; }).join(', ') + '.');
      p.push('נדרשת בדיקה נוספת ב: ' + weak.map(function (t) { return nm(t) + ' (' + d.traits[t] + ')'; }).join(', ') + '.');
      if (cons && cons.score != null) p.push('עקביות תשובות: ' + cons.score + '%' + (cons.score < 70 ? ' — קיימים פערים בין שאלות מקבילות, מומלץ לברר בראיון.' : '.'));
      if (fl.length) p.push('דגלים לתשומת לב: ' + fl.slice(0, 4).map(function (f) { return f.he; }).join(', ') + '.');
      p.push(band === 'high' ? 'המלצה: להעביר לראיון מובנה.' : band === 'mid' ? 'המלצה: ראיון עם דגש על הנקודות החלשות שצוינו.' : 'המלצה: התאמה נמוכה לפרופיל המצליח — החלטה ידנית של המנהל.');
    } else {
      p.push('نسبة التطابق الكلية ' + m.match + '% (' + (band === 'high' ? 'تطابق مرتفع' : band === 'mid' ? 'تطابق متوسط' : 'تطابق منخفض') + ')' +
             (m.simStrong != null ? '، والتشابه مع الموظفين الأقوياء ' + m.simStrong + '%.' : '.'));
      p.push('أبرز نقاط القوة: ' + top.map(function (t) { return nm(t) + ' (' + d.traits[t] + ')'; }).join('، ') + '.');
      p.push('يحتاج تحقق إضافي في: ' + weak.map(function (t) { return nm(t) + ' (' + d.traits[t] + ')'; }).join('، ') + '.');
      if (cons && cons.score != null) p.push('اتساق الإجابات: ' + cons.score + '%' + (cons.score < 70 ? ' — يوجد تفاوت بين أسئلة متطابقة، يُنصح بالتوضيح في المقابلة.' : '.'));
      if (fl.length) p.push('إشارات تحتاج انتباه: ' + fl.slice(0, 4).map(function (f) { return f.ar; }).join('، ') + '.');
      p.push(band === 'high' ? 'التوصية: الانتقال إلى مقابلة منظمة.' : band === 'mid' ? 'التوصية: مقابلة مع التركيز على النقاط الضعيفة أعلاه.' : 'التوصية: تطابق منخفض مع البروفايل الناجح — القرار النهائي للمدير.');
    }
    return p;
  }

  /* ---------- interview questions generator ---------- */
  var IQ = {
    study:      { ar: 'ذكرت أن لديك دراسة حالياً — كيف ستضمن عدم تأثيرها على ساعات العمل والأهداف الشهرية؟', he: 'ציינת שאתה לומד — איך תוודא שזה לא ישפיע על שעות העבודה והיעדים?' },
    study_plan: { ar: 'ذكرت أنك تفكّر بالدراسة لاحقاً — ما هو الإطار الزمني بالضبط وكيف سيتعامل معه جدولك؟', he: 'ציינת שאתה שוקל לימודים — מה לוח הזמנים המדויק וכיצד הוא משתלב במשרה?' },
    schedule:   { ar: 'أعطني مثالاً عملياً على أسبوع نهاية شهر — كيف ستنظّم وقتك إذا احتجنا ساعات إضافية؟', he: 'תן דוגמה מעשית לשבוע סוף חודש — איך תארגן את הזמן אם נדרשות שעות נוספות?' },
    second_job: { ar: 'ما حجم الوقت الذي يأخذه عملك/مشروعك الآخر أسبوعياً، وماذا سيحدث إذا تعارض مع العمل؟', he: 'כמה זמן לוקחת העבודה/הפרויקט הנוסף, ומה יקרה בהתנגשות?' },
    commute:    { ar: 'كيف ستضمن الوصول في الوقت كل يوم مع وضع المواصلات الحالي؟', he: 'איך תבטיח הגעה בזמן מדי יום עם מצב ההסעות הנוכחי?' },
    stability:  { ar: 'ما سبب تغييرك للعمل في المرات السابقة، وما الذي سيجعلك تبقى هنا؟', he: 'מה הסיבה למעברים הקודמים ומה יגרום לך להישאר כאן?' },
    low_persistence:    { ar: 'أعطني مثالاً على عميل رفضك أكثر من مرة واستمررت معه — ماذا فعلت بالضبط؟', he: 'תן דוגמה ללקוח שסירב יותר מפעם והמשכת איתו — מה עשית בדיוק?' },
    low_accountability: { ar: 'احكِ لي عن شهر لم تحقق فيه الهدف — ما الذي كان بيدك أنت وتغيّر بعده؟', he: 'ספר על חודש שלא עמדת ביעד — מה היה בשליטתך ומה שינית?' },
    low_discipline:     { ar: 'صف لي يوم عملك من 9 صباحاً حتى نهاية الدوام بالتفصيل وبالأرقام.', he: 'תאר את יום העבודה שלך משעה 9 עד סופו, בפירוט ובמספרים.' },
    low_coachability:   { ar: 'ما آخر ملاحظة تلقيتها من مدير ولم تعجبك؟ ماذا فعلت بها؟', he: 'מה ההערה האחרונה ממנהל שלא אהבת, ומה עשית איתה?' },
    low_target:         { ar: 'ما الرقم الذي تريد الوصول إليه شهرياً، ولماذا هذا الرقم تحديداً؟', he: 'לאיזה מספר חודשי אתה מכוון, ולמה דווקא הוא?' },
    inconsistency:      { ar: 'لاحظنا إجابتين مختلفتين حول نفس الموضوع — دعنا نمر عليهما معاً للتوضيح.', he: 'זיהינו שתי תשובות שונות באותו נושא — נעבור עליהן יחד להבהרה.' }
  };

  function interviewQuestions(fl, d, lang) {
    var he = lang === 'he', out = [], seen = {};
    fl.forEach(function (f) {
      if (!IQ[f.key] || seen[f.key]) return;
      seen[f.key] = 1;
      out.push(he ? IQ[f.key].he : IQ[f.key].ar);
    });
    var sorted = TK.filter(function (t) { return d.traits[t] != null; }).sort(function (a, b) { return d.traits[a] - d.traits[b]; });
    var lowest = sorted[0];
    var generic = {
      target: { ar: 'كيف تتصرف عندما تكون في منتصف الشهر بعيداً عن الهدف؟ اعطني خطوات محددة.', he: 'איך אתה פועל כשבאמצע החודש אתה רחוק מהיעד? צעדים ספציפיים.' },
      persistence: { ar: 'كم متابعة تعمل عادةً لعميل صامت؟ وكيف؟', he: 'כמה מעקבים אתה עושה ללקוח שותק? ואיך?' },
      resilience: { ar: 'احكِ عن أسوأ يوم رفض مررت به وماذا فعلت بعده مباشرة.', he: 'ספר על יום הדחיות הגרוע ביותר ומה עשית מיד אחריו.' },
      discipline: { ar: 'ما هو نظامك اليومي لتتبع العملاء؟ اعرض لي مثالاً.', he: 'מה השיטה היומית שלך למעקב אחר לקוחות? הדגם.' },
      learning: { ar: 'ما آخر شيء غيّرته في أسلوب بيعك ولماذا؟', he: 'מה הדבר האחרון ששינית בשיטת המכירה שלך ולמה?' },
      coachability: { ar: 'كيف تفضّل أن يوجّهك مديرك؟', he: 'איך היית רוצה שמנהל יאמן אותך?' },
      accountability: { ar: 'ما نسبة النتيجة التي تعتبرها مسؤوليتك الشخصية؟ ولماذا؟', he: 'איזה אחוז מהתוצאה הוא באחריותך האישית? למה?' },
      commitment: { ar: 'أين ترى نفسك بعد سنتين في هذا الدور؟', he: 'איפה אתה רואה את עצמך בעוד שנתיים בתפקיד?' }
    };
    if (lowest && generic[lowest]) out.push(he ? generic[lowest].he : generic[lowest].ar);
    out.push(he ? 'תן דוגמה לתקופה שבה לא היו תוצאות טובות והמשכת בכל זאת.' : 'أعطني مثالاً على فترة لم تحقق فيها نتائج جيدة واستمررت رغم ذلك.');
    return out.slice(0, 6);
  }

  /* ---------- benchmark disagreement (manager label vs data) ---------- */
  function benchmarkCheck(e) {
    var dataGroup = e.targetPct >= 105 && e.attendance >= 92 ? 'strong'
                  : e.targetPct >= 85 ? 'medium' : 'low';
    return { dataGroup: dataGroup, mismatch: dataGroup !== e.group };
  }

  root.SDNA.Engine = {
    dna: dna, character: character, groupStats: groupStats, learnWeights: learnWeights,
    activeWeights: activeWeights, similarity: similarity, match: match, consistency: consistency,
    flags: flags, signals: signals, similarEmployees: similarEmployees, questionPower: questionPower,
    summary: summary, interviewQuestions: interviewQuestions, benchmarkCheck: benchmarkCheck,
    predictions: predictions, candAnswers: candAnswers, mergeAnswers: mergeAnswers, TK: TK
  };
})(window);
