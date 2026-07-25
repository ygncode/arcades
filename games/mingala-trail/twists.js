/**
 * Mingala Trail — twists.js
 *
 * Each city ends in a short "twist" minigame. The engine owns the loop and the
 * overlay; a twist only has to render into `ctx.stage` and call `ctx.done(true|false)`.
 *
 * Contract — every twist may implement:
 *   title, hint   {my, en}                 shown in the overlay header
 *   start(ctx)                             build DOM, set initial state
 *   update(dt)                             called each frame with seconds elapsed
 *   press()                                action button / Space / tap on the stage
 *   release()                              action released (only `climb` uses it)
 *   move(dx, dy)                           d-pad / arrow keys, each component -1..1
 *   cleanup()                              tear down timers/listeners (DOM is wiped)
 *
 * ctx = { stage, done(ok), meter(0..1), say(my, en), sfx, city }
 *
 * Twists must stay winnable when Math.random is stubbed to a constant (the E2E suite
 * does exactly that), so anything that must vary is driven off a round counter rather
 * than off randomness.
 *
 * Exposes: window.TrailTwists
 */
window.TrailTwists = (() => {
  "use strict";

  const A = window.TrailArt;

  /** Build an element with class + optional inner HTML. */
  function el(cls, html) {
    const d = document.createElement("div");
    d.className = cls;
    if (html) d.innerHTML = html;
    return d;
  }
  /** Position a node in the twist stage's 0..100 percentage space. */
  function at(node, x, y) {
    node.style.left = `${x}%`;
    node.style.top = `${y}%`;
    return node;
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ═══════════════════════════════════════════════════════════
  // 1 · YANGON — cross the traffic
  // ═══════════════════════════════════════════════════════════
  const traffic = {
    title: { my: "လမ်းဖြတ်ကူး", en: "Cross the road" },
    hint: { my: "ကားတွေကြားက ကွက်လပ်ကို စောင့်ပြီး တက်ပါ", en: "Wait for a gap, then move up" },
    start(ctx) {
      this.ctx = ctx;
      this.y = 88;
      this.x = 50;
      this.lanes = [
        { y: 68, speed: 21, dir: 1, gap: 50, off: 0 },
        { y: 50, speed: 27, dir: -1, gap: 55, off: 22 },
        { y: 32, speed: 18, dir: 1, gap: 46, off: 44 },
      ];
      this.safe = 0;   // brief mercy window after a knock
      ctx.stage.innerHTML = "";
      const road = el("tw-road");
      ctx.stage.appendChild(road);
      this.lanes.forEach((ln) => {
        const stripe = at(el("tw-lane"), 0, ln.y + 6);
        road.appendChild(stripe);
        ln.cars = [0, 1].map((i) => {
          const c = el("tw-car", A.sprite("bus"));
          road.appendChild(c);
          return { el: c, p: ln.off + i * ln.gap };
        });
      });
      this.kerb = at(el("tw-goal", "<span>ကူးပြီ</span>"), 50, 8);
      road.appendChild(this.kerb);
      this.tok = at(el("tw-token", A.hero("up")), this.x, this.y);
      road.appendChild(this.tok);
      this.road = road;
    },
    move(dx, dy) {
      this.mx = dx;
      this.my = dy;
    },
    update(dt) {
      const c = this.ctx;
      this.x = clamp(this.x + (this.mx || 0) * 44 * dt, 4, 96);
      this.y = clamp(this.y + (this.my || 0) * 44 * dt, 6, 92);
      at(this.tok, this.x, this.y);
      this.safe = Math.max(0, this.safe - dt);
      this.tok.classList.toggle("tw-safe", this.safe > 0);

      for (const ln of this.lanes) {
        for (const car of ln.cars) {
          car.p = (car.p + ln.speed * dt) % 100;
          const x = ln.dir > 0 ? car.p : 100 - car.p;
          at(car.el, x, ln.y);
          car.el.style.transform = `translate(-50%,-50%) scaleX(${ln.dir})`;
          // Clipped: pushed back one lane, not all the way to the kerb, with a
          // short mercy window so a single mistake isn't a total restart.
          if (this.safe <= 0 && Math.abs(x - this.x) < 11 && Math.abs(ln.y - this.y) < 6) {
            this.y = Math.min(88, this.y + 18);
            this.safe = 0.8;
            c.sfx.bad();
            this.tok.classList.add("tw-hit");
            setTimeout(() => this.tok && this.tok.classList.remove("tw-hit"), 260);
          }
        }
      }
      c.meter(clamp((88 - this.y) / 78, 0, 1));
      if (this.y <= 10) {
        c.sfx.win();
        c.done(true);
      }
    },
    cleanup() {
      this.mx = this.my = 0;
    },
  };

  // ═══════════════════════════════════════════════════════════
  // 2 · BAGO — carry the alms bowl without spilling
  // ═══════════════════════════════════════════════════════════
  const balance = {
    title: { my: "သပိတ် မဖိတ်စေနဲ့", en: "Don't spill the bowl" },
    hint: { my: "ယိမ်းတဲ့ဘက် ဆန့်ကျင်ပြီး ထိန်းပါ", en: "Lean against the wobble to stay level" },
    start(ctx) {
      this.ctx = ctx;
      this.tilt = 0;
      this.vel = 0;
      this.carried = 0;
      this.need = 9;
      this.push = 0;
      ctx.stage.innerHTML = "";
      const lane = el("tw-lane-walk");
      ctx.stage.appendChild(lane);
      this.gauge = el("tw-gauge", `<div class="tw-gauge-safe"></div><div class="tw-needle"></div>`);
      lane.appendChild(this.gauge);
      this.needle = this.gauge.querySelector(".tw-needle");
      this.figure = at(el("tw-carry", A.sprite("bowl")), 50, 62);
      lane.appendChild(this.figure);
      this.walker = at(el("tw-walker", A.hero("right")), 50, 88);
      lane.appendChild(this.walker);
    },
    move(dx) {
      this.push = dx;
    },
    update(dt) {
      const c = this.ctx;
      // wobble grows the further you already are — a gentle difficulty ramp
      const drift = Math.sin(this.carried * 1.7 + performance.now() / 620) * 26;
      this.vel += (drift - this.push * 90) * dt;
      this.vel *= 0.96;
      this.tilt = clamp(this.tilt + this.vel * dt, -100, 100);
      this.needle.style.left = `${50 + this.tilt / 2.4}%`;
      this.figure.style.transform = `translate(-50%,-50%) rotate(${this.tilt / 3.2}deg)`;
      this.walker.style.left = `${8 + (this.carried / this.need) * 80}%`;

      if (Math.abs(this.tilt) > 78) {
        c.sfx.bad();
        this.carried = Math.max(0, this.carried - 1.5);
        this.tilt = 0;
        this.vel = 0;
      } else {
        this.carried += dt * 1.15;
      }
      c.meter(clamp(this.carried / this.need, 0, 1));
      if (this.carried >= this.need) {
        c.sfx.win();
        c.done(true);
      }
    },
    cleanup() { this.push = 0; },
  };

  // ═══════════════════════════════════════════════════════════
  // 3 · MANDALAY — hop the broken planks
  // ═══════════════════════════════════════════════════════════
  const planks = {
    title: { my: "ပျဉ်ချပ် ခုန်ကျော်", en: "Hop the planks" },
    hint: { my: "အမှတ်အသား ပျဉ်ပေါ်ရောက်မှ နှိပ်ပါ", en: "Press when the marker is over a plank" },
    start(ctx) {
      this.ctx = ctx;
      this.hops = 0;
      this.need = 6;
      this.p = 0;
      this.dir = 1;
      this.speed = 58;
      ctx.stage.innerHTML = "";
      const bridge = el("tw-bridge");
      ctx.stage.appendChild(bridge);
      // Safe zones alternate; fixed layout so the twist is fair and repeatable.
      this.zones = [[12, 24], [38, 50], [64, 76], [84, 94]];
      this.zones.forEach(([a, b]) => {
        const z = el("tw-plank");
        z.style.left = `${a}%`;
        z.style.width = `${b - a}%`;
        bridge.appendChild(z);
      });
      this.marker = at(el("tw-marker"), 0, 50);
      bridge.appendChild(this.marker);
      this.hopper = at(el("tw-hopper", A.hero("right")), 6, 22);
      bridge.appendChild(this.hopper);
    },
    press() {
      const c = this.ctx;
      const safe = this.zones.some(([a, b]) => this.p >= a && this.p <= b);
      if (safe) {
        this.hops++;
        this.speed += 7;
        c.sfx.good();
        this.hopper.classList.add("tw-jump");
        setTimeout(() => this.hopper && this.hopper.classList.remove("tw-jump"), 220);
      } else {
        this.hops = Math.max(0, this.hops - 1);
        c.sfx.bad();
      }
      c.meter(clamp(this.hops / this.need, 0, 1));
      this.hopper.style.left = `${6 + (this.hops / this.need) * 86}%`;
      if (this.hops >= this.need) {
        c.sfx.win();
        c.done(true);
      }
    },
    update(dt) {
      this.p += this.dir * this.speed * dt;
      if (this.p > 98) { this.p = 98; this.dir = -1; }
      if (this.p < 2) { this.p = 2; this.dir = 1; }
      at(this.marker, this.p, 50);
    },
    cleanup() {},
  };

  // ═══════════════════════════════════════════════════════════
  // 4 · BAGAN — spot the stupa that matches the sketch
  // ═══════════════════════════════════════════════════════════
  const spot = {
    title: { my: "စေတီကို ရှာပါ", en: "Spot the stupa" },
    hint: { my: "ပုံကြမ်းနဲ့ တူတဲ့ စေတီကို ရွေးပါ", en: "Pick the stupa that matches the sketch" },
    start(ctx) {
      this.ctx = ctx;
      this.round = 0;
      this.need = 3;
      this.build();
    },
    build() {
      const ctx = this.ctx;
      ctx.stage.innerHTML = "";
      const wrap = el("tw-spot");
      ctx.stage.appendChild(wrap);

      // Deterministic per round: which slot is correct, and the distinguishing tilt.
      const slots = 5;
      const answer = (this.round * 2 + 1) % slots;
      const skew = 8 + this.round * 5;
      this.answer = answer;

      const card = el("tw-sketch", A.sprite("sketch"));
      card.style.setProperty("--skew", `${skew}deg`);
      wrap.appendChild(card);

      const row = el("tw-row");
      wrap.appendChild(row);
      for (let i = 0; i < slots; i++) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "tw-choice";
        b.dataset.slot = String(i);
        b.innerHTML = A.sprite("stupa");
        // only the answer carries the sketch's silhouette skew
        const s = i === answer ? skew : (i - 2) * 6 + (i === answer ? 0 : 0);
        b.style.setProperty("--skew", `${s}deg`);
        b.addEventListener("click", () => this.choose(i));
        row.appendChild(b);
      }
      ctx.say(`အဆင့် ${this.round + 1} / ${this.need}`, `Round ${this.round + 1} of ${this.need}`);
    },
    choose(i) {
      const c = this.ctx;
      if (i === this.answer) {
        this.round++;
        c.sfx.good();
        c.meter(clamp(this.round / this.need, 0, 1));
        if (this.round >= this.need) {
          c.sfx.win();
          c.done(true);
          return;
        }
        this.build();
      } else {
        c.sfx.bad();
        const b = c.stage.querySelector(`.tw-choice[data-slot="${i}"]`);
        if (b) {
          b.classList.add("tw-wrong");
          setTimeout(() => b.classList.remove("tw-wrong"), 320);
        }
      }
    },
    update() {},
    cleanup() {},
  };

  // ═══════════════════════════════════════════════════════════
  // 5 · INLE — row on the beat
  // ═══════════════════════════════════════════════════════════
  const rowing = {
    title: { my: "စည်းချက်နဲ့ လှော်ပါ", en: "Row on the beat" },
    hint: { my: "အဝိုင်း မျဉ်းပေါ်ရောက်ချိန် နှိပ်ပါ", en: "Press when the ring meets the line" },
    start(ctx) {
      this.ctx = ctx;
      this.hits = 0;
      this.need = 8;
      this.beats = [];
      this.t = 0;
      this.spawn = 0;
      this.period = 0.95;
      ctx.stage.innerHTML = "";
      const lake = el("tw-lake");
      ctx.stage.appendChild(lake);
      lake.appendChild(el("tw-beatline"));
      this.boat = at(el("tw-boat", A.sprite("boat")), 18, 66);
      lake.appendChild(this.boat);
      this.lake = lake;
    },
    press() {
      const c = this.ctx;
      // closest beat to the line at x=76
      let best = null, bd = 999;
      for (const b of this.beats) {
        const d = Math.abs(b.x - 76);
        if (d < bd) { bd = d; best = b; }
      }
      if (best && bd < 7) {
        best.dead = true;
        best.el.classList.add("tw-beat-hit");
        this.hits++;
        c.sfx.good();
        this.boat.classList.add("tw-row");
        setTimeout(() => this.boat && this.boat.classList.remove("tw-row"), 200);
      } else {
        c.sfx.bad();
        this.hits = Math.max(0, this.hits - 1);
      }
      c.meter(clamp(this.hits / this.need, 0, 1));
      if (this.hits >= this.need) {
        c.sfx.win();
        c.done(true);
      }
    },
    update(dt) {
      this.t += dt;
      this.spawn -= dt;
      if (this.spawn <= 0) {
        this.spawn = this.period;
        const node = at(el("tw-beat"), 6, 40);
        this.lake.appendChild(node);
        this.beats.push({ el: node, x: 6, dead: false });
      }
      const alive = [];
      for (const b of this.beats) {
        if (b.dead) {
          // let the hit flash play out, then drop the node
          b.fade = (b.fade || 0) + dt;
          if (b.fade > 0.25) b.el.remove();
          else alive.push(b);
          continue;
        }
        b.x += 46 * dt;
        at(b.el, b.x, 40);
        if (b.x > 104) b.el.remove();
        else alive.push(b);
      }
      this.beats = alive;
      this.boat.style.left = `${18 + (this.hits / this.need) * 56}%`;
    },
    cleanup() { this.beats = []; },
  };

  // ═══════════════════════════════════════════════════════════
  // 6 · KALAW — pace the climb
  // ═══════════════════════════════════════════════════════════
  const climb = {
    title: { my: "တောင်တက်", en: "The climb" },
    hint: { my: "နှိပ်ရင် တက်တယ် · လွှတ်ရင် အသက်ပြန်ရှူ", en: "Hold to climb, release to catch your breath" },
    start(ctx) {
      this.ctx = ctx;
      this.h = 0;
      this.stamina = 1;
      this.holding = false;
      ctx.stage.innerHTML = "";
      const hill = el("tw-hill");
      ctx.stage.appendChild(hill);
      this.bar = el("tw-stamina", `<div class="tw-stamina-fill"></div>`);
      hill.appendChild(this.bar);
      this.fill = this.bar.querySelector(".tw-stamina-fill");
      this.walker = at(el("tw-climber", A.hero("up")), 50, 90);
      hill.appendChild(this.walker);
      hill.appendChild(at(el("tw-summit", "<span>ထိပ်</span>"), 50, 6));
    },
    press() { this.holding = true; },
    release() { this.holding = false; },
    update(dt) {
      const c = this.ctx;
      if (this.holding && this.stamina > 0.02) {
        this.h += 15 * dt;
        this.stamina -= 0.42 * dt;
        if (this.stamina <= 0.02) {
          this.stamina = 0;
          this.holding = false;
          c.sfx.bad();
          this.h = Math.max(0, this.h - 8);
        }
      } else {
        this.stamina = clamp(this.stamina + 0.5 * dt, 0, 1);
        this.h = Math.max(0, this.h - 2.2 * dt);
      }
      this.fill.style.width = `${this.stamina * 100}%`;
      this.fill.classList.toggle("low", this.stamina < 0.25);
      at(this.walker, 50, 90 - clamp(this.h, 0, 84));
      c.meter(clamp(this.h / 84, 0, 1));
      if (this.h >= 84) {
        c.sfx.win();
        c.done(true);
      }
    },
    cleanup() { this.holding = false; },
  };

  // ═══════════════════════════════════════════════════════════
  // 7 · PYIN OO LWIN — gather only the red flowers
  // ═══════════════════════════════════════════════════════════
  const flowers = {
    title: { my: "အနီရောင် ပန်းများ", en: "Reds only" },
    hint: { my: "အနီရောင်ကိုသာ ကောက်ပါ — အချိန်ကုန်ခါနီးပြီ", en: "Tap the red ones only, before the cart leaves" },
    start(ctx) {
      this.ctx = ctx;
      this.got = 0;
      this.need = 6;
      this.time = 22;
      ctx.stage.innerHTML = "";
      const bed = el("tw-bed");
      ctx.stage.appendChild(bed);
      this.clock = el("tw-clock");
      bed.appendChild(this.clock);
      // Fixed 4x3 layout with EXACTLY `need` reds — the mask and `need` must agree
      // or the round becomes unwinnable.
      const RED = [
        1, 0, 0, 1,
        0, 1, 1, 0,
        1, 0, 0, 1,
      ];
      let n = 0;
      for (let r = 0; r < 3; r++) {
        for (let col = 0; col < 4; col++) {
          const red = RED[n] === 1;
          const b = document.createElement("button");
          b.type = "button";
          b.className = "tw-bloom" + (red ? " red" : "");
          b.dataset.red = red ? "1" : "0";
          b.style.left = `${16 + col * 22}%`;
          b.style.top = `${28 + r * 22}%`;
          b.innerHTML = A.sprite("flower");
          b.addEventListener("click", () => this.pick(b));
          bed.appendChild(b);
          n++;
        }
      }
    },
    pick(b) {
      const c = this.ctx;
      if (b.disabled) return;
      if (b.dataset.red === "1") {
        b.disabled = true;
        b.classList.add("tw-picked");
        this.got++;
        c.sfx.good();
      } else {
        this.time -= 3;
        c.sfx.bad();
        b.classList.add("tw-wrong");
        setTimeout(() => b.classList.remove("tw-wrong"), 300);
      }
      c.meter(clamp(this.got / this.need, 0, 1));
      if (this.got >= this.need) {
        c.sfx.win();
        c.done(true);
      }
    },
    update(dt) {
      this.time -= dt;
      this.clock.textContent = `⏱ ${Math.max(0, this.time).toFixed(1)}`;
      this.clock.classList.toggle("low", this.time < 6);
      if (this.time <= 0) {
        this.ctx.sfx.bad();
        this.ctx.done(false);
      }
    },
    cleanup() {},
  };

  // ═══════════════════════════════════════════════════════════
  // 8 · MRAUK U — steer by the stupas through the mist
  // ═══════════════════════════════════════════════════════════
  const fog = {
    title: { my: "မြူထဲက လမ်း", en: "Through the mist" },
    hint: { my: "စေတီရှိတဲ့ဘက်ကို ရွေးပါ", en: "Take the fork where a stupa shows" },
    start(ctx) {
      this.ctx = ctx;
      this.step = 0;
      this.need = 5;
      this.build();
    },
    build() {
      const ctx = this.ctx;
      ctx.stage.innerHTML = "";
      const mist = el("tw-mist");
      ctx.stage.appendChild(mist);
      // Correct side alternates on a fixed pattern — no randomness needed.
      const rightIsSafe = [true, false, true, true, false][this.step % 5];
      this.safe = rightIsSafe ? "right" : "left";

      ["left", "right"].forEach((side) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = `tw-fork ${side}`;
        b.dataset.side = side;
        const safe = side === this.safe;
        b.innerHTML =
          `<div class="tw-fork-view${safe ? " has-stupa" : ""}">${safe ? A.sprite("stupa") : A.sprite("banyan")}</div>` +
          `<span>${side === "left" ? "◀ ဘယ်" : "ညာ ▶"}</span>`;
        b.addEventListener("click", () => this.choose(side));
        mist.appendChild(b);
      });
      mist.appendChild(el("tw-mist-veil"));
      ctx.say(`လမ်းဆုံ ${this.step + 1} / ${this.need}`, `Fork ${this.step + 1} of ${this.need}`);
    },
    choose(side) {
      const c = this.ctx;
      if (side === this.safe) {
        this.step++;
        c.sfx.good();
        c.meter(clamp(this.step / this.need, 0, 1));
        if (this.step >= this.need) {
          c.sfx.win();
          c.done(true);
          return;
        }
        this.build();
      } else {
        c.sfx.bad();
        this.step = Math.max(0, this.step - 1);
        c.meter(clamp(this.step / this.need, 0, 1));
        this.build();
      }
    },
    update() {},
    cleanup() {},
  };

  // ═══════════════════════════════════════════════════════════
  // 9 · HPA-AN — find the key by torchlight
  // ═══════════════════════════════════════════════════════════
  const cave = {
    title: { my: "ဂူထဲက သော့", en: "The key in the cave" },
    hint: { my: "မီးရှူးကို ရွှေ့ပြီး ရှာပါ · တွေ့ရင် နှိပ်ပါ", en: "Sweep the torch, press when you see it" },
    start(ctx) {
      this.ctx = ctx;
      this.x = 20;
      this.y = 70;
      // Fixed hiding spot — the challenge is the sweeping, not a lottery.
      this.kx = 74;
      this.ky = 38;
      ctx.stage.innerHTML = "";
      const dark = el("tw-cave");
      ctx.stage.appendChild(dark);
      this.key = at(el("tw-hidden", A.sprite("key")), this.kx, this.ky);
      dark.appendChild(this.key);
      this.light = at(el("tw-torch"), this.x, this.y);
      dark.appendChild(this.light);
      this.dark = dark;
    },
    move(dx, dy) { this.mx = dx; this.my = dy; },
    press() {
      const c = this.ctx;
      if (this.near) {
        c.sfx.win();
        c.done(true);
      } else {
        c.sfx.bad();
      }
    },
    update(dt) {
      const c = this.ctx;
      this.x = clamp(this.x + (this.mx || 0) * 42 * dt, 6, 94);
      this.y = clamp(this.y + (this.my || 0) * 42 * dt, 10, 90);
      at(this.light, this.x, this.y);
      const d = Math.hypot(this.x - this.kx, (this.y - this.ky) * 0.7);
      this.near = d < 13;
      this.key.classList.toggle("lit", d < 18);
      this.key.style.opacity = String(clamp(1.25 - d / 20, 0, 1));
      c.meter(clamp(1 - d / 70, 0, 1));
    },
    cleanup() { this.mx = this.my = 0; },
  };

  // ═══════════════════════════════════════════════════════════
  // 10 · NGAPALI — beat the tide
  // ═══════════════════════════════════════════════════════════
  const tide = {
    title: { my: "ဒီရေကို အနိုင်ယူ", en: "Beat the tide" },
    hint: { my: "လှိုင်းဆုတ်ချိန် ပြေး · တက်လာရင် ပြန်ဆုတ်", en: "Run while the water is out, retreat when it returns" },
    start(ctx) {
      this.ctx = ctx;
      this.dist = 0;
      this.need = 100;
      this.phase = 0;
      this.holding = false;
      ctx.stage.innerHTML = "";
      const flat = el("tw-flat");
      ctx.stage.appendChild(flat);
      this.water = el("tw-water", A.sprite("wave"));
      flat.appendChild(this.water);
      this.runner = at(el("tw-runner", A.hero("right")), 8, 74);
      flat.appendChild(this.runner);
      this.catchEl = at(el("tw-catch", A.sprite("fish")), 92, 74);
      flat.appendChild(this.catchEl);
      this.warn = el("tw-warn");
      flat.appendChild(this.warn);
    },
    press() { this.holding = true; },
    release() { this.holding = false; },
    update(dt) {
      const c = this.ctx;
      this.phase += dt * 0.85;
      // waterline sweeps in and out; > 0.55 means the flats are covered
      const surge = (Math.sin(this.phase) + 1) / 2;
      const line = 18 + surge * 62;
      this.water.style.height = `${line}%`;
      const covered = surge > 0.55;
      this.warn.textContent = covered ? "လှိုင်းတက်နေပြီ!" : "အခုပြေး!";
      this.warn.classList.toggle("danger", covered);

      if (covered) {
        // caught in the surge — washed back whether or not you keep pushing
        this.dist = Math.max(0, this.dist - (this.holding ? 46 : 12) * dt);
        this.runner.classList.add("tw-wet");
      } else {
        if (this.holding) this.dist += 26 * dt;
        this.runner.classList.remove("tw-wet");
      }
      at(this.runner, 8 + (this.dist / this.need) * 82, 74);
      c.meter(clamp(this.dist / this.need, 0, 1));
      if (this.dist >= this.need) {
        c.sfx.win();
        c.done(true);
      }
    },
    cleanup() { this.holding = false; },
  };

  return { traffic, balance, planks, spot, rowing, climb, flowers, fog, cave, tide };
})();
