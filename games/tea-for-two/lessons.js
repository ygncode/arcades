/* Tea for Two — the four lessons + AI strategies + tournament engines */
"use strict";

const LESSONS = {};

/* ================= tiny DOM helpers ================= */
const $ = (sel, root) => (root || document).querySelector(sel);
const el = (html) => {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ================= game-theory core ================= */

// Prisoner's dilemma payoffs: [myProfit, theirProfit], unit = 1,000 kyat/day
const PD = {
  FAIR: "fair",
  DISC: "disc",
  P: { fair_fair: [30, 30], fair_disc: [0, 50], disc_fair: [50, 0], disc_disc: [10, 10] },
  payoff(my, their) {
    return PD.P[`${my}_${their}`];
  },
  label(m) {
    return m === PD.FAIR ? "လျော်ကန်ဈေး" : "လျှော့ဈေး";
  },
  emoji(m) {
    return m === PD.FAIR ? "🤝" : "⚔️";
  },
};

// AI personalities for The Week (iterated PD)
const AI = {
  khinma: { id: "khinma", kind: "allC", blurb: "သူမက နေ့တိုင်း လျော်ကန်ဈေး ထားတယ် — ယုံကြည်မှုကို ဘယ်တော့မှ မဖျက်ဘူး။" },
  utu: { id: "utu", kind: "allD", blurb: "သူက နေ့တိုင်း လျှော့ဈေး — သူ့အတွက် ဒီညဟာ နောက်ဆုံးညလိုပဲ။" },
  usein: { id: "usein", kind: "tft", blurb: "သူက ခင်ဗျား လုပ်တဲ့အတိုင်း ပြန်လုပ်တယ် — မျက်စိချင်း လဲတယ်ပေါ့။" },
  dnu: { id: "dnu", kind: "forgiving", blurb: "သူမက ခွင့်လွှတ်တတ်တယ် — ဒါပေမဲ့ အမြဲတော့ မဟုတ်ဘူး။" },
  ko: { id: "ko", kind: "random", blurb: "သူက ဒီနေ့ ဘာဆုံးဖြတ်မလဲ — ဘယ်သူမှ မသိ။ ကိုအောင်ပါမသိဘူး။" },
};

// compute an AI's move in an iterated round given history [{me, them}]
function aiMove(ai, hist, rnd) {
  const mine = hist.map((h) => h.them); // what the opponent did against them
  const n = hist.length;
  switch (ai.kind) {
    case "allC":
      return PD.FAIR;
    case "allD":
      return PD.DISC;
    case "tft": {
      const prev = mine[mine.length - 1];
      return prev === undefined ? PD.FAIR : prev;
    }
    case "forgiving": {
      if (n >= 2 && mine[n - 1] === PD.DISC && mine[n - 2] === PD.DISC) return PD.DISC;
      return PD.FAIR;
    }
    case "tf2t": {
      if (n >= 2 && mine[n - 1] === PD.DISC && mine[n - 2] === PD.DISC) return PD.DISC;
      return PD.FAIR;
    }
    case "grudger":
      return mine.includes(PD.DISC) ? PD.DISC : PD.FAIR;
    case "joss": {
      // tit-for-tat, but occasionally sneaks a defection
      const prev = mine[mine.length - 1] ?? PD.FAIR;
      if (prev === PD.FAIR && rnd() < 0.1) return PD.DISC;
      return prev;
    }
    case "gtft": {
      // generous tit-for-tat: forgives a share of defections
      const prev = mine[mine.length - 1];
      if (prev === PD.DISC && rnd() < 0.35) return PD.FAIR;
      return prev === undefined ? PD.FAIR : prev;
    }
    case "alternator":
      return n % 2 === 0 ? PD.FAIR : PD.DISC;
    case "pavlov": {
      // win-stay, lose-shift: repeat unless the last round cost you
      if (n === 0) return PD.FAIR;
      const last = hist[n - 1];
      if (last.me === PD.FAIR && last.them === PD.FAIR) return PD.FAIR; // 30 — keep
      if (last.me === PD.FAIR && last.them === PD.DISC) return PD.DISC; // 0 — shift
      if (last.me === PD.DISC && last.them === PD.FAIR) return PD.DISC; // 50 — keep
      return PD.FAIR; // 10 — shift
    }
    case "detective": {
      // probe C,C,D,D — then punish, or exploit if nobody ever bites back
      if (n < 4) return [PD.FAIR, PD.FAIR, PD.DISC, PD.DISC][n];
      const ever = mine.some((m) => m === PD.DISC);
      if (!ever) return PD.DISC;
      return mine[n - 1];
    }
    case "random":
      return rnd() < 0.5 ? PD.FAIR : PD.DISC;
    default:
      return PD.FAIR;
  }
}

// seeded PRNG (mulberry32) so tournaments are deterministic
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// play N rounds between two AI strategies; returns { scoreA, scoreB, moves }
function duel(a, b, rounds, rnd) {
  let scoreA = 0, scoreB = 0;
  const histA = [], histB = []; // history each sees (their own view)
  const moves = [];
  for (let i = 0; i < rounds; i++) {
    const ma = aiMove(a, histA, rnd);
    const mb = aiMove(b, histB, rnd);
    const [pa, pb] = PD.payoff(ma, mb);
    scoreA += pa;
    scoreB += pb;
    histA.push({ me: ma, them: mb });
    histB.push({ me: mb, them: ma });
    moves.push([ma, mb]);
  }
  return { scoreA, scoreB, moves };
}

// tournament pool — the classics, in the spirit of Axelrod's 1980 field
const TOURNAMENT = [
  { name: "Tit-for-Tat", short: "tft", kind: "tft", note: "ရက်ရော · ပြန်လဲ · ခွင့်လွှတ် · ရှင်းလင်း" },
  { name: "Generous Tit-for-Tat", short: "gtft", kind: "gtft", note: "ဖောက်ပြန်မှု သုံးပုံတစ်ပုံကို ခွင့်လွှတ်" },
  { name: "Tit-for-Two-Tats", short: "tf2t", kind: "tf2t", note: "ဆက်တိုက် ၂ ခါမှ ပြန်လဲ" },
  { name: "Grudger", short: "grudge", kind: "grudger", note: "တစ်ခါ ဖောက်ပြန်ရင် ထာဝရ ပြန်လဲ" },
  { name: "Joss", short: "joss", kind: "joss", note: "tit-for-tat · ဒါပေမဲ့ ၁၀% လှည့်စား" },
  { name: "Random", short: "rand", kind: "random", note: "ကျပန်း" },
  { name: "Detective", short: "det", kind: "detective", note: "အရင်စုံစမ်း · ပြီးမှ အခွင့်ကောင်းယူ" },
  { name: "Always Defect", short: "allD", kind: "allD", note: "အမြဲ ဖောက်ပြန်" },
];

function tournament(seed = 42, rounds = 50) {
  const rnd = mulberry32(seed);
  const n = TOURNAMENT.length;
  const totals = TOURNAMENT.map(() => 0);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = TOURNAMENT[i], b = TOURNAMENT[j];
      const res = duel({ kind: a.kind }, { kind: b.kind }, rounds, rnd);
      totals[i] += res.scoreA;
      totals[j] += res.scoreB;
    }
  }
  return TOURNAMENT.map((t, i) => ({ ...t, score: totals[i] })).sort((x, y) => y.score - x.score);
}

/* ================= shared lesson UI ================= */

function sceneTitle(mm, en, emoji) {
  return el(`<div class="scene-title anim">
    <span class="st-emoji">${emoji}</span>
    <div><h3>${mm}</h3><p>${en}</p></div>
  </div>`);
}

function narrator(charId, mm, en, mood = "neutral") {
  return el(`<div class="narrator anim">
    <div class="narr-portrait">${portrait(charId, mood, 84)}</div>
    <div class="narr-text">
      <p class="narr-name">${CHARS[charId].name} <span>${CHARS[charId].en}</span></p>
      <p class="narr-mm">${mm}</p>
      ${en ? `<p class="narr-en">${en}</p>` : ""}
    </div>
  </div>`);
}

function narratorLine(charId, mm, en, mood = "neutral") {
  return el(`<div class="narr-line anim">
    <span class="nl-emoji">${portrait(charId, mood, 56)}</span>
    <p><span class="mm">${mm}</span>${en ? ` <span class="en">${en}</span>` : ""}</p>
  </div>`);
}

function choiceRow(buttons) {
  const wrap = el(`<div class="choice-row anim"></div>`);
  buttons.forEach((b) => {
    const btn = el(`<button class="choice ${b.cls || ""}" data-x>
      ${b.emoji ? `<span class="c-emoji">${b.emoji}</span>` : ""}
      <span class="c-main"><strong>${b.label}</strong>${b.sub ? `<small>${b.sub}</small>` : ""}</span>
    </button>`);
    btn.addEventListener("click", () => b.onClick(btn));
    wrap.appendChild(btn);
  });
  return wrap;
}

function nextBtn(label, cb, cls = "") {
  const btn = el(`<button class="btn primary next ${cls}">${label}</button>`);
  btn.addEventListener("click", cb);
  return btn;
}

