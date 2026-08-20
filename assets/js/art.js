/* ============================================================
   SALES DNA — ART SYSTEM
   Hand-built vector world: hero, customers, boss, coach, city,
   zone emblems. One shared visual language (flat + gradient +
   rim light). Everything is inline SVG, no external assets.
   ============================================================ */
(function (root) {
  'use strict';

  /* ---------- shared gradient / filter defs (injected once) ---------- */
  var DEFS_INNER = '<defs>' +
    grad('gSkin', '#f7c9a2', '#dfa274') +
    grad('gSkin2', '#e8b48c', '#c98a5e') +
    grad('gHair', '#413a5c', '#191527') +
    grad('gSuit', '#4f8cff', '#8b5cf6') +
    grad('gSuit2', '#22d3ee', '#3b82f6') +
    grad('gPants', '#2a3a52', '#151e2c') +
    grad('gDark', '#48607f', '#1b2536') +
    grad('gGrey', '#8494ad', '#4a5a75') +
    grad('gRed', '#f87171', '#b91c1c') +
    grad('gGold', '#fcd34d', '#f59e0b') +
    grad('gGreen', '#34d399', '#059669') +
    grad('gSky', '#131c36', '#050810') +
    grad('gGlass', 'rgba(255,255,255,.16)', 'rgba(255,255,255,.02)') +
    '<radialGradient id="gAura"><stop offset="0%" stop-color="#3b82f6" stop-opacity=".55"/>' +
      '<stop offset="60%" stop-color="#8b5cf6" stop-opacity=".18"/>' +
      '<stop offset="100%" stop-color="#8b5cf6" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="gAuraRed"><stop offset="0%" stop-color="#ef4444" stop-opacity=".55"/>' +
      '<stop offset="100%" stop-color="#ef4444" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="gMoon"><stop offset="0%" stop-color="#dbeafe" stop-opacity=".9"/>' +
      '<stop offset="100%" stop-color="#dbeafe" stop-opacity="0"/></radialGradient>' +
    '<filter id="fGlow" x="-60%" y="-60%" width="220%" height="220%">' +
      '<feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
    '<filter id="fSoft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="14"/></filter>' +
    '</defs>';
  var DEFS = '<svg id="sdna-defs" width="0" height="0" style="position:absolute" aria-hidden="true">' + DEFS_INNER + '</svg>';

  function grad(id, a, b) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0.4" y2="1">' +
      '<stop offset="0%" stop-color="' + a + '"/><stop offset="100%" stop-color="' + b + '"/></linearGradient>';
  }

  function injectDefs() {
    if (document.getElementById('sdna-defs')) return;
    var d = document.createElement('div');
    d.innerHTML = DEFS;
    document.body.appendChild(d.firstChild);
  }

  /* deterministic pseudo random */
  function rnd(seed) {
    var s = seed || 7;
    return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }

  /* ============================================================
     HERO — the Sales Hero
     pose: idle | point | cheer | think | phone
     expr: idle | happy | focus | wow
     ============================================================ */
  function hero(opt) {
    opt = opt || {};
    var pose = opt.pose || 'idle', expr = opt.expr || 'idle';
    var cls = 'hero-svg pose-' + pose;

    var face = {
      idle:  { eye: eyesOpen(), brow: brows(0), mouth: 'M144 158 q16 11 32 0' },
      happy: { eye: eyesHappy(), brow: brows(-3), mouth: 'M141 154 q19 20 38 0 q-19 8 -38 0' },
      focus: { eye: eyesOpen(1), brow: brows(4), mouth: 'M146 160 h28' },
      wow:   { eye: eyesOpen(-1), brow: brows(-6), mouth: 'M148 154 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0' }
    }[expr] || {};

    var backArm, frontArm, prop = '';
    if (pose === 'cheer') {
      backArm = '<path class="arm" stroke="url(#gSuit)" stroke-width="26" stroke-linecap="round" fill="none" d="M112 214 C82 190 66 150 72 112" />' +
                '<circle cx="70" cy="104" r="14" fill="url(#gSkin)"/>';
      frontArm = '<path class="arm" stroke="url(#gSuit)" stroke-width="26" stroke-linecap="round" fill="none" d="M208 214 C238 190 254 150 248 112" />' +
                 '<circle cx="250" cy="104" r="14" fill="url(#gSkin)"/>';
    } else if (pose === 'point') {
      backArm = '<path class="arm" stroke="url(#gSuit)" stroke-width="26" stroke-linecap="round" fill="none" d="M112 216 C96 250 92 286 96 318" />' +
                '<circle cx="97" cy="326" r="13" fill="url(#gSkin)"/>';
      frontArm = '<path class="arm" stroke="url(#gSuit)" stroke-width="26" stroke-linecap="round" fill="none" d="M208 214 C238 206 262 186 276 160" />' +
                 '<circle cx="280" cy="154" r="13" fill="url(#gSkin)"/>' +
                 '<path d="M286 150 l22 -12" stroke="url(#gSkin)" stroke-width="9" stroke-linecap="round" fill="none"/>';
    } else if (pose === 'think') {
      backArm = '<path class="arm" stroke="url(#gSuit)" stroke-width="26" stroke-linecap="round" fill="none" d="M112 216 C96 250 92 286 96 318"/>' +
                '<circle cx="97" cy="326" r="13" fill="url(#gSkin)"/>';
      frontArm = '<path class="arm" stroke="url(#gSuit)" stroke-width="26" stroke-linecap="round" fill="none" d="M208 216 C226 250 222 214 196 186"/>' +
                 '<circle cx="190" cy="180" r="13" fill="url(#gSkin)"/>';
    } else if (pose === 'phone') {
      backArm = '<path class="arm" stroke="url(#gSuit)" stroke-width="26" stroke-linecap="round" fill="none" d="M112 216 C96 250 92 286 96 318"/>' +
                '<circle cx="97" cy="326" r="13" fill="url(#gSkin)"/>';
      frontArm = '<path class="arm" stroke="url(#gSuit)" stroke-width="26" stroke-linecap="round" fill="none" d="M208 214 C232 200 236 174 218 152"/>' +
                 '<circle cx="214" cy="146" r="13" fill="url(#gSkin)"/>' +
                 '<rect x="196" y="112" width="22" height="40" rx="6" fill="#0f172a" stroke="#22d3ee" stroke-width="2"/>';
    } else { /* idle — tablet in front hand */
      backArm = '<path class="arm arm-back" stroke="url(#gSuit)" stroke-width="26" stroke-linecap="round" fill="none" d="M112 216 C94 252 90 288 94 320"/>' +
                '<circle cx="95" cy="328" r="13" fill="url(#gSkin)"/>';
      frontArm = '<path class="arm arm-front" stroke="url(#gSuit)" stroke-width="26" stroke-linecap="round" fill="none" d="M208 216 C226 246 232 270 226 292"/>' +
                 '<g class="tablet"><rect x="196" y="268" width="74" height="52" rx="8" fill="#0b1222" stroke="#22d3ee" stroke-width="2.5" transform="rotate(-12 233 294)"/>' +
                 '<path d="M208 306 l10 -14 l12 8 l14 -22 l12 16" stroke="#22d3ee" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="rotate(-12 233 294)"/></g>' +
                 '<circle cx="222" cy="298" r="13" fill="url(#gSkin2)"/>';
      prop = '';
    }

    return '<svg viewBox="0 0 340 470" class="' + cls + '" xmlns="http://www.w3.org/2000/svg">' + DEFS_INNER +
      '<ellipse cx="168" cy="452" rx="92" ry="15" fill="#000" opacity=".45" filter="url(#fSoft)"/>' +
      '<circle cx="168" cy="230" r="200" fill="url(#gAura)" class="aura"/>' +
      /* legs */
      '<path d="M128 316 C124 366 122 404 124 440 h34 c2 -40 4 -78 6 -104" fill="url(#gPants)"/>' +
      '<path d="M186 316 c4 44 8 84 10 124 h34 c0 -40 -4 -82 -10 -124" fill="url(#gPants)"/>' +
      '<path d="M120 436 h40 v14 a6 6 0 0 1 -6 6 h-34 z" fill="#0d1526"/>' +
      '<path d="M196 440 h40 v10 a6 6 0 0 1 -6 6 h-34 z" fill="#0d1526"/>' +
      '<path d="M120 448 h40 M196 450 h40" stroke="#22d3ee" stroke-width="2.5" opacity=".8"/>' +
      /* body group (breathes) */
      '<g class="hero-body">' +
        backArm +
        /* torso */
        '<path d="M168 186 c-30 0 -54 10 -62 26 c-8 18 -12 60 -12 106 c26 10 122 10 148 0 c0 -46 -4 -88 -12 -106 c-8 -16 -32 -26 -62 -26 z" fill="url(#gSuit)"/>' +
        '<path d="M168 186 c-14 0 -26 2 -36 6 l36 40 l36 -40 c-10 -4 -22 -6 -36 -6 z" fill="#0f172a" opacity=".55"/>' +
        '<path d="M226 214 c8 18 12 58 12 104 c-10 4 -26 7 -42 8 c4 -44 10 -84 30 -112 z" fill="#fff" opacity=".08"/>' +
        '<path d="M232 224 C240 250 242 292 240 316" stroke="#22d3ee" stroke-width="3" fill="none" opacity=".65"/>' +
        /* badge */
        '<rect x="120" y="238" width="34" height="12" rx="6" fill="#0b1222" opacity=".8"/>' +
        '<rect x="124" y="241" width="26" height="6" rx="3" fill="#22d3ee" opacity=".8"/>' +
        /* neck + head */
        '<path d="M150 168 h36 v24 h-36 z" fill="url(#gSkin2)"/>' +
        '<g class="hero-head">' +
          '<ellipse cx="168" cy="126" rx="50" ry="56" fill="url(#gSkin)"/>' +
          '<path d="M118 122 c0 -44 22 -68 50 -68 c30 0 52 24 50 68 c-6 -22 -18 -34 -34 -36 c-18 -2 -46 4 -66 36 z" fill="url(#gHair)"/>' +
          '<path d="M212 108 c8 22 6 44 2 58 c-2 -20 -6 -38 -12 -50 z" fill="#fff" opacity=".07"/>' +
          '<ellipse cx="128" cy="146" rx="10" ry="6" fill="#e78f6a" opacity=".3"/>' +
          '<ellipse cx="208" cy="146" rx="10" ry="6" fill="#e78f6a" opacity=".3"/>' +
          (face.brow || '') + (face.eye || '') +
          '<path d="' + (face.mouth || '') + '" stroke="#7c3f27" stroke-width="4" fill="none" stroke-linecap="round"/>' +
          /* headset */
          '<path d="M116 118 a52 52 0 0 1 104 0" stroke="#111827" stroke-width="9" fill="none" stroke-linecap="round"/>' +
          '<rect x="102" y="112" width="22" height="34" rx="10" fill="#111827"/>' +
          '<rect x="106" y="120" width="6" height="18" rx="3" fill="#22d3ee" class="led"/>' +
          '<rect x="212" y="112" width="22" height="34" rx="10" fill="#111827"/>' +
          '<path d="M114 146 C118 172 138 178 150 174" stroke="#111827" stroke-width="5" fill="none"/>' +
          '<circle cx="152" cy="174" r="5" fill="#22d3ee" class="led"/>' +
        '</g>' +
        frontArm + prop +
      '</g></svg>';

    function eyesOpen(k) {
      var h = k === 1 ? 5 : k === -1 ? 11 : 8;
      return '<ellipse cx="146" cy="128" rx="7" ry="' + h + '" fill="#1e1b2e"/>' +
             '<ellipse cx="190" cy="128" rx="7" ry="' + h + '" fill="#1e1b2e"/>' +
             '<circle cx="148" cy="125" r="2.4" fill="#fff" opacity=".9"/>' +
             '<circle cx="192" cy="125" r="2.4" fill="#fff" opacity=".9"/>';
    }
    function eyesHappy() {
      return '<path d="M138 130 q8 -12 16 0" stroke="#1e1b2e" stroke-width="5" fill="none" stroke-linecap="round"/>' +
             '<path d="M182 130 q8 -12 16 0" stroke="#1e1b2e" stroke-width="5" fill="none" stroke-linecap="round"/>';
    }
    function brows(dy) {
      return '<path d="M136 ' + (108 + dy) + ' q10 -6 20 -1" stroke="#241f36" stroke-width="5" fill="none" stroke-linecap="round"/>' +
             '<path d="M180 ' + (107 - dy) + ' q10 -5 20 1" stroke="#241f36" stroke-width="5" fill="none" stroke-linecap="round"/>';
    }
  }

  /* ============================================================
     CUSTOMERS — skeptical | hesitant | price | busy | boss
     ============================================================ */
  var CUSTOMERS = {
    skeptical: { ar: 'عميل غير مقتنع', en: 'A sceptical customer', tie: '#ef4444', icon: '😠' },
    hesitant:  { ar: 'عميل متردّد',    en: 'A hesitant customer',  tie: '#f59e0b', icon: '🤔' },
    price:     { ar: 'عميل يركّز على السعر', en: 'A price-focused customer', tie: '#10b981', icon: '💰' },
    busy:      { ar: 'عميل مستعجل',    en: 'A customer in a hurry',  tie: '#22d3ee', icon: '⏱' },
    boss:      { ar: 'العميل الكبير',  en: 'The major customer', tie: '#8b5cf6', icon: '👑' }
  };

  function customer(type) {
    var t = CUSTOMERS[type] ? type : 'skeptical';
    var tie = CUSTOMERS[t].tie;
    var isBoss = t === 'boss';
    var arms, extra = '', face;

    if (t === 'skeptical' || t === 'boss') {
      arms = '<path d="M74 196 C58 232 62 258 78 268 h84 c16 -10 20 -36 4 -72" fill="url(#gDark)" opacity=".001"/>' +
             '<rect x="62" y="236" width="116" height="20" rx="10" fill="url(#gDark)"/>' +
             '<rect x="60" y="252" width="116" height="18" rx="9" fill="#1f2937"/>';
      face = '<path d="M92 96 q12 -10 24 -2 M124 94 q12 -8 24 2" stroke="#2b2436" stroke-width="5" fill="none" stroke-linecap="round"/>' +
             '<path d="M100 148 q20 -10 40 0" stroke="#6b3b2a" stroke-width="4.5" fill="none" stroke-linecap="round"/>';
    } else if (t === 'hesitant') {
      arms = '<path d="M70 200 C56 240 64 276 84 286" stroke="url(#gDark)" stroke-width="24" fill="none" stroke-linecap="round"/>' +
             '<path d="M170 200 C186 232 168 176 142 158" stroke="url(#gDark)" stroke-width="24" fill="none" stroke-linecap="round"/>' +
             '<circle cx="138" cy="152" r="13" fill="url(#gSkin2)"/>';
      face = '<path d="M92 96 q12 -6 24 0 M124 94 q12 -10 24 -2" stroke="#2b2436" stroke-width="5" fill="none" stroke-linecap="round"/>' +
             '<path d="M104 150 q16 4 32 -4" stroke="#6b3b2a" stroke-width="4.5" fill="none" stroke-linecap="round"/>';
    } else if (t === 'price') {
      arms = '<path d="M70 200 C56 240 64 276 84 286" stroke="url(#gDark)" stroke-width="24" fill="none" stroke-linecap="round"/>' +
             '<path d="M170 200 C190 236 186 268 168 280" stroke="url(#gDark)" stroke-width="24" fill="none" stroke-linecap="round"/>' +
             '<circle cx="166" cy="286" r="13" fill="url(#gSkin2)"/>' +
             '<g transform="rotate(14 178 300)"><rect x="152" y="286" width="54" height="34" rx="7" fill="#065f46" stroke="#34d399" stroke-width="2.5"/>' +
             '<text x="179" y="309" font-size="19" font-family="Orbitron,sans-serif" fill="#a7f3d0" text-anchor="middle">$</text></g>';
      face = '<path d="M92 94 q12 -8 24 -2 M124 92 q12 -6 24 2" stroke="#2b2436" stroke-width="5" fill="none" stroke-linecap="round"/>' +
             '<path d="M102 150 h38" stroke="#6b3b2a" stroke-width="4.5" stroke-linecap="round"/>' +
             '<circle cx="104" cy="120" r="15" fill="none" stroke="#0f172a" stroke-width="3"/>' +
             '<circle cx="140" cy="120" r="15" fill="none" stroke="#0f172a" stroke-width="3"/>' +
             '<path d="M119 120 h6" stroke="#0f172a" stroke-width="3"/>';
    } else { /* busy */
      arms = '<path d="M70 200 C52 232 60 258 76 268" stroke="url(#gDark)" stroke-width="24" fill="none" stroke-linecap="round"/>' +
             '<circle cx="78" cy="272" r="13" fill="url(#gSkin2)"/>' +
             '<rect x="60" y="256" width="20" height="16" rx="4" fill="#0f172a" stroke="#22d3ee" stroke-width="2"/>' +
             '<path d="M170 200 C192 186 196 158 178 138" stroke="url(#gDark)" stroke-width="24" fill="none" stroke-linecap="round"/>' +
             '<circle cx="175" cy="132" r="13" fill="url(#gSkin2)"/>' +
             '<rect x="160" y="100" width="22" height="38" rx="6" fill="#0f172a" stroke="#22d3ee" stroke-width="2"/>';
      face = '<path d="M92 92 q12 -4 24 2 M124 94 q12 -6 24 0" stroke="#2b2436" stroke-width="5" fill="none" stroke-linecap="round"/>' +
             '<path d="M104 152 q16 -8 32 0" stroke="#6b3b2a" stroke-width="4.5" fill="none" stroke-linecap="round"/>';
    }
    if (isBoss) {
      extra = '<rect x="88" y="112" width="64" height="18" rx="6" fill="#0b1222"/>' +
              '<path d="M84 118 h72" stroke="#0b1222" stroke-width="6"/>' +
              '<path d="M96 44 l14 22 l14 -22 l14 22 l12 -22 l6 30 h-66 z" fill="url(#gGold)"/>';
    }

    return '<svg viewBox="0 0 240 400" class="cust-svg cust-' + t + '" xmlns="http://www.w3.org/2000/svg">' + DEFS_INNER +
      '<ellipse cx="120" cy="384" rx="76" ry="13" fill="#000" opacity=".45" filter="url(#fSoft)"/>' +
      (isBoss ? '<circle cx="120" cy="200" r="170" fill="url(#gAuraRed)"/>' : '') +
      '<path d="M96 268 c-2 46 -4 78 -4 104 h30 l6 -104 z" fill="#111827"/>' +
      '<path d="M148 268 c4 46 6 78 6 104 h-30 l-6 -104 z" fill="#111827"/>' +
      '<g class="cust-body">' +
        '<path d="M120 180 c-28 0 -48 10 -54 26 c-6 16 -8 52 -8 82 c24 8 100 8 124 0 c0 -30 -2 -66 -8 -82 c-6 -16 -26 -26 -54 -26 z" fill="url(#gDark)"/>' +
        '<path d="M120 180 l-16 8 l16 26 l16 -26 z" fill="#e5e7eb"/>' +
        '<path d="M120 208 l9 8 l-6 46 l-6 0 l-6 -46 z" fill="' + tie + '"/>' +
        '<path d="M120 180 c-12 0 -22 2 -30 6 l30 28 l30 -28 c-8 -4 -18 -6 -30 -6 z" fill="#0b1222" opacity=".35"/>' +
        '<path d="M166 190 c8 8 12 46 12 76 c-8 3 -18 5 -28 6 c3 -32 7 -60 16 -82 z" fill="#fff" opacity=".07"/>' +
        arms +
        '<path d="M108 158 h26 v22 h-26 z" fill="url(#gSkin2)"/>' +
        '<g class="cust-head">' +
          '<ellipse cx="120" cy="118" rx="42" ry="46" fill="url(#gSkin)"/>' +
          '<path d="M80 112 c-2 -34 18 -52 40 -52 c22 0 42 18 40 52 c-8 -18 -20 -26 -40 -26 c-20 0 -32 8 -40 26 z" fill="url(#gHair)"/>' +
          '<ellipse cx="104" cy="120" rx="6" ry="7" fill="#1e1b2e"/>' +
          '<ellipse cx="140" cy="120" rx="6" ry="7" fill="#1e1b2e"/>' +
          '<circle cx="105.5" cy="117.5" r="2" fill="#fff" opacity=".85"/>' +
          '<circle cx="141.5" cy="117.5" r="2" fill="#fff" opacity=".85"/>' +
          '<ellipse cx="88" cy="134" rx="8" ry="5" fill="#e78f6a" opacity=".28"/>' +
          '<ellipse cx="152" cy="134" rx="8" ry="5" fill="#e78f6a" opacity=".28"/>' +
          face + extra +
        '</g>' +
      '</g></svg>';
  }

  /* ---------- coach (learning zone mentor) ---------- */
  function coach() {
    return '<svg viewBox="0 0 240 400" class="cust-svg cust-coach" xmlns="http://www.w3.org/2000/svg">' + DEFS_INNER +
      '<ellipse cx="120" cy="384" rx="74" ry="13" fill="#000" opacity=".4" filter="url(#fSoft)"/>' +
      '<path d="M98 268 c-2 46 -4 78 -4 104 h30 l6 -104 z" fill="#111827"/>' +
      '<path d="M146 268 c4 46 6 78 6 104 h-30 l-6 -104 z" fill="#111827"/>' +
      '<g class="cust-body">' +
      '<path d="M120 180 c-28 0 -48 10 -54 26 c-6 16 -8 52 -8 82 c24 8 100 8 124 0 c0 -30 -2 -66 -8 -82 c-6 -16 -26 -26 -54 -26 z" fill="url(#gGreen)"/>' +
      '<path d="M170 200 C192 190 196 166 182 146" stroke="url(#gGreen)" stroke-width="24" fill="none" stroke-linecap="round"/>' +
      '<circle cx="180" cy="140" r="13" fill="url(#gSkin2)"/>' +
      '<path d="M70 200 C54 236 62 268 78 278" stroke="url(#gGreen)" stroke-width="24" fill="none" stroke-linecap="round"/>' +
      '<rect x="52" y="262" width="46" height="34" rx="5" fill="#0b1222" stroke="#34d399" stroke-width="2"/>' +
      '<path d="M60 272 h30 M60 280 h24 M60 288 h18" stroke="#34d399" stroke-width="2.5" stroke-linecap="round"/>' +
      '<path d="M108 158 h26 v22 h-26 z" fill="url(#gSkin2)"/>' +
      '<g class="cust-head"><ellipse cx="120" cy="118" rx="42" ry="46" fill="url(#gSkin)"/>' +
      '<path d="M78 108 c-2 -32 20 -48 42 -48 c22 0 44 16 42 48 c-10 -16 -22 -22 -42 -22 c-20 0 -32 6 -42 22 z" fill="#4b5563"/>' +
      '<path d="M96 128 q8 -10 16 0 M128 128 q8 -10 16 0" stroke="#1e1b2e" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<path d="M102 148 q18 14 36 0" stroke="#6b3b2a" stroke-width="4.5" fill="none" stroke-linecap="round"/></g>' +
      '</g></svg>';
  }

  /* ============================================================
     CITY — parallax background
     ============================================================ */
  function city() {
    var r = rnd(42), i, x, h, w, out = [];
    var stars = '';
    for (i = 0; i < 70; i++) {
      stars += '<circle cx="' + (r() * 1600).toFixed(1) + '" cy="' + (r() * 300).toFixed(1) + '" r="' +
        (0.6 + r() * 1.5).toFixed(1) + '" fill="#dbeafe" opacity="' + (0.25 + r() * 0.6).toFixed(2) + '"/>';
    }
    function layer(count, baseY, minH, maxH, fill, winColor, winOp, wSeed) {
      var rr = rnd(wSeed), s = '', xx = -40;
      for (var k = 0; k < count; k++) {
        w = 60 + rr() * 120; h = minH + rr() * (maxH - minH);
        var y = baseY - h;
        s += '<rect x="' + xx.toFixed(0) + '" y="' + y.toFixed(0) + '" width="' + w.toFixed(0) + '" height="' + (h + 40).toFixed(0) +
             '" rx="4" fill="' + fill + '"/>';
        if (rr() > .6) s += '<rect x="' + (xx + w / 2 - 3).toFixed(0) + '" y="' + (y - 26).toFixed(0) + '" width="6" height="28" fill="' + fill + '"/>' +
          '<circle cx="' + (xx + w / 2).toFixed(0) + '" cy="' + (y - 30).toFixed(0) + '" r="4" fill="#ef4444" opacity=".85"/>';
        for (var wy = y + 12; wy < baseY - 10; wy += 18) {
          for (var wx = xx + 10; wx < xx + w - 12; wx += 16) {
            if (rr() > .45) s += '<rect x="' + wx.toFixed(0) + '" y="' + wy.toFixed(0) + '" width="7" height="9" rx="1.5" fill="' + winColor +
              '" opacity="' + (winOp * (0.4 + rr() * 0.6)).toFixed(2) + '"/>';
          }
        }
        xx += w + 12 + rr() * 26;
        if (xx > 1620) break;
      }
      return s;
    }
    out.push('<rect width="1600" height="900" fill="url(#gSky)"/>');
    out.push(stars);
    out.push('<circle cx="1290" cy="150" r="180" fill="url(#gMoon)"/>');
    out.push('<circle cx="1290" cy="150" r="46" fill="#e0e7ff" opacity=".85"/>');
    out.push('<g class="city-far" opacity=".55">' + layer(22, 640, 120, 330, '#111a2e', '#60a5fa', .5, 11) + '</g>');
    out.push('<g class="city-mid" opacity=".85">' + layer(16, 730, 160, 400, '#0c1424', '#93c5fd', .75, 23) + '</g>');
    /* neon signs */
    out.push('<g class="city-neon">' +
      '<rect x="230" y="430" width="120" height="34" rx="6" fill="none" stroke="#22d3ee" stroke-width="3" filter="url(#fGlow)" opacity=".8"/>' +
      '<rect x="980" y="380" width="86" height="140" rx="6" fill="none" stroke="#ec4899" stroke-width="3" filter="url(#fGlow)" opacity=".7"/>' +
      '<circle cx="640" cy="400" r="34" fill="none" stroke="#8b5cf6" stroke-width="4" filter="url(#fGlow)" opacity=".7"/></g>');
    out.push('<g class="city-near">' + layer(11, 860, 200, 460, '#060b16', '#3b82f6', .5, 37) + '</g>');
    /* street */
    out.push('<rect y="856" width="1600" height="60" fill="#04070e"/>');
    out.push('<path d="M0 878 h1600" stroke="#22d3ee" stroke-width="2" opacity=".35" stroke-dasharray="60 40"/>');
    return '<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" class="city-svg" xmlns="http://www.w3.org/2000/svg">' + DEFS_INNER +
      out.join('') + '</svg>';
  }

  /* ============================================================
     ZONE EMBLEMS — one building / scene icon per zone
     ============================================================ */
  function zoneEmblem(key, color) {
    var c = color || '#3b82f6';
    var body = {
      tower: '<path d="M44 104 L48 44 h24 l4 60 z" fill="url(#gSuit)"/>' +
             '<rect x="34" y="102" width="52" height="12" rx="4" fill="#0f172a"/>' +
             '<path d="M52 56 h16 M52 70 h16 M52 84 h16" stroke="#0b1222" stroke-width="3.5" opacity=".55"/>' +
             '<circle cx="60" cy="30" r="15" fill="#0f172a" stroke="' + c + '" stroke-width="4"/>' +
             '<circle cx="60" cy="30" r="6" fill="#ef4444"/>',
      arena: '<ellipse cx="60" cy="70" rx="44" ry="30" fill="none" stroke="' + c + '" stroke-width="6"/>' +
             '<path d="M32 70 q28 -34 56 0 q-28 34 -56 0" fill="' + c + '" opacity=".28"/>' +
             '<path d="M44 44 l10 -20 M76 44 l-10 -20" stroke="' + c + '" stroke-width="5" stroke-linecap="round"/>',
      hq:    '<rect x="26" y="34" width="68" height="76" rx="6" fill="#0f172a" stroke="' + c + '" stroke-width="4"/>' +
             '<circle cx="60" cy="66" r="20" fill="none" stroke="' + c + '" stroke-width="4"/>' +
             '<path d="M60 54 v14 l10 6" stroke="' + c + '" stroke-width="4" stroke-linecap="round" fill="none"/>',
      lab:   '<path d="M50 26 h20 v26 l20 44 a10 10 0 0 1 -9 14 h-42 a10 10 0 0 1 -9 -14 l20 -44 z" fill="none" stroke="' + c + '" stroke-width="5"/>' +
             '<path d="M40 86 h40" stroke="' + c + '" stroke-width="5"/><circle cx="54" cy="94" r="5" fill="' + c + '"/><circle cx="70" cy="98" r="4" fill="' + c + '"/>',
      trust: '<path d="M60 22 l34 14 v28 c0 26 -16 40 -34 46 c-18 -6 -34 -20 -34 -46 v-28 z" fill="none" stroke="' + c + '" stroke-width="5"/>' +
             '<path d="M46 64 l10 12 l20 -24" stroke="' + c + '" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
      street:'<path d="M30 110 L52 30 h16 l22 80 z" fill="#0f172a" stroke="' + c + '" stroke-width="4"/>' +
             '<path d="M60 42 v10 M60 62 v10 M60 82 v10" stroke="' + c + '" stroke-width="5" stroke-linecap="round"/>',
      battle:'<path d="M34 96 L82 34 M86 96 L38 34" stroke="' + c + '" stroke-width="7" stroke-linecap="round"/>' +
             '<path d="M74 26 h16 v14 z" fill="' + c + '"/><path d="M46 26 h-16 v14 z" fill="' + c + '"/>' +
             '<rect x="26" y="92" width="20" height="7" rx="3" fill="' + c + '"/>' +
             '<rect x="74" y="92" width="20" height="7" rx="3" fill="' + c + '"/>' +
             '<circle cx="60" cy="62" r="11" fill="' + c + '" opacity=".3"/>',
      final: '<path d="M40 28 h40 v22 a20 20 0 0 1 -40 0 z" fill="url(#gGold)"/>' +
             '<path d="M40 34 h-12 a12 12 0 0 0 12 18 M80 34 h12 a12 12 0 0 1 -12 18" stroke="#f59e0b" stroke-width="4" fill="none"/>' +
             '<rect x="52" y="70" width="16" height="18" fill="#f59e0b"/><rect x="38" y="88" width="44" height="12" rx="4" fill="#f59e0b"/>'
    }[key] || '';
    return '<svg viewBox="0 0 120 120" class="zone-emblem" xmlns="http://www.w3.org/2000/svg">' + DEFS_INNER +
      '<circle cx="60" cy="60" r="54" fill="' + c + '" opacity=".1"/>' + body + '</svg>';
  }

  /* coin / star / xp icons */
  function icon(kind) {
    if (kind === 'coin') return '<svg viewBox="0 0 40 40" class="ic">' + DEFS_INNER + '<circle cx="20" cy="20" r="16" fill="url(#gGold)"/>' +
      '<circle cx="20" cy="20" r="11" fill="none" stroke="#b45309" stroke-width="2" opacity=".6"/>' +
      '<path d="M20 12 v16 M15 16 h10 M15 24 h10" stroke="#7c2d12" stroke-width="2.5" stroke-linecap="round"/></svg>';
    if (kind === 'star') return '<svg viewBox="0 0 40 40" class="ic">' + DEFS_INNER + '<path d="M20 5 l4.6 9.8 10.4 1.4 -7.6 7.4 1.9 10.6 -9.3 -5.1 -9.3 5.1 1.9 -10.6 -7.6 -7.4 10.4 -1.4 z" fill="url(#gGold)"/></svg>';
    if (kind === 'bolt') return '<svg viewBox="0 0 40 40" class="ic">' + DEFS_INNER + '<path d="M23 4 L10 22 h8 l-3 14 14 -20 h-9 z" fill="url(#gSuit2)"/></svg>';
    return '';
  }

  root.SDNA = root.SDNA || {};
  root.SDNA.Art = {
    injectDefs: injectDefs, hero: hero, customer: customer, coach: coach,
    city: city, zoneEmblem: zoneEmblem, icon: icon, CUSTOMERS: CUSTOMERS
  };
})(window);
