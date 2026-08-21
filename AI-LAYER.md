# SALES DNA — طبقة الذكاء: مواصفة تقنية

> هذا هو «الأفيون التقني للمبرمج» الذي طلبته الوثيقة في سطرها الأخير: أسماء الأعمدة،
> معادلة الحساب، نقاط الـ API، بنية JSON، شاشات المدير، وطريقة ربط الذكاء بالموقع القائم.
> كُتب على **المكدّس الفعلي** لهذا المشروع لا على المكدّس المقترح — والفرق مهم، انظر §1.

---

## 1 · تصحيحان في الأساس قبل أي كود

### 1.1 — `pgvector` غير متاح هنا

الوثيقة تبني على `PostgreSQL + pgvector`. المشروع يعمل على **MariaDB 10.6.23**.

- `pgvector` إضافة لـ PostgreSQL حصراً ولا تعمل على MariaDB.
- نوع `VECTOR` الأصلي في MariaDB أُضيف في **11.7**، أي بعد نسختكم.
- الترحيل إلى PostgreSQL يعني قاعدة ثانية بجوار قاعدة Plesk، ونسخاً احتياطياً منفصلاً،
  وطبقة PDO مختلفة — لأجل 24 صفاً.

### 1.2 — عند 24 موظفاً «البحث الشعاعي» ليس مشكلة قائمة

`cosine similarity` بين متجه المرشّح و24 متجهاً = **24 حاصل ضرب نقطي**. هذا أقل من
مليون ثانية في PHP. الفهارس (HNSW) وقواعد المتجهات المخصّصة (Qdrant) تحلّ مشكلة
تبدأ عند مئات الآلاف من الصفوف.

**التوصية:** ابقَ على MariaDB. خزّن المتجه كـ JSON واحسب التشابه في PHP.
هذا **نفس النتيجة الرياضية** بلا قاعدة ثانية. أعِد النظر عند تجاوز ~50,000 صف.

