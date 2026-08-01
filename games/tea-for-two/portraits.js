/* Tea for Two — SVG portrait factory
   Five tea-shop characters, each with mood-reactive faces. */
"use strict";

const CHARS = {
  khinma: {
    name: "ဒေါ်ခင်မ", en: "Daw Khin Ma", shop: "ခင်မ လက်ဖက်ရည်ဆိုင်",
    skin: "#d09a66", shirt: "#4a7c59", hair: "#3a2a26", hairStyle: "bun",
    accent: "flower", desc: "နွေးထွေးပြီး ယုံကြည်စိတ်ရှိတယ်",
    strategy: "အမြဲ လျော်ကန် · Always Fair",
  },
  utu: {
    name: "ဦးတူး", en: "U Tu", shop: "ရွှေတူး ဆိုင်",
    skin: "#b37d50", shirt: "#8a6b3f", hair: "#5c4a3a", hairStyle: "bald",
    accent: "towel", desc: "လိမ္မာပါးနပ်ပြီး ကိုယ့်အကျိုးကြည့်",
    strategy: "အမြဲ လျှော့ဈေး · Always Discount",
  },
  usein: {
    name: "ဦးစိန်", en: "U Sein", shop: "စိန် လက်ဖက်ရည်ဆိုင်",
    skin: "#d2a06a", shirt: "#3f6c8a", hair: "#2f2626", hairStyle: "short",
    accent: "glasses", desc: "အေးဆေးပြီး တွက်ချက်တတ်တယ်",
    strategy: "မျက်စိချင်း လဲ · Tit-for-Tat",
  },
  dnu: {
    name: "ဒေါ်နု", en: "Daw Nu", shop: "နု လက်ဖက်ရည်ဆိုင်",
    skin: "#c99a68", shirt: "#7a5a78", hair: "#45333a", hairStyle: "scarf",
    accent: "scarf", desc: "စိတ်ရှည်ပြီး ခွင့်လွှတ်တတ်တယ်",
    strategy: "ခွင့်လွှတ်တတ် · Forgiving",
  },
  ko: {
    name: "ကိုအောင်", en: "Ko Aung", shop: "အောင် ဆိုင်",
    skin: "#a9744c", shirt: "#2f7d6e", hair: "#2b2018", hairStyle: "cap",
    accent: "cap", desc: "ပေါ့ပျက်ပြီး ခန့်မှန်းရခက်",
    strategy: "ဇာတ်ကြောင်းမရှိ · Whimsical",
  },
};

const MOODS = {
  happy:    { brows: "up",    eyes: "arc",   mouth: "smile" },
  neutral:  { brows: "flat",  eyes: "dot",   mouth: "flat"  },
  smug:     { brows: "one",   eyes: "lid",   mouth: "smirk" },
  sad:      { brows: "sad",   eyes: "dot",   mouth: "frown" },
  worried:  { brows: "sad",   eyes: "dot",   mouth: "wavy"  },
  surprised:{ brows: "high",  eyes: "round", mouth: "o"     },
};