function payoffBubble(yours, theirs, label = "") {
  return el(`<div class="payoff anim ${label}">
    <div class="po-cell po-you"><span>ခင်ဗျားဆိုင်</span><strong>${yours}</strong></div>
    <div class="po-plus">vs</div>
    <div class="po-cell po-them"><span>${label ? "ပြိုင်ဘက်" : "ပြိုင်ဘက်"}</span><strong>${theirs}</strong></div>
  </div>`);
}

// the payoff matrix as a tea-shop menu board
function matrixBoard(opts = {}) {
  const { hl = null, explore = false } = opts;
  const cells = [
    ["fair", "fair", 30, 30, "နှစ်ယောက်လုံး လျော်ကန်ဈေး — ဈေးကွက် ငြိမ်၊ အမြတ် ၃၀/၃၀", "ပါရေတို အကောင်းဆုံး — ဒါပေမဲ့ 'သူက လျှော့ဈေး ဖွင့်ရင် ငါ ရှုံးမှာလား' ဆိုတဲ့ စိုးရိမ်မှု ရှိနေတယ်။"],
    ["fair", "disc", 0, 50, "ခင်ဗျား လျော်ကန်၊ သူ လျှော့ဈေး — ဖောက်သည်တွေ သူ့ဆီ ပြေးသွားတယ်။ ခင်ဗျား ၀။", "သူ့မှာ ချုပ်ကိုင်နည်းဗျူဟာ — လျှော့ဈေး။"],
    ["disc", "fair", 50, 0, "ခင်ဗျား လျှော့ဈေး၊ သူ လျော်ကန် — ဖောက်သည်တွေ ခင်ဗျားဆီ လာတယ်။ ခင်ဗျား ၅၀။", "ခင်ဗျား သူ့ကို လုယူလိုက်တယ် — ဒါပေမဲ့ ဒီည သူ သိသွားမယ်။"],
    ["disc", "disc", 10, 10, "နှစ်ယောက်လုံး လျှော့ဈေး — အမြတ်တွေ ပျောက်၊ ဖောက်သည်တွေ အကျိုးခံစား။ ၁၀/၁၀။", "နက်ရှ် မျှခြေ — ဘယ်သူမှ တစ်ယောက်တည်း မပြောင်းချင်ဘူး။"],
  ];
  const cellKey = (m1, m2) => `${m1}-${m2}`;
  const board = el(`<div class="matrix anim ${explore ? "explorable" : ""}">
    <p class="matrix-cap">ဈေးနှုန်းဘုတ် · The payoff board <span>(× 1,000 ကျပ် / တစ်နေ့)</span></p>
    <div class="matrix-grid">
      <div class="m-corner"><span>ခင်ဗျားဆိုင် ↓</span><span>ပြိုင်ဘက် →</span></div>
      <div class="m-head m-them">လျော်ကန်ဈေး 🤝</div>
      <div class="m-head m-them">လျှော့ဈေး ⚔️</div>
      ${cells.map((c) => {
        const k = cellKey(c[0], c[1]);
        const isHl = hl && hl[0] === c[0] && hl[1] === c[1];
        return `
        <div class="m-head m-you">${c[0] === "fair" ? "လျော်ကန် 🤝" : "လျှော့ဈေး ⚔️"}</div>
        <button class="m-cell ${isHl ? "hl" : ""}" data-key="${k}" ${explore ? "data-explore" : "disabled"}>
          <span class="m-val you">${c[2]}</span><span class="m-val them">${c[3]}</span>
        </button>`;
      }).join("")}
    </div>
    <p class="matrix-legend">ဘယ်ဘက် — ခင်ဗျားရဲ့ အမြတ် · ညာဘက် — ပြိုင်ဘက်ရဲ့ အမြတ်</p>
  </div>`);
  return board;
}

function lessonCard(html) {
  const c = el(`<div class="lesson-panel anim"></div>`);
  c.appendChild(html);
  return c;
}

function quizAndBadge(lessonId, onDone) {
  const wrap = el(`<div class="quiz-entry anim">
    <p class="q-line">${lessonId === "l1" ? "အခုဆို သဘောတရားတွေ သိပြီ — စစ်ဆေးကြည့်ရအောင်။" : "သင်ခန်းစာ ပြီးပြီ — နားလည်ထားလား စစ်ကြည့်ရအောင်။"}</p>
  </div>`);
  const btn = nextBtn("မေးခွန်းလေး ဖြေမယ် · Quick quiz", () => Game.startQuiz(lessonId, onDone), "quiz-start");
  wrap.appendChild(btn);
  return wrap;
}

/* ================= LESSON 1 — The Price War (Prisoner's Dilemma) ================= */

