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
        acc[a.qid] = acc[a.qid] || { qid: a.qid, trait: q.trait, zone: q.zone, strong: [], medium: [], low: [] };
        acc[a.qid][e.group].push(a.s);
      });
    });
    return Object.keys(acc).map(function (qid) {
      var r = acc[qid];
      var s = r.strong.length ? avg(r.strong) : null;
      var l = r.low.length ? avg(r.low) : null;
      var sep = (s != null && l != null) ? s - l : null;
      return {
        qid: qid, trait: r.trait, zone: r.zone,
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

  /* ---------- candidate stage status (never a hard FAIL) ---------- */
  function status(m, state) {
    var th = state.settings.thresholds;
    if (m.match >= th.high) return { key: 'continue', color: '#10b981', dot: '🟢' };
    if (m.match >= (th.stage1 || th.mid)) return { key: 'review', color: '#f59e0b', dot: '🟡' };
    return { key: 'low', color: '#ef4444', dot: '🔴' };
  }

  /* ---------- where the candidate differs most from the strong group ---------- */
  function mainDifferences(d, employees, limit) {
    var gs = groupStats(employees);
    return TK.map(function (k) {
      if (d.traits[k] == null || gs.strong.traits[k] == null) return null;
      return { key: k, gap: gs.strong.traits[k] - d.traits[k], val: d.traits[k], strong: gs.strong.traits[k] };
    }).filter(function (x) { return x && x.gap > 6; })
      .sort(function (a, b) { return b.gap - a.gap; })
      .slice(0, limit || 3);
  }

  /* ============================================================
     BRIDGE — employees (12 traits) -> candidate model (6 dims)
     so a 25-question candidate can be compared with real staff
     ============================================================ */
  var NC = root.SDNA.NC;
  function to6(traits) {
    function avg2(a, b) {
      var v = [traits[a], traits[b]].filter(function (x) { return x != null; });
      return v.length ? round(v.reduce(function (s, x) { return s + x; }, 0) / v.length) : null;
    }
    return {
      target:     avg2('target', 'motivation'),
      persist:    avg2('persistence', 'resilience'),
      discipline: traits.discipline != null ? traits.discipline : null,
      commit:     traits.commitment != null ? traits.commitment : null,
      learn:      avg2('learning', 'coachability'),
      account:    traits.accountability != null ? traits.accountability : null
    };
  }
  function employee6(e) { return e.assessment ? to6(dna(e.assessment.answers).traits) : null; }

  function group6(employees) {
    var res = {};
    ['strong', 'medium', 'low'].forEach(function (g) {
      var list = employees.filter(function (e) { return e.group === g && e.assessment; }).map(employee6);
      var t = {};
      NC.DIM_KEYS.forEach(function (k) {
        var vals = list.map(function (v) { return v[k]; }).filter(function (v) { return v != null; });
        t[k] = vals.length ? round(avg(vals)) : null;
      });
      res[g] = { dims: t, n: list.length };
    });
    return res;
  }

  function similarity6(a, b, w) {
    var num = 0, den = 0;
    NC.DIM_KEYS.forEach(function (k) {
      if (a[k] == null || b[k] == null) return;
      var wk = (w && w[k]) || 1;
      num += wk * Math.abs(a[k] - b[k]); den += wk;
    });
    if (!den) return null;
    return round(clamp(100 - (num / den) * 1.35, 0, 100));
  }

  /* candidate (25-question model) vs the three employee groups */
  function candidateReport(c, state) {
    if (!c.nc) return null;
    var sc = NC.score(c.nc.answers, state);
    var g6 = group6(state.employees);
    var w = state.settings.ncWeights || NC.defaultWeights();
    var sims = {
      strong: g6.strong.n ? similarity6(sc.dims, g6.strong.dims, w) : null,
      medium: g6.medium.n ? similarity6(sc.dims, g6.medium.dims, w) : null,
      low:    g6.low.n ? similarity6(sc.dims, g6.low.dims, w) : null
    };
    var th = state.settings.thresholds;
    var band = sc.match >= th.high ? 'high' : sc.match >= th.mid ? 'mid' : 'low';
    return { score: sc, sims: sims, groups: g6, band: band, weights: w };
  }

  /* calibrate the 6 weights from what actually separates strong from low */
  function calibrate6(employees) {
    var g6 = group6(employees), seps = {}, tot = 0;
    NC.DIM_KEYS.forEach(function (k) {
      var s = g6.strong.dims[k], l = g6.low.dims[k];
      var sep = (s != null && l != null) ? Math.max(0, s - l) : 0;
      seps[k] = sep + 1.5;
      tot += seps[k];
    });
    var w = {}, budget = 100 - NC.CONSISTENCY_W;
    NC.DIM_KEYS.forEach(function (k) { w[k] = Math.round(budget * seps[k] / tot * 10) / 10; });
    return { weights: w, separation: seps, groups: g6, enough: g6.strong.n >= 3 && g6.low.n >= 2 };
  }

  /* ---------- focus benchmarks (kept out of the match on purpose) ---------- */
  function focusStats(employees) {
    var res = {};
    ['strong', 'medium', 'low'].forEach(function (g) {
      var list = employees.filter(function (e) { return e.group === g && e.focus; });
      res[g] = {
        n: list.length,
        focus: list.length ? round(avg(list.map(function (e) { return e.focus.focus; }))) : null,
        sub: ['visual', 'speed', 'accuracy', 'recall'].reduce(function (acc, k) {
          acc[k] = list.length ? round(avg(list.map(function (e) { return e.focus.sub[k]; }))) : null;
          return acc;
        }, {})
      };
    });
    var all = employees.filter(function (e) { return e.focus; });
    res.all = { n: all.length, focus: all.length ? round(avg(all.map(function (e) { return e.focus.focus; }))) : null };
    res.gap = (res.strong.focus != null && res.low.focus != null) ? res.strong.focus - res.low.focus : null;
    res.reliable = res.strong.n >= 5 && res.low.n >= 5 && res.gap != null && Math.abs(res.gap) >= 8;
    return res;
  }

  /* ---------- manager summary for the 25-question model ---------- */
  function ncSummary(rep, lang) {
    var he = lang === 'he', sc = rep.score, D = NC.DIMS;
    var nm = function (k) { return he ? D[k].he : D[k].ar; };
    var sorted = NC.DIM_KEYS.filter(function (k) { return sc.dims[k] != null; })
      .sort(function (a, b) { return sc.dims[b] - sc.dims[a]; });
    var top = sorted.slice(0, 3), weak = sorted.slice(-2).reverse();
    var p = [];
    if (he) {
      p.push('התאמה כוללת ' + sc.match + '%' + (rep.sims.strong != null ? ', דמיון לעובדים החזקים ' + rep.sims.strong + '%.' : '.'));
      p.push('חזק במיוחד ב: ' + top.map(function (k) { return nm(k) + ' (' + sc.dims[k] + ')'; }).join(', ') + '.');
      p.push('נדרשת בדיקה ב: ' + weak.map(function (k) { return nm(k) + ' (' + sc.dims[k] + ')'; }).join(', ') + '.');
      if (sc.consistency != null) p.push('מדד עקביות: ' + sc.consistency + '%' +
        (sc.consistency < 70 ? ' — שאלות ההצלבה בשלב 5 לא תואמות את הפרופיל שנבנה בשלבים 1–4, כדאי לברר בראיון.' : '.'));
      if (sc.flags.length) p.push('לתשומת לב: ' + sc.flags.map(function (f) { return f.he; }).join(', ') + '.');
    } else {
      p.push('نسبة التطابق الكلية ' + sc.match + '%' + (rep.sims.strong != null ? '، والتشابه مع الموظفين الأقوياء ' + rep.sims.strong + '%.' : '.'));
      p.push('الأقوى لديه: ' + top.map(function (k) { return nm(k) + ' (' + sc.dims[k] + ')'; }).join('، ') + '.');
      p.push('يحتاج تحقّقاً في: ' + weak.map(function (k) { return nm(k) + ' (' + sc.dims[k] + ')'; }).join('، ') + '.');
      if (sc.consistency != null) p.push('مؤشر الاتساق: ' + sc.consistency + '%' +
        (sc.consistency < 70 ? ' — أسئلة التقاطع في المستوى الخامس لا تتطابق مع البروفايل الذي بُني في المستويات 1–4، يُنصح بالتوضيح في المقابلة.' : '.'));
      if (sc.flags.length) p.push('نقاط تحتاج انتباهاً: ' + sc.flags.map(function (f) { return f.ar; }).join('، ') + '.');
    }
    return p;
  }

  var NC_IQ = {
    target:     { ar: 'ما الرقم الشهري الذي تريد الوصول إليه، ولماذا هذا الرقم تحديداً؟', he: 'לאיזה מספר חודשי אתה מכוון ולמה דווקא אליו?' },
    persist:    { ar: 'أعطني مثالاً على عميل رفضك أكثر من مرة واستمررت معه — ماذا فعلت بالضبط؟', he: 'תן דוגמה ללקוח שסירב יותר מפעם והמשכת איתו — מה עשית בדיוק?' },
    discipline: { ar: 'صف لي يوم عملك من أوله لآخره بالأرقام: كم مكالمة، كم متابعة، ومتى؟', he: 'תאר את יום העבודה שלך במספרים: כמה שיחות, כמה מעקבים, ומתי?' },
    commit:     { ar: 'ما هي التزاماتك الثابتة خلال الأشهر القادمة وكيف ستنظّمها مع الدوام؟', he: 'מהן ההתחייבויות הקבועות שלך בחודשים הקרובים ואיך הן משתלבות במשרה?' },
    learn:      { ar: 'ما آخر ملاحظة تلقيتها ولم تعجبك؟ وماذا فعلت بها؟', he: 'מה ההערה האחרונה שקיבלת ולא אהבת, ומה עשית איתה?' },
    account:    { ar: 'احكِ لي عن شهر لم تحقق فيه النتيجة — ما الذي كان بيدك أنت؟', he: 'ספר על חודש שלא עמדת בתוצאה — מה היה בשליטתך?' }
  };
  var NC_FLAG_IQ = {
    study:      { ar: 'ذكرت أن لديك دراسة — ما هي الساعات بالضبط وكيف ستنظّمها مع الدوام؟', he: 'ציינת לימודים — מהן השעות ואיך הן משתלבות?' },
    second_job: { ar: 'ما حجم الوقت الذي يأخذه عملك الآخر، وماذا سيحدث عند التعارض؟', he: 'כמה זמן לוקחת העבודה הנוספת ומה יקרה בהתנגשות?' },
    schedule:   { ar: 'كيف ستضمن الالتزام بساعات الدوام الكاملة في الأشهر الأولى؟', he: 'איך תבטיח עמידה בשעות המלאות בחודשים הראשונים?' },
    retention:  { ar: 'ما الذي يجعلك تستمر في وظيفة صعبة بدل البحث عن بديل؟', he: 'מה יגרום לך להישאר בתפקיד קשה במקום לחפש חלופה?' },
    attendance: { ar: 'كيف تتعامل مع يوم تشعر فيه بتعب لكن لديك مواعيد عمل؟', he: 'איך אתה מתמודד עם יום שאתה עייף אבל יש פגישות?' },
    conditional:{ ar: 'أعطني مثالاً على نتيجة حققتها في ظروف غير مناسبة إطلاقاً.', he: 'תן דוגמה לתוצאה שהשגת בתנאים ממש לא נוחים.' },
    commitment_other: { ar: 'ما هو الالتزام الثابت لديك وهل يمكن تعديله؟', he: 'מהי ההתחייבות הקבועה והאם ניתן לשנותה?' }
  };

  function ncInterview(rep, lang) {
    var he = lang === 'he', out = [], seen = {};
    rep.score.flags.forEach(function (f) {
      if (NC_FLAG_IQ[f.key] && !seen[f.key]) { seen[f.key] = 1; out.push(he ? NC_FLAG_IQ[f.key].he : NC_FLAG_IQ[f.key].ar); }
    });
    var weakest = NC.DIM_KEYS.filter(function (k) { return rep.score.dims[k] != null; })
      .sort(function (a, b) { return rep.score.dims[a] - rep.score.dims[b]; }).slice(0, 2);
    weakest.forEach(function (k) { out.push(he ? NC_IQ[k].he : NC_IQ[k].ar); });
    if (rep.score.consistency != null && rep.score.consistency < 75) {
      out.push(he ? 'זיהינו פערים בין תשובות דומות — נעבור עליהן יחד להבהרה.'
                  : 'لاحظنا تبايناً بين إجابات متقاربة — دعنا نمر عليها معاً للتوضيح.');
    }
    return out.slice(0, 6);
  }

  /* ============================================================
     EMPLOYEE QUALITY ENGINE
     1. SALES DNA        — how the person behaves
     2. ACTUAL PERFORMANCE — what they really deliver
     3. CANDIDATE MATCH  — similarity to people who actually deliver
     These three are computed and displayed separately, never mixed.
     ============================================================ */
  function stdev(a) {
    if (a.length < 2) return 0;
    var m = avg(a);
    return Math.sqrt(avg(a.map(function (x) { return (x - m) * (x - m); })));
  }

  /* ---- 2. ACTUAL PERFORMANCE from the monthly history ---- */
  function perfStats(e) {
    var h = (e.history || []).filter(function (x) { return typeof x.pct === 'number'; });
    if (!h.length) {
      return { n: 0, avg: e.targetPct || null, above: null, below: null,
               consistency: null, sd: null, best: null, worst: null, trend: null, history: [] };
    }
    var v = h.map(function (x) { return x.pct; });
    var m = avg(v), sd = stdev(v);
    var cv = m ? sd / m : 0;
    var half = Math.floor(v.length / 2);
    return {
      n: v.length, avg: round(m), sd: round(sd * 10) / 10,
      above: v.filter(function (x) { return x >= 100; }).length,
      below: v.filter(function (x) { return x < 100; }).length,
      best: Math.max.apply(null, v), worst: Math.min.apply(null, v),
      consistency: round(clamp(100 - cv * 220, 0, 100)),
      trend: round(avg(v.slice(half)) - avg(v.slice(0, half))),
      history: h
    };
  }

  /* ---- data-based classification (independent of the manager label) ---- */
  function dataClass(e) {
    var ps = perfStats(e);
    var target = ps.avg != null ? ps.avg : (e.targetPct || 0);
    var parts = {
      target:      clamp((target - 60) / 70 * 100, 0, 100),          // 60% → 0 · 130% → 100
      consistency: ps.consistency != null ? ps.consistency : 60,
      attendance:  clamp((e.attendance - 70) / 30 * 100, 0, 100),
      manager:     clamp((e.managerScore || 0) * 10, 0, 100),
      late:        clamp(100 - (e.lateDays || 0) * 6, 0, 100)
    };
    var score = 0.42 * parts.target + 0.18 * parts.consistency + 0.16 * parts.attendance +
                0.14 * parts.manager + 0.10 * parts.late;
    var g = score >= 72 ? 'strong' : score >= 52 ? 'medium' : 'low';
    return { group: g, score: round(score), parts: parts, perf: ps };
  }

  function classCheck(e) {
    var dc = dataClass(e);
    var rank = { strong: 3, medium: 2, low: 1 };
    return {
      manager: e.group, data: dc.group, score: dc.score, perf: dc.perf,
      conflict: dc.group !== e.group,
      direction: rank[e.group] > rank[dc.group] ? 'manager_higher' :
                 rank[e.group] < rank[dc.group] ? 'data_higher' : 'same'
    };
  }

  /* ---- 4. COMMON DNA — what the strong employees share ---- */
  function commonDNA(employees) {
    var gs = groupStats(employees);
    var rows = TK.map(function (k) { return { key: k, strong: gs.strong.traits[k] }; })
      .filter(function (r) { return r.strong != null; })
      .sort(function (a, b) { return b.strong - a.strong; });
    return { rows: rows, n: gs.strong.n, groups: gs };
  }

  /* ---- 5. SUCCESS DIFFERENTIATORS — present in strong, absent in weak ---- */
  function differentiators(employees) {
    var gs = groupStats(employees);
    var rows = TK.map(function (k) {
      var st = gs.strong.traits[k], md = gs.medium.traits[k], lo = gs.low.traits[k];
      var delta = (st != null && lo != null) ? st - lo : null;
      var rating = delta == null ? 'unknown'
        : delta >= 25 ? 'very_high' : delta >= 15 ? 'high' : delta >= 8 ? 'medium' : 'low';
      return { key: k, strong: st, medium: md, low: lo, delta: delta == null ? null : round(delta), rating: rating };
    }).sort(function (a, b) { return (b.delta == null ? -99 : b.delta) - (a.delta == null ? -99 : a.delta); });
    return { rows: rows, groups: gs, keys: rows.filter(function (r) { return r.rating === 'very_high' || r.rating === 'high'; }) };
  }

  /* ---- 6. QUESTION QUALITY for the 25-question model (staff answers) ---- */
  function optQualityPct(q, oi) {
    var sum = 0, max = 0;
    NC.DIM_KEYS.forEach(function (k) {
      var m = 0;
      q.a.forEach(function (o) { if (o.p[k] != null && o.p[k] > m) m = o.p[k]; });
      max += m; sum += q.a[oi].p[k] || 0;
    });
    return max ? 100 * sum / max : 50;
  }

  function ncQuestionQuality(employees) {
    var staff = employees.filter(function (e) { return e.nc22; });
    var acc = {};
    staff.forEach(function (e) {
      e.nc22.answers.forEach(function (a) {
        var q = NC.get(a.qid); if (!q || q.extra) return;
        acc[a.qid] = acc[a.qid] || { qid: a.qid, lvl: q.lvl, groups: { strong: [], medium: [], low: [] }, picks: { strong: {}, medium: {}, low: {} } };
        acc[a.qid].groups[e.group].push(optQualityPct(q, a.opt));
        var pk = acc[a.qid].picks[e.group];
        pk[a.opt] = (pk[a.opt] || 0) + 1;
      });
    });
    var rows = NC.all.filter(function (q) { return !q.extra; }).map(function (q) {
      var r = acc[q.id];
      if (!r) {
        return { qid: q.id, lvl: q.lvl, q: q.q, staffOnly: q.aud === 'cand', n: 0,
                 strong: null, medium: null, low: null, sep: null, rating: 'nodata',
                 topShare: null, best: bestOption(q) };
      }
      var st = r.groups.strong.length ? avg(r.groups.strong) : null;
      var md = r.groups.medium.length ? avg(r.groups.medium) : null;
      var lo = r.groups.low.length ? avg(r.groups.low) : null;
      var sep = (st != null && lo != null) ? st - lo : null;
      var bi = bestOption(q);
      var share = {};
      ['strong', 'medium', 'low'].forEach(function (g) {
        var tot = Object.keys(r.picks[g]).reduce(function (n, k) { return n + r.picks[g][k]; }, 0);
        share[g] = tot ? round(100 * (r.picks[g][bi] || 0) / tot) : null;
      });
      return {
        qid: q.id, lvl: q.lvl, q: q.q, staffOnly: q.aud === 'cand',
        n: r.groups.strong.length + r.groups.medium.length + r.groups.low.length,
        strong: st == null ? null : round(st), medium: md == null ? null : round(md), low: lo == null ? null : round(lo),
        sep: sep == null ? null : round(sep),
        rating: sep == null ? 'nodata' : sep >= 20 ? 'strong' : sep >= 10 ? 'medium' : 'weak',
        topShare: share, best: bi
      };
    });
    var counts = { strong: 0, medium: 0, weak: 0, nodata: 0 };
    rows.forEach(function (r) { counts[r.rating === 'nodata' ? 'nodata' : r.rating]++; });
    return { rows: rows, counts: counts, staff: staff.length };

    function bestOption(q) {
      var bi = 0, bv = -1;
      q.a.forEach(function (o, i) { var v = optQualityPct(q, i); if (v > bv) { bv = v; bi = i; } });
      return bi;
    }
  }

  /* ---- 7. MATCH CONFIDENCE — how much the model can be trusted yet ---- */
  function matchConfidence(state) {
    var emp = state.employees;
    var withData = emp.filter(function (e) { return e.assessment || e.nc22; });
    var nStrong = withData.filter(function (e) { return e.group === 'strong'; }).length;
    var nLow = withData.filter(function (e) { return e.group === 'low'; }).length;
    var nHist = emp.filter(function (e) { return (e.history || []).length >= 6; }).length;
    var diff = differentiators(emp);
    var sepOK = diff.keys.length >= 2;
    var reasons = [], level;
    if (nStrong >= 10 && nLow >= 5 && sepOK && nHist >= 10) level = 'high';
    else if (nStrong >= 5 && nLow >= 3 && sepOK) level = 'medium';
    else level = 'low';
    reasons.push({ k: 'strong_n', v: nStrong, ok: nStrong >= 5 });
    reasons.push({ k: 'low_n', v: nLow, ok: nLow >= 3 });
    reasons.push({ k: 'history_n', v: nHist, ok: nHist >= 10 });
    reasons.push({ k: 'separation', v: diff.keys.length, ok: sepOK });
    return { level: level, reasons: reasons, nStrong: nStrong, nLow: nLow, nHist: nHist, differentiators: diff.keys };
  }

  /* ---- 8. where the candidate matches / differs from the strong group ---- */
  function commonalities(rep) {
    var strong = rep.groups.strong.dims, dims = rep.score.dims;
    var rows = NC.DIM_KEYS.map(function (k) {
      if (dims[k] == null || strong[k] == null) return null;
      return { key: k, cand: dims[k], strong: strong[k],
               match: round(clamp(100 - Math.abs(dims[k] - strong[k]) * 1.6, 0, 100)),
               delta: round(dims[k] - strong[k]) };
    }).filter(Boolean);
    return {
      common: rows.slice().sort(function (a, b) { return b.match - a.match; }).slice(0, 3),
      differences: rows.filter(function (r) { return r.delta <= -8; })
                       .sort(function (a, b) { return a.delta - b.delta; })
    };
  }

  /* ---- 9. PREDICTION VALIDATION after 30 / 90 / 180 days ---- */
  function actualClass(pct) { return pct >= 105 ? 'strong' : pct >= 85 ? 'medium' : 'low'; }

  function predictionValidation(state) {
    var rows = [];
    state.candidates.forEach(function (c) {
      if (!c.nc || c.decision !== 'hired') return;
      var rep = candidateReport(c, state);
      var reviews = (c.reviews || []).filter(function (r) { return typeof r.targetPct === 'number'; });
      if (!rep || !reviews.length) {
        rows.push({ name: c.name, match: rep ? rep.score.match : null, band: rep ? rep.band : null,
                    day: null, actual: null, actualClass: null, verdict: 'pending' });
        return;
      }
      var last = reviews[reviews.length - 1];
      var ac = actualClass(last.targetPct);
      var ok = (rep.band === 'high' && ac === 'strong') ||
               (rep.band === 'mid' && ac !== 'low') ||
               (rep.band === 'low' && ac !== 'strong');
      rows.push({ name: c.name, match: rep.score.match, band: rep.band, day: last.day,
                  actual: last.targetPct, actualClass: ac, verdict: ok ? 'good' : 'missed',
                  focus: c.focus ? c.focus.focus : null });
    });
    var judged = rows.filter(function (r) { return r.verdict !== 'pending'; });
    return {
      rows: rows, judged: judged.length,
      accuracy: judged.length ? round(100 * judged.filter(function (r) { return r.verdict === 'good'; }).length / judged.length) : null
    };
  }

  /* ---- focus: is it worth any weight at all? ---- */
  function focusVerdict(state) {
    var fs = focusStats(state.employees);
    var enough = fs.strong.n >= 5 && fs.low.n >= 5;
    var gap = fs.gap;
    return {
      stats: fs, enough: enough, gap: gap,
      verdict: !enough ? 'insufficient' : Math.abs(gap) >= 8 ? 'signal' : 'no_signal',
      weight: state.settings.focusWeight || 0
    };
  }

  root.SDNA.Engine = {
    dna: dna, character: character, groupStats: groupStats, learnWeights: learnWeights,
    activeWeights: activeWeights, similarity: similarity, match: match, consistency: consistency,
    flags: flags, signals: signals, similarEmployees: similarEmployees, questionPower: questionPower,
    summary: summary, interviewQuestions: interviewQuestions, benchmarkCheck: benchmarkCheck,
    predictions: predictions, candAnswers: candAnswers, mergeAnswers: mergeAnswers, TK: TK,
    status: status, mainDifferences: mainDifferences,
    to6: to6, employee6: employee6, group6: group6, similarity6: similarity6,
    candidateReport: candidateReport, calibrate6: calibrate6, focusStats: focusStats,
    ncSummary: ncSummary, ncInterview: ncInterview,
    perfStats: perfStats, dataClass: dataClass, classCheck: classCheck,
    commonDNA: commonDNA, differentiators: differentiators, ncQuestionQuality: ncQuestionQuality,
    matchConfidence: matchConfidence, commonalities: commonalities,
    predictionValidation: predictionValidation, focusVerdict: focusVerdict, actualClass: actualClass
  };
})(window);