function portrait(id, mood = "neutral", size = 96) {
  const c = CHARS[id] || CHARS.khinma;
  const m = MOODS[mood] || MOODS.neutral;
  const s = size;
  const unit = s / 120;

  // eyes
  let eyes;
  if (m.eyes === "arc") {
    eyes = `<path d="M38 ${58 * unit} q6 -7 12 0" stroke="#33231a" stroke-width="3.4" fill="none" stroke-linecap="round"/>
            <path d="M70 ${58 * unit} q6 -7 12 0" stroke="#33231a" stroke-width="3.4" fill="none" stroke-linecap="round"/>
            <circle cx="44" cy="${65 * unit}" r="${4.5 * unit}" fill="#e58a8a" opacity=".55"/>
            <circle cx="76" cy="${65 * unit}" r="${4.5 * unit}" fill="#e58a8a" opacity=".55"/>`;
  } else if (m.eyes === "lid") {
    eyes = `<path d="M36 ${56 * unit} h16 M68 ${56 * unit} h16" stroke="#33231a" stroke-width="3.6" stroke-linecap="round"/>
            <circle cx="44" cy="${62 * unit}" r="${3 * unit}" fill="#33231a"/>
            <circle cx="76" cy="${62 * unit}" r="${3 * unit}" fill="#33231a"/>`;
  } else if (m.eyes === "round") {
    eyes = `<circle cx="44" cy="${58 * unit}" r="${5.5 * unit}" fill="#33231a"/>
            <circle cx="76" cy="${58 * unit}" r="${5.5 * unit}" fill="#33231a"/>
            <circle cx="${46 * unit}" cy="${56 * unit}" r="1.8" fill="#fff"/>
            <circle cx="${78 * unit}" cy="${56 * unit}" r="1.8" fill="#fff"/>`;
  } else {
    eyes = `<circle cx="44" cy="${58 * unit}" r="${3.6 * unit}" fill="#33231a"/>
            <circle cx="76" cy="${58 * unit}" r="${3.6 * unit}" fill="#33231a"/>`;
  }

  // brows
  let brows;
  const bx = { flat: 42, up: 40, high: 42, one: 42, sad: 42 };
  const by = { flat: 46, up: 42, high: 36, one: 44, sad: 50 };
  const arch = m.brows === "sad" ? " q7 -4 14 0" : m.brows === "up" ? " q7 4 14 0" : " q7 -3 14 0";
  brows = `<path d="M${bx[m.brows]} ${by[m.brows]}${arch}" stroke="#33231a" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
  if (m.brows === "one") {
    brows += `<path d="M${bx[m.brows] + 28} ${by[m.brows] - 2} q7 5 14 -1" stroke="#33231a" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
  } else {
    brows += `<path d="M${bx[m.brows] + 28} ${by[m.brows]}${arch}" stroke="#33231a" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
  }
  if (m.brows === "high") {
    brows = `<path d="M40 34 q7 -4 14 0 M68 34 q7 -4 14 0" stroke="#33231a" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
  }

  // mouth
  let mouth;
  if (m.mouth === "smile") {
    mouth = `<path d="M48 ${78 * unit} q12 9 24 0" stroke="#33231a" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
  } else if (m.mouth === "smirk") {
    mouth = `<path d="M48 ${78 * unit} q12 4 24 -2" stroke="#33231a" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
  } else if (m.mouth === "frown") {
    mouth = `<path d="M48 ${80 * unit} q12 -8 24 0" stroke="#33231a" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
  } else if (m.mouth === "wavy") {
    mouth = `<path d="M46 ${79 * unit} q6 -4 8 0 q4 3 8 0 q4 -3 8 0 q3 2 4 0" stroke="#33231a" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
  } else if (m.mouth === "o") {
    mouth = `<ellipse cx="60" cy="${79 * unit}" rx="6" ry="7" fill="#8e2d24"/>`;
  } else {
    mouth = `<path d="M48 ${79 * unit} h24" stroke="#33231a" stroke-width="3.2" stroke-linecap="round"/>`;
  }

  // hair by style
  let hair = "";
  if (c.hairStyle === "bun") {
    hair = `<path d="M30 52 q-4 -26 18 -28 q20 -4 26 10 q8 -6 18 -4 q14 4 12 22 q2 -12 12 -12 q14 0 14 14 v10 q0 8 -16 8 q-34 4 -56 0 q-20 -4 -18 -20 Z" fill="${c.hair}"/>
            <circle cx="84" cy="30" r="13" fill="${c.hair}"/>`;
    if (c.accent === "flower") {
      hair += `<circle cx="84" cy="30" r="7" fill="#e58a8a"/><circle cx="84" cy="30" r="3" fill="#f7e6c8"/>`;
    }
  } else if (c.hairStyle === "bald") {
    hair = `<path d="M32 52 q-4 -24 14 -28 q16 -6 28 -2 q14 2 16 14 q8 -4 14 -2 q10 6 8 18 q2 -14 14 -10 q12 4 10 16 q-2 10 -14 8 q-36 4 -58 0 q-20 -6 -22 -20 Z" fill="${c.hair}"/>`;
    if (c.accent === "towel") {
      hair += `<rect x="18" y="20" width="16" height="8" rx="3" transform="rotate(-24 26 24)" fill="#e8c9a0"/>
               <rect x="40" y="8" width="10" height="6" rx="2" transform="rotate(-16 45 11)" fill="#f0f0e8"/>`;
    }
  } else if (c.hairStyle === "short") {
    hair = `<path d="M30 54 q-4 -26 16 -30 q20 -4 30 2 q16 4 16 18 q2 12 -14 10 q-34 4 -52 0 q-18 -6 -16 -22 Z" fill="${c.hair}"/>`;
    if (c.accent === "glasses") {
      hair += `<circle cx="44" cy="58" r="11" fill="none" stroke="#33231a" stroke-width="2.4"/>
               <circle cx="76" cy="58" r="11" fill="none" stroke="#33231a" stroke-width="2.4"/>
               <path d="M55 58 h10" stroke="#33231a" stroke-width="2.4"/>`;
    }
  } else if (c.hairStyle === "scarf") {
    hair = `<path d="M28 56 q-4 -28 20 -30 q22 -4 34 4 q16 4 14 22 q2 -16 14 -12 q12 4 8 16 q-2 10 -16 6 q-36 6 -56 0 q-18 -6 -18 -18 Z" fill="${c.hair}"/>
            <path d="M30 48 q34 -10 62 0 q4 -8 0 -16 q-30 -12 -62 0 Z" fill="#b3564a"/>`;
  } else if (c.hairStyle === "cap") {
    hair = `<path d="M32 56 q-2 -26 18 -28 q22 -4 34 2 q14 2 14 16 q2 -14 14 -10 q12 4 10 16 q-2 10 -16 6 q-34 6 -56 0 q-18 -6 -16 -22 Z" fill="${c.hair}"/>
            <path d="M28 44 q34 -14 66 0 q4 -2 2 -8 q-32 -18 -70 -2 Z" fill="#c0392b"/>
            <circle cx="42" cy="38" r="3" fill="#f7e6c8"/>`;
  }

  return `<svg class="portrait mood-${mood}" viewBox="0 0 120 120" width="${s}" height="${s}" role="img" aria-label="${c.name}">
    <circle cx="60" cy="60" r="58" fill="#f3e3c0"/>
    <circle cx="60" cy="60" r="51" fill="#fff6e2"/>
    <path d="M34 118 q4 -14 26 -14 q22 0 26 14 Z" fill="${c.shirt}"/>
    <circle cx="60" cy="86" r="16" fill="${c.shirt}"/>
    <ellipse cx="60" cy="98" rx="30" ry="20" fill="${c.shirt}"/>
    <path d="M44 66 q16 8 32 0" stroke="#33231a" stroke-width="2" fill="none" opacity=".25"/>
    ${hair}
    <circle cx="60" cy="62" r="34" fill="${c.skin}"/>
    <path d="M26 62 q-4 12 6 18" stroke="${c.skin}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M94 62 q4 12 -6 18" stroke="${c.skin}" stroke-width="6" fill="none" stroke-linecap="round"/>
    ${eyes}
    ${brows}
    ${mouth}
    ${m.eyes === "arc" ? `<circle cx="44" cy="52" r="2.2" fill="#a3572f"/><circle cx="76" cy="52" r="2.2" fill="#a3572f"/>` : ""}
  </svg>`;
}