LESSONS.l1 = {
  id: "l1",
  title: "ဈေးစစ်ပွဲ",
  en: "The Price War",
  emoji: "🍵",
  mount(body) {
    body.innerHTML = "";
    const state = { stage: "intro" };

    const showIntro = () => {
      body.innerHTML = "";
      body.appendChild(sceneTitle("ဈေးစစ်ပွဲ — The Price War", "၃၂ လမ်းမှာ လက်ဖက်ရည်ဆိုင် နှစ်ဆိုင်က ဘေးချင်းကပ်။ ဒီနေ့ ဈေးကို ဘယ်သူ ဘယ်လို သတ်မှတ်မလဲ — တိတ်တဆိတ်။", "🍵"));

      const shops = el(`<div class="shops anim">
        <div class="shop-box">
          <div class="shop-cloth"></div>
          <div class="shop-avatar">${portrait("khinma", "neutral", 92)}</div>
          <p class="shop-name">ခင်ဗျားဆိုင်<small>Your Tea Shop</small></p>
          <p class="shop-tag">နေ့စဉ် ဆုံးဖြတ်ချက် — ဈေးနှုန်း</p>
        </div>
        <div class="shop-vs">VS</div>
        <div class="shop-box">
          <div class="shop-cloth"></div>
          <div class="shop-avatar">${portrait("utu", "neutral", 92)}</div>
          <p class="shop-name">ရွှေတူး ဆိုင်<small>U Tu's Shop</small></p>
          <p class="shop-tag">အတိတ်မှာ သူက အမြဲ… တွေးကြည့်စရာ</p>
        </div>
      </div>`);
      body.appendChild(shops);

      body.appendChild(narrator("khinma", "မနက်တိုင်း နှစ်ဆိုင်လုံးက ဒီနေ့ဈေး သတ်မှတ်တယ်။ ရွေးစရာ နှစ်ခုပဲရှိတယ် — လျော်ကန်ဈေး ဒါမှမဟုတ် လျှော့ဈေး။ ရွေးပြီးမှသာ တစ်ဖက်က ဘာရွေးလဲ သိရတယ်။", "Each morning both shops set a price in secret. Two choices: a fair price, or a discount. You only learn the other's choice after deciding.", "neutral"));
      body.appendChild(choiceRow([
        { emoji: "🤝", label: "လျော်ကန်ဈေး", sub: "Fair price — ဖောက်သည်တွေ နှစ်ဆိုင်လုံး ကျေနပ်", onClick: () => decide(PD.FAIR) },
        { emoji: "⚔️", label: "လျှော့ဈေး", sub: "Discount — ဖောက်သည်တွေ ကိုယ့်ဆီ ဆွဲ", onClick: () => decide(PD.DISC) },
      ]));
    };

    const decide = (myMove) => {
      state.stage = "result";
      const theirMove = PD.DISC; // U Tu always discounts — scripted
      const [mine, theirs] = PD.payoff(myMove, theirMove);
      Game.sfx("reveal");
      body.innerHTML = "";

      if (myMove === PD.FAIR) {
        body.appendChild(narrator("utu", "ဦးတူးက လျှော့ဈေး ဖွင့်လိုက်တယ်။ ဖောက်သည်တွေ သူ့ဆီ ပြေးသွားတယ် — ခင်ဗျားဆိုင် ဒီနေ့ အမြတ် သုည။", "U Tu opened with a discount. The customers poured into his shop. Yours made nothing today.", "smug"));
      } else {
        body.appendChild(narrator("utu", "ဦးတူးက လျှော့ဈေး ဖွင့်လိုက်တယ်။ ခင်ဗျားလည်း လျှော့ဈေး — နှစ်ယောက်လုံး ဈေးကွက်ကို ကွဲပြီး အမြတ်တွေ ပျောက်သွားတယ်။", "U Tu discounted. So did you. Both shops bled margin to win a market neither fully keeps.", "neutral"));
      }

      const reveal = el(`<div class="reveal anim">
        <div class="rv-row">
          <div class="rv-move rv-you"><span>${PD.emoji(myMove)} ${PD.label(myMove)}</span><small>ခင်ဗျားဆိုင်</small></div>
          <div class="rv-move rv-them"><span>${PD.emoji(theirMove)} ${PD.label(theirMove)}</span><small>ရွှေတူးဆိုင်</small></div>
        </div>
        <div class="rv-score">ဒီနေ့အမြတ် — <strong>${mine}</strong> vs <strong>${theirs}</strong> <small>(×1,000 ကျပ်)</small></div>
      </div>`);
      body.appendChild(reveal);

      if (myMove === PD.FAIR) {
        body.appendChild(narrator("khinma", "ခဏစောင့် — ဒါ တရားမျှတလား? ခင်ဗျား လျော်ကန်ဈေးထားလို့ ခင်ဗျား ၀ ရတယ်၊ သူက ၅၀ ရတယ်။ ဒါဆို နောက်တစ်ခါ ဘာရွေးမလဲ?", "Wait a moment — is that fair? You played fair and got 0 while he got 50. What would you pick next time?", "surprised"));
      } else {
        body.appendChild(narrator("khinma", "နှစ်ယောက်လုံး လျှော့ဈေး — ၁၀/၁၀။ လျော်ကန်ဈေး နှစ်ယောက်လုံး ထားရင် ၃၀/၃၀ ရနိုင်တယ်လေ။ ဘာဖြစ်လို့ ဒီနေရာကို ရောက်နေတာလဲ?", "Both discounted — 10/10. If you had both kept fair prices, it would have been 30/30. How did we end up here?", "worried"));
      }

      const cont = nextBtn("ဘုတ်ကို ကြည့်မယ် · See the board", () => showMatrix(myMove, theirMove, mine, theirs));
      body.appendChild(cont);
    };

    const showMatrix = (myMove, theirMove, mine, theirs) => {
      body.innerHTML = "";
      body.appendChild(sceneTitle("အပြည့်အစုံ ပုံရိပ် — The full picture", "ဒါက ဈေးနှုန်းဘုတ်။ အခြေအနေ လေးမျိုးလုံးကို ပြတယ်။", "📋"));
      const board = matrixBoard({ hl: [myMove, theirMove] });
      body.appendChild(board);

      const explain = lessonCard(el(`<div class="explain">
        <h4>ဒီပုံစံထဲက သင်ခန်းစာ ၃ ခု</h4>
        <div class="ex-row">
          <span class="ex-n">၁</span>
          <p><strong>ချုပ်ကိုင်နည်းဗျူဟာ · Dominant strategy</strong> — ဦးတူး ဘာလုပ်လုပ်၊ လျှော့ဈေးက ခင်ဗျားအတွက် အမြဲ ပိုအမြတ် (၅၀ > ၃၀၊ ၁၀ > ၀)။ သူ့အတွက်လည်း အဲဒီလိုပဲ။</p>
        </div>
        <div class="ex-row">
          <span class="ex-n">၂</span>
          <p><strong>နက်ရှ် မျှခြေ · Nash equilibrium</strong> — နှစ်ယောက်လုံး လျှော့ဈေးဆိုရင် (၁၀/၁၀) — တစ်ယောက်တည်း လျော်ကန်ဈေး ပြောင်းရင် ကိုယ့်ဘက်က ၀ ရလို့ ဘယ်သူမှ မပြောင်းချင်ဘူး။</p>
        </div>
        <div class="ex-row">
          <span class="ex-n">၃</span>
          <p><strong>ပါရေတို အကောင်းဆုံး · Pareto optimal</strong> — နှစ်ယောက်လုံး လျော်ကန်ဈေး (၃၀/၃၀) က လူတိုင်း ပိုကောင်းတဲ့ နေရာ။ ဒါပေမဲ့ ကိုယ့်အကျိုးကို လူတိုင်း ကြည့်ရင် အဲဒီနေရာကို မရောက်ဘူး။</p>
        </div>
        <p class="ex-punch">ဒါဟာ <strong>အကျဉ်းသားနှစ်ဦး ဒွိလမ်းဆန် (prisoner's dilemma)</strong> — လူတိုင်း ဆင်ခြင်တုံးတရားနဲ့ ရွေးတာက အားလုံးအတွက် ပိုဆိုးတယ်။</p>
      </div>`));
      body.appendChild(explain);

      const exploreBtn = nextBtn("အခြေအနေတွေ စမ်းကြည့်မယ် · Explore the board", () => showExplorer());
      body.appendChild(exploreBtn);
    };

    const showExplorer = () => {
      body.innerHTML = "";
      body.appendChild(sceneTitle("ဘုတ်ပေါ် စမ်းကြည့်မယ် — Try every corner", "အကွက် တစ်ခုချင်းစီ နှိပ်ကြည့်ပါ — ဘာဖြစ်မလဲ ကြည့်ရအောင်။", "🔍"));
      const board = matrixBoard({ explore: true });
      const note = el(`<div class="explore-note anim" id="explore-note">
        <p>အကွက်တစ်ခုကို နှိပ်ပါ — ပုံပြင်လေးနဲ့တကွ ဖတ်ရမယ်။</p>
      </div>`);
      board.addEventListener("click", (e) => {
        const cell = e.target.closest("[data-explore]");
        if (!cell) return;
        const k = cell.dataset.key;
        const row = [
          ["fair-fair", "နှစ်ယောက်လုံး လျော်ကန်ဈေး — ၃၀/၃၀။ ဖောက်သည်တွေ ကျေနပ်၊ နှစ်ဆိုင်လုံး ဝင်ငွေ ကောင်း။", "ပါရေတို အကောင်းဆုံး — ဒါပေမဲ့ ဖောက်ပြန်ရင် ပိုရမှာ စိုးနေတဲ့ စိတ် ရှိတယ်။"],
          ["fair-disc", "ခင်ဗျား လျော်ကန်၊ ဦးတူး လျှော့ဈေး — ၀/၅၀။ ဖောက်သည်အားလုံး သူ့ဆီ သွားတယ်။", "ဖောက်ပြန်မှုက အမြတ်ကြီးပေးတယ် — ဒါပေမဲ့ ယုံကြည်မှု ပျက်စီးတယ်။"],
          ["disc-fair", "ခင်ဗျား လျှော့ဈေး၊ ဦးတူး လျော်ကန် — ၅၀/၀။ ဖောက်သည်တွေ အကုန် ခင်ဗျားဆီ။", "လှည့်စားမှုက ဒီည အနိုင်ရတယ် — မနက်ဖြန် ဘာဖြစ်မလဲဆိုတာ စဉ်းစားစရာ။"],
          ["disc-disc", "နှစ်ယောက်လုံး လျှော့ဈေး — ၁၀/၁၀။ ဈေးကွက် ကွဲ၊ အမြတ်တွေ ပျောက်။", "နက်ရှ် မျှခြေ — လူတိုင်း 'ကိုယ့်အတွက် အကောင်းဆုံး' ရွေးလို့ အားလုံး ဆိုးတဲ့နေရာ။"],
        ].find((r) => r[0] === k);
        if (row) {
          note.innerHTML = `<p class="note-mm">${row[1]}</p><p class="note-en">${row[2]}</p>`;
          note.classList.remove("anim");
          void note.offsetWidth;
          note.classList.add("anim");
          Game.sfx("tap");
        }
      });
      body.appendChild(board);
      body.appendChild(note);
      body.appendChild(quizAndBadge("l1", () => {
        Game.badge("l1");
        finishScreen();
      }));
    };

    const finishScreen = () => {
      body.innerHTML = "";
      body.appendChild(sceneTitle("ဈေးစစ်ပွဲ ပြီးပြီ — Lesson 1 complete", "နောက်တစ်ဆင့် — ရက်သတ္တပတ် တစ်ပတ်လုံး ယှဉ်ကြည့်ရအောင်။", "🎉"));
      body.appendChild(narrator("khinma", "တစ်ခါတည်းဆိုရင် ဖောက်ပြန်တာ ပိုအမြတ်လို ထင်ရတယ်။ ဒါပေမဲ့ မနက်ဖြန် ထပ်တွေ့မယ်ဆိုရင်ကော? အဲဒါကို နောက်သင်ခန်းစာမှာ စမ်းကြည့်မယ်။", "In one round, cheating looks smart. But what if you'll meet again tomorrow? That is the next lesson.", "happy"));
      body.appendChild(nextBtn("ဒီသင်ခန်းစာ ပြီးပြီ · Done", () => Game.goStart()));
    };

    showIntro();
  },
};

/* ================= LESSON 2 — The Week (Iterated PD) ================= */

