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
  /* A question the clock ran out on is stored as unanswered, never as a wrong
     answer, so it contributes to neither the numerator nor the denominator of
     a trait. Completeness is reported separately — see timingStats(). */
  function isAnswered(a) {
    return !!a && !a.unanswered && a.opt !== null && a.opt !== undefined;
  }

  function dna(answers) {
    answers = answers || [];
    var scored = answers.filter(isAnswered);
    var buckets = {}, out = { traits: {}, overall: 0, count: scored.length, asked: answers.length };
    TK.forEach(function (t) { buckets[t] = []; });
    scored.forEach(function (a) {
      var q = Q.get(a.qid); if (!q) return;
      var opt = q.a[a.opt];
      var sc = typeof a.s === 'number' ? a.s : (opt ? opt.s : null);
      if (typeof sc !== 'number') return;
      buckets[q.trait].push(sc);
    });
    var present = [];
    TK.forEach(function (t) {
      if (buckets[t].length) { out.traits[t] = round(avg(buckets[t])); present.push(out.traits[t]); }
      else out.traits[t] = null;
    });
    out.overall = round(avg(present));
    return out;
  }

  /* ---------- timed assessment ----------
     Reads a stored assessment payload and reports how the subject behaved
     against the clock. Deliberately kept apart from DNA and MATCH: speed is
     an observation, not a verdict, and nothing here feeds a score until the
     company's own data shows it separates strong from weak performers. */
  function timingStats(payload) {
    if (!payload) return null;
    var ans = payload.answers || [];
    if (!ans.length) return null;

    var answered = ans.filter(isAnswered);
    var durations = answered.map(function (a) { return typeof a.ms === 'number' ? a.ms : null; })
                           .filter(function (v) { return typeof v === 'number' && v > 0; });

    var out = {
      asked: ans.length,
      answered: answered.length,
      unanswered: ans.length - answered.length,
      completeness: ans.length ? Math.round(100 * answered.length / ans.length) : null,
      avgMs: durations.length ? Math.round(durations.reduce(function (s, v) { return s + v; }, 0) / durations.length) : null,
      fastestMs: durations.length ? Math.min.apply(null, durations) : null,
      slowestMs: durations.length ? Math.max.apply(null, durations) : null,
      levels: [],
      timedOutLevels: 0,
      totalSeconds: null,
      timed: false
    };

    var lv = payload.levels || [];
    if (lv.length) {
      out.timed = true;
      var total = 0;
      out.levels = lv.map(function (b) {
        var secs = intOr(b.seconds, 0);
        total += secs;
        if (b.timedOut) out.timedOutLevels++;
        return {
          key: b.key || '', n: intOr(b.n, 0), code: b.code || '',
          answered: intOr(b.answered, 0), total: intOr(b.total, 0),
          seconds: secs, limit: intOr(b.limit, 0), timedOut: !!b.timedOut
        };
      });
      out.totalSeconds = total;
    }
    return out;
  }
  function intOr(v, d) { var n = parseInt(v, 10); return isNaN(n) ? d : n; }

  /* how much of the picture we actually have — reported next to the score,
     never folded into it */
  function completenessBand(pct) {
    if (pct == null) return 'unknown';
    if (pct >= 95) return 'high';
    if (pct >= 80) return 'medium';
    return 'low';
  }

  function mmss(secs) {
    if (secs == null) return '—';
    var m = Math.floor(secs / 60), s = secs % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
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
    { key: 'HUNTER',  need: ['target', 'persistence'],       ar: 'الصيّاد',     en: 'The Hunter',     emoji: '🎯', desc_ar: 'يلاحق الهدف بلا توقف، أفضل نتائجه تحت ضغط الأرقام.', desc_en: 'Chases the target without pause, and does their best work under the pressure of numbers.' },
    { key: 'CLOSER',  need: ['target', 'resilience'],        ar: 'المُغلِق',    en: 'The Closer',     emoji: '⚡', desc_ar: 'قوي في اللحظات الحاسمة، لا يتراجع أمام الاعتراضات.', desc_en: 'Strong in the decisive moments, does not retreat in the face of objections.' },
    { key: 'GRINDER', need: ['discipline', 'persistence'],   ar: 'المثابر',     en: 'The Grinder',    emoji: '⛏', desc_ar: 'يكسب بالتكرار والانضباط اليومي وليس بالحظ.', desc_en: 'Wins through repetition and daily discipline, not luck.' },
    { key: 'BUILDER', need: ['commitment', 'accountability'],ar: 'الباني',      en: 'The Builder',     emoji: '🏗', desc_ar: 'يبني علاقات ونتائج طويلة المدى ويتحمّل المسؤولية.', desc_en: 'Builds long-term relationships and results, and owns the outcome.' },
    { key: 'STUDENT', need: ['learning', 'coachability'],    ar: 'المتعلّم',    en: 'The Student',     emoji: '🧠', desc_ar: 'يتحسّن بسرعة، يستفيد من كل ملاحظة ويطوّر أسلوبه.', desc_en: 'Improves quickly, takes something from every piece of feedback and develops their approach.' }
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
    study:       { ar: 'دراسة حالية',              en: 'Currently studying',        sev: 2 },
    study_plan:  { ar: 'خطة دراسة قادمة',          en: 'Study planned ahead', sev: 2 },
    schedule:    { ar: 'تعارض في ساعات العمل',     en: 'Clash with working hours',  sev: 3 },
    second_job:  { ar: 'عمل/مشروع آخر',            en: 'Another job or project',           sev: 2 },
    commute:     { ar: 'صعوبة وصول/مواصلات',       en: 'Difficulty getting to work',            sev: 1 },
    stability:   { ar: 'تنقّل وظيفي متكرر',        en: 'Frequent job changes',  sev: 2 },
    low_persistence:   { ar: 'إصرار منخفض',         en: 'Low persistence',           sev: 3 },
    low_accountability:{ ar: 'مسؤولية منخفضة',      en: 'Low accountability',          sev: 3 },
    low_discipline:    { ar: 'انضباط منخفض',        en: 'Low discipline',           sev: 2 },
    low_coachability:  { ar: 'صعوبة في تقبّل التوجيه', en: 'Struggles to take direction',  sev: 2 },
    low_target:        { ar: 'دافع منخفض نحو الهدف', en: 'Low drive towards the target',        sev: 3 },
    inconsistency:     { ar: 'تناقض في الإجابات',   en: 'Inconsistent answers',   sev: 3 }
  };

  function flags(answers, d, cons) {
    var counts = {};
    answers.forEach(function (a) {
      var f = a.f || (Q.get(a.qid) && Q.get(a.qid).a[a.opt].f);
      if (f) counts[f] = (counts[f] || 0) + 1;
    });
    var out = [];
    Object.keys(counts).forEach(function (k) {
      if (FLAG_META[k]) out.push({ key: k, n: counts[k], sev: FLAG_META[k].sev, ar: FLAG_META[k].ar, en: FLAG_META[k].en });
    });
    var lowMap = { persistence: 'low_persistence', accountability: 'low_accountability', discipline: 'low_discipline', coachability: 'low_coachability', target: 'low_target' };
    Object.keys(lowMap).forEach(function (t) {
      if (d.traits[t] != null && d.traits[t] < 62) {
        var k = lowMap[t];
        out.push({ key: k, n: 1, sev: FLAG_META[k].sev, ar: FLAG_META[k].ar, en: FLAG_META[k].en, val: d.traits[t] });
      }
    });
    if (cons && cons.score != null && cons.score < 70) {
      out.push({ key: 'inconsistency', n: 1, sev: 3, ar: FLAG_META.inconsistency.ar, en: FLAG_META.inconsistency.en, val: cons.score });
    }
    // combined risk: study/plan + schedule conflict
    if (counts.schedule && (counts.study || counts.study_plan)) {
      out.push({ key: 'schedule', n: counts.schedule, sev: 3, ar: 'خطر جدولة مرتفع (دراسة + ساعات)', en: 'High scheduling risk (study + hours)' });
    }
    var seen = {};
    return out.filter(function (f) { if (seen[f.key + f.ar]) return false; seen[f.key + f.ar] = 1; return true; })
              .sort(function (a, b) { return b.sev - a.sev; });
  }

  function signals(d) {
    return TK.filter(function (t) { return d.traits[t] != null && d.traits[t] >= 84; })
      .sort(function (a, b) { return d.traits[b] - d.traits[a]; })
      .map(function (t) { return { key: t, val: d.traits[t], ar: Q.TRAITS[t].ar, en: Q.TRAITS[t].en, icon: Q.TRAITS[t].icon }; });
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
    var en = lang === 'en';
    var sorted = TK.filter(function (t) { return d.traits[t] != null; })
                   .sort(function (a, b) { return d.traits[b] - d.traits[a]; });
    var top = sorted.slice(0, 3), weak = sorted.slice(-2).reverse();
    var nm = function (t) { return en ? Q.TRAITS[t].en : Q.TRAITS[t].ar; };
    var band = m.band;
    var p = [];
    if (en) {
      p.push('Overall match ' + m.match + '% (' + (band === 'high' ? 'high match' : band === 'mid' ? 'medium match' : 'low match') + ')' +
             (m.simStrong != null ? ', similarity to the strong employees ' + m.simStrong + '%.' : '.'));
      p.push('Standout strengths: ' + top.map(function (t) { return nm(t) + ' (' + d.traits[t] + ')'; }).join(', ') + '.');
      p.push('Needs further checking in: ' + weak.map(function (t) { return nm(t) + ' (' + d.traits[t] + ')'; }).join(', ') + '.');
      if (cons && cons.score != null) p.push('Answer consistency: ' + cons.score + '%' + (cons.score < 70 ? ' — there are gaps between parallel questions, worth clarifying in the interview.' : '.'));
      if (fl.length) p.push('Flags to note: ' + fl.slice(0, 4).map(function (f) { return f.en; }).join(', ') + '.');
      p.push(band === 'high' ? 'Recommendation: move to a structured interview.' : band === 'mid' ? 'Recommendation: interview with a focus on the weak points noted above.' : 'Recommendation: low match against the successful profile — the manager decides.');
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
    study:      { ar: 'ذكرت أن لديك دراسة حالياً — كيف ستضمن عدم تأثيرها على ساعات العمل والأهداف الشهرية؟', en: 'You mentioned you are studying — how will you make sure it does not affect your working hours and monthly targets?' },
    study_plan: { ar: 'ذكرت أنك تفكّر بالدراسة لاحقاً — ما هو الإطار الزمني بالضبط وكيف سيتعامل معه جدولك؟', en: 'You mentioned you are thinking about studying later — what exactly is the timeframe, and how will your schedule take it?' },
    schedule:   { ar: 'أعطني مثالاً عملياً على أسبوع نهاية شهر — كيف ستنظّم وقتك إذا احتجنا ساعات إضافية؟', en: 'Give me a practical example of an end-of-month week — how will you organise your time if we need extra hours?' },
    second_job: { ar: 'ما حجم الوقت الذي يأخذه عملك/مشروعك الآخر أسبوعياً، وماذا سيحدث إذا تعارض مع العمل؟', en: 'How much time does your other job or project take each week, and what happens if it clashes with work?' },
    commute:    { ar: 'كيف ستضمن الوصول في الوقت كل يوم مع وضع المواصلات الحالي؟', en: 'How will you make sure you arrive on time every day, given your current transport?' },
    stability:  { ar: 'ما سبب تغييرك للعمل في المرات السابقة، وما الذي سيجعلك تبقى هنا؟', en: 'Why did you change jobs the previous times, and what would make you stay here?' },
    low_persistence:    { ar: 'أعطني مثالاً على عميل رفضك أكثر من مرة واستمررت معه — ماذا فعلت بالضبط؟', en: 'Give me an example of a customer who refused you more than once and you stayed with them — what exactly did you do?' },
    low_accountability: { ar: 'احكِ لي عن شهر لم تحقق فيه الهدف — ما الذي كان بيدك أنت وتغيّر بعده؟', en: 'Tell me about a month where you missed the target — what was in your hands, and what did you change afterwards?' },
    low_discipline:     { ar: 'صف لي يوم عملك من 9 صباحاً حتى نهاية الدوام بالتفصيل وبالأرقام.', en: 'Describe your working day from 9am to the end of the shift, in detail and in numbers.' },
    low_coachability:   { ar: 'ما آخر ملاحظة تلقيتها من مدير ولم تعجبك؟ ماذا فعلت بها؟', en: 'What is the last piece of feedback from a manager that you did not like? What did you do with it?' },
    low_target:         { ar: 'ما الرقم الذي تريد الوصول إليه شهرياً، ولماذا هذا الرقم تحديداً؟', en: 'What monthly number do you want to reach, and why that number in particular?' },
    inconsistency:      { ar: 'لاحظنا إجابتين مختلفتين حول نفس الموضوع — دعنا نمر عليهما معاً للتوضيح.', en: 'We noticed two different answers on the same subject — let us go through them together.' }
  };

  function interviewQuestions(fl, d, lang) {
    var en = lang === 'en', out = [], seen = {};
    fl.forEach(function (f) {
      if (!IQ[f.key] || seen[f.key]) return;
      seen[f.key] = 1;
      out.push(en ? IQ[f.key].en : IQ[f.key].ar);
    });
    var sorted = TK.filter(function (t) { return d.traits[t] != null; }).sort(function (a, b) { return d.traits[a] - d.traits[b]; });
    var lowest = sorted[0];
    var generic = {
      target: { ar: 'كيف تتصرف عندما تكون في منتصف الشهر بعيداً عن الهدف؟ اعطني خطوات محددة.', en: 'What do you do when you are halfway through the month and far from target? Give me specific steps.' },
      persistence: { ar: 'كم متابعة تعمل عادةً لعميل صامت؟ وكيف؟', en: 'How many follow-ups do you usually make with a customer who has gone quiet? And how?' },
      resilience: { ar: 'احكِ عن أسوأ يوم رفض مررت به وماذا فعلت بعده مباشرة.', en: 'Tell me about the worst day of rejections you have had, and what you did straight afterwards.' },
      discipline: { ar: 'ما هو نظامك اليومي لتتبع العملاء؟ اعرض لي مثالاً.', en: 'What is your daily system for tracking customers? Show me an example.' },
      learning: { ar: 'ما آخر شيء غيّرته في أسلوب بيعك ولماذا؟', en: 'What is the last thing you changed in the way you sell, and why?' },
      coachability: { ar: 'كيف تفضّل أن يوجّهك مديرك؟', en: 'How do you prefer your manager to coach you?' },
      accountability: { ar: 'ما نسبة النتيجة التي تعتبرها مسؤوليتك الشخصية؟ ولماذا؟', en: 'What share of the result do you treat as your personal responsibility? And why?' },
      commitment: { ar: 'أين ترى نفسك بعد سنتين في هذا الدور؟', en: 'Where do you see yourself in two years in this role?' }
    };
    if (lowest && generic[lowest]) out.push(en ? generic[lowest].en : generic[lowest].ar);
    out.push(en ? 'Give me an example of a stretch with poor results where you kept going anyway.' : 'أعطني مثالاً على فترة لم تحقق فيها نتائج جيدة واستمررت رغم ذلك.');
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
    var en = lang === 'en', sc = rep.score, D = NC.DIMS;
    var nm = function (k) { return en ? D[k].en : D[k].ar; };
    var sorted = NC.DIM_KEYS.filter(function (k) { return sc.dims[k] != null; })
      .sort(function (a, b) { return sc.dims[b] - sc.dims[a]; });
    var top = sorted.slice(0, 3), weak = sorted.slice(-2).reverse();
    var p = [];
    if (en) {
      p.push('Overall match ' + sc.match + '%' + (rep.sims.strong != null ? ', similarity to the strong employees ' + rep.sims.strong + '%.' : '.'));
      p.push('Strongest in: ' + top.map(function (k) { return nm(k) + ' (' + sc.dims[k] + ')'; }).join(', ') + '.');
      p.push('Needs checking in: ' + weak.map(function (k) { return nm(k) + ' (' + sc.dims[k] + ')'; }).join(', ') + '.');
      if (sc.consistency != null) p.push('Consistency index: ' + sc.consistency + '%' +
        (sc.consistency < 70 ? ' — the level 5 cross-checks do not match the profile built over levels 1–4, worth clarifying in the interview.' : '.'));
      if (sc.flags.length) p.push('To note: ' + sc.flags.map(function (f) { return f.en; }).join(', ') + '.');
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
    target:     { ar: 'ما الرقم الشهري الذي تريد الوصول إليه، ولماذا هذا الرقم تحديداً؟', en: 'What monthly number are you aiming for, and why that one in particular?' },
    persist:    { ar: 'أعطني مثالاً على عميل رفضك أكثر من مرة واستمررت معه — ماذا فعلت بالضبط؟', en: 'Give me an example of a customer who refused you more than once and you stayed with them — what exactly did you do?' },
    discipline: { ar: 'صف لي يوم عملك من أوله لآخره بالأرقام: كم مكالمة، كم متابعة، ومتى؟', en: 'Describe your working day in numbers: how many calls, how many follow-ups, and when?' },
    commit:     { ar: 'ما هي التزاماتك الثابتة خلال الأشهر القادمة وكيف ستنظّمها مع الدوام؟', en: 'What fixed commitments do you have over the coming months, and how will you fit them around the job?' },
    learn:      { ar: 'ما آخر ملاحظة تلقيتها ولم تعجبك؟ وماذا فعلت بها؟', en: 'What is the last piece of feedback you received that you did not like? And what did you do with it?' },
    account:    { ar: 'احكِ لي عن شهر لم تحقق فيه النتيجة — ما الذي كان بيدك أنت؟', en: 'Tell me about a month where you did not deliver the result — what was within your control?' }
  };
  var NC_FLAG_IQ = {
    study:      { ar: 'ذكرت أن لديك دراسة — ما هي الساعات بالضبط وكيف ستنظّمها مع الدوام؟', en: 'You mentioned studying — what exactly are the hours, and how will they fit around the job?' },
    second_job: { ar: 'ما حجم الوقت الذي يأخذه عملك الآخر، وماذا سيحدث عند التعارض؟', en: 'How much time does your other job take, and what happens when it clashes?' },
    schedule:   { ar: 'كيف ستضمن الالتزام بساعات الدوام الكاملة في الأشهر الأولى؟', en: 'How will you make sure you keep to full hours in the first months?' },
    retention:  { ar: 'ما الذي يجعلك تستمر في وظيفة صعبة بدل البحث عن بديل؟', en: 'What would make you stay in a hard role instead of looking for an alternative?' },
    attendance: { ar: 'كيف تتعامل مع يوم تشعر فيه بتعب لكن لديك مواعيد عمل؟', en: 'How do you handle a day when you feel tired but have work appointments?' },
    conditional:{ ar: 'أعطني مثالاً على نتيجة حققتها في ظروف غير مناسبة إطلاقاً.', en: 'Give me an example of a result you achieved in conditions that really did not suit you.' },
    commitment_other: { ar: 'ما هو الالتزام الثابت لديك وهل يمكن تعديله؟', en: 'What is your fixed commitment, and can it be adjusted?' }
  };

  function ncInterview(rep, lang) {
    var en = lang === 'en', out = [], seen = {};
    rep.score.flags.forEach(function (f) {
      if (NC_FLAG_IQ[f.key] && !seen[f.key]) { seen[f.key] = 1; out.push(en ? NC_FLAG_IQ[f.key].en : NC_FLAG_IQ[f.key].ar); }
    });
    var weakest = NC.DIM_KEYS.filter(function (k) { return rep.score.dims[k] != null; })
      .sort(function (a, b) { return rep.score.dims[a] - rep.score.dims[b]; }).slice(0, 2);
    weakest.forEach(function (k) { out.push(en ? NC_IQ[k].en : NC_IQ[k].ar); });
    if (rep.score.consistency != null && rep.score.consistency < 75) {
      out.push(en ? 'We noticed gaps between similar answers — let us go through them together.'
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
    /* no numbers at all → no data-based classification, and we say so */
    if (ps.avg == null && e.targetPct == null && e.attendance == null && e.managerScore == null) {
      return { group: null, score: null, insufficient: true, parts: {}, perf: ps };
    }
    var target = ps.avg != null ? ps.avg : (e.targetPct || 0);
    var parts = {
      target:      clamp((target - 60) / 70 * 100, 0, 100),          // 60% → 0 · 130% → 100
      consistency: ps.consistency != null ? ps.consistency : 60,
      attendance:  e.attendance == null ? 60 : clamp((e.attendance - 70) / 30 * 100, 0, 100),
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
    if (dc.insufficient || !e.group) {
      return { manager: e.group || null, data: dc.group, score: dc.score, perf: dc.perf,
               conflict: false, insufficient: true, direction: 'same' };
    }
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
  /* ============================================================
     TARGET HITTERS — "why do our successful salespeople succeed?"

     groupStats() splits by e.group, which is the manager's label. This
     splits by measured attainment instead, because the label is an
     opinion and the number is a fact. A mean is never reported alone:
     median, spread and range come with it, so a trait that merely looks
     shared is not mistaken for one that genuinely is.
     ============================================================ */

  /* the full 36-scenario profile if it exists, else the 22 comparable ones */
  function empTraits(e) {
    if (!e) return null;
    if (e.assessment) return dna(e.assessment.answers).traits;
    if (e.nc22) return dna(e.nc22.answers).traits;
    return null;
  }
  /* measured target attainment: the monthly history first, the single figure second */
  function attainment(e) {
    if (!e) return null;
    var ps = perfStats(e);
    if (ps.avg != null) return ps.avg;
    return e.targetPct != null ? e.targetPct : null;
  }

  function distribution(values) {
    var v = (values || []).filter(function (x) { return typeof x === 'number'; })
                          .slice().sort(function (a, b) { return a - b; });
    if (!v.length) return null;
    var mid = Math.floor(v.length / 2);
    return {
      n: v.length, mean: round(avg(v)),
      median: v.length % 2 ? v[mid] : round((v[mid - 1] + v[mid]) / 2),
      sd: Math.round(stdev(v) * 10) / 10,
      min: v[0], max: v[v.length - 1], range: v[v.length - 1] - v[0]
    };
  }

  function targetHitters(employees, minPct) {
    minPct = (typeof minPct === 'number') ? minPct : 100;
    var hitters = [], others = [], assessedNoPerf = 0, perfNoAssessment = 0;
    (employees || []).forEach(function (e) {
      var t = empTraits(e), a = attainment(e);
      if (t && a == null) { assessedNoPerf++; return; }
      if (!t && a != null) { perfNoAssessment++; return; }
      if (!t || a == null) return;
      (a >= minPct ? hitters : others).push(e);
    });
    return { threshold: minPct, hitters: hitters, others: others,
             assessedNoPerf: assessedNoPerf, perfNoAssessment: perfNoAssessment };
  }

  function hittersDNA(employees, minPct) {
    var split = targetHitters(employees, minPct);
    var rows = TK.map(function (k) {
      var h = distribution(split.hitters.map(function (e) { return empTraits(e)[k]; }));
      var o = distribution(split.others.map(function (e) { return empTraits(e)[k]; }));
      var gap = (h && o) ? h.mean - o.mean : null;
      /* Under five points is noise, not a differentiator. This is the guard
         against the Focus 81 vs 79 mistake: a two-point edge must never be
         reported as a reason for success. */
      var verdict = gap == null ? 'unknown'
        : Math.abs(gap) < 5 ? 'no_difference'
        : gap >= 20 ? 'strong' : gap >= 10 ? 'moderate' : gap > 0 ? 'slight' : 'inverse';
      /* how tightly the hitters cluster on this trait */
      var shared = h == null ? null
        : h.range <= 12 ? 'consistent' : h.range <= 25 ? 'mixed' : 'scattered';
      return { key: k, hitters: h, others: o, gap: gap == null ? null : round(gap),
               verdict: verdict, shared: shared };
    }).filter(function (r) { return r.hitters || r.others; })
      .sort(function (a, b) { return (b.gap == null ? -999 : b.gap) - (a.gap == null ? -999 : a.gap); });

    return {
      rows: rows, split: split,
      enough: split.hitters.length >= 3 && split.others.length >= 3,
      confidence: (split.hitters.length >= 10 && split.others.length >= 5) ? 'high'
                : (split.hitters.length >= 5 && split.others.length >= 3) ? 'medium' : 'low',
      differentiators: rows.filter(function (r) { return r.verdict === 'strong' || r.verdict === 'moderate'; }),
      notDifferentiating: rows.filter(function (r) { return r.verdict === 'no_difference'; })
    };
  }

  /* one employee against another, biggest difference first */
  function compareEmployees(a, b) {
    var ta = empTraits(a), tb = empTraits(b);
    if (!ta || !tb) return null;
    var rows = TK.map(function (k) {
      if (ta[k] == null || tb[k] == null) return null;
      return { key: k, a: ta[k], b: tb[k], gap: ta[k] - tb[k] };
    }).filter(Boolean).sort(function (x, y) { return Math.abs(y.gap) - Math.abs(x.gap); });
    return {
      rows: rows,
      major: rows.filter(function (r) { return Math.abs(r.gap) >= 10; }),
      similar: rows.filter(function (r) { return Math.abs(r.gap) < 5; }),
      perf: { a: attainment(a), b: attainment(b) }
    };
  }

  /* where someone sits below the people who hit target — phrased as a gap to
     close, never as a verdict on the person */
  function developmentPriorities(e, employees, minPct) {
    var t = empTraits(e);
    if (!t) return null;
    var hd = hittersDNA(employees, minPct);
    var rows = hd.rows.map(function (r) {
      if (!r.hitters || t[r.key] == null) return null;
      return { key: r.key, value: t[r.key], benchmark: r.hitters.mean,
               gap: round(t[r.key] - r.hitters.mean),
               matters: r.verdict === 'strong' || r.verdict === 'moderate' };
    }).filter(Boolean).filter(function (r) { return r.gap <= -8; })
      .sort(function (x, y) {
        /* a gap on a trait that actually separates performers comes first */
        if (x.matters !== y.matters) return x.matters ? -1 : 1;
        return x.gap - y.gap;
      });
    return { rows: rows, benchmarkN: hd.split.hitters.length, enough: hd.enough };
  }

  /* how much of this employee's picture we actually hold */
  function dataQuality(e) {
    var checks = [
      { k: 'assessment', ok: !!(e.assessment || e.nc22) },
      { k: 'target', ok: attainment(e) != null },
      { k: 'history6', ok: (e.history || []).length >= 6 },
      { k: 'attendance', ok: e.attendance != null },
      { k: 'manager_score', ok: e.managerScore != null },
      { k: 'group', ok: !!e.group }
    ];
    var missing = checks.filter(function (c) { return !c.ok; }).map(function (c) { return c.k; });
    return { pct: round(100 * (checks.length - missing.length) / checks.length),
             missing: missing, total: checks.length };
  }

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
    timingStats: timingStats, completenessBand: completenessBand, mmss: mmss, isAnswered: isAnswered,
    empTraits: empTraits, attainment: attainment, distribution: distribution,
    targetHitters: targetHitters, hittersDNA: hittersDNA, compareEmployees: compareEmployees,
    developmentPriorities: developmentPriorities, dataQuality: dataQuality,
    predictionValidation: predictionValidation, focusVerdict: focusVerdict, actualClass: actualClass
  };
})(window);
