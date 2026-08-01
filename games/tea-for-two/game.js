/* Tea for Two — app shell: routing, badges, quiz, theory room, sound */
"use strict";

const Game = (() => {
  const KEY_BADGES = "tft_badges_v1";
  const KEY_SOUND = "tft_sound_v1";

  const $ = (sel) => document.querySelector(sel);

  /* ---------- sound ---------- */
  let actx = null;
  let soundOn = localStorage.getItem(KEY_SOUND) !== "off";

  function tone(freq, dur, type = "sine", vol = 0.12, when = 0) {
    if (!actx) return;
    const t = actx.currentTime + when;
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(actx.destination);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  function sfx(name) {
    if (!soundOn) return;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
      switch (name) {
        case "tap": tone(520, 0.07, "square", 0.05); break;
        case "reveal": tone(440, 0.12, "triangle", 0.1); tone(660, 0.14, "triangle", 0.1, 0.08); break;
        case "good": tone(523, 0.1, "triangle", 0.1); tone(659, 0.1, "triangle", 0.1, 0.08); tone(784, 0.16, "triangle", 0.1, 0.16); break;
        case "bad": tone(196, 0.18, "sawtooth", 0.07); tone(147, 0.24, "sawtooth", 0.07, 0.1); break;
        case "coin": tone(880, 0.08, "square", 0.06); tone(1174, 0.12, "square", 0.06, 0.06); break;
        case "done": [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, "triangle", 0.1, i * 0.12)); break;
      }
    } catch (e) { /* audio is best-effort */ }
  }

  function toggleSound() {
    soundOn = !soundOn;
    localStorage.setItem(KEY_SOUND, soundOn ? "on" : "off");
    document.querySelectorAll("#btn-sound, #btn-lesson-sound").forEach((b) => {
      b.textContent = soundOn ? "🔊" : "🔇";
    });
    if (soundOn) sfx("tap");
  }

  /* ---------- badges ---------- */
  const BADGES = [
    { id: "l1", emoji: "🍵", label: "ဈေးစစ်ပွဲ", sub: "The Price War" },
    { id: "l2", emoji: "🔁", label: "တစ်ပတ်တာ", sub: "The Week" },
    { id: "l3", emoji: "🐟", label: "ငါးကန်", sub: "The Pond" },
    { id: "l4", emoji: "⚖️", label: "ခွဲဝေပွဲ", sub: "The Split" },
  ];

  function loadBadges() {
    try { return JSON.parse(localStorage.getItem(KEY_BADGES)) || {}; } catch { return {}; }
  }

  function badge(id) {
    const b = loadBadges();
    b[id] = true;
    localStorage.setItem(KEY_BADGES, JSON.stringify(b));
    sfx("done");
    toast("🏅 ဘွဲ့ရပြီ! Badge earned — " + (BADGES.find((x) => x.id === id)?.sub || ""));
    renderBadges();
  }

  function renderBadges() {
    const b = loadBadges();
    const shelf = $("#badge-shelf");
    if (shelf) {
      shelf.innerHTML = BADGES.map((bg) => `
        <div class="shelf-item ${b[bg.id] ? "earned" : ""}" title="${bg.sub}">
          <span class="si-emoji">${b[bg.id] ? bg.emoji : "🔒"}</span>
          <span class="si-label">${b[bg.id] ? bg.label : "?"}</span>
        </div>`).join("");
      const done = BADGES.every((bg) => b[bg.id]);
      const note = $("#shelf-note");
      if (note) note.textContent = done ? "🎓 သင်ခန်းစာတွေ အားလုံး ပြီးပြီ! ဂိမ်းသီအိုရီ ကျောင်းသားဖြစ်ပြီ။" : `ဘွဲ့ ${BADGES.filter((x) => b[x.id]).length} / ၄ · badges earned`;
    }
    const mini = $("#badge-mini");
    if (mini) mini.textContent = BADGES.filter((bg) => b[bg.id]).map((bg) => bg.emoji).join(" ") || "🔒";
    document.querySelectorAll(".lc-badge").forEach((el) => {
      const id = el.dataset.badge;
      el.textContent = b[id] ? "✅" : "";
    });
  }

  /* ---------- toast ---------- */
  let toastTimer = null;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ---------- quiz ---------- */
  function startQuiz(lessonId, onDone) {
    const q = QUIZZES[lessonId];
    if (!q) { onDone(); return; }
    const ov = $("#quiz-overlay");
    $("#quiz-kicker").textContent = q.kicker;
    $("#quiz-question").textContent = q.question;
    const opts = $("#quiz-options");
    const fb = $("#quiz-feedback");
    const next = $("#btn-quiz-next");
    opts.innerHTML = "";
    fb.hidden = true;
    next.hidden = true;
    let answered = false;

    q.options.forEach((o, i) => {
      const btn = document.createElement("button");
      btn.className = "quiz-opt";
      btn.textContent = o.t;
      btn.addEventListener("click", () => {
        if (answered) return;
        answered = true;
        sfx(o.ok ? "good" : "bad");
        btn.classList.add(o.ok ? "correct" : "wrong");
        opts.querySelectorAll(".quiz-opt").forEach((b, j) => {
          if (q.options[j].ok) b.classList.add("correct");
          if (b !== btn && !q.options[j].ok) b.classList.add("dim");
        });
        fb.hidden = false;
        fb.innerHTML = `<strong>${o.ok ? "✅ မှန်ပါတယ်" : "❌ မမှန်ဘူး"}</strong><p>${o.why}</p>`;
        next.hidden = false;
      });
      opts.appendChild(btn);
    });

    next.onclick = () => {
      ov.classList.add("hidden");
      onDone();
    };
    ov.classList.remove("hidden");
  }

  /* ---------- theory room ---------- */
  function showTheory() {
    sfx("tap");
    setLessonHeader("သီအိုရီခန်း", "The Theory Room · ဂိမ်းသီအိုရီ အဘိဓာန်", "");
    $("#start-screen").classList.remove("active");
    $("#lesson-screen").classList.add("active");
    $("#lesson-chip").textContent = "သီအိုရီခန်း";
    window.scrollTo(0, 0);
    const body = $("#lesson-body");
    body.innerHTML = "";
    const intro = document.createElement("p");
    intro.className = "theory-intro anim";
    intro.innerHTML = "သင်ခန်းစာတွေထဲက သဘောတရားတွေကို ဒီမှာ ပြန်ကြည့်လို့ရတယ် — ကဒ်တစ်ခုစီ နှိပ်ပြီး ဖတ်ပါ။ <span class='en'>Every idea from the lessons, expandable — tap a card to read it.</span>";
    body.appendChild(intro);

    THEORY.forEach((t, i) => {
      const card = document.createElement("div");
      card.className = "theory-card anim";
      card.style.animationDelay = `${Math.min(i * 0.05, 0.4)}s`;
      card.innerHTML = `
        <button class="theory-head">
          <span class="th-emoji">${t.emoji}</span>
          <span class="th-titles"><strong>${t.mm}</strong><small>${t.en}</small></span>
          <span class="th-caret">▾</span>
        </button>
        <div class="theory-body">
          ${t.body.map(([mm, en]) => `<p class="th-mm">${mm}</p><p class="th-en">${en}</p>`).join("")}
          <div class="th-take"><span>အဓိကအချက် ·</span> ${t.take} <span class="en">${t.takeEn}</span></div>
        </div>`;
      card.querySelector(".theory-head").addEventListener("click", () => {
        sfx("tap");
        card.classList.toggle("open");
      });
      body.appendChild(card);
    });

    const back = document.createElement("div");
    back.className = "theory-done";
    back.appendChild(makeButton("အပြင်ကို ပြန်မယ် · Back to the street", () => Game.goStart(), "primary"));
    body.appendChild(back);
  }

  /* ---------- buttons ---------- */
  function makeButton(label, cb, cls = "") {
    const btn = document.createElement("button");
    btn.className = `btn ${cls}`;
    btn.textContent = label;
    btn.addEventListener("click", cb);
    return btn;
  }

  /* ---------- lesson shell ---------- */
  function setLessonHeader(title, en, chip) {
    $("#lesson-title").innerHTML = `${title} <span class="lt-en">${en}</span>`;
    $("#lesson-kicker").textContent = chip || "";
  }

  function openLesson(id) {
    const L = LESSONS[id];
    if (!L) return;
    sfx("tap");
    setLessonHeader(`${L.emoji} ${L.title}`, L.en, "");
    $("#lesson-chip").textContent = L.title;
    $("#start-screen").classList.remove("active");
    $("#lesson-screen").classList.add("active");
    window.scrollTo(0, 0);
    L.mount($("#lesson-body"));
  }

  function goStart() {
    $("#lesson-screen").classList.remove("active");
    $("#start-screen").classList.add("active");
    $("#lesson-body").innerHTML = "";
    renderBadges();
    window.scrollTo(0, 0);
  }

  /* ---------- boot ---------- */
  function boot() {
    // duel portraits on the start card
    $("#duel-left").innerHTML = portrait("khinma", "neutral", 108);
    $("#duel-right").innerHTML = portrait("utu", "smug", 108);

    document.querySelectorAll(".lesson-card[data-lesson]").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.dataset.lesson;
        if (id === "theory") showTheory();
        else openLesson(id);
      });
    });

    $("#btn-lesson-back").addEventListener("click", () => { sfx("tap"); goStart(); });
    $("#btn-sound").addEventListener("click", toggleSound);
    $("#btn-lesson-sound").addEventListener("click", toggleSound);

    document.querySelectorAll("#btn-sound, #btn-lesson-sound").forEach((b) => {
      b.textContent = soundOn ? "🔊" : "🔇";
    });

    renderBadges();
  }

  return { boot, sfx, toast, badge, startQuiz, goStart, openLesson, showTheory };
})();

document.addEventListener("DOMContentLoaded", () => Game.boot());