LESSONS.l2 = {
  id: "l2",
  title: "တစ်ပတ်တာ အတွဲ",
  en: "The Week",
  emoji: "🔁",
  mount(body) {
    const state = {
      opponent: null,
      day: 0,
      hist: [], // {me, them}
      myTotal: 0,
      theirTotal: 0,
      rnd: Math.random,
    };

    const pickOpponent = () => {
      body.innerHTML = "";
      body.appendChild(sceneTitle("ပြိုင်ဘက် ရွေးမယ် — Choose your rival", "၁၀ ရက် ဆက်တိုက် ယှဉ်ပြိုင်မယ်။ တစ်ရက်ချင်း မဟုတ်ဘူး — တစ်ပတ်လုံး မှတ်တမ်း ယူမယ်။", "🥊"));
      body.appendChild(narrator("khinma", "ဒီတစ်ခါ တစ်ရက်တည်း မဟုတ်ဘူး — ၁၀ ရက်လုံး နေ့တိုင်း ယှဉ်ရမယ်။ မနက်တိုင်း နှစ်ယောက်လုံး တစ်ပြိုင်နက် ဈေးရွေးမယ်။ ဘယ်သူ့ကို ယှဉ်မလဲ?", "This time it is not one round — it is ten mornings in a row, each a secret choice made at the same time. Who will you sit across from?", "neutral"));

      const grid = el(`<div class="rival-grid"></div>`);
      Object.entries(AI).forEach(([id, ai]) => {
        const card = el(`<button class="rival-card anim" data-rival="${id}">
          <span class="rc-avatar">${portrait(id, "neutral", 84)}</span>
          <span class="rc-name">${CHARS[id].name}<small>${CHARS[id].en}</small></span>
          <span class="rc-strat">${CHARS[id].strategy}</span>
          <span class="rc-blurb">${ai.blurb}</span>
          <span class="rc-pick">ရွေးမယ် →</span>
        </button>`);
        card.addEventListener("click", () => {
          state.opponent = ai;
          Game.sfx("tap");
          briefing();
        });
        grid.appendChild(card);
      });
      body.appendChild(grid);
    };

    const briefing = () => {
      body.innerHTML = "";
      const op = state.opponent;
      body.appendChild(sceneTitle(`${CHARS[op.id].name} နဲ့ ၁၀ ရက် — Ten days with ${CHARS[op.id].en}`, "နေ့တိုင်း နှစ်ယောက်လုံး တစ်ပြိုင်နက် ရွေးတယ်။ စတင်ပြီ။", "🫖"));
      body.appendChild(narrator(op.id, `${CHARS[op.id].name} — ${CHARS[op.id].strategy}။ ${op.blurb}`, `${CHARS[op.id].en} — ${CHARS[op.id].desc}. ${op.blurb}`, "neutral"));
      body.appendChild(nextBtn("ပထမနေ့ စမယ် · Day one", () => playDay()));
    };

    const playDay = () => {
      const d = state.day + 1;
      body.innerHTML = "";
      body.appendChild(el(`<div class="day-head anim"><span class="day-chip">နေ့ ${d} / ၁၀</span><h3>မနက်စောစော — နှစ်ဆိုင်လုံး ဈေး ရွေးကြမယ်</h3></div>`));

      body.appendChild(el(`<div class="scoreboard anim">
        <div class="sb-you"><span class="sb-avatar">${portrait("khinma", "neutral", 52)}</span><div><strong>ခင်ဗျားဆိုင်</strong><b class="sb-total" id="sb-my">${state.myTotal}</b></div></div>
        <div class="sb-mid"><span class="sb-history" id="sb-hist">${state.hist.map((h) => `<i>${PD.emoji(h.me)}</i>`).join("")}</span></div>
        <div class="sb-them"><div><strong>${CHARS[state.opponent.id].name}</strong><b class="sb-total" id="sb-their">${state.theirTotal}</b></div><span class="sb-avatar">${portrait(state.opponent.id, "neutral", 52)}</span></div>
      </div>`));

      body.appendChild(choiceRow([
        { emoji: "🤝", label: "လျော်ကန်ဈေး", sub: "Fair price", cls: "big", onClick: () => resolve(PD.FAIR) },
        { emoji: "⚔️", label: "လျှော့ဈေး", sub: "Discount", cls: "big", onClick: () => resolve(PD.DISC) },
      ]));
    };

    const resolve = (myMove) => {
      const op = state.opponent;
      const theirMove = aiMove(op, state.hist, state.rnd);
      const [mine, theirs] = PD.payoff(myMove, theirMove);
      state.hist.push({ me: myMove, them: theirMove });
      state.myTotal += mine;
      state.theirTotal += theirs;
      state.day++;
      Game.sfx(mine >= theirs ? "good" : "reveal");

      body.innerHTML = "";
      body.appendChild(el(`<div class="day-head anim"><span class="day-chip">နေ့ ${state.day} ရလဒ်</span></div>`));

      const rv = el(`<div class="reveal anim">
        <div class="rv-row">
          <div class="rv-move rv-you"><span>${PD.emoji(myMove)} ${PD.label(myMove)}</span><small>ခင်ဗျားဆိုင်</small><b>+${mine}</b></div>
          <div class="rv-move rv-them"><span>${PD.emoji(theirMove)} ${PD.label(theirMove)}</span><small>${CHARS[op.id].name}</small><b>+${theirs}</b></div>
        </div>
      </div>`);
      body.appendChild(rv);
      body.appendChild(quip(myMove, theirMove, op.id));

      const sb = el(`<div class="scoreboard anim compact">
        <div class="sb-you"><span class="sb-avatar">${portrait("khinma", "neutral", 44)}</span><div><strong>ခင်ဗျားဆိုင်</strong><b>${state.myTotal}</b></div></div>
        <div class="sb-mid"><span class="sb-history">${state.hist.map((h) => `<i>${PD.emoji(h.me)}</i>`).join("")}</span></div>
        <div class="sb-them"><div><strong>${CHARS[op.id].name}</strong><b>${state.theirTotal}</b></div><span class="sb-avatar">${portrait(op.id, theirMove === PD.FAIR ? "neutral" : "smug", 44)}</span></div>
      </div>`);
      body.appendChild(sb);

      const cont = nextBtn(state.day >= 10 ? "ရလဒ်ကြည့်မယ် · See results" : `နေ့ ${state.day + 1} →`, () => (state.day >= 10 ? results() : playDay()));
      body.appendChild(cont);
    };

    const quip = (myMove, theirMove, opId) => {
      const t = {
        fair_fair: ["နှစ်ယောက်လုံး လျော်ကန်ဈေး — ဖောက်သည်တွေ နှစ်ဆိုင်လုံး စိတ်ချ။", "Both fair — the street keeps its calm, and so do both ledgers."],
        fair_disc: [`${CHARS[opId].name} က လျှော့ဈေး — ခင်ဗျား လျော်ကန်ဈေး ထားလို့ ဖောက်သည်တွေ လုယူခံရတယ်။`, "They discounted; your fair price cost you the morning rush."],
        disc_fair: [`ခင်ဗျား လျှော့ဈေး — ဖောက်သည်တွေ အကုန် ခင်ဗျားဆီ လာတယ်။`, "Your discount pulled the whole street your way today."],
        disc_disc: ["လျှော့ဈေး နဲ့ လျှော့ဈေး — နှစ်ယောက်လုံး မြတ်စရာ ကျန်တော့တာ နည်းတယ်။", "Discount against discount — the only winner is the customer."],
      }[`${myMove}_${theirMove}`];
      return narratorLine(opId, t[0], t[1], myMove === PD.FAIR && theirMove === PD.DISC ? "smug" : "neutral");
    };

    const results = () => {
      body.innerHTML = "";
      const op = state.opponent;
      const winner = state.myTotal > state.theirTotal ? "you" : state.myTotal < state.theirTotal ? "them" : "draw";
      body.appendChild(sceneTitle("၁၀ ရက် ပြီးဆုံး — The week is done", "စာရင်း ချရအောင်။", "🧾"));

      const board = el(`<div class="week-result anim">
        <div class="wr-cell wr-you"><span class="wr-avatar">${portrait("khinma", winner === "you" ? "happy" : "sad", 76)}</span><p>ခင်ဗျားဆိုင်</p><strong>${state.myTotal}</strong></div>
        <div class="wr-vs">${winner === "you" ? "🏆" : winner === "them" ? "💀" : "🤝"}</div>
        <div class="wr-cell wr-them"><span class="wr-avatar">${portrait(op.id, winner === "them" ? "smug" : winner === "you" ? "sad" : "neutral", 76)}</span><p>${CHARS[op.id].name}</p><strong>${state.theirTotal}</strong></div>
      </div>`);
      body.appendChild(board);
      body.appendChild(analysis(op, state));

      body.appendChild(el(`<div class="duel-entry anim">
        <p class="q-line">ဗျူဟာတွေ အချင်းချင်း တိုက်ကြည့်ချင်လား? စက်တွေကို တိုက်ခိုင်းကြည့်ရအောင်။</p>
      </div>`));
      body.appendChild(nextBtn("🤖 AI တိုက်ပွဲခန်း · Watch the machines duel", () => duelMode()));
      body.appendChild(nextBtn("ပြီးပြီ · Finish", () => { Game.badge("l2"); finishScreen(); }, "ghost"));
    };

    const analysis = (op, st) => {
      const coopDays = st.hist.filter((h) => h.me === PD.FAIR).length;
      const defDays = 10 - coopDays;
      let core;
      switch (op.kind) {
        case "allC":
          core = [`${CHARS[op.id].name} က ၁၀ ရက်လုံး လျော်ကန်ဈေး ထားတယ် — တစ်ရက်မှ မဖောက်ပြန်ဘူး။ ဒီလို လူမျိုးနဲ့ဆို ပူးပေါင်းတာက နှစ်ယောက်လုံးအတွက် အကောင်းဆုံး။`, `She kept her word all ten days. Against someone who always cooperates, the best strategy is simple: cooperate back.`];
          if (defDays > coopDays) core.push([`ဒါပေမဲ့ ခင်ဗျားက ${defDays} ရက် ဖောက်ပြန်ခဲ့တယ် — သူမရဲ့ ယုံကြည်မှုကို သုံးပြီး အမြတ်ထုတ်ခဲ့တာ။ ဒါမျိုးက ခဏ ရနိုင်ပေမဲ့ ရေရှည်မှာ လူတွေ မမေ့ဘူး။`, `But you exploited her trust on ${defDays} days. It works once; people remember.`]);
          break;
        case "allD":
          core = [`${CHARS[op.id].name} က ၁၀ ရက်လုံး လျှော့ဈေး — ဘယ်တော့မှ ပြောင်းမှာ မဟုတ်ဘူး။ ဖောက်ပြန်သူ အစဉ်ကြီးနဲ့ဆို ယုံကြည်မှု တည်ဆောက်စရာ မရှိဘူး — တစ်ခုတည်းသော ကာကွယ်နည်းက ကိုယ်တိုင်လည်း လျှော့ဈေး။`, `Ten days, ten discounts. With an always-defector, trust is a gift they will always cash in — the only defence is to defect too.`];
          break;
        case "tft":
          core = [`${CHARS[op.id].name} က မျက်စိချင်း လဲပြတယ် — ခင်ဗျား လျော်ကန်ရင် သူ လျော်ကန်၊ ခင်ဗျား လျှော့ရင် သူ လျှော့ပြန်။ ဒါက tit-for-tat — ရက်ရော၊ ပြန်လဲ၊ ခွင့်လွှတ်၊ ရှင်းလင်း။ ဒီလိုလူမျိုးနဲ့ဆို ပူးပေါင်းတာ အမြဲ အကျိုးရှိတယ်။`, `He mirrored you exactly — that is tit-for-tat: nice, retaliatory, forgiving, clear. With such a rival, cooperation is the winning move.`];
          break;
        case "forgiving":
          core = [`${CHARS[op.id].name} က ခွင့်လွှတ်တတ်တယ် — တစ်ခါတစ်လေ ဖောက်ပြန်ရင် ဒေါသမထွက်ဘူး၊ ဒါပေမဲ့ ဆက်တိုက်လုပ်ရင် သူမလည်း ပြန်လဲတယ်။`, `She forgives a slip, but not a pattern — the moment you kept cheating, she began defending herself.`];
          break;
        case "random":
          core = [`${CHARS[op.id].name} က ကျပန်း ကစားတယ် — ခန့်မှန်းလို့မရဘူး။ ဒီလို လူမျိုးနဲ့ဆို ရေရှည် မဟာဗျူဟာ မရှိဘူး — ဒါပေမဲ့ ဒါကလည်း ဘဝမှာ တကယ် ကြုံရတတ်တဲ့ အခြေအနေပဲ။`, `He plays by mood, not by plan — impossible to read, impossible to trust, and very human.`];
          break;
      }
      const analysisEl = el(`<div class="analysis anim"></div>`);
      const rows = [core];
      rows.forEach((r) => {
        const [mm, en] = Array.isArray(r[0]) ? r[0] : r;
        analysisEl.appendChild(el(`<div class="ex-row"><span class="ex-n">✦</span><p><span class="mm">${mm}</span> <span class="en">${en}</span></p></div>`));
      });
      analysisEl.appendChild(el(`<p class="ex-punch">သင်ခန်းစာ — ထပ်ခါထပ်ခါ ကစားရတဲ့အခါ၊ နာမည်နဲ့ ယုံကြည်မှုက အမြတ်အစွန်းထက် ပိုတန်ဖိုးရှိတယ်။ <span class="en">Lesson — when you will meet again, reputation is worth more than any single round.</span></p>`));
      return analysisEl;
    };

    const duelMode = () => {
      body.innerHTML = "";
      body.appendChild(sceneTitle("AI တိုက်ပွဲခန်း — Machine duel", "ဗျူဟာ နှစ်ခု ရွေးပါ — ၂၀ ရက် တိုက်ခိုင်းပြီး ဘယ်သူ နိုင်လဲ ကြည့်ရအောင်။", "🤖"));
      const state2 = { a: null, b: null };
      const grid = el(`<div class="tourney-pool"></div>`);
      TOURNAMENT.forEach((t, i) => {
        const card = el(`<button class="t-card anim" data-t="${t.short}">
          <span class="t-emoji">${["🐢", "🧸", "🦊", "🧱", "🦂", "🎲", "🕵️", "⚔️"][i]}</span>
          <span class="t-name">${t.name}</span>
          <span class="t-note">${t.note}</span>
        </button>`);
        card.addEventListener("click", () => {
          Game.sfx("tap");
          if (!state2.a) { state2.a = t; card.classList.add("picked"); }
          else if (state2.b !== t && state2.b === null && t.short !== state2.a.short) {
            state2.b = t; card.classList.add("picked"); runDuel();
          }
        });
        grid.appendChild(card);
      });
      body.appendChild(grid);
      body.appendChild(el(`<div class="hint anim"><p>ဗျူဟာ ၂ ခု ရွေးပါ · pick two strategies</p></div>`));
      body.appendChild(nextBtn("🏆 ပြိုင်ပွဲအပြည့် · Full tournament (8 strategies)", () => fullTournament(), "ghost"));

      const runDuel = () => {
        body.innerHTML = "";
        const res = duel({ kind: state2.a.kind }, { kind: state2.b.kind }, 20, mulberry32(7));
        const aWon = res.scoreA > res.scoreB, bWon = res.scoreB > res.scoreA;
        body.appendChild(sceneTitle("တိုက်ပွဲရလဒ် — Result", `${state2.a.name} vs ${state2.b.name} — ၂၀ ရက်။`, "🥊"));
        body.appendChild(el(`<div class="week-result anim">
          <div class="wr-cell wr-you"><p>${state2.a.name}</p><strong>${res.scoreA}</strong></div>
          <div class="wr-vs">${aWon ? "🏆" : bWon ? "💀" : "🤝"}</div>
          <div class="wr-cell wr-them"><p>${state2.b.name}</p><strong>${res.scoreB}</strong></div>
        </div>`));
        const spark = el(`<div class="sparkline anim"></div>`);
        const max = Math.max(res.scoreA, res.scoreB);
        res.moves.forEach((m, i) => {
          const span = el(`<i class="sp sp-${m[0] === m[1] ? "both" : m[0] === PD.FAIR ? "a" : "b"}" title="နေ့ ${i + 1}: ${PD.label(m[0])} vs ${PD.label(m[1])}"></i>`);
          spark.appendChild(span);
        });
        body.appendChild(spark);
        body.appendChild(el(`<p class="legend-mini">နေ့ ၂၀ — 🤝 နှစ်ယောက်လုံး ပူးပေါင်း · 🟩 ဘယ်သူက ဖောက်ပြန် · 🟥 ညာဘက်က ဖောက်ပြန်</p>`));
        body.appendChild(el(`<div class="analysis anim"><div class="ex-row"><span class="ex-n">✦</span><p>${state2.a.name} vs ${state2.b.name} — အမြတ်တွေကို ကြည့်ပါ။ ပူးပေါင်းတဲ့ရက်တွေ များလေ၊ နှစ်ယောက်လုံး ပိုရလေ။ <span class="en">Watch the days where both cooperated — that is where the real money is made.</span></p></div></div>`));
        body.appendChild(nextBtn("နောက်တစ်တွဲ · Another duel", () => duelMode()));
        body.appendChild(nextBtn("🏆 ပြိုင်ပွဲအပြည့် · Full tournament", () => fullTournament(), "ghost"));
        body.appendChild(nextBtn("ပြီးပြီ · Finish", () => { Game.badge("l2"); finishScreen(); }, "ghost"));
      };

      const fullTournament = () => {
        body.innerHTML = "";
        const results = tournament(42);
        body.appendChild(sceneTitle("ပြိုင်ပွဲအပြည့် — Full tournament", "ဗျူဟာ ၈ ခု၊ တစ်ခုနဲ့တစ်ခု ၂၀ ရက်စီ — Axelrod ရဲ့ ပြိုင်ပွဲပုံစံ။", "🏆"));
        const rows = results.map((r, i) => el(`<div class="trow ${i === 0 ? "winner" : ""} anim">
          <span class="trow-rank">${i + 1}</span>
          <span class="trow-name">${r.name}</span>
          <span class="trow-note">${r.note}</span>
          <span class="trow-score">${r.score}</span>
        </div>`));
        const table = el(`<div class="t-table"></div>`);
        rows.forEach((r) => table.appendChild(r));
        body.appendChild(table);
        const top = results[0];
        body.appendChild(el(`<div class="analysis anim">
          <div class="ex-row"><span class="ex-n">🏅</span><p><strong>${top.name}</strong> က ထိပ်ဆုံး — 'ရက်ရောပေမဲ့ အကာကွယ်ရှိတဲ့' ဗျူဟာတွေက ရေရှည်မှာ အနိုင်ရတယ်။ Always Defect က ဘယ်နေရာမှာ ရှိနေလဲ ကြည့်ပါ — ဖောက်ပြန်တာ ခဏ ရနိုင်ပေမဲ့ ပူးပေါင်းမှုကနေ ရမယ့် အမြတ်ကြီးတွေကို လက်လွှတ်ရတယ်။ <span class="en">Nice-but-retaliatory strategies win the long game — and look where Always Defect lands: cheating wins rounds, but loses the fortune that cooperation builds.</span></p></div>
        </div>`));
        body.appendChild(nextBtn("ပြီးပြီ · Finish", () => { Game.badge("l2"); finishScreen(); }));
      };
    };

    const finishScreen = () => {
      body.innerHTML = "";
      body.appendChild(sceneTitle("တစ်ပတ်တာ အတွဲ ပြီးပြီ — Lesson 2 complete", "နောက်တစ်ဆင့် — မျှဝေထားတဲ့ ငါးကန်။", "🎉"));
      body.appendChild(narrator("khinma", "တစ်ခါတည်းဆို ဖောက်ပြန်တာ အမြတ်။ ဒါပေမဲ့ ထပ်ခါထပ်ခါ ကစားရတဲ့အခါ — နာမည်က အရာရာ။ အခု နောက်ထပ် ပြဿနာတစ်ခု — နှစ်ယောက်လုံး သုံးနေတဲ့ အရင်းအမြစ်တစ်ခု။", "One round rewards cheating. Repeated play rewards reputation. Now — a resource you both share.", "happy"));
      body.appendChild(nextBtn("ဒီသင်ခန်းစာ ပြီးပြီ · Done", () => Game.goStart()));
    };

    pickOpponent();
  },
};

