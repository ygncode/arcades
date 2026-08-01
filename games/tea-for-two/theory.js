/* Tea for Two — theory glossary + quiz bank */
"use strict";

const THEORY = [
  {
    id: "game",
    emoji: "🎲",
    mm: "ဂိမ်းတစ်ပွဲဆိုတာ",
    en: "What is a game?",
    body: [
      ["ကစားသမားတွေ — ဘယ်သူတွေ ဆုံးဖြတ်ချက် ချနေလဲ", "The players — who is deciding?"],
      ["နည်းဗျူဟာတွေ — တစ်ယောက်ချင်းစီမှာ ဘယ်ရွေးချယ်စရာတွေ ရှိလဲ", "The strategies — what choices each one has"],
      ["အကျိုးအမြတ်တွေ — ရွေးချယ်မှုတိုင်းရဲ့ ရလဒ်က ဘယ်သူ့အတွက် ဘာရလဲ", "The payoffs — what everyone gets from every outcome"],
    ],
    take: "ဂိမ်းသီအိုရီဆိုတာ — ကစားသူတွေ၊ ရွေးစရာတွေ၊ ရလဒ်တွေကို တွက်ကြည့်တဲ့ သင်္ချာပဲ။",
    takeEn: "Game theory is just the math of who's playing, what they can pick, and what everyone gets.",
  },
  {
    id: "dominant",
    emoji: "👑",
    mm: "ချုပ်ကိုင်နည်းဗျူဟာ",
    en: "Dominant strategy",
    body: [
      ["နည်းဗျူဟာတစ်ခုက ပြိုင်ဘက် ဘာလုပ်လုပ် ကိုယ့်အတွက် အမြဲ အကောင်းဆုံးဆိုရင် — အဲဒါကို ချုပ်ကိုင်နည်းဗျူဟာ လို့ခေါ်တယ်။", "A strategy that is best for you no matter what the other player does."],
      ["ဈေးစစ်ပွဲမှာ — ပြိုင်ဘက် ဘယ်ဈေးပဲထားထား၊ လျှော့ဈေးက အမြဲ ပိုအမြတ်။ ဒါကြောင့် လျှော့ဈေးက နှစ်ဖက်လုံးရဲ့ ချုပ်ကိုင်နည်းဗျူဟာ။", "In the price war, discounting pays more whatever the rival does — so it is dominant for both sides."],
    ],
    take: "ချုပ်ကိုင်နည်းဗျူဟာရှိတဲ့အခါ — ပြိုင်ဘက်ရဲ့ အပြုအမူကို ကြည့်စရာမလိုတော့ဘူး။",
    takeEn: "With a dominant strategy, you don't even need to guess what the other side will do.",
  },
  {
    id: "nash",
    emoji: "⚖️",
    mm: "နက်ရှ် မျှခြေ",
    en: "Nash equilibrium",
    body: [
      ["John Nash ရဲ့ အတွေးအခေါ် — တစ်ယောက်ယောက်က တစ်ယောက်တည်း နည်းဗျူဟာပြောင်းရင် ကိုယ့်ဘက်က ပိုဆိုးသွားမယ့် အခြေအနေ။", "A situation where no single player can improve by changing their strategy alone — that is John Nash's famous idea."],
      ["ဈေးစစ်ပွဲမှာ (လျှော့ဈေး၊ လျှော့ဈေး) က မျှခြေ — တစ်ယောက်တည်း လျော်ကန်ဈေးပြောင်းရင် ကိုယ်က ၀ ရတယ်။", "In the price war, (discount, discount) is the equilibrium — switching alone makes you lose everything."],
      ["သတိထားစရာ — မျှခြေဆိုတာ အားလုံးအတွက် အကောင်းဆုံးလို့ မဆိုလိုဘူး။", "Careful: equilibrium does not mean it is good for everyone."],
    ],
    take: "မျှခြေဆိုတာ 'ဘယ်သူမှ တစ်ယောက်တည်း ပြောင်းမယ့်သူမရှိ' ဆိုတဲ့ အခြေအနေ — အဲဒါက ကောင်းတဲ့နေရာမှာ ရှိဖို့ မလိုဘူး။",
    takeEn: "An equilibrium is a place nobody wants to leave alone — not necessarily a place anyone loves.",
  },
  {
    id: "pareto",
    emoji: "💹",
    mm: "ပါရေတို အကောင်းဆုံး",
    en: "Pareto optimal",
    body: [
      ["တစ်ယောက်ယောက် ပိုမဆိုးဘဲ ဘယ်သူမှ ပိုမကောင်းနိုင်တဲ့ အခြေအနေ။", "A result where nobody can be made better off without making someone else worse off."],
      ["ဈေးစစ်ပွဲမှာ (လျော်ကန်၊ လျော်ကန်) က ပါရေတို အကောင်းဆုံး — ၃၀/၃၀ ကနေ တစ်ယောက်ယောက် ပိုရအောင် လုပ်ရင် ကျန်တစ်ယောက် လျော့ရတယ်။", "In the price war, (fair, fair) is Pareto optimal — improving one side's 30 requires hurting the other."],
    ],
    take: "ပါရေတို အကောင်းဆုံးမှာ 'အားလုံး ပိုကောင်းတဲ့ ရွေးစရာ' မရှိတော့ဘူး — ဒါပေမဲ့ တစ်ယောက် ရတာကို နောက်တစ်ယောက် မရချင်လို့ ဖြစ်နိုင်တယ်။",
    takeEn: "Pareto optimal means no free lunch is left — but someone may simply not accept the split.",
  },
  {
    id: "pd",
    emoji: "🚔",
    mm: "အကျဉ်းသားနှစ်ဦး ဒွိလမ်းဆန်",
    en: "The prisoner's dilemma",
    body: [
      ["ဂန္တဝင် ပုံပြင် — တိုက်မှုတစ်ခုမှာ သံသယရှိသူ နှစ်ယောက် ဖမ်းခံရတယ်။ တစ်ယောက်စီကို 'ဖော်ပြ' ရင် လွတ်ကင်းရာ ရမယ်လို့ ရဲက စကားလုံး ပေးတယ်။", "The classic story — two suspects are caught. Each is secretly offered freedom for confessing against the other."],
      ["နှစ်ယောက်လုံး မဖော်ပြရင် — ဒဏ်နည်းနည်း (နှစ်ယောက်လုံး အကောင်းဆုံး)။ တစ်ယောက်ဖော်ရင် ဖော်တဲ့သူ လွတ်။ နှစ်ယောက်လုံး ဖော်ရင် — ဒဏ်ပြင်းပြင်း။", "Both silent: light sentence (best for both). One confesses: confessor walks free. Both confess: heavy sentence for both."],
      ["ဆင်ခြင်တုံးတရားနဲ့ တွက်ရင် ဖော်ပြတာ အမြဲ ပိုကောင်းတယ် — ဒါပေမဲ့ ရလဒ်က နှစ်ယောက်လုံး ပိုဆိုးတယ်။ ဒါဟာ အကျဉ်းသား ဒွိလမ်းဆန်။", "Rational logic says confess — yet the result is worse for both. That tension is the dilemma."],
    ],
    take: "လက်ဖက်ရည်ဆိုင် ဈေးစစ်ပွဲ၊ နိုင်ငံကြီးတွေရဲ့ လက်နက်ပြိုင်ဆိုင်မှု — အပေါ်ယံ ကွဲပေမဲ့ တည်ဆောက်ပုံချင်း တူတဲ့ ပုံစံတွေပဲ။",
    takeEn: "A price war and an arms race look different, but underneath they are the same game.",
  },
  {
    id: "repeated",
    emoji: "🔁",
    mm: "ထပ်ခါထပ်ခါ ကစားပွဲ",
    en: "Repeated games & tit-for-tat",
    body: [
      ["တစ်ခါတည်းဆိုရင် ဖောက်ပြန်တာက ပိုအမြတ်။ ဒါပေမဲ့ နက်ဖြန် ထပ်တွေ့မယ်ဆိုရင် — နာမည်ဆိုး သယ်သွားရတယ်။ ဒါကြောင့် ထပ်ခါထပ်ခါ ကစားရတဲ့အခါ ပူးပေါင်းမှု ဖြစ်ထွန်းလာတယ်။", "In one round, cheating pays. But when you will meet again tomorrow, your reputation follows you — so cooperation can emerge."],
      ["၁၉၈၀ မှာ Robert Axelrod က ပညာရှင်တွေဆီက ဗျူဟာတွေ ကောက်ခံပြီး ပြိုင်ပွဲလုပ်တယ်။ အနိုင်ရတာက tit-for-tat — သူများကို စတင်ယုံကြည်တယ်၊ ဖောက်ပြန်ရင် ပြန်လဲတယ်၊ ပူးပေါင်းရင် ပြန်ပူးပေါင်းတယ်။", "In 1980 Robert Axelrod ran a tournament of strategies. The winner was tit-for-tat — start trusting, punish cheating, forgive cooperation."],
      ["tit-for-tat ရဲ့ သော့ချက် ၄ ချက် — ရက်ရောတယ် (အရင်ပူးပေါင်း)၊ ပြန်လဲတယ် (ဖောက်ပြန်ရင် ပြန်လုပ်တယ်)၊ ခွင့်လွှတ်တယ် (ပြန်ပူးပေါင်းရင် နောက်ပြန်လှည့်တယ်)၊ ရှင်းလင်းတယ် (လူတိုင်း နားလည်တယ်)။", "Tit-for-tat's four virtues — nice (cooperate first), retaliatory (punish cheating), forgiving (restore trust), clear (everyone can read it)."],
    ],
    take: "ရေရှည်ဆက်ဆံရေးမှာ — အမြဲဖောက်ပြန်တဲ့သူက ခေတ္တရနိုင်ပေမဲ့၊ ရက်ရောပြီး မျှတတဲ့သူက နောက်ဆုံးမှာ နိုင်တယ်။",
    takeEn: "Over the long run, the consistently dishonest may win rounds — the fair and forgiving win the tournament.",
  },
  {
    id: "commons",
    emoji: "🐟",
    mm: "မျှဝေထားတဲ့ အရင်းအမြစ်",
    en: "Tragedy of the commons",
    body: [
      ["အားလုံး သုံးနိုင်တဲ့ အရင်းအမြစ်တစ်ခုရှိတယ် — ငါးကန်၊ မြက်ခင်း၊ လေထု။ တစ်ဦးချင်းကြည့်ရင် ပိုယူတာ အမြဲ အကျိုးရှိတယ်။", "A resource everyone can use — a fish pond, a pasture, clean air. For each individual, taking more always pays."],
      ["ဒါပေမဲ့ အားလုံးက အများဆုံး ယူရင် — အရင်းအမြစ်က ပျက်သွားပြီး အားလုံး ဆုံးရှုံးတယ်။ အကျိုးက ကိုယ့်တစ်ဦးတည်း ရတယ်၊ ကုန်ကျစရိတ်က အားလုံး ခံရတယ်။", "But if everyone takes the maximum, the resource collapses and everyone loses. The gain is private; the cost is shared."],
      ["ဖြေရှင်းနည်း — စည်းမျဉ်း၊ ခွဲတမ်း၊ ပိုင်ဆိုင်မှု သတ်မှတ်ချက်၊ ပူးပေါင်းစီမံခန့်ခွဲမှု။ Elinor Ostrom က ဒီအကြောင်း လေ့လာလို့ ၂၀၀၉ နိုဘယ်ဆု ရတယ်။", "Solutions — rules, quotas, property rights, collective management. Elinor Ostrom won the 2009 Nobel for studying exactly this."],
    ],
    take: "အားလုံးပိုင်တဲ့ အရာတစ်ခု မပျက်စီးအောင် — စည်းမျဉ်းတွေ ဒါမှမဟုတ် ပူးပေါင်းမှု လိုတယ်။ 'ငါမယူရင် တစ်ပါးသူ ယူမယ်' ဆိုတဲ့ အတွေးက အားလုံးကို နစ်မြုပ်စေတယ်။",
    takeEn: "Common resources need rules or cooperation — 'if I don't take it, someone else will' is a trap for everyone.",
  },
  {
    id: "ultimatum",
    emoji: "✋",
    mm: "နောက်ဆုံးကမ်းလှမ်းမှု",
    en: "The ultimatum game",
    body: [
      ["ငွေတစ်ပုံး ခွဲဖို့ အဆိုပြုသူ တစ်ယောက်၊ လက်ခံ/ငြင်းပယ် လုပ်သူ တစ်ယောက်။ ငြင်းရင် နှစ်ယောက်လုံး ဘာမှ မရဘူး။", "One player proposes a split; the other accepts or rejects. Reject and both get nothing."],
      ["သင်္ချာအရ — 'တစ်ခုခုရတာက ဘာမှမရတာထက် ပိုကောင်းတယ်' ဆိုပြီး ဘာကိုမဆို လက်ခံသင့်တယ်။ ဒါပေမဲ့ ဓာတ်ခွဲခန်းတွေမှာ လူတွေက မတရားတဲ့ အဆိုပြုချက် (၂၀–၃၀% အောက်) ကို သုံးပုံတစ်ပုံလောက် ငြင်းပယ်တယ်။", "The math says accept anything — something beats nothing. But in labs, people reject unfair offers (under ~20–30%) about a third of the time."],
      ["ငြင်းပယ်တာက ကိုယ့်အတွက်လည်း ဆုံးရှုံးပေမဲ့ — 'ဒီလိုလုပ်ရင် ငါ မခံမယ်' ဆိုတဲ့ သင်ခန်းစာကို ပေးတယ်။ ဒါကြောင့် အဆိုပြုသူတွေက မျှတအောင် ကမ်းလှမ်းတတ်လာတယ်။", "Rejecting costs you too — but it teaches the proposer a lesson, which is how fairness norms are born."],
    ],
    take: "တရားမျှတမှုဆိုတာ စိတ်ကူးယဉ်မဟုတ်ဘူး — လူတွေက မတရားမှုကို ကိုယ့်အကျိုး စွန့်ပြီးတောင် အပြစ်ပေးတတ်လို့၊ မျှတမှုက ဈေးကွက်ထဲမှာ တကယ်တန်ဖိုးရှိတယ်။",
    takeEn: "Fairness is not a fantasy — people punish unfairness at their own cost, so fairness has real market value.",
  },
  {
    id: "zero",
    emoji: "⚔️",
    mm: "သုညပေါင်းဂိမ်း",
    en: "Zero-sum games",
    body: [
      ["ငါရတာက မင်းဆုံးရှုံးတာ — ပေါင်းလိုက်ရင် အမြဲ သုည။ ကျောက်တုံး-ကတ်ကြေး-အဝတ်၊ စစ်တုရင်၊ ကျန်တဲ့ မုန့်ဟင်းခါး တစ်ပန်းကန်။", "My gain is exactly your loss — the total is always zero. Rock-paper-scissors, chess, one last bowl of mohinga."],
      ["ဘဝမှာ ဒီလိုဂိမ်းတွေ ရှိသလို — နှစ်ယောက်လုံး အနိုင် (win-win) ဖြစ်နိုင်တဲ့ ဂိမ်းတွေလည်း ရှိတယ်။ ဒါကြောင့် 'ဒါ ဘယ်လို ဂိမ်းလဲ' ဆိုတာ အရင်ဆုံး သိဖို့ အရေးကြီးတယ်။", "Life has these — but also win-win games. So the first move is to read which kind of game you are in."],
    ],
    take: "ပြိုင်ပွဲတိုင်းက သုညပေါင်းမဟုတ်ဘူး — ဂိမ်းကို မှန်မှန် ဖတ်တတ်မှ မှန်မှန် ကစားနိုင်မယ်။",
    takeEn: "Not every contest is zero-sum — read the game right, and you can play it right.",
  },
  {
    id: "real",
    emoji: "🌏",
    mm: "ဒါက ဘာကြောင့် အရေးကြီးလဲ",
    en: "Why this matters",
    body: [
      ["ဈေးနှုန်း၊ ညှိနှိုင်းမှု၊ လေလံပွဲ၊ ရာသီဥတု သဘောတူညီချက်၊ ယာဉ်ကြော၊ ချိန်းတွေ့မှု၊ နိုင်ငံရေး — အားလုံးက လူတွေရဲ့ ရွေးချယ်မှုတွေ ပေါင်းစပ်ထားတဲ့ ဂိမ်းတွေပဲ။", "Pricing, negotiation, auctions, climate deals, traffic, dating, politics — all of it is games of interlocking choices."],
      ["ဂိမ်းသီအိုရီက 'နိုင်ဖို့' သင်ပေးတာမဟုတ်ဘူး — 'ဂိမ်းကို မြင်တတ်အောင်' သင်ပေးတာပဲ။ ကိုယ့်ရဲ့ ရွေးချယ်မှုတိုင်းရဲ့ နောက်မှာ ဘယ်လို တွက်ချက်မှုတွေ ရှိနေလဲ ဆိုတာကို။", "Game theory does not teach you to win — it teaches you to see the game, and the calculation inside every choice."],
    ],
    take: "နောက်တစ်ခါ လက်ဖက်ရည်ဆိုင်မှာ ထိုင်ရင်း — ပတ်ဝန်းကျင်က ဆုံးဖြတ်ချက်တွေရဲ့ ဂိမ်းတွေကို စကြည့်ကြည့်ပါ။",
    takeEn: "Next time you sit in a tea shop, try spotting the games hidden in the choices around you.",
  },
];

