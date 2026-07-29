/* =============================================================
   Upstream — story data
   Pure writing: prologue, one scene per town, epilogue.
   Every line is bilingual { mm, en }. No DOM, no logic.
   Scenes are keyed by the town id that ENDS each leg.
   ============================================================= */
(function () {
  "use strict";

  const CAST = {
    hero:    { id: "hero",    en: "Phoe Yay",    mm: "ဖိုးရေ",      emoji: "🧑🏽‍🦱" },
    grandma: { id: "grandma", en: "Phwar Sein",  mm: "ဘွားစိန်",     emoji: "👵🏽" },
    boss:    { id: "boss",    en: "U Tun Kyi",   mm: "ဦးထွန်းကြည်",  emoji: "👨🏽‍🦳" },
    teaman:  { id: "teaman",  en: "Tea-shop uncle", mm: "လက်ဖက်ရည်ဆိုင် ဦးလေး", emoji: "🫖" },
    aunty:   { id: "aunty",   en: "Market aunty", mm: "ဈေးသည် အန်တီ", emoji: "👩🏽" },
    monk:    { id: "monk",    en: "U Nanda",     mm: "ဦးနန္ဒ",       emoji: "🧘🏽" },
    potter:  { id: "potter",  en: "Pot master",  mm: "အိုးဆရာ",      emoji: "👨🏽‍🎨" },
    mahout:  { id: "mahout",  en: "Ko Naw Seng", mm: "ကိုနောစိန်",   emoji: "🐘" },
    pilot:   { id: "pilot",   en: "Old pilot",   mm: "ရေကြောင်းပြ အဖိုး", emoji: "🧭" },
    girl:    { id: "girl",    en: "Ma Ja Seng",  mm: "မဂျာစိန်",     emoji: "👧🏽" },
    river:   { id: "river",   en: "The river",   mm: "မြစ်ကြီး",     emoji: "🌊" },
  };

  const PROLOGUE = {
    title: { en: "A letter from Pakokku", mm: "ပခုက္ကူက စာတစ်စောင်" },
    lines: [
      { who: "grandma", mm: "မြေးလေး ဖိုးရေ… ဒီနှစ် ဘွား အသက် ရှစ်ဆယ် ပြည့်ပြီ။", en: "Little one… this year your Phwar turns eighty." },
      { who: "grandma", mm: "ရေစက်ချ မင်္ဂလာအတွက် မြစ်ဆုံက ရေ တစ်ဗူး လိုချင်တယ်။ မြစ်နှစ်စင်း လက်ထပ်ရာ နေရာက ရေပေါ့။", en: "For the water-blessing I want one bottle from Myitsone — where the two rivers marry." },
      { who: "grandma", mm: "အလာလမ်းမှာ အိမ်ကို ဝင်ခဲ့ဦးနော်။ ဘွားက မုန့်လုပ်ထားမယ်။", en: "And stop by home on your way up. I'll have sweets ready." },
      { who: "boss", mm: "ပခုက္ကူအထိ မဟုတ်ဘူး၊ မြစ်ဆုံအထိ ဆန်တက်မယ် ဟုတ်လား။ ရွှေဟင်္သာကို ယူသွား။", en: "Not just to Pakokku — all the way to Myitsone, eh? Take the Shwe Hintha." },
      { who: "boss", mm: "လှေအိုပေမယ့် မြစ်ကို သိတယ်။ မင်း အဖိုးလို ရေကို ဖတ်တတ်ရင် ရောက်မှာပါ။", en: "She's old, but she knows this river. Read the water like your grandfather did and she'll carry you." },
      { who: "hero", mm: "ရန်ကုန်ကနေ မြစ်ညာအထိ… ကောင်းပြီ ဘွား။ မြေး လာပြီ။", en: "From Yangon to the headwaters… alright, Phwar. Your grandson is coming." },
    ],
  };

  const SCENES = {
    pyay: {
      arrive: { en: "Pyay, at dusk", mm: "ပြည်မြို့ ညနေခင်း" },
      lines: [
        { who: "teaman", mm: "ရန်ကုန်ကနေ ဆန်တက်လာတာလား။ ရွှေဆံတော်ဘုရားကို ဦးချပြီးမှ ဆက်သွားကွယ်။", en: "Upriver from Yangon? Bow to Shwesandaw pagoda before you go on." },
        { who: "hero", mm: "သင်္ဘောကြီးတွေကြားထဲ ညှပ်မလို့။ လက်ဖက်ရည် တစ်ခွက် လိုနေပြီ ဦးလေး။", en: "Nearly got flattened between two barges. I need that tea, uncle." },
        { who: "teaman", mm: "ရှေ့မှာ ရေတိမ်တယ်။ သဲသောင်ပေါ် တင်ရင် လှေဝမ်း ပွန်းသွားမယ်၊ သတိထား။", en: "Shallow water ahead. Ground her on a sandbar and you'll scrape the belly off her. Careful." },
      ],
    },
    magway: {
      arrive: { en: "Magway, under the toddy palms", mm: "မကွေး ထန်းတောအောက်" },
      lines: [
        { who: "aunty", mm: "မြေးက ဘယ်အထိလဲ။ …မြစ်ဆုံ? ဟယ်၊ ဘွားအတွက် ရေသွားခပ်တာကိုး။", en: "How far are you going, child? …Myitsone? Oh — fetching water for your grandmother." },
        { who: "aunty", mm: "ဒါဆို ထန်းလျက် ယူသွား။ ခရီးကြမ်းရင် ချိုတာလေး တစ်ခုခု ရှိသင့်တယ်။", en: "Then take some jaggery. A hard road should carry something sweet." },
        { who: "hero", mm: "မကွေးရေဝဲတွေက နာမည်ကြီးတယ်ဆို… ရှေ့မှာ ပိုဆိုးမယ် ထင်တယ်။", en: "If Magway's whirlpools are famous… I suspect it only gets worse upstream." },
        { who: "aunty", mm: "ဝဲထဲ မဝင်နဲ့၊ ဝဲဘေးက လှည့်။ မြစ်နဲ့ မခုန်နဲ့၊ မြစ်နဲ့ ကချေ။", en: "Never fight the spin — dance around it. You don't wrestle this river, you waltz with it." },
      ],
    },
    bagan: {
      arrive: { en: "Bagan, a thousand spires", mm: "ပုဂံ စေတီတစ်ထောင်" },
      lines: [
        { who: "monk", mm: "ညနေစောင်းရင် စေတီတွေက ရွှေရောင် တောက်တယ်။ တစ်ခဏ ရပ်ပြီး ကြည့်သွားပါ ဒကာ။", en: "At this hour the pagodas burn gold. Stop a moment and look, donor." },
        { who: "hero", mm: "အရှင်ဘုရား… ဒီမြင်ကွင်းအတွက်ဆို ရေဝဲတွေနဲ့ နပန်းလုံးရကျိုး နပ်ပါတယ်။", en: "Venerable one… a view like this is worth every whirlpool." },
        { who: "monk", mm: "မနက်ဖြန် ချင်းတွင်းမြစ်ဆုံကို ဖြတ်ရမယ်။ ရေနှစ်စင်း ဆုံရင် ရေက စိတ်တို တတ်တယ်။", en: "Tomorrow you cross where the Chindwin comes in. Where two waters meet, the river has a temper." },
        { who: "monk", mm: "ပြီးရင် ပခုက္ကူ ရောက်ပြီပေါ့။ အဘွားက စောင့်နေပြီ မဟုတ်လား။", en: "And then — Pakokku. Someone is waiting for you there, is she not?" },
      ],
    },
    pakokku: {
      arrive: { en: "Pakokku. Home.", mm: "ပခုက္ကူ။ အိမ်။" },
      home: true,
      lines: [
        { who: "hero", mm: "တံတားကြီးအောက် ဖြတ်လာတုန်းက ရင်ထဲမှာ တစ်မျိုးကြီးပဲ ဘွား။ ငယ်ငယ်က ဒီကမ်းမှာ ရေကူးသင်ခဲ့တာ။", en: "Passing under the big bridge did something to my chest, Phwar. I learned to swim on this bank." },
        { who: "grandma", mm: "မြေးလေး! လာ လာ၊ ထမင်းအရင်စား။ သနပ်ခါးတောက အမွှေးက မြို့ထဲအထိ လာတယ် မဟုတ်လား။", en: "My grandson! Come, eat first. You can smell the thanaka groves all the way from the river, can't you?" },
        { who: "hero", mm: "မန္တလေးအထိ ညဘက် မောင်းရမယ်။ မီးအိမ်တွေနဲ့ လမ်းရှာရမယ်တဲ့။", en: "The next run to Mandalay is a night run. They say you find the channel by lantern light." },
        { who: "grandma", mm: "ဒါဆို ဒါ ယူသွား။ မင်း အဖိုးရဲ့ ကြေးဝါ သံလိုက်အိမ်မြှောင်။ မြစ်ပေါ်မှာ သူ့ကို လမ်းပြခဲ့တာ နှစ်လေးဆယ်။", en: "Then take this. Your grandfather's brass compass. It showed him the way on this river for forty years." },
        { who: "grandma", mm: "အဖိုးက ပြောဖူးတယ် — မြစ်ကို မကြောက်နဲ့၊ မမေ့နဲ့။ ကြောက်ရင် လမ်းမှား၊ မေ့ရင် နစ်မယ်တဲ့။", en: "He used to say — never fear the river, never forget it. Fear it and you lose the channel; forget it and you sink." },
        { who: "hero", mm: "ဘွား… မြစ်ဆုံရေ အပြည့်ထည့်ပြီး ပြန်လာခဲ့မယ်။ ကတိ။", en: "Phwar… I'll come back with that bottle full of Myitsone water. Promise." },
        { who: "grandma", mm: "သိတယ်လေ။ မင်းက ပခုက္ကူသားပဲ ဟာ။ မြစ်က မင်း သွေးထဲမှာ ရှိပြီးသား။", en: "I know you will. You're Pakokku-born, child. The river is already in your blood." },
      ],
      gift: {
        id: "compass",
        en: "Grandfather's compass", mm: "အဖိုးရဲ့ သံလိုက်အိမ်မြှောင်",
        note: { en: "Coins drift toward the boat. (Hintha charm, level 1)", mm: "အသပြာတွေ လှေဆီ မျောလာမယ်။" },
      },
    },
    mandalay: {
      arrive: { en: "Mandalay, lights on the hill", mm: "မန္တလေး တောင်ပေါ်မီးရောင်" },
      lines: [
        { who: "girl", mm: "ညဘက် တစ်ယောက်တည်း မောင်းလာတာလား! မီးအိမ်နီတွေကို မတိုက်ဘူးနော်။", en: "You ran the night water alone?! And didn't hit a single red lantern?" },
        { who: "hero", mm: "အဖိုးရဲ့ သံလိုက်အိမ်မြှောင်က ကူတယ်။ စိန်ပန်းပုံ တံတားအောက် ဖြတ်တုန်း မီးတွေ တောက်နေတာ မမေ့နိုင်ဘူး။", en: "Grandfather's compass helped. And the old bridge all lit up — I won't forget that." },
        { who: "girl", mm: "ရှေ့ လမ်းက မိုးကြီးမယ်တဲ့။ ကျောက်မြောင်းဘက် မုန်တိုင်း ဝင်နေတယ်။", en: "Storm warning upriver. A squall is sitting on the Kyaukmyaung reach." },
        { who: "hero", mm: "မိုးထဲမှာ လှေအို တစ်စင်း၊ လူတစ်ယောက်။ …သွားရမှာပဲလေ။", en: "One old boat, one boy, one storm. …Well. The water won't fetch itself." },
      ],
    },
    kyaukmyaung: {
      arrive: { en: "Kyaukmyaung, town of great jars", mm: "ကျောက်မြောင်း အိုးကြီးတွေရဲ့မြို့" },
      lines: [
        { who: "potter", mm: "မုန်တိုင်းထဲက ထွက်လာတာလား ကလေး။ ဝင် ဝင်၊ မီးဖိုနားမှာ ခြောက်အောင် လှမ်း။", en: "Out of that squall, boy? In, in — dry off by the kiln." },
        { who: "potter", mm: "ဒီအိုးကြီးတွေ မြစ်ကြောင်းတစ်လျှောက် ဆင်းသွားတာ နှစ်တစ်ရာ ကျော်ပြီ။ မြစ်က ကုန်လမ်း၊ ရေလမ်း၊ အသက်လမ်း။", en: "These jars have ridden this river for a hundred years. The river is road, trade, and life itself." },
        { who: "hero", mm: "အခုမှ သိတယ် — မိုးထဲမှာ မျောလာတဲ့ သစ်တုံးက သင်္ဘောထက် ကြောက်စရာ ပိုကောင်းတယ်။", en: "Today I learned a drifting log in the rain is scarier than any barge." },
        { who: "potter", mm: "ရှေ့မှာ ကျွန်းသစ်ဖောင်တွေ ဆီးကြိုမယ်။ ဖောင်ကြီးတွေ့ရင် စောစော ရွေး၊ နောက်ကျရင် နေရာ မရှိဘူး။", en: "Teak rafts ahead. Pick your side early — a raft leaves no room for late decisions." },
      ],
    },
    katha: {
      arrive: { en: "Katha, the quiet bend", mm: "ကသာ တိတ်ဆိတ်တဲ့ မြစ်ကွေ့" },
      lines: [
        { who: "mahout", mm: "ကမ်းပေါ်က ဆင်တွေ မြင်လား။ သစ်ဆွဲပြီး နားနေကြတာ။ မင်းလည်း နားသင့်ပြီ ပုံရတယ်။", en: "See the elephants on the bank? Resting after hauling teak. You look like you could use the same." },
        { who: "hero", mm: "ဖောင်ကြီးတွေကြားက လှိုက်လာတာ… လက်တွေ တောင့်နေပြီ ကိုနောစိန်။", en: "Weaving through those rafts… my arms have opinions now, Ko Naw Seng." },
        { who: "mahout", mm: "ရှေ့မှာ မြစ်ကျဉ်း စောင့်နေတယ်။ ကျောက်နံရံ နှစ်ဖက်ကြားမှာ မြစ်တစ်ခုလုံး ညှစ်ထားသလို ကျဉ်းတယ်။", en: "The defile waits upstream. Cliff walls both sides — the whole river squeezed into a corridor." },
        { who: "mahout", mm: "အသံက နံရံမှာ ပြန်လာမယ်။ ကိုယ့်စက်သံ ကိုယ် ပြန်ကြားရင် — အလယ်ကြောင်းကနေ မခွာနဲ့။", en: "Your engine will echo off the rock. When you hear yourself twice — hold the center line." },
      ],
    },
    bhamo: {
      arrive: { en: "Bhamo, gate of the north", mm: "ဗန်းမော် မြောက်ဘက်တံခါး" },
      lines: [
        { who: "pilot", mm: "မြစ်ကျဉ်းကို တစ်ယောက်တည်း ဖြတ်လာတယ်ဆိုတော့… မင်း မျက်လုံးက ငယ်ပေမယ့် လက်က အိုပြီ။", en: "Through the defile alone… your eyes are young but your hands have grown old, boy." },
        { who: "hero", mm: "အဖိုးလည်း ဒီလမ်းကြောင်း မောင်းဖူးတယ် ကြားဖူးတယ်။ ဦးလေး သူ့ကို သိလား။", en: "They say my grandfather ran this reach too. Did you know him, uncle?" },
        { who: "pilot", mm: "ကြေးဝါ သံလိုက်အိမ်မြှောင်နဲ့ လူကြီးလား။ ဟ! မြစ်တစ်ခုလုံးက သူ့ကို သိတယ်။ မင်းက သူ့မြေးကိုး။", en: "The man with the brass compass? Ha! The whole river knew him. So you're his grandson." },
        { who: "pilot", mm: "ဒါဆို ဆက်သွား။ မြစ်ကြီးနားကို ကျော်ရင် မြစ်ဆုံပဲ။ ရေက ကြမ်းမယ်၊ ဒါပေမယ့် မင်း သွေးက မှတ်မိလိမ့်မယ်။", en: "Then go on. Past Myitkyina lies the confluence. The water turns wild — but your blood will remember the way." },
      ],
    },
    myitkyina: {
      arrive: { en: "Myitkyina, last town before the meeting", mm: "မြစ်ကြီးနား မြစ်ဆုံမတိုင်ခင် နောက်ဆုံးမြို့" },
      lines: [
        { who: "girl", mm: "ဒီကနေ မြစ်ဆုံအထိက အကြမ်းဆုံး အပိုင်း။ ကျောက်တန်း၊ ရေကြမ်း၊ အကုန်လုံး တစ်ပြိုင်နက်။", en: "From here to Myitsone is the wildest reach. Shoals, rapids — everything at once." },
        { who: "hero", mm: "ဗူးလေးက ဒီမှာ။ ဘွားရဲ့ ရေစက်ချပွဲက လာမယ့်လ။ နောက်ဆုံး တစ်ပိုင်းပဲ ကျန်တော့တယ်။", en: "The bottle is right here. Phwar's ceremony is next month. One last leg." },
        { who: "girl", mm: "မေခက အရှေ့ကလာ၊ မလိခက အနောက်က။ နှစ်စင်း ဆုံရင် ရေရောင်တောင် မတူဘူး — ကိုယ့်မျက်စိနဲ့ တွေ့ရလိမ့်မယ်။", en: "The N'Mai comes from the east, the Mali from the west. Where they meet, even the water is two colors — you'll see it with your own eyes." },
        { who: "hero", mm: "အဖိုးရဲ့ သံလိုက်အိမ်မြှောင်က မြောက်ကိုပဲ ညွှန်နေတယ်။ …သွားကြစို့ ရွှေဟင်္သာ။", en: "Grandfather's compass points north, steady as ever. …One more run, Shwe Hintha." },
      ],
    },
    myitsone: {
      arrive: { en: "Myitsone — where the rivers marry", mm: "မြစ်ဆုံ — မြစ်နှစ်စင်း လက်ထပ်ရာ" },
      finale: true,
      lines: [
        { who: "river", mm: "…", en: "…" },
        { who: "hero", mm: "ရောက်ပြီ။ မေခနဲ့ မလိခ။ ရေနှစ်ရောင်က တကယ်ပဲ ယှဉ်စီးနေတယ်။", en: "Here it is. The N'Mai and the Mali. Two colors of water, running side by side." },
        { who: "hero", mm: "ဘွားရေ… မြေး ရောက်ပြီ။ ဗူးထဲ ရေ ဖြည့်ပြီ။", en: "Phwar… your grandson made it. The bottle is filling." },
        { who: "hero", mm: "အဖိုး… မြစ်ကို မကြောက်ခဲ့ဘူး၊ မမေ့ခဲ့ဘူး။ အိမ်မြှောင်က လမ်းပြခဲ့တယ်။", en: "Grandfather… I never feared her, and I never forgot her. Your compass showed the way." },
      ],
      epilogue: [
        { mm: "လအနည်းငယ်ကြာပြီးနောက် — ပခုက္ကူ။", en: "Some weeks later — Pakokku." },
        { mm: "ဘွားစိန်ရဲ့ အသက် ရှစ်ဆယ်ပြည့် ရေစက်ချပွဲမှာ မြစ်ဆုံရေက ငွေဖလားထဲကနေ တစ်စက်ချင်း ကျတယ်။", en: "At Phwar Sein's eightieth water-blessing, Myitsone water fell drop by drop from a silver bowl." },
        { mm: "«မြစ်နှစ်စင်း ဆုံသလို မိသားစုလည်း ဆုံပါစေ» လို့ ဘွားက ဆုတောင်းတယ်။", en: "\"As two rivers meet and become one, may this family always find its way together,\" she prayed." },
        { mm: "ဖိုးရေကတော့ ကမ်းနားထိုင်ပြီး မြစ်ကို ကြည့်နေတယ်။ မြစ်က မြောက်ကနေ လာတယ်။ သူ သိတယ် — ဘယ်လောက်ဝေးဝေး၊ မြစ်က အိမ်ကို အမြဲ ပြန်ပို့တယ်။", en: "Phoe Yay sat on the bank and watched the river come down from the north. He knew now — however far it runs, the river always carries you home." },
      ],
    },
  };

  window.UpstreamStory = {
    cast: CAST,
    prologue: PROLOGUE,
    scenes: SCENES,
    heroName: CAST.hero,
    boatName: { en: "Shwe Hintha", mm: "ရွှေဟင်္သာ" },
  };
})();