/* ================= LESSON 3 — The Shared Pond (Tragedy of the Commons) ================= */

LESSONS.l3 = {
  id: "l3",
  title: "မျှဝေတဲ့ကန်",
  en: "The Shared Pond",
  emoji: "🐟",
  mount(body) {
    const MAX = 20, REGROW = 3;
    const state = { pond: 20, day: 0, myFish: 0, herFish: 0, hist: [], collapsed: false };

    const rivalTake = (pond, prevPlayerTake) => {
      if (pond < 6) return 1;
      if (prevPlayerTake === 3) return 3; // she fears the rush
      return 2;
    };

    const showIntro = () => {
      body.innerHTML = "";
      body.appendChild(sceneTitle("မျှဝေတဲ့ကန် — The Shared Pond", "ဆိုင်နှစ်ဆိုင်ရဲ့ နောက်ဖေးမှာ ငါးကန်တစ်ကန် — မုန့်ဟင်းခါးဟင်းရည် နှစ်ဆိုင်လုံး ဒီကန်က ငါးကို သုံးတယ်။", "🐟"));
      body.appendChild(narrator("khinma", "ငါးတွေက နေ့တိုင်း ပြန်ပေါက်တယ် — ဒါပေမဲ့ တစ်ရက် ၃ ကောင်ပဲ။ နေ့တိုင်း နှစ်ဆိုင်လုံး ငါးဘယ်နှစ်ကောင် ယူမလဲ ရွေးရတယ်။ ၁၀ ရက်ကြာရင် ဘာဖြစ်မလဲ?", "The fish breed, but only three per day. Every day both shops choose how many to take. What happens to the pond after ten days?", "neutral"));

      const pond = el(`<div class="pond-display anim">
        <div class="pd-fish" id="pd-fish"></div>
        <div class="pd-label"><strong id="pd-count">၂၀</strong><span>ငါး · fish left</span></div>
      </div>`);
      body.appendChild(pond);
      body.appendChild(el(`<div class="pond-legend anim"><span>🟢 ကန်ကျန်းမာ</span><span>🟡 စိုးရိမ်စရာ</span><span>🔴 အန္တရာယ်</span></div>`));
      body.appendChild(nextBtn("ပထမနေ့ · Day one", () => playDay()));
    };

    const renderPond = () => {
      const fish = $("#pd-fish");
      if (!fish) return;
      const n = state.pond;
      fish.innerHTML = Array.from({ length: Math.min(20, n) }, () => "🐟").join("");
      const count = $("#pd-count");
      if (count) count.textContent = String(n);
      const box = fish.closest(".pond-display");
      box.classList.toggle("low", n < 8);
      box.classList.toggle("mid", n >= 8 && n < 14);
      box.classList.toggle("high", n >= 14);
    };

    const playDay = () => {
      const d = state.day + 1;
      body.innerHTML = "";
      body.appendChild(el(`<div class="day-head anim"><span class="day-chip">နေ့ ${d} / ၁၀</span><h3>ဒီနေ့ ငါး ဘယ်နှစ်ကောင် ယူမလဲ?</h3></div>`));
      body.appendChild(el(`<div class="pond-display anim" id="pd-box">
        <div class="pd-fish" id="pd-fish"></div>
        <div class="pd-label"><strong id="pd-count">${state.pond}</strong><span>ငါး · fish left</span></div>
      </div>`));
      renderPond();
      body.appendChild(narratorLine("khinma", "ဒေါ်ခင်မက သူ့အတွက် ရွေးနေပြီ — ခင်ဗျား အရင်ရွေး။", "Daw Khin Ma has already decided hers — you pick first.", "neutral"));

      const picks = [
        { n: 1, emoji: "🐟", sub: "နည်းနည်းပဲ — ကန်ကို ထိန်း", cls: "eco" },
        { n: 2, emoji: "🐠", sub: "ပုံမှန် — မျှမျှတတ", cls: "" },
        { n: 3, emoji: "🐡", sub: "အများကြီး — ဒီနေ့ အမြတ်ယူ", cls: "greedy" },
      ];
      body.appendChild(choiceRow(picks.map((p) => ({
        emoji: p.emoji, label: `ငါး ${p.n} ကောင်`, sub: p.sub, cls: p.cls,
        onClick: () => resolve(p.n),
      }))));
    };

    const resolve = (take) => {
      const prev = state.hist[state.hist.length - 1];
      const herTake = rivalTake(state.pond, prev);
      state.hist.push(take);
      state.myFish += take;
      state.herFish += herTake;
      state.pond = Math.min(MAX, state.pond - take - herTake + REGROW);
      state.day++;
      if (state.pond <= 0) { state.pond = 0; state.collapsed = true; }

      body.innerHTML = "";
      body.appendChild(el(`<div class="day-head anim"><span class="day-chip">နေ့ ${state.day} ရလဒ်</span></div>`));

      const rv = el(`<div class="reveal anim">
        <div class="rv-row">
          <div class="rv-move rv-you"><span>🐟 ငါး ${take} ကောင်</span><small>ခင်ဗျားဆိုင်</small><b>+${take}</b></div>
          <div class="rv-move rv-them"><span>🐟 ငါး ${herTake} ကောင်</span><small>ဒေါ်ခင်မ</small><b>+${herTake}</b></div>
        </div>
      </div>`);
      body.appendChild(rv);

      const pond = el(`<div class="pond-display anim ${state.pond < 8 ? "low" : state.pond < 14 ? "mid" : "high"}" id="pd-box">
        <div class="pd-fish" id="pd-fish"></div>
        <div class="pd-label"><strong id="pd-count">${state.pond}</strong><span>ငါး · fish left</span></div>
      </div>`);
      body.appendChild(pond);
      renderPond();

      if (state.collapsed) {
        body.appendChild(narratorLine("khinma", "ကန်က ကုန်သွားပြီ… ငါးတွေ မကျန်တော့ဘူး။ ကျန်တဲ့ရက်တွေ ဘာမှ မရတော့ဘူး။", "The pond is empty. No fish, no broth, and nothing left for the days ahead.", "sad"));
        const btn = nextBtn("ရလဒ် ကြည့်မယ် · See the damage", () => results());
        body.appendChild(btn);
        return;
      }
      if (state.day >= 10) {
        const btn = nextBtn("ရလဒ် ကြည့်မယ် · See results", () => results());
        body.appendChild(btn);
        return;
      }
      const hint = take === 3 ? narratorLine("khinma", "ဒေါ်ခင်မက မျက်မှောင်ကြုတ်ပြီး — သူမလည်း ပိုယူလာပြီ။", "She frowns — and starts taking more too.", "worried") : narratorLine("khinma", "ဒေါ်ခင်မက ခင်ဗျားကို ကြည့်ပြီး သူ့အတွက် ဆုံးဖြတ်တယ်။", "She watches you, and decides for herself.", "neutral");
      body.appendChild(hint);
      body.appendChild(nextBtn(`နေ့ ${state.day + 1} →`, () => playDay()));
    };

    const results = () => {
      body.innerHTML = "";
      body.appendChild(sceneTitle("၁၀ ရက် ပြီးဆုံး — Season over", "ကန်ရဲ့ အခြေအနေနဲ့ စာရင်း။", "🧾"));

      const board = el(`<div class="week-result anim">
        <div class="wr-cell wr-you"><p>ခင်ဗျားရဲ့ ငါး</p><strong>${state.myFish}</strong></div>
        <div class="wr-vs">${state.collapsed ? "☠️" : state.pond < 8 ? "⚠️" : "🌿"}</div>
        <div class="wr-cell wr-them"><p>ဒေါ်ခင်မရဲ့ ငါး</p><strong>${state.herFish}</strong></div>
      </div>`);

      const pondMeter = el(`<div class="pond-meter anim">
        <div class="pm-track"><div class="pm-fill ${state.pond < 8 ? "danger" : state.pond < 14 ? "warn" : "ok"}" style="width:${(state.pond / MAX) * 100}%"></div></div>
        <p>ကန်ထဲ ကျန်တဲ့ငါး — <strong>${state.pond}</strong> / ၂၀</p>
      </div>`);
      body.appendChild(board);
      body.appendChild(pondMeter);

      const epilogue = el(`<div class="analysis anim"></div>`);
      let epi;
      if (state.collapsed) {
        epi = ["ကန်က ပျက်သွားပြီ။ ဒီနှစ် ငါးကို စားရပေမဲ့ — နောက်နှစ် မုန့်ဟင်းခါးအတွက် ဘာမှ မကျန်တော့ဘူး။", "The pond is dead. You ate well this season — next season, there is no broth."];
      } else if (state.pond < 8) {
        epi = [`ကန်ထဲ ငါး ${state.pond} ကောင်ပဲ ကျန်တယ်။ နောက်ရာသီ အန္တရာယ်များတယ် — ငါးတွေ ပြန်ပေါက်ဖို့ မလောက်တော့ဘူး။`, `Only ${state.pond} fish left — barely enough to rebuild. Next season hangs by a thread.`];
      } else if (state.pond < 14) {
        epi = [`ကန်က ပိန်လာတယ် — ငါး ${state.pond} ကောင်ပဲ ကျန်တယ်။ ဒီအတိုင်းဆက်ယူရင် မကြာခင် ပြဿနာတက်မယ်။`, `The pond is thinning — keep taking like this and trouble is a season away.`];
      } else {
        epi = [`ကန်က ကျန်းမာနေတုန်းပဲ — ငါး ${state.pond} ကောင်။ ဒီလိုမျိုး ထိန်းထားနိုင်ရင် နောက်နှစ်တွေလည်း ရှိမယ်။`, `The pond is healthy at ${state.pond} fish — this is what sustainability looks like.`];
      }
      epilogue.appendChild(el(`<div class="ex-row"><span class="ex-n">✦</span><p><span class="mm">${epi[0]}</span> <span class="en">${epi[1]}</span></p></div>`));

      const greedyDays = state.hist.filter((h) => h === 3).length;
      if (greedyDays > 0) {
        epilogue.appendChild(el(`<div class="ex-row"><span class="ex-n">✦</span><p><span class="mm">ခင်ဗျား ငါး ၃ ကောင် ယူတဲ့နေ့ ${greedyDays} ရက် — ဒေါ်ခင်မလည်း လိုက်ပြိုင်ယူလာတယ်။ အားလုံး ဒီလိုယူရင် ကန်က ၇ ရက်အတွင်း ပျက်မယ်။</span> <span class="en">On your ${greedyDays} greedy days she matched you — if everyone played that way, the pond collapses within a week.</span></p></div>`));
      }
      epilogue.appendChild(el(`<div class="ex-row"><span class="ex-n">✦</span><p><strong>သင်ခန်းစာ · Tragedy of the commons</strong> — တစ်ကောင်ချင်း ကြည့်ရင် ပိုယူတာ အမြဲ အကျိုးရှိတယ်။ ဒါပေမဲ့ အကျိုးက ကိုယ့်တစ်ဦးတည်းရတယ်၊ ကုန်ကျစရိတ်က အားလုံး ခံရတယ် — ဒါကြောင့် 'စည်းမျဉ်း' ဒါမှမဟုတ် 'ပူးပေါင်းမှု' မရှိရင် အားလုံးပိုင်အရင်းအမြစ်က ပျက်စီးသွားတယ်။ <span class="en">The benefit of taking more is private; the cost is shared. Without rules or cooperation, shared resources collapse.</span></p></div>`));
      body.appendChild(epilogue);
      body.appendChild(quizAndBadge("l3", () => { Game.badge("l3"); finishScreen(); }));
    };

    const finishScreen = () => {
      body.innerHTML = "";
      body.appendChild(sceneTitle("မျှဝေတဲ့ကန် ပြီးပြီ — Lesson 3 complete", "နောက်ဆုံးသင်ခန်းစာ — ငွေခွဲပွဲ။", "🎉"));
      body.appendChild(narrator("khinma", "ငါးကန်၊ မြက်ခင်း၊ လေထု — အားလုံးပိုင်တဲ့အရာတွေက ကိုယ့်အကျိုးတစ်ခုတည်းကြည့်ရင် ပျက်စီးတတ်တယ်။ အခု နောက်ဆုံးပွဲ — ဆုငွေ ခွဲပွဲ။", "Ponds, pastures, air — shared things collapse under purely private logic. One last game: splitting the prize.", "neutral"));
      body.appendChild(nextBtn("ဒီသင်ခန်းစာ ပြီးပြီ · Done", () => Game.goStart()));
    };

    showIntro();
  },
};

