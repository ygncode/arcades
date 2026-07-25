/**
 * Mingala Trail — story.js
 *
 * ALL the writing. Nothing here knows about pixels.
 *
 * THE SPINE
 *   Phoe Chit's grandfather, U Ba Nyein (ဦးဘငြိမ်း), spent forty years as a postal
 *   runner. Before he died he wrote ten letters and left instructions that the boy
 *   deliver them by hand, in route order. He didn't say why.
 *   The tenth envelope has Phoe Chit's own name on it.
 *
 * DIALOGUE
 *   { start, nodes } where start is a node id, or a list of {if, to} tried in order.
 *   node: { who, text:{my,en}, effect, choices:[{text, to, if, effect}], to, letter }
 *   Effects use the systems.js language: { learn, forget, give, take, kyat, hours, record }
 *   Conditions: "flag" · "!flag" · {flag,notFlag,item,kyat} · arrays (all must hold)
 *
 * QUESTS
 *   Objectives are derived from flags, never a step counter, so anything — a line of
 *   dialogue, a pickup, a minigame — can advance them.
 *
 * Exposes: window.TrailStory
 */
window.TrailStory = (() => {
  "use strict";

  // ═══════════════════════════════════════════════════════════
  // PEOPLE
  // ═══════════════════════════════════════════════════════════
  const people = {
    "phoe-chit": {
      name: { my: "ဖိုးချစ်", en: "Phoe Chit" }, portrait: "phoe-chit",
      note: { my: "ငါ့ကိုယ်ငါ။ ဆယ့်နှစ်နှစ်။ စာအိတ်ဆယ်စောင်။", en: "Me. Twelve years old. Ten envelopes." },
    },
    "u-ba-nyein": {
      name: { my: "ဦးဘငြိမ်း", en: "U Ba Nyein" }, portrait: "u-ba-nyein",
      note: { my: "အဖိုး။ စာပို့သမား လေးဆယ်နှစ်။", en: "Grandfather. Forty years carrying other people's words." },
    },

    "ko-myint-swe": { name: { my: "ကိုမြင့်ဆွေ", en: "Ko Myint Swe" }, portrait: "teashop",
      note: { my: "လက်ဖက်ရည်ဆိုင်ရှင်။ မြို့ထဲက သတင်းအားလုံး သူ့ဆီ ရောက်တယ်။", en: "Runs the tea shop. Every rumour in Yangon passes his counter." } },
    "daw-khin-khin": { name: { my: "ဒေါ်ခင်ခင်", en: "Daw Khin Khin" }, portrait: "vendor",
      note: { my: "ကွမ်းသည်။ လမ်းထောင့်မှာ လေးဆယ်နှစ်။", en: "Betel seller. Forty years on the same corner." } },
    "maung-tint": { name: { my: "မောင်တင့်", en: "Maung Tint" }, portrait: "kid",
      note: { my: "ကလေး။ ဘောလုံး ပျောက်နေတယ်။", en: "A boy who has lost his ball." } },
    "ko-bo": { name: { my: "ကိုဘိုး", en: "Ko Bo" }, portrait: "driver",
      note: { my: "ဆိုက်ကားသမား။ ဈေးမညှိဘူး။", en: "Trishaw driver. Does not haggle." } },
    "daw-nilar": { name: { my: "ဒေါ်နီလာ", en: "Daw Nilar" }, portrait: "clerk",
      note: { my: "စာတိုက်စာရေး။ အဖိုးနဲ့ အလုပ်တူတူ လုပ်ဖူးတယ်။", en: "Post office clerk. She worked the same counter as your grandfather." } },
    "u-sein-hla": { name: { my: "ဦးစိန်လှ", en: "U Sein Hla" }, portrait: "printer",
      note: { my: "ပုံနှိပ်သမား။ အဖိုးကို စာဖတ်တတ်အောင် သင်ပေးခဲ့သူ။", en: "Printer. He taught your grandfather to read." } },

    "ma-nu": { name: { my: "မနု", en: "Ma Nu" }, portrait: "woman",
      note: { my: "ဆွမ်းလောင်းသူ။ မနက်တိုင်း ထမင်းချက်တယ်။", en: "Cooks for the alms round every morning without fail." } },
    "ko-htay": { name: { my: "ကိုဌေး", en: "Ko Htay" }, portrait: "vendor",
      note: { my: "ပန်းသည်။ ဈေးဆစ်ရင် ဝမ်းသာတယ်။", en: "Flower seller. Enjoys being haggled with." } },
    "novice-thu": { name: { my: "ကိုရင်သူ", en: "Novice Thu" }, portrait: "monk",
      note: { my: "ကိုရင်လေး။ တစ်ဆယ့်တစ်နှစ်။", en: "Eleven years old, and taking it seriously." } },
    "sayadaw-u-kaythara": { name: { my: "ဆရာတော် ဦးကေသရ", en: "Sayadaw U Kaythara" }, portrait: "monk",
      note: { my: "ကျောင်းထိုင်ဆရာတော်။ အဖိုးကို နှစ်လ နေရာပေးခဲ့သူ။", en: "Abbot. He gave your grandfather a floor to sleep on for two months." } },

    "ko-zaw": { name: { my: "ကိုဇော်", en: "Ko Zaw" }, portrait: "fisherman",
      note: { my: "တံငါသည်။ တံတားအောက်မှာ မျှားတယ်။", en: "Fishes under the bridge, mostly for the quiet." } },
    "daw-tin-mya": { name: { my: "ဒေါ်တင်မြ", en: "Daw Tin Mya" }, portrait: "elder",
      note: { my: "အသက်ရှစ်ဆယ့်လေး။ တံတားကို ဆောက်တာ မြင်ဖူးတယ်။", en: "Eighty-four. She remembers the bridge being repaired twice." } },
    "ma-phyu": { name: { my: "မဖြူ", en: "Ma Phyu" }, portrait: "woman",
      note: { my: "ဦးထွန်းရင်ရဲ့ သမီး။", en: "U Tun Yin's daughter." } },
    "u-tun-yin": { name: { my: "ဦးထွန်းရင်", en: "U Tun Yin" }, portrait: "elderman",
      note: { my: "ရွှေထုသမား။ လက်တွေ တုန်နေပြီ။", en: "Gold-beater. His hands shake now." } },

    "daw-hla": { name: { my: "ဒေါ်လှ", en: "Daw Hla" }, portrait: "elder",
      note: { my: "မီးခွက်ရောင်းသူ။ စေတီတိုင်း သိတယ်။", en: "Sells oil lamps. Knows every stupa by its shadow." } },
    "ko-nyi": { name: { my: "ကိုညီ", en: "Ko Nyi" }, portrait: "guide",
      note: { my: "လမ်းပြ။ ဧည့်သည်တွေကို လှည့်ပြတယ်။", en: "A guide, when there are visitors." } },
    "ma-ei-mon": { name: { my: "မအိမွန်", en: "Ma Ei Mon" }, portrait: "vendor",
      note: { my: "ယွန်းထည်လုပ်သူ။", en: "Makes lacquerware, badly, and knows it." } },
    "u-thaung": { name: { my: "ဦးသောင်း", en: "U Thaung" }, portrait: "elderman",
      note: { my: "စေတီစောင့်။ ရှစ်နှစ် ဒီမှာ ထိုင်နေတယ်။", en: "Keeps this one stupa. Has sat here eight years." } },

    "ko-nyunt": { name: { my: "ကိုညွန့်", en: "Ko Nyunt" }, portrait: "fisherman",
      note: { my: "ခြေထောက်နဲ့ လှော်တဲ့ တံငါသည်။", en: "Leg-rower. Says it is easier than it looks, which is a lie." } },
    "daw-mya-yee": { name: { my: "ဒေါ်မြရီ", en: "Daw Mya Yee" }, portrait: "elder",
      note: { my: "ရွာထဲက အသက်အကြီးဆုံး။", en: "The oldest woman on the water." } },
    "maung-oo": { name: { my: "မောင်အုန်း", en: "Maung Oo" }, portrait: "kid",
      note: { my: "ကလေး။ လှေမောင်းချင်တယ်။", en: "Wants to row before he can swim." } },
    "daw-sein": { name: { my: "ဒေါ်စိန်", en: "Daw Sein" }, portrait: "elder",
      note: { my: "ကြာချည် ရက်သူ။ အဖိုးအတွက် လုံချည် ချုပ်ပေးခဲ့သူ။", en: "Lotus-thread weaver. She once made your grandfather a longyi." } },

    "ko-aung": { name: { my: "ကိုအောင်", en: "Ko Aung" }, portrait: "guide",
      note: { my: "တောင်တက်လမ်းပြ။ ဒူးနာနေပြီ။", en: "Trekking guide. His knees have opinions now." } },
    "daw-shwe": { name: { my: "ဒေါ်ရွှေ", en: "Daw Shwe" }, portrait: "vendor",
      note: { my: "လမ်းဘေး ကော်ဖီသည်။", en: "Sells coffee at the bend where everyone stops." } },
    "maung-kyaw": { name: { my: "မောင်ကျော်", en: "Maung Kyaw" }, portrait: "kid",
      note: { my: "ကျောင်းသား။ တောင်ပေါ် နေ့တိုင်း တက်တယ်။", en: "Walks up the ridge to school. Every day." } },
    "saya-ma-khin": { name: { my: "ဆရာမ ခင်", en: "Saya Ma Khin" }, portrait: "woman",
      note: { my: "ဆရာမ။ ငါ့အမေကို သင်ပေးခဲ့သူ။", en: "The teacher who taught my mother." } },

    "ma-thida": { name: { my: "မသီတာ", en: "Ma Thida" }, portrait: "vendor",
      note: { my: "ပန်းသည်။ မြင်းလှည်း တစ်နေ့တစ်ခေါက်။", en: "Flower seller. One cart a day, and it does not wait." } },
    "u-maung-gale": { name: { my: "ဦးမောင်ငယ်", en: "U Maung Gale" }, portrait: "driver",
      note: { my: "မြင်းလှည်းသမား။", en: "Drives the horse cart, and the horse knows it." } },
    "daw-yin-nwe": { name: { my: "ဒေါ်ယဉ်နွယ်", en: "Daw Yin Nwe" }, portrait: "elder",
      note: { my: "စာလက်မခံသူ။ အကြောင်းရှိတယ်။", en: "Refused the letter. She has her reasons." } },
    "ko-lwin": { name: { my: "ကိုလွင်", en: "Ko Lwin" }, portrait: "clerk",
      note: { my: "ဥယျာဉ်မှူး။", en: "Keeps the glasshouse, and the town's memory with it." } },

    "u-thila": { name: { my: "ဦးသီလ", en: "U Thila" }, portrait: "monk",
      note: { my: "မြူထဲက ဘုန်းကြီး။", en: "A monk in the fog, entirely unbothered by it." } },
    "ma-hla-nu": { name: { my: "မလှနု", en: "Ma Hla Nu" }, portrait: "woman",
      note: { my: "ဦးကျော်ဇံရဲ့ သမီး။", en: "U Kyaw Zan's daughter. She kept his chair." } },
    "ko-san-shwe": { name: { my: "ကိုစံရွှေ", en: "Ko San Shwe" }, portrait: "guide",
      note: { my: "မြူထဲ လမ်းပြတတ်သူ။", en: "Can find any temple in this fog, and charges for it." } },

    "maung-lay": { name: { my: "မောင်လေး", en: "Maung Lay" }, portrait: "kid",
      note: { my: "ကလေး။ ဂူထဲ ဝင်ရဲတယ်။", en: "Not afraid of the cave. Says so twice, which settles it." } },
    "daw-aye": { name: { my: "ဒေါ်အေး", en: "Daw Aye" }, portrait: "elder",
      note: { my: "ဆေးရွက်ကြီး ရောင်းသူ။", en: "Sells cheroots and other people's history." } },
    "u-po-thin": { name: { my: "ဦးဖိုးသိန်း", en: "U Po Thin" }, portrait: "elderman",
      note: { my: "အဖိုးကို ဒေါသထွက်နေဆဲ။ အကြောင်းရှိတယ်။", en: "Still angry at your grandfather. With cause." } },

    "u-hla-win": { name: { my: "ဦးလှဝင်း", en: "U Hla Win" }, portrait: "fisherman",
      note: { my: "ကမ်းခြေက တံငါသည်။", en: "Fishes the shallows, reads the tide like a timetable." } },
    "daw-thein-yi": { name: { my: "ဒေါ်သိန်းရီ", en: "Daw Thein Yi" }, portrait: "elder",
      note: { my: "အဖိုးရဲ့ နောက်ဆုံးစာကို သိမ်းထားပေးခဲ့သူ။", en: "She kept the last envelope for a year, as asked." } },
    "ma-su": { name: { my: "မစု", en: "Ma Su" }, portrait: "woman",
      note: { my: "ကမ်းခြေမှာ ဆိုင်ဖွင့်ထားသူ။", en: "Runs the shack at the end of the beach." } },
  };

  // ═══════════════════════════════════════════════════════════
  // ITEMS
  // ═══════════════════════════════════════════════════════════
  const items = {
    satchel: { name: { my: "အဖိုးရဲ့ အိတ်", en: "Grandfather's satchel" }, sprite: "routebook" },
    "letter-1": { name: { my: "စာ (၁)", en: "Letter one" }, sprite: "sealedletter" },
    "letter-2": { name: { my: "စာ (၂)", en: "Letter two" }, sprite: "sealedletter" },
    bouquet: { name: { my: "ပန်းစည်း", en: "A bouquet" }, sprite: "flower" },
    tinbox: { name: { my: "သံဘူးလေး", en: "A tin box" }, sprite: "key" },
    torch: { name: { my: "မီးရှူး", en: "A torch" }, sprite: "torch" },
    sketch: { name: { my: "ပုံကြမ်း", en: "The sketch" }, sprite: "sketch" },
  };

  // ═══════════════════════════════════════════════════════════
  // THE TEN LETTERS
  // ═══════════════════════════════════════════════════════════
  const L = (my, en) => ({ my, en });

  const letters = {
    yangon: {
      to: L("ဦးစိန်လှ ထံသို့", "To U Sein Hla"),
      body: [
        L("စိန်လှရေ။ ငါ့စာကို မင်း ဖတ်နေတယ်ဆိုရင် ငါ မရှိတော့ဘူး။",
          "Sein Hla. If you are reading this, I am not here."),
        L("ငါ အသက်သုံးဆယ့်တစ်နှစ်အထိ စာမဖတ်တတ်ဘူးဆိုတာ မင်းပဲ သိတယ်။ တစ်ယောက်တည်း သိတယ်။",
          "You are the only person who knew I could not read until I was thirty-one."),
        L("မင်းက ငါ့ကို ဘယ်တော့မှ မမေးဘူး။ စာလုံးတွေကို စက်ပေါ်မှာ စီပြပြီး 'ဒါက ဘာလဲ' လို့ပဲ ပြောတယ်။",
          "You never once asked. You set the letters on the machine and said only, what does that say."),
        L("လေးဆယ်နှစ်လုံး သူများစာတွေ သယ်ခဲ့တယ်။ ငါ့စာ ငါ ရေးနိုင်တာ မင်းကြောင့်ပဲ။",
          "Forty years I carried other people's words. I could write my own because of you."),
      ],
      fragment: L("အဖိုးက အသက် ၃၁ နှစ်မှ စာဖတ်တတ်တာ။ ဦးစိန်လှက သင်ပေးခဲ့တယ်။",
        "Grandfather learned to read at thirty-one. U Sein Hla taught him, and told no one."),
    },
    bago: {
      to: L("ဆရာတော် ဦးကေသရ ထံသို့", "To Sayadaw U Kaythara"),
      body: [
        L("၁၉၇၉ ခုနှစ်၊ မိုးတွင်း။ တပည့်တော် ကျောင်းကြမ်းပြင်မှာ နှစ်လ အိပ်ခဲ့ပါတယ်။",
          "The monsoon of 1979. I slept two months on your floor."),
        L("ဘာလို့လဲလို့ ဆရာတော် တစ်ခါမှ မမေးဘူး။ ဆွမ်းချိန်တိုင်း နှစ်ယောက်စာ ချထားပေးတယ်။",
          "You never asked why. You simply set out two bowls at the meal, every day."),
        L("အဲဒီအချိန်က တပည့်တော် အိမ်မပြန်ရဲဘူး။ အခုတော့ ပြန်ခဲ့ပြီးပါပြီ။ အားလုံး အဆင်ပြေသွားပါပြီ။",
          "I could not go home then. I went home later. It came right in the end."),
      ],
      fragment: L("၁၉၇၉ မှာ အဖိုး အိမ်မပြန်ဘဲ ကျောင်းမှာ နှစ်လ နေခဲ့တယ်။ ဘာလို့လဲ မသိရသေးဘူး။",
        "In 1979 grandfather could not go home for two months. He never said why."),
    },
    mandalay: {
      to: L("ဦးထွန်းရင် ထံသို့", "To U Tun Yin"),
      body: [
        L("ထွန်းရင်ရေ။ ငါ့မိန်းမ နေမကောင်းတုန်းက မင်း ရွှေတစ်ရွက် ငါ့လက်ထဲ ထည့်ပေးခဲ့တယ်။",
          "Tun Yin. When my wife was ill you put one leaf of gold into my hand."),
        L("'ရောင်းလိုက်' ပဲ ပြောတယ်။ ငါ ကျေးဇူးတင်တယ်လို့ မပြောလိုက်ရဘူး။ မင်းက လှည့်သွားပြီးသား။",
          "You said only, sell it. I did not get to thank you. You had already turned away."),
        L("သူမ နောက်ထပ် ဆယ့်တစ်နှစ် နေခဲ့တယ်။ ဒါက မင်းပေးတဲ့ ဆယ့်တစ်နှစ်။",
          "She lived eleven more years. Those eleven years were yours."),
      ],
      fragment: L("အဖိုးရဲ့ ဇနီး နေမကောင်းတုန်းက ဦးထွန်းရင်က ရွှေတစ်ရွက် ပေးခဲ့တယ်။",
        "When grandmother was ill, a gold-beater in Mandalay gave grandfather a leaf of gold and walked away."),
    },
    bagan: {
      to: L("စေတီစောင့် ထံသို့", "To whoever keeps this stupa"),
      body: [
        L("ဒီစာကို လိပ်စာ မရေးထားပါဘူး။ ဘာလို့လဲဆိုတော့ လိပ်စာက လူမဟုတ်လို့ပါ။",
          "This letter has no name on it because the address is not a person."),
        L("၁၉၈၄ မှာ ဒီစေတီအောက်မှာ ငါ စာတစ်စောင် မြှုပ်ခဲ့တယ်။ ပို့ဖို့ ပျက်ကွက်ခဲ့တဲ့ စာ။",
          "In 1984 I buried a letter under this stupa. One I failed to deliver."),
        L("စာပို့သမားတစ်ယောက် ပျက်ကွက်ရင် ဘယ်လို ဖြေရမလဲ ငါ မသိခဲ့ဘူး။ ဒါကြောင့် မြှုပ်လိုက်တာ။",
          "I did not know what a runner does when he fails, so I put it in the ground."),
        L("မြှုပ်တာနဲ့ မပို့တာ တူတယ်လို့ အခုတော့ ငါ သိပြီ။",
          "I know now that burying a thing and not delivering it are the same thing."),
      ],
      fragment: L("၁၉၈၄ မှာ အဖိုး စာတစ်စောင် ပို့ဖို့ ပျက်ကွက်ပြီး စေတီအောက် မြှုပ်ခဲ့တယ်။",
        "In 1984 grandfather failed to deliver a letter, and buried it under a stupa rather than admit it."),
    },
    inle: {
      to: L("ဒေါ်စိန် ထံသို့", "To Daw Sein"),
      body: [
        L("စိန်ရေ။ မင်းချုပ်ပေးတဲ့ လုံချည်ကို ငါ တစ်ခါမှ မဝတ်ခဲ့ဘူး။",
          "Sein. I never wore the longyi you made me."),
        L("ကောင်းလွန်းလို့ပါ။ စာပို့သမားက ဒီလောက်ကောင်းတာ ဝတ်လို့ မဖြစ်ဘူးလို့ ထင်ခဲ့တယ်။",
          "It was too fine. I thought a postman had no business in cloth like that."),
        L("အခု ပြန်တွေးတော့ — မင်းက အဲဒါကို လေးလ ရက်ခဲ့တာ။ ငါက ပုံးထဲ လေးဆယ်နှစ် ထားခဲ့တာ။",
          "Looking back: it took you four months to weave. It took me forty years to leave it in a box."),
        L("ဒါက မင်းရဲ့ အမှား မဟုတ်ဘူး။ ငါ့အမှား။",
          "That was not your mistake. It was mine."),
      ],
      fragment: L("ဒေါ်စိန် ရက်ပေးတဲ့ လုံချည်ကို အဖိုး လေးဆယ်နှစ်လုံး မဝတ်ခဲ့ဘူး။",
        "A weaver spent four months on a longyi for him. He kept it in a box for forty years."),
    },
    kalaw: {
      to: L("ဆရာမ ခင် ထံသို့", "To Saya Ma Khin"),
      body: [
        L("ဆရာမရေ။ ကျွန်တော့်သမီးကို ဆရာမ သင်ပေးခဲ့တယ်။ မလှမြင့်ပါ။",
          "You taught my daughter. Ma Hla Myint."),
        L("သူမ အခု ဆရာမ ဖြစ်နေပြီ။ သူ့သားက ဒီစာကို သယ်လာမှာ ဖြစ်ပါတယ်။",
          "She is a teacher herself now. Her son is the one carrying this."),
        L("ဆရာမ သူ့ကို 'မင်းက ထက်တယ်၊ ဒါပေမယ့် ပျင်းတယ်' လို့ ပြောခဲ့တာ သူ မှတ်မိသေးတယ်။ တစ်သက်လုံး မှတ်မိနေမှာ။",
          "She still remembers you telling her she was clever but lazy. She will remember it all her life."),
      ],
      fragment: L("ငါ့အမေကို သင်ပေးခဲ့တဲ့ ဆရာမ။ အမေက အခု ဆရာမ ဖြစ်နေတယ်။",
        "The teacher who taught my mother. My mother is a teacher now because of her."),
    },
    "pyin-oo-lwin": {
      to: L("ဒေါ်ယဉ်နွယ် ထံသို့", "To Daw Yin Nwe"),
      body: [
        L("ယဉ်နွယ်ရေ။ မင်း ဒီစာကို လက်မခံဘူးဆိုတာ ငါ သိတယ်။ ဒါပေမယ့် ရေးရမှာပဲ။",
          "Yin Nwe. I know you will not take this letter. I have to write it anyway."),
        L("၁၉၈၄ မှာ မင်းအမေဆီက စာတစ်စောင် ငါ့လက်ထဲ ရောက်ခဲ့တယ်။ ငါ မပို့လိုက်ဘူး။",
          "In 1984 a letter from your mother came into my hands. I did not deliver it."),
        L("ငါ ဘာလို့ မပို့လဲဆိုတာ အခုထိ ငါ့ကိုယ်ငါ မဖြေနိုင်ဘူး။ မောပန်းလို့လား၊ နောက်ကျလို့လား၊ ကြောက်လို့လား။",
          "I still cannot tell you why. Tired, late, afraid — I have tried all three and none of them fit."),
        L("မင်းအမေ ဆုံးသွားတဲ့အခါ မင်း အနားမှာ မရှိခဲ့ဘူး။ ဒါ ငါ့ကြောင့်ပါ။",
          "You were not there when she died. That was because of me."),
        L("ခွင့်လွှတ်ပါလို့ ငါ မတောင်းဘူး။ သိစေချင်တာပဲ — ငါ တစ်သက်လုံး မမေ့ခဲ့ဘူးဆိုတာ။",
          "I am not asking to be forgiven. I want you to know I did not forget it for one day."),
      ],
      fragment: L("၁၉၈၄ က မပို့လိုက်တဲ့စာ — ဒေါ်ယဉ်နွယ်ရဲ့ အမေဆီက။ အဲဒါကြောင့် သူမ အမေ့အနားမှာ မရှိခဲ့ဘူး။",
        "The letter he buried in Bagan was hers. Because of it she was not there when her mother died."),
    },
    "mrauk-u": {
      to: L("ဦးကျော်ဇံ ထံသို့", "To U Kyaw Zan"),
      body: [
        L("ကျော်ဇံရေ။ မင်း ငါ့ထက် အရင် သွားလိမ့်မယ်လို့ ငါ ထင်ခဲ့တယ်။ မှန်သွားတယ်။",
          "Kyaw Zan. I thought you would go before me. I was right."),
        L("မင်းက ငါ့ကို တစ်ခါ ပြောခဲ့တယ် — 'စာပို့သမားက စာထဲမှာ ဘာရေးထားလဲ မသိရဘူး၊ ဒါက ကောင်းတယ်' တဲ့။",
          "You told me once that a runner never learns what is in the letters, and that this is a mercy."),
        L("မင်း မှားတယ်။ တစ်ခါတလေ ငါတို့ သိတယ်။ လူတွေရဲ့ မျက်နှာက ပြောပြတယ်။",
          "You were wrong. Sometimes we learn. Their faces tell us at the door."),
        L("မင်းသမီးကို ပြောပေးပါ — မင်း ငါ့ကို ဘယ်တော့မှ ငွေ မတောင်းခဲ့ဘူးလို့။",
          "Tell your daughter that you never once asked me for the money back."),
      ],
      fragment: L("ဦးကျော်ဇံ မနှစ်က ဆုံးသွားပြီ။ အဖိုးက သူ့ကို ငွေအကြွေးရှိတယ် — ဘယ်တော့မှ မတောင်းခဲ့ဘူး။",
        "U Kyaw Zan died last year. Grandfather owed him money and he never once asked for it."),
    },
    "hpa-an": {
      to: L("ဦးဖိုးသိန်း ထံသို့", "To U Po Thin"),
      body: [
        L("ဖိုးသိန်းရေ။ မင်း ငါ့ကို မုန်းတာ မှန်တယ်။",
          "Po Thin. You are right to hate me."),
        L("၁၉၉၁ မှာ မင်းအဖေ့အကြောင်း သူတို့ ငါ့ကို မေးတဲ့အခါ ငါ ဘာမှ မပြောခဲ့ဘူး။ ငြိမ်နေခဲ့တယ်။",
          "In 1991 they asked me about your father. I said nothing. I stayed quiet."),
        L("ငါ ငြိမ်နေတာက မင်းအဖေကို ကူညီမယ်လို့ ငါ ထင်ခဲ့တယ်။ မကူညီဘူး။",
          "I believed my silence would protect him. It did not."),
        L("မင်းအဖေရဲ့ သံဘူးလေးက ဂူထဲ ရှိသေးတယ်။ ငါ ဘယ်တော့မှ မဖွင့်ဘူး။ မင်းအတွက်ပါ။",
          "His tin box is still in the cave. I never opened it. It was never mine to open."),
      ],
      fragment: L("၁၉၉၁ မှာ အဖိုး ငြိမ်နေခဲ့တယ်။ အဲဒီအငြိမ်က တစ်ယောက်ကို ကယ်မယ်လို့ ထင်ခဲ့တာ — မကယ်ခဲ့ဘူး။",
        "In 1991 grandfather stayed silent, believing it would protect someone. It did not."),
    },
    ngapali: {
      to: L("ဖိုးချစ် ထံသို့", "To Phoe Chit"),
      body: [
        L("ဖိုးချစ်ရေ။ ဒီစာကို မင်း ဖတ်နေပြီဆိုရင် မင်း ခရီးတစ်ခုလုံး လျှောက်ခဲ့ပြီးပြီ။",
          "Phoe Chit. If you are reading this, you have walked the whole way."),
        L("ငါ မင်းကို ပြောပြလို့ရတယ်။ ဒါပေမယ့် ပြောပြတာနဲ့ သိတာက မတူဘူး။",
          "I could have told you all of it. But being told and knowing are different things."),
        L("မင်းတွေ့ခဲ့တဲ့ လူတွေက ငါ့အကြောင်း ကောင်းတာရော မကောင်းတာရော ပြောပြပြီးပြီ။ နှစ်မျိုးလုံး မှန်တယ်။",
          "The people you met told you good things about me and bad ones. Both are true."),
        L("ငါ တောင်းဆိုတာ တစ်ခုပဲ ရှိတယ် — မင်းက စာပို့သမား မဖြစ်နဲ့။ ဒါပေမယ့် စာပို့သမားလို လူတွေကို မှတ်မိပါ။",
          "I ask one thing. Do not be a postman. But remember people the way a postman does."),
        L("မင်းဟာ ငါ ဘယ်တော့မှ မပို့နိုင်ခဲ့တဲ့ စာ။ အခုတော့ ရောက်ပြီ။",
          "You are the letter I could never deliver. It has arrived now."),
      ],
      fragment: L("နောက်ဆုံးစာက ငါ့ဆီ။ အဖိုးက ငါ့ကို လမ်းတစ်ခုလုံး လျှောက်ခိုင်းခဲ့တာ — သူ့ကို သိစေဖို့။",
        "The last letter was mine. He made me walk the whole route so I would know who he had been."),
    },
  };

  // ═══════════════════════════════════════════════════════════
  // QUESTS — objectives derive from flags
  // ═══════════════════════════════════════════════════════════
  const q = (my, en, done) => ({ objective: { my, en }, done });

  const quests = {
    yangon: {
      main: {
        title: { my: "ပထမစာ", en: "The first letter" },
        steps: [
          q("ဦးစိန်လှ ဘယ်မှာလဲ မေးပါ", "Ask where U Sein Hla is", "yangon_knows_press"),
          q("လမ်းမကြီးကို ဖြတ်ကူးပါ", "Cross the main road", "yangon_crossed"),
          q("ပုံနှိပ်တိုက်ထဲ ဝင်ပြီး စာပေးပါ", "Deliver the letter at the press", "yangon_delivered"),
        ],
      },
      side: [
        { title: { my: "လက်ဖက်ရည် တစ်ခွက်", en: "A cup of tea" },
          steps: [q("ဆိုင်မှာ လက်ဖက်ရည် သောက်ပါ", "Drink tea at the shop", "had_tea")] },
        { title: { my: "မောင်တင့်ရဲ့ ဘောလုံး", en: "Maung Tint's ball" },
          steps: [q("မောင်တင့်ကို ကူညီပါ", "Help Maung Tint", "yangon_helped_kid")] },
      ],
    },
    bago: {
      main: {
        title: { my: "ဒုတိယစာ", en: "The second letter" },
        steps: [
          q("ဆရာတော် ဘယ်မှာလဲ မေးပါ", "Ask after the Sayadaw", "bago_offered_help"),
          q("ဆွမ်းခံလှည့်ရာမှာ ကူညီပါ", "Help with the alms round", "bago_carried"),
          q("ကျောင်းတိုက်မှာ စာပေးပါ", "Deliver the letter at the monastery", "bago_delivered"),
        ],
      },
      side: [
        { title: { my: "ကိုရင်သူရဲ့ မေးခွန်း", en: "Novice Thu's question" },
          steps: [q("ကိုရင်သူနဲ့ စကားပြောပါ", "Talk with Novice Thu", "bago_talked_novice")] },
        { title: { my: "ပန်းဖိုး", en: "The price of flowers" },
          steps: [q("ကိုဌေးဆီက ပန်းဝယ်ပါ", "Buy from Ko Htay", "bago_bought_flowers")] },
      ],
    },
    mandalay: {
      main: {
        title: { my: "တတိယစာ", en: "The third letter" },
        steps: [
          q("ရွှေထုစက်ရုံ ဘယ်မှာလဲ မေးပါ", "Find where the gold shed is", "mandalay_knows_shop"),
          q("ကျိုးနေတဲ့ တံတားကို ဖြတ်ပါ", "Cross the broken planks", "mandalay_crossed"),
          q("ဦးထွန်းရင်ကို စာပေးပါ", "Deliver the letter to U Tun Yin", "mandalay_delivered"),
        ],
      },
      side: [
        { title: { my: "ဒေါ်တင်မြရဲ့ မှတ်ဉာဏ်", en: "Daw Tin Mya remembers" },
          steps: [q("ဒေါ်တင်မြနဲ့ စကားပြောပါ", "Hear Daw Tin Mya out", "mandalay_heard_elder")] },
        { title: { my: "ကိုဇော်ရဲ့ မျှားချိန်", en: "Ko Zaw's patience" },
          steps: [q("ကိုဇော်နဲ့ စကားပြောပါ", "Sit with Ko Zaw a while", "mandalay_sat_with_zaw")] },
      ],
    },
    bagan: {
      main: {
        title: { my: "စတုတ္ထစာ", en: "The fourth letter" },
        steps: [
          q("ပုံကြမ်းကို ကြည့်ပါ", "Study the sketch", "bagan_has_sketch"),
          q("မှန်ကန်တဲ့ စေတီကို ရှာပါ", "Find the stupa that matches", "bagan_found_stupa"),
          q("စေတီစောင့်ကို စာပေးပါ", "Deliver it to the keeper", "bagan_delivered"),
        ],
      },
      side: [
        { title: { my: "ဒေါ်လှရဲ့ မီးခွက်", en: "Daw Hla's lamps" },
          steps: [q("ဒေါ်လှဆီက မီးခွက် ဝယ်ပါ", "Buy a lamp from Daw Hla", "bagan_bought_lamp")] },
        { title: { my: "ယွန်းထည် တစ်ခု", en: "One piece of lacquer" },
          steps: [q("မအိမွန်နဲ့ စကားပြောပါ", "Talk to Ma Ei Mon", "bagan_talked_lacquer")] },
      ],
    },
    inle: {
      main: {
        title: { my: "ပဉ္စမစာ", en: "The fifth letter" },
        steps: [
          q("ဒေါ်စိန် ဘယ်ရောက်သွားလဲ မေးပါ", "Ask where Daw Sein went", "inle_knows_where"),
          q("ရက်ကန်းစင်ဆီ လှော်သွားပါ", "Row out to the weaving shed", "inle_rowed"),
          q("ဒေါ်စိန်ကို စာပေးပါ", "Deliver the letter to Daw Sein", "inle_delivered"),
        ],
      },
      side: [
        { title: { my: "မောင်အုန်းရဲ့ လှော်နည်း", en: "Teaching Maung Oo" },
          steps: [q("မောင်အုန်းနဲ့ စကားပြောပါ", "Talk to Maung Oo", "inle_taught_kid")] },
        { title: { my: "ကိုညွန့်ရဲ့ ငါး", en: "Ko Nyunt's catch" },
          steps: [q("ကိုညွန့်ဆီက ငါးဝယ်ပါ", "Buy fish from Ko Nyunt", "inle_bought_fish")] },
      ],
    },
    kalaw: {
      main: {
        title: { my: "ဆဋ္ဌမစာ", en: "The sixth letter" },
        steps: [
          q("ကျောင်းကို ဘယ်လိုသွားရလဲ မေးပါ", "Ask the way up to the school", "kalaw_knows_way"),
          q("တောင်ပေါ် တက်ပါ", "Climb the ridge", "kalaw_climbed"),
          q("ဆရာမကို စာပေးပါ", "Deliver the letter to the teacher", "kalaw_delivered"),
        ],
      },
      side: [
        { title: { my: "မောင်ကျော်ရဲ့ လမ်း", en: "Maung Kyaw's walk" },
          steps: [q("မောင်ကျော်နဲ့ စကားပြောပါ", "Walk a while with Maung Kyaw", "kalaw_walked_with_kid")] },
        { title: { my: "ကော်ဖီတစ်ခွက်", en: "One coffee" },
          steps: [q("ဒေါ်ရွှေဆီက ကော်ဖီ ဝယ်ပါ", "Buy coffee from Daw Shwe", "kalaw_bought_coffee")] },
      ],
    },
    "pyin-oo-lwin": {
      main: {
        title: { my: "သတ္တမစာ", en: "The seventh letter" },
        steps: [
          q("ဒေါ်ယဉ်နွယ်နဲ့ စကားပြောပါ", "Speak to Daw Yin Nwe", "pol_refused"),
          q("သူမ လက်ခံအောင် နည်းရှာပါ", "Find a way to be heard", "pol_gathered"),
          q("စာကို ပေးအပ်ပါ", "Deliver the letter", "pol_delivered"),
        ],
      },
      side: [
        { title: { my: "ဥယျာဉ်မှူးရဲ့ မှတ်တမ်း", en: "The gardener's record" },
          steps: [q("ကိုလွင်နဲ့ စကားပြောပါ", "Talk to Ko Lwin", "pol_talked_gardener")] },
        { title: { my: "မြင်းလှည်း", en: "The horse cart" },
          steps: [q("ဦးမောင်ငယ်နဲ့ စကားပြောပါ", "Talk to U Maung Gale", "pol_talked_driver")] },
      ],
    },
    "mrauk-u": {
      main: {
        title: { my: "အဋ္ဌမစာ", en: "The eighth letter" },
        steps: [
          q("ဦးကျော်ဇံ ဘယ်မှာလဲ မေးပါ", "Ask after U Kyaw Zan", "mrauk_knows_grave"),
          q("မြူထဲက လမ်းကို ရှာပါ", "Find the way through the mist", "mrauk_walked"),
          q("သင်္ချိုင်းမှာ စာဖတ်ပြပါ", "Read the letter at the grave", "mrauk_delivered"),
        ],
      },
      side: [
        { title: { my: "မလှနုရဲ့ ကုလားထိုင်", en: "Ma Hla Nu's chair" },
          steps: [q("မလှနုနဲ့ စကားပြောပါ", "Talk to Ma Hla Nu", "mrauk_talked_daughter")] },
        { title: { my: "လမ်းပြခ", en: "The guide's fee" },
          steps: [q("ကိုစံရွှေနဲ့ စကားပြောပါ", "Deal with Ko San Shwe", "mrauk_dealt_guide")] },
      ],
    },
    "hpa-an": {
      main: {
        title: { my: "နဝမစာ", en: "The ninth letter" },
        steps: [
          q("ဦးဖိုးသိန်းနဲ့ စကားပြောပါ", "Speak to U Po Thin", "hpaan_refused"),
          q("ဂူထဲက သံဘူးကို ရှာပါ", "Find the tin box in the cave", "hpaan_found_box"),
          q("သံဘူးနဲ့ စာကို ပေးအပ်ပါ", "Bring him the box and the letter", "hpaan_delivered"),
        ],
      },
      side: [
        { title: { my: "မောင်လေးရဲ့ မီးရှူး", en: "Maung Lay's torch" },
          steps: [q("မောင်လေးဆီက မီးရှူး ယူပါ", "Get a torch from Maung Lay", "hpaan_has_torch")] },
        { title: { my: "ဒေါ်အေးရဲ့ သတင်း", en: "What Daw Aye knows" },
          steps: [q("ဒေါ်အေးနဲ့ စကားပြောပါ", "Talk to Daw Aye", "hpaan_talked_elder")] },
      ],
    },
    ngapali: {
      main: {
        title: { my: "နောက်ဆုံးစာ", en: "The last letter" },
        steps: [
          q("ဒေါ်သိန်းရီကို ရှာပါ", "Find Daw Thein Yi", "ngapali_knows_spot"),
          q("ဒီရေမတက်ခင် ဖြတ်ပါ", "Beat the tide across the flats", "ngapali_crossed"),
          q("စာအိတ်ကို ဖွင့်ပါ", "Open the envelope", "ngapali_delivered"),
        ],
      },
      side: [
        { title: { my: "ဦးလှဝင်းရဲ့ ဒီရေ", en: "U Hla Win's tide" },
          steps: [q("ဦးလှဝင်းနဲ့ စကားပြောပါ", "Talk to U Hla Win", "ngapali_talked_fisher")] },
        { title: { my: "မစုရဲ့ ဆိုင်", en: "Ma Su's shack" },
          steps: [q("မစုနဲ့ စကားပြောပါ", "Talk to Ma Su", "ngapali_talked_masu")] },
      ],
    },
  };

  // ═══════════════════════════════════════════════════════════
  // DIALOGUE
  // ═══════════════════════════════════════════════════════════
  const T = (my, en) => ({ my, en });
  /** narration node — no speaker portrait */
  const nar = (my, en, extra = {}) => Object.assign({ text: T(my, en) }, extra);

  const dialogue = {
    // ───────────────────────────────── YANGON
    yangon_arrive: {
      start: "a",
      nodes: {
        a: nar("အဖိုး ဆုံးပြီး သုံးလ။ အိတ်ထဲမှာ စာအိတ် ဆယ်စောင်၊ စာရွက်တစ်ရွက်။",
          "Three months since grandfather died. Ten envelopes in the satchel, and one sheet of instructions.",
          { to: "b" }),
        b: nar("စာရွက်ပေါ်မှာ — 'တစ်စောင်ချင်း၊ လက်နဲ့။ အစဉ်လိုက်။ ဘာကြောင့်လဲ မမေးနဲ့။'",
          "The sheet says: one at a time, by hand, in order. Do not ask why.",
          { to: "c" }),
        c: {
          who: "phoe-chit",
          text: T("ပထမတစ်စောင်… ဦးစိန်လှ။ ပုံနှိပ်တိုက်လို့ ရေးထားတယ်။ ဘယ်ပုံနှိပ်တိုက်လဲ။",
            "First one. U Sein Hla, at the press. It doesn't say which press."),
          effect: { give: "satchel", record: { kind: "people", id: "u-ba-nyein" } },
          to: "end",
        },
      },
    },
    yangon_notice: {
      start: "a",
      nodes: {
        a: { who: "phoe-chit",
          text: T("ကြော်ငြာသင်ပုန်း။ ပုံနှိပ်တိုက် သုံးခုရဲ့ လိပ်စာ ကပ်ထားတယ် — နှစ်ခုက ပိတ်သွားပြီ။",
            "A notice board. Three printers listed. Two are crossed out."),
          effect: { learn: "yangon_saw_notice" }, to: "end" },
      },
    },
    yangon_teashop: {
      start: [{ if: "yangon_knows_press", to: "after" }, { to: "greet" }],
      nodes: {
        greet: {
          who: "ko-myint-swe",
          text: T("ထိုင်ဦး ကလေး။ မျက်နှာက ခရီးရောက်ခါစ ပုံပဲ။ ဘာလိုချင်လဲ။",
            "Sit down, boy. You've the face of someone just off a bus. What do you need?"),
          choices: [
            { text: T("ဦးစိန်လှဆိုတဲ့ ပုံနှိပ်သမား သိလား", "Do you know a printer called U Sein Hla?"), to: "printer" },
            { text: T("လက်ဖက်ရည် တစ်ခွက် (၃၀၀ ကျပ်)", "A cup of tea (300 kyat)"),
              if: { kyat: 300 }, effect: { kyat: -300, learn: "had_tea" }, to: "tea" },
            { text: T("ဘာမှ မလိုပါဘူး", "Nothing, thank you"), to: "end" },
          ],
        },
        printer: {
          who: "ko-myint-swe",
          text: T("စိန်လှ? အိုး… သူ့စက်က အခုထိ လည်နေတုန်းပဲ။ လမ်းတစ်ဖက်၊ ဆယ့်ခုနစ်လမ်းထောင့်။ ဒါပေမယ့် ကူးရတာ လွယ်တာ မဟုတ်ဘူးနော်။",
            "Sein Hla? His machine still turns. Other side of the road, corner of 17th. Crossing is the hard part, mind."),
          effect: { learn: "yangon_knows_press", record: { kind: "people", id: "ko-myint-swe" } },
          to: "printer2",
        },
        printer2: {
          who: "ko-myint-swe",
          text: T("မင်းအဖိုးက ဒီဆိုင်မှာ ထိုင်ဖူးတယ်။ တစ်ခွက်တည်း၊ တစ်နာရီ။ ဘယ်တော့မှ နှစ်ခွက် မမှာဘူး။",
            "Your grandfather drank here, you know. One cup, one hour. Never ordered a second."),
          to: "end",
        },
        tea: {
          who: "ko-myint-swe",
          text: T("ဟုတ်ပြီ။ ဒါက အခမဲ့ အကြံ — မြို့ထဲမှာ မေးရင် နှစ်ယောက်ကို မေးပါ။ တစ်ယောက်တည်းက မှားတတ်တယ်။",
            "Good. Free advice with it: in this city, ask two people. One is always wrong."),
          to: "greet",
        },
        after: {
          who: "ko-myint-swe",
          text: T("ဆယ့်ခုနစ်လမ်းထောင့်။ ကားတွေကို စောင့်ပြီးမှ ကူးနော်။",
            "Corner of 17th. Wait for a gap before you cross, boy."),
          to: "end",
        },
      },
    },
    yangon_vendor: {
      start: [{ if: "yangon_knows_press", to: "after" }, { to: "greet" }],
      nodes: {
        greet: {
          who: "daw-khin-khin",
          text: T("ကွမ်းယာ လိုသလား ကလေး — မလိုဘူးပေါ့။ မင်း အိတ်ကို ငါ မှတ်မိတယ်။ အဲဒီအိတ်မျိုး ဒီလမ်းပေါ် အရင်က တွေ့ဖူးတယ်။",
            "Betel? No, not for you. But I know that satchel. I have seen one like it on this road before."),
          choices: [
            { text: T("အဖိုးရဲ့ အိတ်ပါ", "It was my grandfather's"), to: "grandfather" },
            { text: T("ဦးစိန်လှကို သိလား", "Do you know U Sein Hla?"), to: "printer" },
          ],
        },
        grandfather: {
          who: "daw-khin-khin",
          text: T("ဘငြိမ်း။ ဟုတ်တယ်။ လေးဆယ်နှစ် ဒီလမ်းက ဖြတ်သွားတာ။ တစ်ခါမှ ကွမ်း မဝယ်ဘူး။ ဒါပေမယ့် နှုတ်ဆက်တိုင်း နာမည်နဲ့ ခေါ်တယ်။",
            "Ba Nyein. Forty years down this road. Never bought a leaf off me once. But he called me by name every time."),
          effect: { record: { kind: "people", id: "daw-khin-khin" } },
          to: "printer",
        },
        printer: {
          who: "daw-khin-khin",
          text: T("စိန်လှက လမ်းတစ်ဖက်၊ ဆယ့်ခုနစ်လမ်း။ ကူးတဲ့အခါ သတိထားနော် — အဲဒီလမ်းက ကလေးတွေကို မချစ်ဘူး။",
            "Sein Hla is across the road, 17th street. Careful crossing. That road has no love for children."),
          effect: { learn: "yangon_knows_press" },
          to: "end",
        },
        after: {
          who: "daw-khin-khin",
          text: T("သွားလေ။ စက်သံကြားရင် ရောက်ပြီ။", "Go on. When you hear the machine, you're there."),
          to: "end",
        },
      },
    },
    yangon_kid: {
      start: [{ if: "yangon_helped_kid", to: "after" }, { to: "greet" }],
      nodes: {
        greet: {
          who: "maung-tint",
          text: T("ကိုကြီးရေ… ကျွန်တော့်ဘောလုံး ကားအောက် ဝင်သွားတယ်။ ဆရာက ပြန်မယူရဲဘူးတဲ့။",
            "Big brother — my ball went under the bus. Everyone says leave it."),
          choices: [
            { text: T("ငါ ယူပေးမယ်", "I'll get it"), effect: { learn: "yangon_helped_kid", kyat: 0 }, to: "helped" },
            { text: T("ကားအောက် မဝင်နဲ့။ အသစ်ဝယ်လိုက်ပါ (၅၀၀ ကျပ်)", "Don't. Buy a new one (500 kyat)"),
              if: { kyat: 500 }, effect: { kyat: -500, learn: "yangon_helped_kid" }, to: "bought" },
            { text: T("စိတ်မကောင်းပါဘူး", "I'm sorry, I can't"), to: "end" },
          ],
        },
        helped: {
          who: "maung-tint",
          text: T("ရပြီ! ကိုကြီးက သူရဲကောင်းပဲ။ ဟိုမှာ… ကားမှတ်တိုင်နားမှာ တစ်ခုခု ကျနေတယ်။ ကိုကြီး ယူသွား။",
            "Got it! You're brave. Here — something's lying by the bus stop. You take it."),
          to: "end",
        },
        bought: {
          who: "maung-tint",
          text: T("အသစ်လား? ဟုတ်… ဒါပေမယ့် အဟောင်းက အဖေပေးတာ။ ဒါပေမယ့် ကျေးဇူးပါ ကိုကြီး။",
            "A new one? Yes… only the old one was from my father. Thank you anyway."),
          to: "end",
        },
        after: {
          who: "maung-tint",
          text: T("ကိုကြီး နောက်တစ်ခါ လာခဲ့နော်။", "Come back this way sometime."),
          to: "end",
        },
      },
    },
    yangon_driver: {
      start: "greet",
      nodes: {
        greet: {
          who: "ko-bo",
          text: T("ဆိုက်ကား စီးမလား။ တစ်ထောင့်ငါးရာ။ ဈေးမဆစ်ပါနဲ့ — ငါ တစ်နေ့လုံး နင်းရတာ။",
            "Trishaw? Fifteen hundred. Don't haggle. I pedal all day."),
          choices: [
            { text: T("စီးမယ် (၁,၅၀၀ ကျပ် · ၁ နာရီ သက်သာ)", "Ride (1,500 kyat · saves an hour)"),
              if: [{ kyat: 1500 }, "yangon_knows_press"],
              effect: { kyat: -1500, learn: "yangon_crossed" }, to: "ride" },
            { text: T("အဖိုးက ဘယ်လိုသွားလဲ", "How did my grandfather travel?"), to: "granddad" },
            { text: T("လမ်းလျှောက်မယ်", "I'll walk"), to: "end" },
          ],
        },
        ride: {
          who: "ko-bo",
          text: T("ဟုတ်ပြီ။ တင်လိုက်။ ကားတွေကြားက ငါ လျှိုသွားမယ် — မင်း မျက်စိ မှိတ်မထားနဲ့နော်။",
            "Right. Get on. I'll thread the traffic. Don't shut your eyes, it's the best part."),
          to: "end",
        },
        granddad: {
          who: "ko-bo",
          text: T("စာပို့သမားလား။ သူတို့ လျှောက်တာပဲ။ တစ်နေ့ကို ဆယ်မိုင်၊ လေးဆယ်နှစ်။ ငါက နင်းတာတောင် ညည်းနေတာ။",
            "A runner? They walked. Ten miles a day, forty years. And here I am complaining about pedalling."),
          effect: { record: { kind: "people", id: "ko-bo" } },
          to: "greet",
        },
      },
    },
    yangon_clerk: {
      start: "greet",
      nodes: {
        greet: {
          who: "daw-nilar",
          text: T("မင်းက ဘငြိမ်းရဲ့ မြေးလား။ မျက်လုံးက အတူတူပဲ။ ငါ သူနဲ့ ကောင်တာတစ်ခုတည်း ဆယ့်ခြောက်နှစ် လုပ်ခဲ့တယ်။",
            "You're Ba Nyein's grandson. Same eyes. I worked the same counter as him for sixteen years."),
          choices: [
            { text: T("အဖိုးက ဘယ်လိုလူလဲ", "What was he like?"), to: "like" },
            { text: T("စာဆယ်စောင် ပို့ခိုင်းထားတယ်", "He left me ten letters to deliver"), to: "letters" },
          ],
        },
        like: {
          who: "daw-nilar",
          text: T("တိတ်တိတ်။ အရမ်း တိတ်တိတ်။ ဒါပေမယ့် လူတိုင်းရဲ့ နာမည်ကို မှတ်မိတယ်။ လိပ်စာတွေကို အလွတ်ရတယ်။",
            "Quiet. Very quiet. But he knew every name on his round, and every address by heart."),
          effect: { record: { kind: "people", id: "daw-nilar" } },
          to: "greet",
        },
        letters: {
          who: "daw-nilar",
          text: T("ဆယ်စောင်… သူ ဒါကို နှစ်ချီပြီး ရေးခဲ့တာ။ ငါ့ကို တစ်ခါ မေးဖူးတယ် — 'ပို့ဖို့ ကျန်နေသေးတဲ့ စာက ဘယ်တော့ ပျက်ကွက်တာ ဖြစ်လဲ' တဲ့။",
            "Ten. He wrote them over two years. He asked me once: when does a late letter become a failed one?"),
          effect: { learn: "yangon_heard_clerk" },
          to: "letters2",
        },
        letters2: {
          who: "daw-nilar",
          text: T("ငါ မဖြေတတ်ခဲ့ဘူး။ အခုလည်း မဖြေတတ်သေးဘူး။",
            "I had no answer. I still don't."),
          to: "end",
        },
      },
    },
    yangon_recipient: {
      start: [{ if: "yangon_delivered", to: "after" }, { to: "greet" }],
      nodes: {
        greet: {
          who: "u-sein-hla",
          text: T("စက်ရပ်ခိုင်းလိုက်ရတယ်။ ကလေးတစ်ယောက် ဒီထဲ ဝင်လာတာ ဆယ်နှစ်လောက် ရှိပြီ။ ဘာလဲ။",
            "I had to stop the press. Ten years since a child walked in here. What is it?"),
          choices: [
            { text: T("ဦးဘငြိမ်းဆီက စာပါ", "A letter from U Ba Nyein"), to: "react" },
          ],
        },
        react: {
          who: "u-sein-hla",
          text: T("…ဘငြိမ်း။ ကူးသွားပြီလား။",
            "…Ba Nyein. He's gone, then."),
          to: "react2",
        },
        react2: {
          who: "u-sein-hla",
          text: T("ထိုင်ပါကွယ်။ စက်က နောက်မှ လည်လို့ရတယ်။ ဖတ်ပါရစေ။",
            "Sit. The machine can wait. Let me read it."),
          effect: { learn: "yangon_delivered", kyat: 1800, record: { kind: "people", id: "u-sein-hla" } },
          letter: "yangon",
          to: "end",
        },
        after: {
          who: "u-sein-hla",
          text: T("မင်းအဖိုးက စာလုံးတွေကို လက်နဲ့ ထိပြီး ဖတ်တတ်တယ်။ ဒါက ငါ မသင်ပေးခဲ့တာ။ သူ့ဟာသူ လုပ်တာ။",
            "Your grandfather read with his fingers on the type. I never taught him that. He worked it out himself."),
          to: "end",
        },
      },
    },

    // ───────────────────────────────── BAGO
    bago_arrive: {
      start: "a",
      nodes: {
        a: nar("မနက် ငါးနာရီခွဲ။ ဆွမ်းခံတန်း စတန်းလျားက လမ်းဆုံကနေ စတယ်။",
          "Half past five. The alms line starts at the junction and does not hurry.", { to: "b" }),
        b: { who: "phoe-chit",
          text: T("ဒုတိယစာ — ဆရာတော် ဦးကေသရ။ ကျောင်းတိုက်က ဟိုမှာပဲ။ လွယ်မယ် ထင်တယ်။",
            "Second letter. Sayadaw U Kaythara. The monastery is right there. This should be easy."),
          to: "end" },
      },
    },
    bago_donor: {
      start: [{ if: "bago_offered_help", to: "after" }, { to: "greet" }],
      nodes: {
        greet: {
          who: "ma-nu",
          text: T("ဆရာတော့်ဆီ သွားမလား။ အခု မရဘူးကွယ် — ဆွမ်းခံလှည့်နေတယ်။ ကိုရင်တစ်ပါး ဖျားနေလို့ သပိတ် တစ်လုံး ပိုနေတယ်။",
            "Off to see the Sayadaw? Not now — he's on the round. One novice is ill, so there's a bowl short-handed."),
          choices: [
            { text: T("ကျွန်တော် ကူညီပါရစေ", "Let me carry it"),
              effect: { learn: "bago_offered_help", record: { kind: "people", id: "ma-nu" } }, to: "yes" },
            { text: T("စောင့်နေလိုက်မယ်", "I'll wait"), to: "wait" },
          ],
        },
        yes: {
          who: "ma-nu",
          text: T("ကောင်းတယ်။ သပိတ်က လမ်းဆုံမှာ။ ဖိတ်မကျစေနဲ့နော် — ဖိတ်ရင် ပြန်ချက်ရမယ်။",
            "Good. The bowl's at the junction. Don't spill it — if you spill it I cook it again."),
          to: "end",
        },
        wait: {
          who: "ma-nu",
          text: T("စောင့်ချင် စောင့်ပေါ့။ ဒါပေမယ့် နေတက်ရင် ဆရာတော် အနားယူတယ်နော်။",
            "Wait if you like. But once the sun's up he rests, and then you wait till evening."),
          to: "greet",
        },
        after: {
          who: "ma-nu",
          text: T("သပိတ်က လမ်းဆုံမှာ ကလေး။ သွားလေ။", "The bowl's at the junction, child. Go on."),
          to: "end",
        },
      },
    },
    bago_vendor: {
      start: "greet",
      nodes: {
        greet: {
          who: "ko-htay",
          text: T("ပန်း ဝယ်မလား။ တစ်စည်း ရှစ်ရာ။ ဈေးဆစ်ပါ — ဆစ်မှ ပျော်စရာကောင်းတာ။",
            "Flowers? Eight hundred a bunch. Do haggle. It's no fun otherwise."),
          choices: [
            { text: T("ခြောက်ရာ ရမလား", "Six hundred?"),
              if: { kyat: 600 }, effect: { kyat: -600, learn: "bago_bought_flowers" }, to: "haggled" },
            { text: T("ရှစ်ရာ ပေးမယ်", "Eight hundred is fine"),
              if: { kyat: 800 }, effect: { kyat: -800, learn: "bago_bought_flowers" }, to: "paid" },
            { text: T("မဝယ်တော့ဘူး", "Not today"), to: "end" },
          ],
        },
        haggled: {
          who: "ko-htay",
          text: T("ခုနစ်ရာ… ဟုတ်ပြီ ခြောက်ရာ။ မင်းက မင်းအဖိုးလိုပဲ။ သူလည်း ဆစ်တယ်၊ ဒါပေမယ့် အမြဲ အပိုထည့်ပေးသွားတယ်။",
            "Seven — fine, six. You're like your grandfather. He haggled too, then always overpaid on the way out."),
          to: "end",
        },
        paid: {
          who: "ko-htay",
          text: T("ဈေးမဆစ်ဘူးလား။ တော်တော် ကောင်းတဲ့ကလေးပဲ။ ဒါဆို တစ်စည်း ပိုပေးမယ်။",
            "No haggling? Decent of you. Take an extra bunch then."),
          to: "end",
        },
      },
    },
    bago_novice: {
      start: "greet",
      nodes: {
        greet: {
          who: "novice-thu",
          text: T("ဒကာလေး တစ်ခု မေးပါရစေ။ လူတစ်ယောက် ကူညီတာ ကောင်းမှုရဖို့ လုပ်ရင် ကောင်းမှု ရသေးလား။",
            "May I ask you something. If a person helps in order to gain merit, is it still merit?"),
          choices: [
            { text: T("ရတယ် ထင်တယ်", "I think it counts"),
              effect: { learn: "bago_talked_novice", record: { kind: "people", id: "novice-thu" } }, to: "a" },
            { text: T("မရဘူး ထင်တယ်", "I don't think it does"),
              effect: { learn: "bago_talked_novice", record: { kind: "people", id: "novice-thu" } }, to: "b" },
          ],
        },
        a: { who: "novice-thu",
          text: T("ဆရာတော်လည်း အဲလိုပဲ ပြောတယ်။ ကူညီခံရသူအတွက် တူတူပဲတဲ့။ ကျွန်တော် စဉ်းစားနေတုန်းပါ။",
            "The Sayadaw says the same. He says it is identical to the person being helped. I am still thinking about it."), to: "end" },
        b: { who: "novice-thu",
          text: T("ကျွန်တော်လည်း အဲလို ထင်ခဲ့တယ်။ ဒါပေမယ့် ဆာနေတဲ့သူက ဘယ်စိတ်နဲ့ ချက်ထားလဲ မမေးဘူးလေ။",
            "I thought that too. But a hungry person does not ask what mood the rice was cooked in."), to: "end" },
      },
    },
    bago_recipient: {
      start: [
        { if: "bago_delivered", to: "after" },
        { if: "bago_carried", to: "greet" },
        { to: "busy" },
      ],
      nodes: {
        busy: {
          who: "sayadaw-u-kaythara",
          text: T("ခဏစောင့်ပါ ဒကာလေး။ ဆွမ်းခံတန်း မပြီးသေးဘူး။",
            "In a moment, child. The round is not finished."),
          to: "end",
        },
        greet: {
          who: "sayadaw-u-kaythara",
          text: T("သပိတ်ကို တစ်စက်မှ မဖိတ်ဘဲ သယ်လာတယ်။ ဒါက လွယ်တာ မဟုတ်ဘူး။ ဘာကိစ္စလဲ ဒကာလေး။",
            "You carried that bowl without spilling a drop. That is not easy. Now — what brings you?"),
          choices: [{ text: T("ဦးဘငြိမ်းဆီက စာပါ", "A letter from U Ba Nyein"), to: "react" }],
        },
        react: {
          who: "sayadaw-u-kaythara",
          text: T("ဘငြိမ်း။ ၁၉၇၉ မိုးတွင်းက ကောင်လေး။ သူ ဒီကြမ်းပြင်မှာ နှစ်လ အိပ်ခဲ့တယ်။",
            "Ba Nyein. The boy from the monsoon of '79. He slept two months on that floor."),
          to: "react2",
        },
        react2: {
          who: "sayadaw-u-kaythara",
          text: T("ဘာလို့လဲလို့ ငါ တစ်ခါမှ မမေးဘူး။ မမေးတာ မှန်တယ်လို့ အခုထိ ထင်တယ်။ ဖတ်ပါရစေ။",
            "I never asked why. I still think that was right. Let me read."),
          effect: { learn: "bago_delivered", kyat: 1800, record: { kind: "people", id: "sayadaw-u-kaythara" } },
          letter: "bago",
          to: "end",
        },
        after: {
          who: "sayadaw-u-kaythara",
          text: T("မင်းအဖိုး ပြန်သွားတဲ့နေ့ သူ ကြမ်းပြင်ကို သန့်ရှင်းရေး လုပ်သွားတယ်။ မလိုအပ်ဘဲနဲ့။",
            "The day he left he swept the floor he had slept on. Nobody asked him to."),
          to: "end",
        },
      },
    },

    // ───────────────────────────────── MANDALAY
    mandalay_arrive: {
      start: "a",
      nodes: {
        a: nar("ဦးပိန်တံတား။ ကျွန်းတိုင် တစ်ထောင့်ကိုးရာ။ တချို့က ကျိုးနေပြီ။",
          "U Bein bridge. Nine hundred teak posts, and a good few of the planks are gone.", { to: "b" }),
        b: { who: "phoe-chit",
          text: T("တတိယစာ — ဦးထွန်းရင်။ ရွှေထုသမားတဲ့။ ဒီဘက်ကမ်းမှာ မဟုတ်ဘူး ထင်တယ်။",
            "Third letter. U Tun Yin, a gold-beater. Not on this side of the water, I think."), to: "end" },
      },
    },
    mandalay_fisherman: {
      start: [{ if: "mandalay_knows_shop", to: "after" }, { to: "greet" }],
      nodes: {
        greet: {
          who: "ko-zaw",
          text: T("တိတ်တိတ်နေပါကွာ။ ငါး မရှိပေမယ့် တိတ်တိတ်နေတာက ကောင်းတယ်။",
            "Keep it down. There are no fish, but the quiet is good regardless."),
          choices: [
            { text: T("ရွှေထုစက်ရုံ ဘယ်မှာလဲ", "Where's the gold-beaters' shed?"), to: "shop" },
            { text: T("ဘေးမှာ ထိုင်လိုက်မယ်", "I'll just sit a minute"),
              effect: { learn: "mandalay_sat_with_zaw", record: { kind: "people", id: "ko-zaw" } }, to: "sit" },
          ],
        },
        shop: {
          who: "ko-zaw",
          text: T("တံတားတစ်ဖက်။ ဒါပေမယ့် အလယ်လောက်မှာ ပျဉ်တွေ ကျိုးနေတယ်။ လှမ်းရမယ်၊ လျှောက်လို့ မရဘူး။",
            "Far side. But the middle planks are out. You'll jump it, not walk it."),
          effect: { learn: "mandalay_knows_shop" },
          to: "end",
        },
        sit: {
          who: "ko-zaw",
          text: T("မင်းအဖိုးလည်း ဒီမှာ ထိုင်ဖူးတယ်။ စာအိတ်တွေ ပိုက်ပြီး ငါးမျှားနေတဲ့ ငါ့ကို ကြည့်နေတယ်။ ဘာမှ မပြောဘူး။ ကောင်းတဲ့လူ။",
            "Your grandfather sat here too. Bag on his knees, watching me not catch anything. Said nothing. Good man."),
          to: "shop",
        },
        after: {
          who: "ko-zaw",
          text: T("အလယ်က ပျဉ်တွေ။ လှမ်းတဲ့အခါ အောက်ကို မကြည့်နဲ့။",
            "The middle planks. Don't look down when you jump."),
          to: "end",
        },
      },
    },
    mandalay_elder: {
      start: "greet",
      nodes: {
        greet: {
          who: "daw-tin-mya",
          text: T("ငါ ဒီတံတားကို နှစ်ခါ ပြင်တာ မြင်ဖူးတယ်ကွယ်။ မင်း အသက် ဘယ်လောက်လဲ။",
            "I have watched this bridge repaired twice. How old are you, child?"),
          choices: [
            { text: T("ဆယ့်နှစ်နှစ်ပါ", "Twelve"),
              effect: { learn: "mandalay_heard_elder", record: { kind: "people", id: "daw-tin-mya" } }, to: "a" },
          ],
        },
        a: {
          who: "daw-tin-mya",
          text: T("ဆယ့်နှစ်နှစ်။ ငါ ဒီတံတားပေါ် ပထမဆုံး လျှောက်တုန်းက အဲဒီအရွယ်ပဲ။ အဲဒီတုန်းက ပျဉ်တွေ အသစ်။ အခု ငါ အိုပြီ၊ ပျဉ်တွေလည်း အိုပြီ။",
            "Twelve. That is how old I was the first time I crossed it. The planks were new then. Now I am old and so are they."),
          to: "b",
        },
        b: {
          who: "daw-tin-mya",
          text: T("မင်း စာပို့သမားရဲ့ မြေးလား။ သူက တံတားပေါ် အမြဲ ဖြေးဖြေး လျှောက်တယ်။ တခြားလူတွေက အမြန်။ သူက ဖြေးဖြေး။",
            "You're the postman's grandson? He always crossed slowly. Everyone else hurries. He never did."),
          to: "end",
        },
      },
    },
    mandalay_daughter: {
      start: [{ if: "mandalay_delivered", to: "after" }, { to: "greet" }],
      nodes: {
        greet: {
          who: "ma-phyu",
          text: T("အဖေ့ဆီ သွားမလား။ သတိပေးထားမယ် — သူ့လက်တွေ တုန်နေပြီ။ ရွှေမထုနိုင်တော့ဘူး။ ဒါပေမယ့် နေ့တိုင်း စက်ရုံ ဖွင့်တယ်။",
            "Going to see my father? Fair warning — his hands shake now. He cannot beat gold any more. He opens the shed anyway."),
          choices: [
            { text: T("စာတစ်စောင် ပေးစရာရှိလို့ပါ", "I have a letter for him"), to: "letter" },
          ],
        },
        letter: {
          who: "ma-phyu",
          text: T("စာ? ဘယ်သူ့ဆီကလဲ။ …ဘငြိမ်းလား။ အဖေ အဲဒီနာမည်ကို နှစ်ဆယ်လောက် မပြောဘူး။ ပြောရင်လည်း တစ်ခွန်းပဲ ပြောတယ် — 'သူ ကောင်းတဲ့လူ' တဲ့။",
            "A letter? From whom — Ba Nyein? My father hasn't said that name in twenty years. When he does it is one sentence: he was a good man."),
          effect: { record: { kind: "people", id: "ma-phyu" } },
          to: "end",
        },
        after: {
          who: "ma-phyu",
          text: T("အဖေ ငိုနေတယ်။ ဒါပေမယ့် စိတ်မပူပါနဲ့ — နှစ်ဆယ်လုံး စောင့်နေတဲ့ မျက်ရည်ပါ။",
            "He's crying. Don't worry. Those are twenty years' worth, and they were due."),
          to: "end",
        },
      },
    },
    mandalay_recipient: {
      start: [{ if: "mandalay_delivered", to: "after" }, { to: "greet" }],
      nodes: {
        greet: {
          who: "u-tun-yin",
          text: T("ကလေးရေ၊ ရွှေ ဝယ်ဖို့ဆိုရင် ငါ့မှာ မရှိတော့ဘူး။ လက်တွေက မလုပ်နိုင်တော့ဘူး။",
            "If you've come to buy, boy, I've nothing. The hands won't do it any more."),
          choices: [{ text: T("ဦးဘငြိမ်းဆီက စာပါ", "A letter from U Ba Nyein"), to: "react" }],
        },
        react: {
          who: "u-tun-yin",
          text: T("…ဘငြိမ်း။ ငါ့ကို စာရေးလို့လား။ လေးဆယ်နှစ်လုံး တစ်ခွန်းမှ မပြောဘဲနဲ့။",
            "…Ba Nyein. He wrote to me? Forty years and not a word, and now he writes."),
          to: "react2",
        },
        react2: {
          who: "u-tun-yin",
          text: T("ငါ သူ့ကို ရွှေတစ်ရွက် ပေးခဲ့တယ်။ တစ်ရွက်တည်း။ ငါ့မှာ နှစ်ရွက် ရှိခဲ့တာ။ အဲဒါ ငါ ဘယ်တော့မှ မပြောခဲ့ဘူး။",
            "I gave him one leaf of gold. One. I had two. I never told him that."),
          effect: { learn: "mandalay_delivered", kyat: 1800, record: { kind: "people", id: "u-tun-yin" } },
          letter: "mandalay",
          to: "end",
        },
        after: {
          who: "u-tun-yin",
          text: T("ဆယ့်တစ်နှစ်တဲ့။ ငါ့ဒုတိယရွှေရွက်က ဘာဖြစ်သွားလဲ ငါ မမှတ်မိတော့ဘူး။ ပထမတစ်ရွက်ကတော့ ဆယ့်တစ်နှစ် ဖြစ်သွားတယ်။",
            "Eleven years. I cannot remember what became of the second leaf. The first one became eleven years."),
          to: "end",
        },
      },
    },

    // ───────────────────────────────── BAGAN
    bagan_arrive: {
      start: "a",
      nodes: {
        a: nar("စေတီပေါင်း နှစ်ထောင်။ လိပ်စာက ပုံကြမ်းတစ်ခုပဲ။",
          "Two thousand temples. The address is a drawing.", { to: "b" }),
        b: { who: "phoe-chit",
          text: T("အဖိုးက ဒီစာကို ဘယ်သူ့ဆီ ပို့ခိုင်းတာလဲ မရေးထားဘူး။ စေတီပုံပဲ ဆွဲထားတယ်။",
            "He didn't write a name on the fourth one. Only a stupa, drawn in pencil."),
          effect: { give: "sketch", learn: "bagan_has_sketch" }, to: "end" },
      },
    },
    bagan_elder: {
      start: "greet",
      nodes: {
        greet: {
          who: "daw-hla",
          text: T("မီးခွက် ဝယ်မလား ကလေး။ ငါးရာပဲ။ ညကျရင် လိုလိမ့်မယ်။",
            "Lamp, child? Five hundred. You'll want one after dark."),
          choices: [
            { text: T("ဝယ်မယ် (၅၀၀ ကျပ်)", "Buy one (500 kyat)"),
              if: { kyat: 500 }, effect: { kyat: -500, learn: "bagan_bought_lamp" }, to: "bought" },
            { text: T("ဒီစေတီပုံ သိလား", "Do you know this stupa?"), to: "sketch" },
          ],
        },
        bought: {
          who: "daw-hla",
          text: T("ကောင်းတယ်။ ဒီမှာ — မီးခြစ်ပါ ယူသွား။ အလကား။",
            "Good. Take the matches too. On me."),
          to: "greet",
        },
        sketch: {
          who: "daw-hla",
          text: T("ဒီပုံလား… စေတီတွေက အားလုံး တူတယ်ကွယ်။ ဒါပေမယ့် အရိပ်က မတူဘူး။ နေဝင်ချိန်မှာ ကြည့်။ ပုံနဲ့ တူတဲ့ အရိပ် တစ်ခုပဲ ရှိမယ်။",
            "They all look alike. Their shadows do not. Look near sunset. Only one shadow will match that drawing."),
          effect: { record: { kind: "people", id: "daw-hla" } },
          to: "end",
        },
      },
    },
    bagan_guide: {
      start: "greet",
      nodes: {
        greet: {
          who: "ko-nyi",
          text: T("လမ်းပြ လိုသလား။ တစ်နာရီ နှစ်ထောင်။ ဧည့်သည် မရှိတဲ့ရက်တွေ များတယ်။",
            "Need a guide? Two thousand an hour. There are more empty days than not."),
          choices: [
            { text: T("ငှားမယ် (၂,၀၀၀ ကျပ်)", "Hire him (2,000 kyat)"),
              if: [{ kyat: 2000 }, "!bagan_found_stupa"],
              effect: { kyat: -2000, learn: "bagan_found_stupa" }, to: "hired" },
            { text: T("စေတီတွေ ဘယ်နှစ်ခု ရှိလဲ", "How many temples are there?"), to: "count" },
            { text: T("ကိုယ့်ဘာသာ ရှာမယ်", "I'll look myself"), to: "end" },
          ],
        },
        hired: {
          who: "ko-nyi",
          text: T("ဟုတ်ပြီ။ လာ — မင်းပုံထဲက အုတ်ပုံစံက အနောက်ဘက်ခြမ်းက စေတီတွေမှာပဲ ရှိတယ်။ ငါ တစ်ခါတည်း ခေါ်သွားမယ်။",
            "Right. Come. That brickwork in your drawing only exists on the west group. I'll take you straight there."),
          to: "end",
        },
        count: {
          who: "ko-nyi",
          text: T("တရားဝင်က နှစ်ထောင်လေးရာ။ တကယ်ကတော့ ဘယ်သူမှ မရေဖူးဘူး။ ငါ ကလေးဘဝက ရေဖူးတယ် — ခုနစ်ရာမှာ လက်လျှော့လိုက်တယ်။",
            "Officially two thousand four hundred. Truly, nobody has counted. I tried as a boy. I gave up at seven hundred."),
          effect: { record: { kind: "people", id: "ko-nyi" } },
          to: "greet",
        },
      },
    },
    bagan_lacquer: {
      start: "greet",
      nodes: {
        greet: {
          who: "ma-ei-mon",
          text: T("ယွန်းထည် ကြည့်မလား။ ငါ လုပ်တာ သိပ်မကောင်းဘူး။ ငါ သိတယ်။ ဒါပေမယ့် ဈေးချိုတယ်။",
            "Lacquerware? Mine isn't good. I know it isn't. But it is cheap."),
          choices: [
            { text: T("ဘာလို့ ဆက်လုပ်နေတာလဲ", "Why keep making it, then?"),
              effect: { learn: "bagan_talked_lacquer", record: { kind: "people", id: "ma-ei-mon" } }, to: "why" },
          ],
        },
        why: {
          who: "ma-ei-mon",
          text: T("အမေ လုပ်ခဲ့တာ။ အမေက ကောင်းတယ်။ ငါ မကောင်းဘူး။ ဒါပေမယ့် ငါ ရပ်လိုက်ရင် ဒီရွာမှာ ဘယ်သူမှ မလုပ်တော့ဘူး။",
            "My mother made it. She was good. I am not. But if I stop, nobody in this village makes it at all."),
          to: "end",
        },
      },
    },
    bagan_recipient: {
      start: [{ if: "bagan_delivered", to: "after" }, { to: "greet" }],
      nodes: {
        greet: {
          who: "u-thaung",
          text: T("ဒီစေတီကို လာတဲ့သူ နည်းတယ်။ ငါ ရှစ်နှစ် ဒီမှာ ထိုင်နေတယ်။ မင်း ဘာရှာနေလဲ။",
            "Few come to this one. I have sat here eight years. What are you looking for?"),
          choices: [
            { text: T("စာတစ်စောင် ပေးရမှာပါ။ ဒါပေမယ့် နာမည် မပါဘူး", "A letter. Only it has no name on it"), to: "react" },
          ],
        },
        react: {
          who: "u-thaung",
          text: T("နာမည် မပါဘူးလား။ ဒါဆို စေတီအတွက်ပေါ့။ …ခဏနေဦး။ ဒီအောက်မှာ တစ်ခုခု မြှုပ်ထားတာ ရှိတယ်။ ငါ မတူးဘူး။ တူးဖို့ မဟုတ်လို့။",
            "No name? Then it is for the stupa. …Wait. Something is buried under here. I never dug it up. It was not mine to dig."),
          to: "react2",
        },
        react2: {
          who: "u-thaung",
          text: T("မင်းအဖိုးလား။ ဒါဆို သူ ပြန်လာတယ်ပေါ့။ နှစ်ဆယ့်နှစ်နှစ်ကြာမှ ဖြစ်ပေမယ့် ပြန်လာတာပဲ။",
            "Your grandfather? Then he came back after all. Twenty-two years late, but he came back."),
          effect: { learn: "bagan_delivered", kyat: 1800, record: { kind: "people", id: "u-thaung" } },
          letter: "bagan",
          to: "end",
        },
        after: {
          who: "u-thaung",
          text: T("မြှုပ်ထားတဲ့စာက ပြင်ဦးလွင်က မိန်းမတစ်ယောက်ဆီ ပို့ဖို့။ မင်း အဲဒီကို သွားမယ် ထင်တယ်။",
            "The buried letter was for a woman in Pyin Oo Lwin. I expect you are going there."),
          effect: { learn: "knows_buried_letter" },
          to: "end",
        },
      },
    },

    // ───────────────────────────────── INLE
    inle_arrive: {
      start: "a",
      nodes: {
        a: nar("အင်းလေးကန်။ အိမ်တွေက ရေပေါ်မှာ။ လမ်းတွေက ရေ။",
          "Inle. The houses stand in the water and the roads are water too.", { to: "b" }),
        b: { who: "phoe-chit",
          text: T("ပဉ္စမစာ — ဒေါ်စိန်။ ကြာချည် ရက်တဲ့သူတဲ့။",
            "Fifth letter. Daw Sein, who weaves lotus thread."), to: "end" },
      },
    },
    inle_fisherman: {
      start: [{ if: "inle_knows_where", to: "after" }, { to: "greet" }],
      nodes: {
        greet: {
          who: "ko-nyunt",
          text: T("ငါး ဝယ်မလား။ ဒါမှမဟုတ် လမ်းမေးမလား။ မင်းက လမ်းမေးမယ့် မျက်နှာပဲ။",
            "Buying fish or asking directions? You've the face of directions."),
          choices: [
            { text: T("ဒေါ်စိန် ဘယ်မှာလဲ", "Where is Daw Sein?"), to: "sein" },
            { text: T("ငါး ဝယ်မယ် (၁,၂၀၀ ကျပ်)", "Buy fish (1,200 kyat)"),
              if: { kyat: 1200 }, effect: { kyat: -1200, learn: "inle_bought_fish" }, to: "fish" },
          ],
        },
        sein: {
          who: "ko-nyunt",
          text: T("စိန်ကြီးလား။ ရွာမှာ မနေတော့ဘူး။ ရက်ကန်းစင်ကို ရေထဲ ရွှေ့လိုက်တယ် — တစ်ယောက်တည်း နေချင်လို့တဲ့။ လှေနဲ့မှ ရောက်တယ်။",
            "Old Sein? Not in the village any more. She moved the loom out onto the water to be left alone. You'll need a boat."),
          effect: { learn: "inle_knows_where", record: { kind: "people", id: "ko-nyunt" } },
          to: "end",
        },
        fish: {
          who: "ko-nyunt",
          text: T("ကောင်းတဲ့ငါး။ ဒီနေ့ ငါ ကံကောင်းတယ်။ ဒါပေမယ့် ကံကောင်းတာက စောင့်တတ်လို့ပါ။",
            "Good fish. Lucky day. Though luck is mostly sitting still long enough."),
          to: "greet",
        },
        after: {
          who: "ko-nyunt",
          text: T("လှေက ဟိုမှာ။ ခြေထောက်နဲ့ လှော်ကြည့်။ ထင်သလောက် မလွယ်ဘူး။",
            "Boat's there. Try rowing with your leg. It is not as easy as we make it look."),
          to: "end",
        },
      },
    },
    inle_elder: {
      start: "greet",
      nodes: {
        greet: {
          who: "daw-mya-yee",
          text: T("စိန်ကို ရှာနေတာလား။ သူ ဘာလို့ ရွာကနေ ထွက်သွားလဲ သိလား။",
            "Looking for Sein? Do you know why she left the village?"),
          choices: [
            { text: T("မသိပါဘူး", "No"), to: "why" },
          ],
        },
        why: {
          who: "daw-mya-yee",
          text: T("သူ့ရက်ကန်းက အသံရှိတယ်။ ရွာသားတွေက ညဘက် အိပ်မရဘူးလို့ ညည်းတယ်။ ဒါနဲ့ သူ ရေပေါ် ရွှေ့သွားတယ်။ တစ်ခွန်းမှ မငြင်းဘဲ။",
            "Her loom makes a noise. The village complained they could not sleep. So she moved onto the water. She did not argue once."),
          effect: { record: { kind: "people", id: "daw-mya-yee" } },
          to: "b",
        },
        b: {
          who: "daw-mya-yee",
          text: T("အခုတော့ ညဘက် တိတ်ဆိတ်နေပြီ။ ငါတို့ အိပ်မရသေးဘူး။",
            "It is quiet at night now. We still cannot sleep."),
          to: "end",
        },
      },
    },
    inle_kid: {
      start: "greet",
      nodes: {
        greet: {
          who: "maung-oo",
          text: T("ကိုကြီး၊ ခြေထောက်နဲ့ လှော်တတ်လား။ ကျွန်တော် မတတ်သေးဘူး။ ရေကူးလည်း မတတ်ဘူး။",
            "Can you row with your leg? I can't. I can't swim either."),
          choices: [
            { text: T("ရေကူးအရင် သင်ပါ", "Learn to swim first"),
              effect: { learn: "inle_taught_kid", record: { kind: "people", id: "maung-oo" } }, to: "a" },
            { text: T("ငါလည်း မတတ်ဘူး", "I can't row either"),
              effect: { learn: "inle_taught_kid", record: { kind: "people", id: "maung-oo" } }, to: "b" },
          ],
        },
        a: { who: "maung-oo",
          text: T("အားလုံး အဲလိုပဲ ပြောတယ်။ ဒါပေမယ့် အဖေက ရေမကူးတတ်ဘဲ လှော်တာ သုံးဆယ်နှစ်ပဲ။",
            "Everyone says that. But my father has rowed for thirty years and never learned to swim."), to: "end" },
        b: { who: "maung-oo",
          text: T("ဟုတ်လား! ဒါဆို ကိုကြီးရော ကျွန်တော်ရော တူတူပဲ။ ကောင်းတယ်။",
            "Really! Then we're the same. That's better."), to: "end" },
      },
    },
    inle_recipient: {
      start: [{ if: "inle_delivered", to: "after" }, { to: "greet" }],
      nodes: {
        greet: {
          who: "daw-sein",
          text: T("ဒီအထိ လှော်လာတာလား။ ရွာသားတွေတောင် မလာကြဘူး။ ဘာလဲ ကလေး။",
            "You rowed all the way out? Even the village does not. What is it, child?"),
          choices: [{ text: T("ဦးဘငြိမ်းဆီက စာပါ", "A letter from U Ba Nyein"), to: "react" }],
        },
        react: {
          who: "daw-sein",
          text: T("ဘငြိမ်း။ …ရက်ကန်း ရပ်လိုက်ပါရစေ။ ဒီအသံနဲ့ ဖတ်လို့ မရဘူး။",
            "Ba Nyein. …Let me stop the loom. I cannot read anything over that noise."),
          to: "react2",
        },
        react2: {
          who: "daw-sein",
          text: T("သူ့အတွက် လုံချည်တစ်ထည် ငါ ချုပ်ပေးခဲ့တယ်။ လေးလ ကြာတယ်။ သူ ဘယ်တော့မှ မဝတ်ဘူးဆိုတာ ငါ သိတယ်။",
            "I wove him a longyi once. Four months. I always knew he never wore it."),
          effect: { learn: "inle_delivered", kyat: 1800, record: { kind: "people", id: "daw-sein" } },
          letter: "inle",
          to: "end",
        },
        after: {
          who: "daw-sein",
          text: T("စိတ်မဆိုးပါဘူး။ ရက်ရတာက ဝတ်ရတာထက် ပိုကောင်းတယ်။ တကယ်ပါ။",
            "I am not angry. The weaving was better than the wearing. Truly."),
          to: "end",
        },
      },
    },

    // ───────────────────────────────── KALAW
    kalaw_arrive: {
      start: "a",
      nodes: {
        a: nar("ထင်းရှူးနံ့။ အေးတယ်။ တောင်ပေါ်က ကျောင်းက မြူထဲမှာ။",
          "Pine and cold air. The school is somewhere up in the cloud.", { to: "b" }),
        b: { who: "phoe-chit",
          text: T("ဆဋ္ဌမစာ — ဆရာမ ခင်။ အမေ့ဆရာမတဲ့။ အမေ တစ်ခါမှ မပြောဖူးဘူး။",
            "Sixth letter. Saya Ma Khin. My mother's teacher. Mother never mentioned her."), to: "end" },
      },
    },
    kalaw_guide: {
      start: [{ if: "kalaw_knows_way", to: "after" }, { to: "greet" }],
      nodes: {
        greet: {
          who: "ko-aung",
          text: T("တောင်တက်မလား။ ငါ လမ်းပြပေးလို့ရတယ် — ဒါပေမယ့် ဒူးက မကောင်းတော့ဘူး။ လမ်းပဲ ပြောပြမယ်။",
            "Going up? I could guide you, but the knees have retired. I'll tell you the way instead."),
          choices: [
            { text: T("ပြောပြပါ", "Please"),
              effect: { learn: "kalaw_knows_way", record: { kind: "people", id: "ko-aung" } }, to: "way" },
          ],
        },
        way: {
          who: "ko-aung",
          text: T("မတ်စောက်တယ်။ အရှိန်နဲ့ တက်ရင် တစ်ဝက်မှာ ရပ်ရမယ်။ ဖြေးဖြေး တက်၊ အသက်ကို ပြန်ရအောင် ရပ်ပါ။ တောင်က ပြေးတဲ့သူကို ဒဏ်ခတ်တယ်။",
            "It's steep. Rush it and you'll stop halfway. Go slow, breathe back. The hill punishes hurry."),
          to: "end",
        },
        after: {
          who: "ko-aung",
          text: T("မောရင် ရပ်။ ရပ်တာက ရှုံးတာ မဟုတ်ဘူး။",
            "Stop when you're winded. Stopping isn't losing."),
          to: "end",
        },
      },
    },
    kalaw_vendor: {
      start: "greet",
      nodes: {
        greet: {
          who: "daw-shwe",
          text: T("ကော်ဖီ သောက်မလား။ လေးရာ။ တောင်တက်ခါနီး လူတိုင်း ဒီမှာ ရပ်တယ်။",
            "Coffee? Four hundred. Everyone stops here before the climb."),
          choices: [
            { text: T("သောက်မယ် (၄၀၀ ကျပ်)", "Yes (400 kyat)"),
              if: { kyat: 400 }, effect: { kyat: -400, learn: "kalaw_bought_coffee" }, to: "drink" },
            { text: T("ဆရာမ ခင်ကို သိလား", "Do you know Saya Ma Khin?"), to: "teacher" },
          ],
        },
        drink: {
          who: "daw-shwe",
          text: T("ဖြေးဖြေး သောက်ပါ။ အပေါ်မှာ ဘာမှ မရှိဘူး — ကျောင်းတစ်ဆောင်နဲ့ လေပဲ။",
            "Drink it slowly. There's nothing up top but the school and a great deal of wind."),
          to: "greet",
        },
        teacher: {
          who: "daw-shwe",
          text: T("ဆရာမ ခင်လား။ လေးဆယ်နှစ် ဒီတောင်ပေါ်မှာ သင်နေတာ။ ငါ့သားတောင် သူ့တပည့်။ အခု သူ့မြေးတွေ သင်နေပြီ။",
            "Forty years teaching on that ridge. My son was hers. Now she has his children."),
          effect: { record: { kind: "people", id: "daw-shwe" } },
          to: "greet",
        },
      },
    },
    kalaw_kid: {
      start: "greet",
      nodes: {
        greet: {
          who: "maung-kyaw",
          text: T("ကိုကြီးလည်း ကျောင်းသွားမှာလား။ ကျွန်တော် နေ့တိုင်း တက်တယ်။ တစ်နာရီခွဲ လမ်းလျှောက်ရတယ်။",
            "Are you going up to the school? I walk it every day. An hour and a half."),
          choices: [
            { text: T("နေ့တိုင်းလား", "Every day?"),
              effect: { learn: "kalaw_walked_with_kid", record: { kind: "people", id: "maung-kyaw" } }, to: "a" },
          ],
        },
        a: {
          who: "maung-kyaw",
          text: T("ဟုတ်တယ်။ မိုးရွာရင်လည်း တက်တယ်။ ဆရာမက 'မလာလည်း ရတယ်' လို့ ပြောတယ်။ ဒါပေမယ့် သူ့မျက်နှာက မဟုတ်ဘူး။",
            "Yes. Even in rain. Saya says I don't have to come. Her face says otherwise."),
          to: "end",
        },
      },
    },
    kalaw_recipient: {
      start: [{ if: "kalaw_delivered", to: "after" }, { to: "greet" }],
      nodes: {
        greet: {
          who: "saya-ma-khin",
          text: T("တောင်တက်လာတာလား။ မောနေတယ်။ ထိုင်။ ရေသောက်။ ပြီးမှ ပြော။",
            "You climbed. You're winded. Sit. Water first, then talk."),
          choices: [{ text: T("ဦးဘငြိမ်းဆီက စာပါ", "A letter from U Ba Nyein"), to: "react" }],
        },
        react: {
          who: "saya-ma-khin",
          text: T("ဘငြိမ်း… မလှမြင့်ရဲ့ အဖေ။ ဒါဆို မင်းက မလှမြင့်ရဲ့ သားပေါ့။",
            "Ba Nyein. Ma Hla Myint's father. Then you are Ma Hla Myint's son."),
          to: "react2",
        },
        react2: {
          who: "saya-ma-khin",
          text: T("မင်းအမေက ထက်တယ်။ ပျင်းတယ်။ နှစ်ခုလုံး မှန်တယ်။ ငါ သူ့ကို အဲလို ပြောခဲ့တယ် — အခုထိ နောင်တရနေတယ်လို့ ထင်ခဲ့တာ။",
            "Your mother was clever and lazy. Both were true. I told her so, and have wondered about it for thirty years."),
          effect: { learn: "kalaw_delivered", kyat: 1800, record: { kind: "people", id: "saya-ma-khin" } },
          letter: "kalaw",
          to: "end",
        },
        after: {
          who: "saya-ma-khin",
          text: T("သူ မှတ်မိသေးတယ်ဆိုတော့… ကောင်းတယ်။ ဆရာမတစ်ယောက် ကြောက်တာက မေ့သွားမှာပဲ။",
            "She remembers, then. Good. A teacher's fear is being forgotten, not being wrong."),
          to: "end",
        },
      },
    },

    // ───────────────────────────────── PYIN OO LWIN
    pol_arrive: {
      start: "a",
      nodes: {
        a: nar("ပန်းခြံမြို့။ လေက အေးတယ်။ စာအိတ်ပေါ်က နာမည် — ဒေါ်ယဉ်နွယ်။",
          "Garden town, cool air. The name on the seventh envelope is Daw Yin Nwe.", { to: "b" }),
        b: { who: "phoe-chit",
          text: T("ပုဂံက အဖိုးကြီး ပြောသွားတဲ့ နာမည်နဲ့ တူတယ်။ မြှုပ်ထားတဲ့ စာက သူ့ဆီ ပို့ဖို့ဆိုတာ။",
            "The same name the old keeper in Bagan said. The buried letter was hers."), to: "end" },
      },
    },
    pol_vendor: {
      start: [{ if: "pol_asked_flowers", to: "after" }, { to: "greet" }],
      nodes: {
        greet: {
          who: "ma-thida",
          text: T("ပန်းလား။ မြင်းလှည်း မထွက်ခင် ရောင်းရအောင်။",
            "Flowers? Let me sell them before the cart goes."),
          choices: [
            { text: T("ဒေါ်ယဉ်နွယ်ကို သိလား", "Do you know Daw Yin Nwe?"), to: "who" },
          ],
        },
        who: {
          who: "ma-thida",
          text: T("သိတာပေါ့။ တစ်ပတ်တစ်ခါ ဒီကို လာတယ်။ ပန်းဝယ်ပြီး သင်္ချိုင်းကို သွားတယ်။ အမေ့အတွက်။",
            "Of course. She comes once a week, buys flowers, walks to the cemetery. For her mother."),
          effect: { learn: "pol_knows_flowers", record: { kind: "people", id: "ma-thida" } },
          to: "who2",
        },
        who2: {
          who: "ma-thida",
          text: T("စကားပြောချင်ရင် ပန်းယူသွား။ လက်ဗလာနဲ့ သွားလို့ ရမယ့် မိန်းမ မဟုတ်ဘူး။",
            "If you want her to listen, don't arrive empty-handed. She isn't that sort of woman."),
          to: "end",
        },
        after: {
          who: "ma-thida",
          text: T("အနီရောင်ချည်း ကောက်နော်။ သူ အနီပဲ ယူတယ်။",
            "Reds only, mind. She only ever takes the red ones."),
          to: "end",
        },
      },
    },
    pol_driver: {
      start: "greet",
      nodes: {
        greet: {
          who: "u-maung-gale",
          text: T("မြင်းလှည်း စီးမလား။ တစ်ပတ် နှစ်ထောင်။ မြင်းက ငါ့ထက် အလုပ်ကြိုးစားတယ်။",
            "Cart ride? Two thousand the loop. The horse works harder than I do."),
          choices: [
            { text: T("စီးမယ် (၂,၀၀၀ ကျပ်)", "Ride (2,000 kyat)"),
              if: { kyat: 2000 }, effect: { kyat: -2000, learn: "pol_talked_driver" }, to: "ride" },
            { text: T("ဒေါ်ယဉ်နွယ်အကြောင်း သိလား", "What do you know about Daw Yin Nwe?"),
              effect: { learn: "pol_talked_driver", record: { kind: "people", id: "u-maung-gale" } }, to: "her" },
          ],
        },
        ride: { who: "u-maung-gale",
          text: T("တင်လိုက်။ ဒီမြို့က မြင်းလှည်းနဲ့ ကြည့်မှ လှတယ်။", "Get on. This town is only pretty at cart speed."), to: "end" },
        her: {
          who: "u-maung-gale",
          text: T("နှစ်ဆယ်ကျော် တစ်ယောက်တည်း နေတယ်။ အမေဆုံးတုန်းက သူ ရန်ကုန်မှာ။ သတင်း မရလိုက်ဘူး။ အဲဒါ သူ့ကို ပြောင်းပစ်လိုက်တယ်။",
            "Alone twenty-odd years. She was in Yangon when her mother died. Word never reached her. It changed her."),
          to: "end",
        },
      },
    },
    pol_gardener: {
      start: "greet",
      nodes: {
        greet: {
          who: "ko-lwin",
          text: T("ဖန်လုံအိမ်ထဲ ကြိုက်သလို ကြည့်ပါ။ ဒီပန်းတွေက ငါ့ထက် သက်တမ်းရှည်မယ်။",
            "Look round the glasshouse. Most of these will outlive me."),
          choices: [
            { text: T("ဒေါ်ယဉ်နွယ်က ဒီကို လာလား", "Does Daw Yin Nwe come here?"),
              effect: { learn: "pol_talked_gardener", record: { kind: "people", id: "ko-lwin" } }, to: "a" },
          ],
        },
        a: {
          who: "ko-lwin",
          text: T("လာတယ်။ တစ်ပတ်တစ်ခါ။ အမြဲ တစ်နေရာမှာ ရပ်တယ် — အဲဒီ ပန်းကွက်။ သူ့အမေ စိုက်ခဲ့တာ။",
            "Weekly. Always stops at the same bed. Her mother planted it."),
          to: "b",
        },
        b: {
          who: "ko-lwin",
          text: T("စိတ်ဆိုးတာ ဆိုတာ တစ်ခါတလေ ချစ်တာကို သိမ်းထားတဲ့ နည်းလမ်းပဲ ကလေးရေ။",
            "Anger is sometimes only love that was never allowed to arrive, child."),
          to: "end",
        },
      },
    },
    pol_recipient: {
      start: [
        { if: "pol_delivered", to: "after" },
        { if: "pol_gathered", to: "second" },
        { if: "pol_refused", to: "again" },
        { to: "greet" },
      ],
      nodes: {
        greet: {
          who: "daw-yin-nwe",
          text: T("ဘာလဲ ကလေး။",
            "Yes, child?"),
          choices: [{ text: T("ဦးဘငြိမ်းဆီက စာပါ", "A letter from U Ba Nyein"), to: "refuse" }],
        },
        refuse: {
          who: "daw-yin-nwe",
          text: T("မယူပါဘူး။",
            "No."),
          to: "refuse2",
        },
        refuse2: {
          who: "daw-yin-nwe",
          text: T("နာမည် ထပ်မပြောနဲ့။ ပြန်သွား ကလေး။ မင်းနဲ့ မဆိုင်ဘူး။",
            "Do not say that name again. Go home. This is not your business."),
          effect: { learn: "pol_refused" },
          to: "end",
        },
        again: {
          who: "daw-yin-nwe",
          text: T("ရှိသေးလား။ ငါ ပြောပြီးပြီ။",
            "Still here? I have said my piece."),
          choices: [
            { text: T("ပန်းယူလာပါရစေ", "Let me bring you flowers"),
              effect: { learn: "pol_asked_flowers" }, to: "flowers" },
            { text: T("ကျွန်တော် ပြန်သွားပါ့မယ်", "I'll go"), to: "end" },
          ],
        },
        flowers: {
          who: "daw-yin-nwe",
          text: T("…ပန်း။ အနီရောင်ပဲ ယူခဲ့။ အမေ အနီကြိုက်တယ်။",
            "…Flowers. Red ones only. My mother liked red."),
          to: "end",
        },
        second: {
          who: "daw-yin-nwe",
          text: T("ဒါတွေ ဘယ်က ကောက်လာလဲ။ …ဟုတ်ပြီ။ ထိုင်။",
            "Where did you pick these? …All right. Sit."),
          choices: [{ text: T("စာကို ဖတ်ပါ", "Read the letter"), to: "read" }],
        },
        read: {
          who: "daw-yin-nwe",
          text: T("ဖတ်မှာ မဟုတ်ဘူး။ ငါ့ဘာသာ ဖတ်မယ်။ မင်းက ထွက်သွား။ …မဟုတ်ဘူး၊ နေပါ။ နေပါ ကလေး။",
            "I will not read it aloud. I will read it myself, and you will go outside. …No. Stay. Stay, child."),
          effect: { learn: "pol_delivered", record: { kind: "people", id: "daw-yin-nwe" } },
          letter: "pyin-oo-lwin",
          to: "end",
        },
        after: {
          who: "daw-yin-nwe",
          text: T("သူ့ကို ငါ ခွင့်မလွှတ်ဘူး။ ဒါပေမယ့် သူ မမေ့ဘူးဆိုတာ ငါ သိသွားပြီ။ ဒါက တခြားအရာတစ်ခုပဲ။",
            "I have not forgiven him. But I know now that he did not forget. That is a different thing, and it is something."),
          to: "end",
        },
      },
    },

    // ───────────────────────────────── MRAUK U
    mrauk_arrive: {
      start: "a",
      nodes: {
        a: nar("မြူက ရင်ဘတ်အထိ။ စေတီတွေက အသံလို ပေါ်လာပြီး ပျောက်သွားတယ်။",
          "Mist to the chest. Temples surface and disappear like sounds.", { to: "b" }),
        b: { who: "phoe-chit",
          text: T("အဋ္ဌမစာ — ဦးကျော်ဇံ။",
            "Eighth letter. U Kyaw Zan."), to: "end" },
      },
    },
    mrauk_monk: {
      start: [{ if: "mrauk_knows_grave", to: "after" }, { to: "greet" }],
      nodes: {
        greet: {
          who: "u-thila",
          text: T("မြူထဲမှာ လမ်းပျောက်တတ်တယ် ဒကာလေး။ ဘယ်ကို သွားမလဲ။",
            "People lose the path in this, child. Where are you bound?"),
          choices: [{ text: T("ဦးကျော်ဇံကို ရှာနေတာပါ", "I'm looking for U Kyaw Zan"), to: "news" }],
        },
        news: {
          who: "u-thila",
          text: T("…ကျော်ဇံ ဒကာကြီး မနှစ်က ကွယ်လွန်သွားပြီ။ မိုးဦးကျမှာ။",
            "…Kyaw Zan died last year. At the start of the rains."),
          to: "news2",
        },
        news2: {
          who: "u-thila",
          text: T("သင်္ချိုင်းက အရှေ့ဘက်။ မြူထဲမှာ စေတီတွေကို မှတ်ပြီး သွား — လမ်းက စေတီရှိတဲ့ဘက်မှာ။",
            "The grave is east. Steer by the stupas — where a stupa shows, the path is true."),
          effect: { learn: "mrauk_knows_grave", record: { kind: "people", id: "u-thila" } },
          to: "end",
        },
        after: {
          who: "u-thila",
          text: T("စေတီရှိတဲ့ဘက် ကလေး။ ပြေးမသွားနဲ့။",
            "Where the stupa shows, child. And do not run."),
          to: "end",
        },
      },
    },
    mrauk_daughter: {
      start: [{ if: "mrauk_delivered", to: "after" }, { to: "greet" }],
      nodes: {
        greet: {
          who: "ma-hla-nu",
          text: T("မင်း အဖေ့ကို ရှာနေတာလား။ နောက်ကျသွားပြီ။ လူတိုင်းလိုပဲ။",
            "You're looking for my father. You're late. Everyone is."),
          choices: [
            { text: T("စာတစ်စောင် ယူလာတာပါ", "I brought a letter"), to: "letter" },
            { text: T("စိတ်မကောင်းပါဘူး", "I'm sorry"),
              effect: { learn: "mrauk_talked_daughter", record: { kind: "people", id: "ma-hla-nu" } }, to: "sorry" },
          ],
        },
        letter: {
          who: "ma-hla-nu",
          text: T("ဘငြိမ်းဆီကလား။ …အဖေ သူ့အကြောင်း ပြောတယ်။ ငွေချေးထားတယ်လို့။ ဘယ်တော့မှ ပြန်မတောင်းဘူးလို့။",
            "From Ba Nyein? …Father spoke of him. Said he owed him money. Said he'd never ask for it."),
          effect: { learn: "mrauk_talked_daughter", record: { kind: "people", id: "ma-hla-nu" } },
          to: "letter2",
        },
        letter2: {
          who: "ma-hla-nu",
          text: T("သင်္ချိုင်းမှာ ဖတ်ပြပါ။ အဖေက စာဖတ်ရတာ ကြိုက်တယ်။ မျက်စိ မကောင်းတော့လို့ ငါ ဖတ်ပြရတာ။",
            "Read it at the graveside. He liked being read to. His eyes went, so I read to him."),
          to: "end",
        },
        sorry: {
          who: "ma-hla-nu",
          text: T("လူတိုင်း စိတ်မကောင်းဘူးလို့ ပြောတယ်။ တစ်ယောက်မှ သူ့ကုလားထိုင်ကို မထိုင်ရဲဘူး။ ငါ မဖယ်ဘူး။",
            "Everyone is sorry. Nobody will sit in his chair. I have not moved it."),
          to: "end",
        },
        after: {
          who: "ma-hla-nu",
          text: T("ကျေးဇူးတင်ပါတယ်။ အဖေ ကြားသွားလိမ့်မယ် ထင်တယ်။",
            "Thank you. I think he heard it."),
          to: "end",
        },
      },
    },
    mrauk_guide: {
      start: "greet",
      nodes: {
        greet: {
          who: "ko-san-shwe",
          text: T("မြူထဲ လမ်းပြပေးရမလား။ သုံးထောင်။ ဒီမြူက ရက်ပေါင်းများစွာ မတိတ်ဘူး။",
            "Guide through the fog? Three thousand. This mist can last days."),
          choices: [
            { text: T("ငှားမယ် (၃,၀၀၀ ကျပ်)", "Hire him (3,000 kyat)"),
              if: [{ kyat: 3000 }, "mrauk_knows_grave", "!mrauk_walked"],
              effect: { kyat: -3000, learn: ["mrauk_walked", "mrauk_dealt_guide"] }, to: "hired" },
            { text: T("ကိုယ့်ဘာသာ သွားမယ်", "I'll find it myself"),
              effect: { learn: "mrauk_dealt_guide", record: { kind: "people", id: "ko-san-shwe" } }, to: "alone" },
          ],
        },
        hired: {
          who: "ko-san-shwe",
          text: T("လိုက်ခဲ့။ ငါ့ခြေရာကို နင်း။ ငါ ဒီမှာ မွေးတာ — မြူက ငါ့ကို လမ်းမပျောက်စေဘူး။",
            "Follow. Step where I step. I was born here; the fog and I have an arrangement."),
          to: "end",
        },
        alone: {
          who: "ko-san-shwe",
          text: T("ကောင်းတယ်။ သွား။ စေတီရှိတဲ့ဘက် လိုက်။ လမ်းမှားရင် ပြန်လာခဲ့ — ဈေးတက်မှာတော့ မဟုတ်ဘူး။",
            "Fine. Go. Follow the stupas. Come back if you get lost — I won't put the price up."),
          to: "end",
        },
      },
    },
    mrauk_graveside: {
      start: "a",
      nodes: {
        a: nar("သင်္ချိုင်းက သေးသေးလေး။ နာမည်ကို လက်နဲ့ ထွင်းထားတယ်။",
          "The grave is small. The name was cut by hand, not well.", { to: "b" }),
        b: {
          who: "phoe-chit",
          text: T("ဘယ်လို ဖတ်ပြရမလဲ ငါ မသိဘူး။ ဒါပေမယ့် မလှနုက ဖတ်ပြခိုင်းတယ်။",
            "I don't know how you read a letter to someone who isn't there. But she asked me to."),
          to: "c",
        },
        c: {
          who: "phoe-chit",
          text: T("ကျယ်ကျယ် ဖတ်လိုက်တယ်။ မြူထဲမှာ အသံက မလွင့်ဘူး — အနားမှာပဲ ကျန်နေတယ်။",
            "I read it out loud. In fog a voice doesn't carry. It just stays near you."),
          effect: { learn: "mrauk_delivered" },
          letter: "mrauk-u",
          to: "end",
        },
      },
    },

    // ───────────────────────────────── HPA-AN
    hpaan_arrive: {
      start: "a",
      nodes: {
        a: nar("ကျောက်တောင်တွေက လယ်ကွင်းထဲက တိုက်တွေလိုပဲ ထောင်နေတယ်။",
          "The karsts stand out of the paddy like buildings nobody built.", { to: "b" }),
        b: { who: "phoe-chit",
          text: T("နဝမစာ — ဦးဖိုးသိန်း။ အဖိုးရဲ့ လက်ရေးက ဒီစာမှာ တုန်နေတယ်။",
            "Ninth letter. U Po Thin. Grandfather's handwriting shakes on this one."), to: "end" },
      },
    },
    hpaan_kid: {
      start: [{ if: "hpaan_has_torch", to: "after" }, { to: "greet" }],
      nodes: {
        greet: {
          who: "maung-lay",
          text: T("ဂူထဲ ဝင်မလား။ ကျွန်တော် မကြောက်ဘူး။ တကယ် မကြောက်ဘူး။",
            "Going in the cave? I'm not scared of it. I'm really not."),
          choices: [
            { text: T("မီးရှူး ရှိလား", "Have you got a torch?"),
              effect: { learn: "hpaan_has_torch", give: "torch", record: { kind: "people", id: "maung-lay" } }, to: "torch" },
          ],
        },
        torch: {
          who: "maung-lay",
          text: T("ရှိတယ်။ ဒီမှာ။ ဒါပေမယ့် ပြန်ပေးရမယ်နော် — ကျွန်တော့်အဖေ့ဟာ။",
            "Yes. Here. Bring it back though. It was my father's."),
          to: "end",
        },
        after: {
          who: "maung-lay",
          text: T("ဂူထဲမှာ ဘာရှိလဲ ပြောပြနော်။ ကျွန်တော် မကြောက်ပေမယ့် မဝင်ဖူးသေးဘူး။",
            "Tell me what's inside. I'm not scared, I've just never been in."),
          to: "end",
        },
      },
    },
    hpaan_elder: {
      start: "greet",
      nodes: {
        greet: {
          who: "daw-aye",
          text: T("ဦးဖိုးသိန်းဆီ သွားမလား။ သတိထား — သူ့ဒေါသက ရှစ်နှစ်လောက် အသက်ရှည်တယ်။",
            "Off to see U Po Thin? Careful. His temper outlived his wife by eight years."),
          choices: [
            { text: T("ဘာဖြစ်ခဲ့တာလဲ", "What happened to him?"),
              effect: { learn: "hpaan_talked_elder", record: { kind: "people", id: "daw-aye" } }, to: "a" },
          ],
        },
        a: {
          who: "daw-aye",
          text: T("၁၉၉၁ မှာ သူ့အဖေကို ခေါ်သွားတယ်။ ပြန်မလာဘူး။ လူတွေ မေးခံရတယ် — အားလုံး ငြိမ်နေခဲ့တယ်။ စာပို့သမားပါ ငြိမ်နေခဲ့တယ်။",
            "In 1991 they took his father. He never came back. People were questioned. Everyone stayed quiet. The postman stayed quiet too."),
          to: "b",
        },
        b: {
          who: "daw-aye",
          text: T("ငြိမ်နေတာက အဲဒီတုန်းက ပညာရှိတာ။ အခုတော့ လူတိုင်း အဲလို မထင်တော့ဘူး။",
            "Silence was wisdom then. Not everyone still calls it that."),
          to: "end",
        },
      },
    },
    hpaan_recipient: {
      start: [
        { if: "hpaan_delivered", to: "after" },
        { if: { item: "tinbox" }, to: "box" },
        { if: "hpaan_refused", to: "again" },
        { to: "greet" },
      ],
      nodes: {
        greet: {
          who: "u-po-thin",
          text: T("ဘာလဲ။",
            "What."),
          choices: [{ text: T("ဦးဘငြိမ်းဆီက စာပါ", "A letter from U Ba Nyein"), to: "angry" }],
        },
        angry: {
          who: "u-po-thin",
          text: T("ထွက်သွား။",
            "Get out."),
          to: "angry2",
        },
        angry2: {
          who: "u-po-thin",
          text: T("အဲဒီလူက ငြိမ်နေခဲ့တယ်။ ငါ့အဖေ ပြန်မလာဘူး။ စာနဲ့ ဘာလုပ်မလဲ။",
            "That man said nothing. My father did not come home. What is a letter meant to do."),
          effect: { learn: "hpaan_refused" },
          to: "end",
        },
        again: {
          who: "u-po-thin",
          text: T("မင်း ဒီမှာ ဘာလုပ်နေတာလဲ။",
            "Why are you still standing there."),
          choices: [
            { text: T("စာထဲမှာ ဂူတစ်ခုအကြောင်း ရေးထားတယ်", "The letter mentions a cave"),
              effect: { learn: "hpaan_hint" }, to: "hint" },
            { text: T("ပြန်သွားပါ့မယ်", "I'll go"), to: "end" },
          ],
        },
        hint: {
          who: "u-po-thin",
          text: T("…ဂူ။ ငါ့အဖေက ဂူထဲ တစ်ခုခု ထားခဲ့တယ်လို့ ပြောဖူးတယ်။ ငါ ရှာဖူးတယ်။ မတွေ့ဘူး။ မင်း သွားရှာကြည့်။",
            "…The cave. My father said he left something there. I looked. I never found it. Go and look, then."),
          to: "end",
        },
        box: {
          who: "u-po-thin",
          text: T("ဒါ… အဖေ့ သံဘူး။ မင်း ဖွင့်ခဲ့လား။",
            "That is his tin. Did you open it."),
          choices: [
            { text: T("မဖွင့်ပါဘူး", "No"), to: "open" },
          ],
        },
        open: {
          who: "u-po-thin",
          text: T("ဘငြိမ်းလည်း မဖွင့်ဘူး။ ဆယ်နှစ်ကျော် သိထားပြီး မဖွင့်ဘူး။ …ဟုတ်ပြီ။ စာကို ပေး။",
            "Ba Nyein never opened it either. Knew where it was for thirty years and left it shut. …All right. Give me the letter."),
          effect: { learn: "hpaan_delivered", take: "tinbox", record: { kind: "people", id: "u-po-thin" } },
          letter: "hpa-an",
          to: "end",
        },
        after: {
          who: "u-po-thin",
          text: T("ငါ သူ့ကို ခွင့်မလွှတ်ဘူး။ ဒါပေမယ့် သူ ဒီဘူးကို မဖွင့်ခဲ့ဘူးဆိုတာ… အဲဒါက တစ်ခုခုပဲ။",
            "I do not forgive him. But he did not open the tin. That is something. It is not nothing."),
          to: "end",
        },
      },
    },

    // ───────────────────────────────── NGAPALI
    ngapali_arrive: {
      start: "a",
      nodes: {
        a: nar("ကမ်းခြေ။ ဒီရေ ဆုတ်နေတယ်။ သဲပေါ်မှာ ခြေရာတွေ ကျန်နေတယ်။",
          "The shore. The tide is out, and the flats are printed with everyone who crossed today.", { to: "b" }),
        b: {
          who: "phoe-chit",
          text: T("နောက်ဆုံးစာအိတ်။ လိပ်စာမှာ… ငါ့နာမည်။",
            "The last envelope. The name on it is mine."),
          to: "end",
        },
      },
    },
    ngapali_fisherman: {
      start: "greet",
      nodes: {
        greet: {
          who: "u-hla-win",
          text: T("ဒီရေက နှစ်နာရီပဲ ရှိတယ်ကွယ်။ သဲပြင်ကို ဖြတ်မယ်ဆိုရင် အခု ဖြတ်။",
            "Two hours of low water, no more. If you're crossing the flats, cross now."),
          choices: [
            { text: T("ဒေါ်သိန်းရီကို သိလား", "Do you know Daw Thein Yi?"),
              effect: { learn: "ngapali_talked_fisher", record: { kind: "people", id: "u-hla-win" } }, to: "her" },
          ],
        },
        her: {
          who: "u-hla-win",
          text: T("သိတယ်။ ကမ်းစပ်မှာ။ တစ်နှစ်လုံး တစ်ခုခု သိမ်းထားတယ်လို့ ပြောတယ် — ကလေးတစ်ယောက် လာယူမယ်တဲ့။",
            "Aye. Up the beach. Says she's been keeping something for a year. Says a boy will come for it."),
          to: "end",
        },
      },
    },
    ngapali_keeper: {
      start: [{ if: "ngapali_knows_spot", to: "after" }, { to: "greet" }],
      nodes: {
        greet: {
          who: "daw-thein-yi",
          text: T("မင်း ဖိုးချစ်လား။",
            "Are you Phoe Chit?"),
          choices: [
            { text: T("ဟုတ်ပါတယ်", "I am"), to: "yes" },
          ],
        },
        yes: {
          who: "daw-thein-yi",
          text: T("မင်းအဖိုး ဒီကို လာခဲ့တယ် — ဆုံးခါနီးမှာ။ စာအိတ်တစ်စောင် ငါ့ကို အပ်သွားတယ်။ 'ကလေး လာမယ်။ ဒါပေမယ့် သဲပြင် ဖြတ်ပြီးမှ ပေး' တဲ့။",
            "Your grandfather came here at the end. Left me an envelope. Said a boy would come, and I was not to give it to him until he had crossed the flats."),
          to: "yes2",
        },
        yes2: {
          who: "daw-thein-yi",
          text: T("ဘာလို့လဲလို့ ငါ မေးတယ်။ သူ ပြောတယ် — 'ခရီးက စာထဲမှာ မပါဘူး။ ခရီးက ခြေထောက်ထဲမှာ' တဲ့။",
            "I asked why. He said: the journey is not in the letter. It is in the legs."),
          effect: { learn: "ngapali_knows_spot", record: { kind: "people", id: "daw-thein-yi" } },
          to: "end",
        },
        after: {
          who: "daw-thein-yi",
          text: T("ဒီရေ မတက်ခင် သွား ကလေး။ စာက ဟိုဘက်မှာ။",
            "Go before the water turns, child. It is waiting on the far side."),
          to: "end",
        },
      },
    },
    ngapali_daughter: {
      start: "greet",
      nodes: {
        greet: {
          who: "ma-su",
          text: T("ရေနွေးကြမ်း သောက်မလား။ အခမဲ့ပါ။ မင်း မျက်နှာက အဝေးကြီးက လာတဲ့ပုံ။",
            "Tea? No charge. You've the look of someone who came a long way."),
          choices: [
            { text: T("ဆယ်မြို့", "Ten towns"),
              effect: { learn: "ngapali_talked_masu", record: { kind: "people", id: "ma-su" } }, to: "a" },
          ],
        },
        a: {
          who: "ma-su",
          text: T("ဆယ်မြို့။ တစ်ယောက်တည်းလား။ …ထိုင်ပါ။ ပြီးမှ သွား။ စာက ပြေးမသွားပါဘူး။",
            "Ten. On your own? …Sit down first. Whatever it is will still be there."),
          to: "end",
        },
      },
    },
    ngapali_final: {
      start: "a",
      nodes: {
        a: nar("ဒီရေက နောက်ကျောမှာ တက်လာနေပြီ။ စာအိတ်က ခြောက်နေတယ်။",
          "The water is coming back in behind you. The envelope is dry.", { to: "b" }),
        b: {
          who: "phoe-chit",
          text: T("ဆယ်မြို့။ လူ ဆယ့်ရှစ်ယောက်။ အဖိုးအကြောင်း ငါ မသိခဲ့တာတွေ။",
            "Ten towns. Some thirty people. All of them knew things about him I didn't."),
          to: "c",
        },
        c: {
          who: "phoe-chit",
          text: T("ဖွင့်လိုက်တယ်။",
            "I open it."),
          effect: { learn: "ngapali_delivered" },
          letter: "ngapali",
          to: "end",
        },
      },
    },
  };

  return { people, items, letters, quests, dialogue };
})();