```sql
-- كافٍ تماماً على هذا الحجم
CREATE TABLE embeddings (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  subject_type  VARCHAR(12) NOT NULL,        -- employee | candidate
  subject_id    VARCHAR(24) NOT NULL,
  model         VARCHAR(40) NOT NULL,        -- text-embedding-3-small
  dims          SMALLINT NOT NULL,           -- 1536
  vec           LONGTEXT NOT NULL,           -- JSON: [0.013, -0.44, ...]
  norm          DOUBLE NOT NULL,             -- ‖v‖ محسوب مسبقاً لتسريع الجيب
  source_text   TEXT NULL,                   -- النص الذي وُلّد منه (للتدقيق)
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_subject_model (subject_type, subject_id, model)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 2 · ما هو مبنيّ بالفعل — ولا يحتاج ذكاءً اصطناعياً

أقوى أفكار الوثيقة إحصائية لا توليدية، ومعظمها يعمل الآن في `assets/js/engine.js`:

| بند الوثيقة | الحالة | الدالة |
|---|---|---|
| 5 · تعريف مجموعة المقارنة | ✅ | `targetHitters(emps, {minPct,minMonths,minStreak})` |
| 6 · أنماط عبر عدة ناجحين لا فرد واحد | ✅ | `hittersDNA()` — متوسط ووسيط وانحراف ومدى |
| 15 · Confidence | ✅ | `hittersDNA().confidence` |
| 16 · Sample size tiers | ✅ | `datasetTier(n)` → insufficient / preliminary / medium / strong |
| 20 · «ما يتنبّأ بالنجاح فعلاً» | ✅ | `hittersDNA().differentiators` + `notDifferentiating` |
| 2B · Similarity to successful | ✅ | `hitters6()` + `similarity6()` |
| 7 · شاشة المرشّح | ✅ | تقرير المرشّح + `developmentPriorities()` |
| 8 · أسئلة مقابلة موجّهة | ✅ | `ncInterview()` · `interviewQuestions()` |
| 9 · متابعة 30/90/180 | ✅ | `candidate_reviews` + `predictionValidation()` |
| 17 · فصل بيانات HR | ✅ جزئياً | التحليل يعمل على `employee_id` لا على الاسم |

**الخلاصة:** البنود 2A و2B و5 و6 و7 و8 و9 و15 و16 و20 لا تحتاج LLM. المتبقّي فعلاً هو
2C (التنبؤ من نتائج فعلية) و3 (Embeddings) و11 (الدردشة) و12 (البحث الدلالي).

---

## 3 · العائق الحقيقي: لا توجد بيانات بعد

بند 16 في الوثيقة نفسها يقول: أقل من 10 موظفين = `Insufficient Data`.

الحالة الآن على الإنتاج: **24 موظفاً · 0 منهم أجرى التقييم · 0 شهر أداء مُدخل.**

فأي طبقة تنبؤ أو تفسير تُبنى الآن ستنتج كلاماً واثقاً بلا أساس — وهو بالضبط ما يحذّر
منه بند 14. **الترتيب الصحيح:**

```
① تمرير التقييم على الـ24 موظفاً        ← أنت · لا كود
② إدخال 6–12 شهراً من أرقام المبيعات    ← أنت · الشاشة جاهزة
③ عند ≥3 في كل مجموعة → الإحصاء يعمل    ← جاهز الآن
④ عند ≥30 موظفاً بنتائج → التنبؤ معقول  ← §5
⑤ Embeddings والدردشة                    ← §6 · §7
```

بناء ⑤ قبل ① هو بناء سقف بلا أساس.

---

## 4 · معادلة الحساب — ثلاث طبقات لا رقم واحد

بند 2 محق: لا يجوز إخراج `91%` بلا تفسير. الصيغة المقترحة:

```
FinalMatch = 0.40·Assessment + 0.30·Similarity + 0.30·Predictive
```

⚠ **قاعدة إلزامية:** الطبقة الثالثة تبقى **بوزن صفر** حتى تتحقق `datasetTier ≥ medium`
(30 موظفاً بنتائج فعلية). قبل ذلك:

```
FinalMatch = 0.57·Assessment + 0.43·Similarity      // 40:30 مُعاد التطبيع
predictive = null, shown as "insufficient data"
```

هذا نفس منطق «وزن التركيز 0%» القائم في النظام: **لا يدخل رقم في القرار قبل أن تُثبت
بياناتكم أنه يفرّق.**

| الطبقة | المصدر | موجودة؟ |
|---|---|---|
| A · Assessment 40% | `NC.score().match` | ✅ |
| B · Similarity 30% | `similarity6(cand, hitters6().hitters.dims)` | ✅ |
| C · Predictive 30% | §5 أدناه | ❌ يحتاج بيانات |

---

## 5 · الطبقة التنبؤية (بند 2C · 9 · 10) — إحصاء لا LLM

السؤال: «من بين 18 موظفاً بروفايلهم مشابه، كم وصل 100%+ بعد 3 أشهر؟»

```sql
CREATE TABLE prediction_results (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  candidate_id   VARCHAR(24) NOT NULL,
  employee_id    VARCHAR(24) NULL,          -- يُملأ عند التوظيف
  predicted_at   DATETIME NOT NULL,
  predicted_match SMALLINT NOT NULL,        -- ما تنبّأنا به
  predicted_tier VARCHAR(16) NOT NULL,      -- الثقة وقت التنبؤ
  horizon_days   SMALLINT NOT NULL,         -- 30 | 90 | 180
  actual_pct     SMALLINT NULL,             -- الأداء الفعلي
  verdict        VARCHAR(12) NULL,          -- hit | miss | pending
  reviewed_at    DATETIME NULL,
  KEY idx_cand (candidate_id),
  KEY idx_verdict (verdict)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

الحساب (PHP، بلا نموذج):

```
neighbours = أقرب k=15 موظفاً بالتشابه، بشرط توفّر أداء فعلي
predictive = 100 × (عدد من تجاوز 100% من الهدف) ÷ عدد الجيران
تُعرض دائماً مع: "13 من 18 موظفاً بروفايلهم مشابه تجاوزوا الهدف"
```

الرقم الخام بلا هذه الجملة ممنوع: `72%` وحدها تُقرأ كحكم، و«13 من 18» تُقرأ كدليل.

---

## 6 · Embeddings — متى، وبأي شكل

### 6.1 · ما يذهب إلى النموذج

نصّ مُولَّد من الأرقام، **بلا أي مُعرِّف شخصي** (بند 17):

```
Employee 1842. Persistence 93 (top decile). Rejection recovery 95.
Target drive 91. Discipline 87. Concentration 76 (mid).
Listens before proposing. Confidence high.
Performance dips after three consecutive losses.
Attainment: 8 months, average 112%, longest streak above target 8.
```

بند 1 محق تماماً: **العمر والجنس والقومية لا تدخل إطلاقاً.** ليست حيادية إحصائياً،
وإدخالها يجعل النظام يميّز بينما يبدو موضوعياً. النص أعلاه يحتوي أرقام أداء وسمات فقط.

### 6.2 · الحساب في PHP

```php
/* جيب الزاوية بين متجهين مخزّنين كـ JSON */
function cosine(array $a, array $b, $na, $nb) {
  $dot = 0.0;
  for ($i = 0, $n = count($a); $i < $n; $i++) $dot += $a[$i] * $b[$i];
  return ($na && $nb) ? $dot / ($na * $nb) : 0.0;
}
```

24 موظفاً × 1536 بعداً = 36,864 عملية ضرب. **أقل من ميلي ثانية.**

### 6.3 · نقاط الـ API الجديدة

| المسار | الصلاحية | الوظيفة |
|---|---|---|
| `POST ?r=ai/embed` | manager | يولّد ويخزّن متجهاً لموظف أو مرشّح |
| `POST ?r=ai/embed-all` | manager | يعيد توليد كل المتجهات (بعد تغيير النموذج) |
| `GET  ?r=ai/similar&id=&k=` | manager | أقرب k بالتشابه + أداؤهم الفعلي |
| `POST ?r=ai/explain` | manager | تفسير LLM لتقرير **محسوب مسبقاً** |
| `GET  ?r=ai/audit` | manager | سجل كل نداء: من، ماذا أُرسل، الكلفة |

شكل الرد لـ `ai/similar`:

```json
{ "ok": true,
  "subject": { "type": "candidate", "id": "C260821AB" },
  "model": "text-embedding-3-small",
  "neighbours": [
    { "employee_id": "EMP07", "similarity": 0.91, "attainment": 128,
      "months": 14, "streak": 9, "in_benchmark": true },
    { "employee_id": "EMP12", "similarity": 0.88, "attainment": 119,
      "months": 11, "streak": 6, "in_benchmark": true }
  ],
  "predictive": { "value": 72, "hit": 13, "of": 18, "tier": "preliminary" },
  "confidence": "low",
  "confidence_reason": "6 employees with performance data; 30 needed for medium"
}
```

---

## 7 · الدردشة والبحث الدلالي (بند 11 · 12 · 13)

**بند 14 هو القاعدة الحاكمة، ويجب فرضه في الكود لا في التوثيق:**

```
سؤال المدير
   ↓
مُصنِّف نوايا  →  استعلام SQL منظَّم  (الأرقام كلها من القاعدة)
   ↓
حساب إحصائي في PHP
   ↓
LLM يستقبل الأرقام الجاهزة  ←  ممنوع أن يحسب أو يخمّن رقماً
   ↓
شرح بالعربية/الإنجليزية + الأرقام مرفقة
```

**الفرض التقني:** الـ prompt يمرّر الأرقام كـ JSON، ويُطلب من النموذج صراحةً ألّا
يُنتج أي رقم غير موجود في المُدخل. وكل رد يُعرض مع الأرقام الخام بجواره ليتمكّن
المدير من كشف أي انحراف.

بند 13 (Hybrid Search) هو الصحيح: **التصفية المنظَّمة أولاً، التشابه بعدها.**

```sql
-- "موظفو فلسطين بأقدمية 6 أشهر+ وأداء 110%+ المشابهون للمرشّح Ahmed"
SELECT e.id FROM employees e
WHERE e.branch = 'فلسطين'
  AND TIMESTAMPDIFF(MONTH, e.start_date, '2026-08-01') >= 6
  AND (SELECT AVG(pct) FROM employee_history WHERE emp_id = e.id) >= 110;
-- ثم يُرتَّب الناتج بالتشابه في PHP
```

---

## 8 · الجداول — ما هو موجود وما يُضاف

بند 19 يقترح 20 جدولاً. الموجود يغطّي 11 منها بأسماء مختلفة:

| مقترح الوثيقة | الموجود |
|---|---|
| `employees` · `candidates` | ✅ نفس الاسم |
| `assessment_answers` · `assessment_scores` | ✅ `assessments.answers` (JSON) |
| `assessment_sessions` | ⚠ عميل فقط (`sdna_run_v1`) — انظر `HANDOFF §5.2` |
| `sales_monthly` · `employee_performance` | ✅ `employee_history` (مع الهدف والمبيعات والصفقات) |
| `employee_traits` · `candidate_traits` | ✅ تُحسب من `answers` عند القراءة |
| `manager_reviews` | ✅ `candidate_reviews` |
| `success_benchmarks` · `benchmark_members` | ✅ تعريف في `settings` يُحسب عند الطلب |
| `ai_audit_log` | ❌ يُضاف مع §6 |
| `employee_embeddings` · `candidate_embeddings` | ❌ جدول واحد `embeddings` (§1.2) |
| `similarity_results` · `prediction_results` | ❌ `prediction_results` فقط (§5) |

**لا تُنشئ `employee_traits` كجدول.** السمات مشتقّة من الإجابات؛ تخزينها يخلق نسخة
ثانية تتعارض مع الأولى عند تعديل الأوزان.

---

## 9 · قرارات تحتاج موافقتك قبل أي سطر

1. **إرسال بيانات الموظفين إلى OpenAI.** المتجهات تُولَّد خارج سيرفركم. الأرقام تخرج
   بلا أسماء (§6.1) لكنها تخرج. راجع سياسة الاحتفاظ بالبيانات لواجهة الـ API.
2. **الكلفة.** `text-embedding-3-small` رخيص جداً على 34 صفاً، لكن الدردشة بنداء
   لكل سؤال تُراكم كلفة شهرية متكرّرة.
3. **مفتاح الـ API** يجب أن يبقى على السيرفر في `config.php` (المستثنى من git) ولا
   يظهر في أي ملف يُنشر — نفس قاعدة كلمة مرور القاعدة.
4. **سطر أحمر مقترح:** لا يُتّخذ قرار توظيف أو إنهاء بناءً على مخرَج LLM وحده.
   الذكاء يشرح ويقترح؛ القرار يبقى للمدير — كما هي القاعدة الرابعة في `HANDOFF`.

---

## 10 · خطة التنفيذ

| المرحلة | العمل | يعتمد على |
|---|---|---|
| **0** | تمرير التقييم + إدخال الأرقام | أنت |
| **1** | جدول `embeddings` + `ai/embed` + التشابه في PHP | قرار §9.1 |
| **2** | `ai/similar` + أقرب الموظفين في شاشة المرشّح | المرحلة 1 |
| **3** | `prediction_results` + الطبقة الثالثة بوزن صفر | ≥10 موظفين بنتائج |
| **4** | تفعيل وزن الطبقة الثالثة | `tier ≥ medium` |
| **5** | `ai/explain` — الشرح فقط، لا حساب | المرحلة 2 |
| **6** | الدردشة + البحث الهجين | المرحلة 5 |

المرحلة 0 لا تحتاجني. المراحل 1–2 أستطيع بناءها فوراً بعد قرارك في §9.