/* ================= LESSON 4 — The Split (Ultimatum Game) ================= */

LESSONS.l4 = {
  id: "l4",
  title: "ခွဲဝေပွဲ",
  en: "The Split",
  emoji: "⚖️",
  mount(body) {
    const STAKE = 10;
    // rounds: [proposer, responderThreshold(for AI responder), aiProposal(for AI proposer), aiMood]
    const ROUNDS = [
      { ai: "khinma", proposer: "ai", proposal: [5, 5], threshold: null, note: "မျှတတဲ့ အဆိုပြုချက်" },
      { ai: "utu", proposer: "you", proposal: null, threshold: 1, note: "ဘာမဆို လက်ခံနိုင်တဲ့သူ" },
      { ai: "utu", proposer: "ai", proposal: [9, 1], threshold: null, note: "လောဘကြီးတဲ့ အဆိုပြုချက်" },
      { ai: "usein", proposer: "you", proposal: null, threshold: 3, note: "အနည်းဆုံး ၃ ပြား လိုတယ်" },
      { ai: "usein", proposer: "ai", proposal: [6, 4], threshold: null, note: "မျှမျှတတ" },
      { ai: "khinma", proposer: "you", proposal: null, threshold: 4, note: "အနည်းဆုံး ၄ ပြား လိုတယ်" },
    ];
    const state = { round: 0, total: 0, history: [] };

    const showIntro = () => {
      body.innerHTML = "";
      body.appendChild(sceneTitle("ခွဲဝေပွဲ — The Split", "ဈေးပွဲတော်ကော်မတီက နှစ်ဆိုင်လုံးကို ရွှေဒင်္ဂါး ၁၀ ပြား ဆုပေးတယ်။ ဒါပေမဲ့ — အဆိုပြုရမယ်။", "⚖️"));
      body.appendChild(narrator("khinma", "စည်းမျဉ်း — တစ်ဆိုင်က အချိုးအစား အဆိုပြုရတယ်။ နောက်တစ်ဆိုင်က လက်ခံရင် အဲဒီအတိုင်း ရမယ်။ ငြင်းရင် — နှစ်ယောက်လုံး ဘာမှ မရတော့ဘူး။ ဆုငွေက ကော်မတီဆီ ပြန်သွားတယ်။", "One shop proposes a split of the ten coins. If the other accepts, the deal stands. If they reject — both get nothing, and the prize returns to the committee.", "neutral"));
      body.appendChild(el(`<div class="coins anim" aria-hidden="true">${Array.from({ length: STAKE }, () => "<i>🪙</i>").join("")}</div>`));
      body.appendChild(nextBtn("စမယ် · Start", () => playRound()));
    };

    const playRound = () => {
      const r = ROUNDS[state.round];
      body.innerHTML = "";
      body.appendChild(el(`<div class="day-head anim"><span class="day-chip">အလှည့် ${state.round + 1} / ၆</span><h3>${r.proposer === "ai" ? `${CHARS[r.ai].name} က အဆိုပြုတယ်` : "ခင်ဗျား အဆိုပြုရမယ်"}</h3></div>`));
      body.appendChild(el(`<div class="coin-tally anim"><span>ခင်ဗျားရဲ့ စုစုပေါင်း</span><strong>${state.total}</strong> ပြား</div>`));
      body.appendChild(narratorLine(r.ai, r.note, "", r.proposer === "ai" ? "smug" : "neutral"));

      if (r.proposer === "ai") {
        const [aShare, bShare] = r.proposal; // ai keeps aShare, you get bShare
        body.appendChild(el(`<div class="proposal anim">
          <div class="pr-ai">${portrait(r.ai, "smug", 76)}<p>${CHARS[r.ai].name}</p><strong>${aShare} ပြား</strong></div>
          <div class="pr-split">🪙 ${aShare} : ${bShare} 🪙</div>
          <div class="pr-you">${portrait("khinma", "neutral", 76)}<p>ခင်ဗျား</p><strong>${bShare} ပြား</strong></div>
        </div>`));
        body.appendChild(choiceRow([
          { emoji: "✅", label: "လက်ခံမယ်", sub: `+${bShare} ပြား`, cls: "eco", onClick: () => respond(true, bShare, r) },
          { emoji: "🚫", label: "ငြင်းပယ်မယ်", sub: "နှစ်ယောက်လုံး ၀ ရ", cls: "greedy", onClick: () => respond(false, 0, r) },
        ]));
      } else {
        const splits = [5, 6, 7, 8, 9, 10].map((keep) => ({ keep, give: STAKE - keep }));
        body.appendChild(choiceRow(splits.map((s) => ({
          emoji: "🪙",
          label: `${s.keep} : ${s.give}`,
          sub: `ကိုယ့်အတွက် ${s.keep} · သူ့အတွက် ${s.give}`,
          onClick: () => propose(s, r),
        }))));
      }
    };

    const respond = (accept, gain, r) => {
      const aiName = CHARS[r.ai].name;
      state.total += gain;
      state.round++;
      Game.sfx(accept ? "good" : "bad");
      body.innerHTML = "";
      const [aShare] = r.proposal;
      if (accept) {
        body.appendChild(narrator(r.ai, `လက်ခံတယ်။ ${aShare} : ${gain} နဲ့ အဆင်ပြေတယ် — ငွေရတာ ရှိပြီ။`, `Accepted. ${aShare}:${gain} works — better than nothing, and this street runs on deals, not grudges.`, "happy"));
      } else {
        body.appendChild(narrator(r.ai, `${aShare} : ${gain} လား — ဒါ မတရားဘူး။ ငြင်းပယ်တယ်။ နှစ်ယောက်လုံး ဘာမှ မရတော့ဘူး။`, `${aShare}:${gain}? That is insulting. Rejected — we both walk away with nothing.`, "surprised"));
      }
      body.appendChild(el(`<div class="coin-tally anim"><span>ခင်ဗျားရဲ့ စုစုပေါင်း</span><strong>${state.total}</strong> ပြား</div>`));
      const btn = nextBtn(state.round >= ROUNDS.length ? "ရလဒ် · Results" : `အလှည့် ${state.round + 1} →`, () => (state.round >= ROUNDS.length ? results() : playRound()));
      body.appendChild(btn);
    };

    const propose = (s, r) => {
      const aiName = CHARS[r.ai].name;
      const accepted = s.give >= r.threshold;
      state.total += accepted ? s.keep : 0;
      state.round++;
      Game.sfx(accepted ? "good" : "bad");
      body.innerHTML = "";
      if (accepted) {
        const lines = {
          utu: ["၁ ပြား ရတာက ဘာမှ မရတာထက် ပိုကောင်းတယ် — လက်ခံတယ်။", "One coin beats no coin — accepted. Pure arithmetic, zero pride."],
          usein: [`${s.give} ပြားဆိုရင် လက်ခံလို့ရတယ် — သဘောတူတယ်။`, `${s.give} coins is acceptable — deal.`],
          khinma: [`${s.give} ပြားဆိုတာ မျှတသလို ခံစားရတယ် — လက်ခံတယ်။`, `${s.give} coins feels fair — accepted.`],
        };
        body.appendChild(narrator(r.ai, lines[r.ai][0], lines[r.ai][1], "happy"));
      } else {
        const lines = {
          utu: ["…ဟ? ငါ့အတွက် ဘာမှ မကျန်တော့ဘူးလား။ ဒါ ငြင်းပယ်မယ် — နှစ်ယောက်လုံး ဘာမှမရတာ ပိုကောင်းတယ်။", "Wait — nothing for me? Rejected. If I get nothing either way, you get nothing too."],
          usein: [`${s.give} ပြားပဲလား — ဒါ လေးစားမှုမရှိဘူး။ ငြင်းပယ်တယ်။`, `${s.give} coins? That is disrespect — rejected.`],
          khinma: [`${s.give} ပြားပဲလား။ ငါ မခံဘူး — ဒီလိုမျိုး ငြင်းပယ်တာက သင်ခန်းစာတစ်ခု ပေးတာပဲ။`, `${s.give} coins? I will not accept — and my rejection is a lesson.`],
        };
        body.appendChild(narrator(r.ai, lines[r.ai][0], lines[r.ai][1], "smug"));
      }
      body.appendChild(el(`<div class="coin-tally anim"><span>ခင်ဗျားရဲ့ စုစုပေါင်း</span><strong>${state.total}</strong> ပြား</div>`));
      const btn = nextBtn(state.round >= ROUNDS.length ? "ရလဒ် · Results" : `အလှည့် ${state.round + 1} →`, () => (state.round >= ROUNDS.length ? results() : playRound()));
      body.appendChild(btn);
    };

    const results = () => {
      body.innerHTML = "";
      body.appendChild(sceneTitle("ခွဲဝေပွဲ ပြီးဆုံး — All settled", "ဆုငွေ စာရင်း။", "🧾"));
      body.appendChild(el(`<div class="week-result anim">
        <div class="wr-cell wr-you"><p>ခင်ဗျားရဲ့ ပြား</p><strong>${state.total}</strong></div>
        <div class="wr-vs">🪙</div>
        <div class="wr-cell wr-them"><p>စုစုပေါင်း</p><strong>${ROUNDS.length * STAKE}</strong></div>
      </div>`));

      const analysis = el(`<div class="analysis anim"></div>`);
      analysis.appendChild(el(`<div class="ex-row"><span class="ex-n">✦</span><p><span class="mm">သင်္ချာအရဆိုရင် — 'ငြင်းတာထက် လက်ခံတာက အမြဲ ပိုကောင်း' ဆိုပြီး ဘာကိုမဆို လက်ခံသင့်တယ်။ ဒါပေမဲ့ လူတွေ တကယ်ကစားရင် — မတရားတဲ့ ကမ်းလှမ်းမှုကို သုံးပုံတစ်ပုံလောက် ငြင်းပယ်ကြတယ်။</span> <span class="en">The math says accept anything — 1 beats 0. But in real experiments, people reject unfair offers about a third of the time.</span></p></div>`));
      analysis.appendChild(el(`<div class="ex-row"><span class="ex-n">✦</span><p><span class="mm">ငြင်းပယ်တာက ကိုယ့်အတွက်လည်း ဆုံးရှုံးပေမဲ့ — 'မင်း ဒီလိုလုပ်ရင် ငါ မခံမယ်' ဆိုတဲ့ သင်ခန်းစာ ပေးတာပဲ။ ဒါကြောင့် အဆိုပြုသူတွေက မျှတအောင် ကမ်းလှမ်းတတ်လာတယ် — မျှတမှုဆိုတာ တန်ဖိုးရှိတဲ့ အရာဖြစ်လာတယ်။</span> <span class="en">Rejecting costs you, but it trains the proposer — which is how fairness becomes valuable, and then normal.</span></p></div>`));
      analysis.appendChild(el(`<div class="ex-row"><span class="ex-n">✦</span><p><span class="mm">ဦးတူးက ၁ ပြားကိုတောင် လက်ခံတယ် — သူ့အတွက် တွက်ချက်မှုက ရိုးရှင်းတယ်။ ဒါပေမဲ့ ဒေါ်ခင်မလိုလူက မျှတမှုကို ကြည့်တယ် — လူတစ်ယောက်ချင်းစီရဲ့ 'ငြင်းမယ့် သတ်မှတ်ချက်' ကို မသိရင်၊ အန္တရာယ် ရှိတယ်။</span> <span class="en">U Tu accepts one coin; Daw Khin Ma demands fairness. Not knowing someone's rejection threshold is the risk of every offer.</span></p></div>`));
      body.appendChild(analysis);
      body.appendChild(quizAndBadge("l4", () => { Game.badge("l4"); finishScreen(); }));
    };

    const finishScreen = () => {
      body.innerHTML = "";
      body.appendChild(sceneTitle("ခွဲဝေပွဲ ပြီးပြီ — Lesson 4 complete", "သင်ခန်းစာ ၄ ခုလုံး ပြီးပြီ — သီအိုရီခန်းမှာ အကျဉ်းချုပ် ရှိတယ်။", "🎓"));
      body.appendChild(narrator("khinma", "မျှတမှုက စိတ်ကူးယဉ်မဟုတ်ဘူး — လူတွေ ကိုယ့်အကျိုး စွန့်ပြီးတောင် မတရားမှုကို အပြစ်ပေးတတ်လို့၊ မျှတမှုက ဈေးကွက်ထဲမှာ တကယ့် တန်ဖိုးရှိတယ်။ သင်ခန်းစာတွေ အားလုံး ပြီးပြီ။", "Fairness is not a fantasy — it has real market value, because people pay to punish unfairness. That is the last lesson.", "happy"));
      body.appendChild(nextBtn("ပြီးပြီ · Done", () => Game.goStart()));
    };

    showIntro();
  },
};