const QUIZZES = {
  l1: {
    kicker: "ဈေးစစ်ပွဲ · Price War",
    question: "ဈေးစစ်ပွဲမှာ နက်ရှ် မျှခြေ (Nash equilibrium) က ဘယ်ဟာလဲ?",
    options: [
      { t: "နှစ်ယောက်လုံး လျော်ကန်ဈေး (၃၀/၃၀)", ok: false, why: "ဒါက ပါရေတို အကောင်းဆုံးပဲ — ဒါပေမဲ့ တစ်ယောက်တည်း လျှော့ဈေး ပြောင်းရင် ၅၀ ရလို့ 'မျှခြေ' မဟုတ်ဘူး။" },
      { t: "နှစ်ယောက်လုံး လျှော့ဈေး (၁၀/၁၀)", ok: true, why: "မှန်ပါတယ် — တစ်ယောက်တည်း လျော်ကန်ဈေး ပြောင်းရင် ၀ ရလို့ ဘယ်သူမှ မပြောင်းချင်ဘူး။ ဒါက မျှခြေဖြစ်ပေမဲ့ အားလုံးအတွက် ဆိုးတယ်။" },
      { t: "ခင်ဗျား လျှော့ဈေး၊ သူ လျော်ကန် (၅၀/၀)", ok: false, why: "အဲဒီအခြေအနေမှာ ပြိုင်ဘက်က တစ်ယောက်တည်း လျှော့ဈေး ပြောင်းရင် ပိုကောင်းတယ် — ဒါကြောင့် မျှခြေ မဟုတ်ဘူး။" },
    ],
  },
  l2: {
    kicker: "တစ်ပတ်တာ အတွဲ · The Week",
    question: "Axelrod ရဲ့ ပြိုင်ပွဲမှာ tit-for-tat ဘာကြောင့် နိုင်ခဲ့တာလဲ?",
    options: [
      { t: "အမြဲ လျှော့ဈေး ဖောက်ပြန်လို့", ok: false, why: "အမြဲဖောက်ပြန်တဲ့သူတွေက စောစောပိုင်းမှာ ရပေမဲ့ — တစ်ယောက်တည်း ကစားသမားတွေကို နောက်ကနေ ကျော်သွားတယ်။" },
      { t: "ရက်ရော၊ ပြန်လဲ၊ ခွင့်လွှတ်၊ ရှင်းလင်းလို့", ok: true, why: "မှန်ပါတယ် — tit-for-tat က ယုံကြည်မှု ဖြစ်ထွန်းအောင် လုပ်တယ်၊ ဖောက်ပြန်မှုကို ပြန်လဲတယ်၊ ပူးပေါင်းမှုကို ခွင့်လွှတ်တယ်။ ရေရှည်မှာ ဒီဟာက အကောင်းဆုံး။" },
      { t: "ကျပန်း လှည့်လို့", ok: false, why: "ကျပန်း ကစားတာက ခန့်မှန်းလို့မရတဲ့သူပဲ — ယုံကြည်မှု မတည်ဆောက်နိုင်ဘူး။" },
    ],
  },
  l3: {
    kicker: "မျှဝေတဲ့ကန် · Shared Pond",
    question: "အကန့် (tragedy) ဘာကြောင့် ဖြစ်ရတာလဲ?",
    options: [
      { t: "လူတွေက သဘာဝအတိုင်း မကောင်းလို့", ok: false, why: "လူတွေက မကောင်းလို့ မဟုတ်ဘူး — ပုံစံတည်ဆောက်ပုံက ကိုယ့်အကျိုးနဲ့ အားလုံးရဲ့အကျိုး ဆန့်ကျင်နေလို့ပဲ။" },
      { t: "အကျိုးက တစ်ဦးချင်း ရတယ်၊ ကုန်ကျစရိတ်က အားလုံး ခံရတယ်", ok: true, why: "မှန်ပါတယ် — ငါးပိုယူတာက ကိုယ့်အတွက် ရတယ်၊ ဒါပေမဲ့ ကန်ပျက်တဲ့ စရိတ်က အားလုံး ခံရတယ်။ ဒါကြောင့် အားလုံး အများဆုံးယူရင် အားလုံး ဆုံးရှုံးတယ်။" },
      { t: "ငါးတွေ ပြန်မပေါက်လို့", ok: false, why: "ငါးတွေက ပြန်ပေါက်တယ် — ဒါပေမဲ့ ယူတာက ပေါက်တာထက် များနေရင် ကန်က လျော့နေတယ်။" },
    ],
  },
  l4: {
    kicker: "ခွဲဝေပွဲ · The Split",
    question: "မတရားတဲ့ ခွဲဝေမှု (ဥပမာ ၉–၁) ကို လူတွေ ဘာကြောင့် ငြင်းပယ်ပြီး ဘာမှ မရကြတာလဲ?",
    options: [
      { t: "သင်္ချာ မတွက်တတ်လို့", ok: false, why: "တွက်တတ်ပါတယ် — ၁ က ၀ ထက် ပိုကောင်းတာ သူတို့ သိတယ်။ ဒါပေမဲ့ မတရားမှုကို အပြစ်ပေးတာက ပိုအရေးကြီးတယ်လို့ ခံစားကြတယ်။" },
      { t: "မတရားမှုကို အပြစ်ပေးပြီး သင်ခန်းစာ ပေးဖို့", ok: true, why: "မှန်ပါတယ် — ကိုယ့်အကျိုး စွန့်ပြီးတောင် ငြင်းပယ်တာက 'ဒီလိုလုပ်ရင် ငါ မခံမယ်' ဆိုတဲ့ သတင်းစကား ပို့တာပဲ။ ဒီကနေ မျှတမှုရဲ့ စည်းမျဉ်း ဖြစ်ပေါ်လာတယ်။" },
      { t: "သူတို့ ငွေ မလိုလို့", ok: false, why: "ငွေလိုတာပါ — ဒါပေမဲ့ မတရားခံရတဲ့ ခံစားချက်က ငွေထက် ပိုလေးတယ်။" },
    ],
  },
};
