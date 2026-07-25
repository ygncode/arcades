/**
 * Mingala Trail — systems.js
 *
 * The rules layer, kept deliberately separate from the engine and the writing.
 * Everything here is pure state + small pure-ish helpers, so the E2E suite can
 * simulate a whole playthrough (including a worst-case player) without a DOM.
 *
 * The two systems that matter interlock:
 *   ⏳ HOURS — one chapter is one day. Actions cost time.
 *   ကျပ် KYAT — earned from side work, spent on transport, food and favours.
 * You can pay to save time or spend time to save money. That trade is the game.
 *
 * SOFT-FAIL GUARANTEE: running out of hours never ends a run. You sleep; lodging
 * costs kyat if you have it and nothing if you don't. There is therefore no way to
 * soft-lock on either resource, and `tests/e2e/mingala.mjs` asserts it.
 *
 * Exposes: window.TrailSystems
 */
window.TrailSystems = (() => {
  "use strict";

  const SAVE_KEY = "mingala-trail-v2";
  const DAY_HOURS = 12;
  const START_KYAT = 8000;
  const LODGING = 2500;

  const listeners = new Set();

  function blank() {
    return {
      chapter: 0,            // index into TrailCities
      unlocked: 1,
      cleared: {},           // cityId -> true
      kyat: START_KYAT,
      hours: DAY_HOURS,
      day: 1,
      sleptRough: 0,         // times you had to sleep with nothing to pay
      flags: {},             // knowledge + quest progress
      bag: {},               // itemId -> true
      journal: { letters: [], people: [], keepsakes: [], fragments: [] },
    };
  }

  let s = blank();

  // ═══════════════════════════════════════════════════════════
  // PERSISTENCE
  // ═══════════════════════════════════════════════════════════
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        s = Object.assign(blank(), parsed);
        s.journal = Object.assign(blank().journal, parsed.journal || {});
        s.flags = parsed.flags || {};
        s.bag = parsed.bag || {};
      }
    } catch (_) {
      s = blank();
    }
    return s;
  }

  function persist() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (_) {}
  }

  function emit() {
    persist();
    for (const fn of listeners) {
      try { fn(s); } catch (_) {}
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CHAPTER LIFECYCLE
  // ═══════════════════════════════════════════════════════════

  /**
   * Start (or restart) a chapter. Kyat, flags and journal carry over; the day resets
   * to `hours`, which is how the transport you paid for on the map cashes out — a
   * night bus drops you at midday with 7 hours left, a flight gives you all 12.
   */
  function beginChapter(idx, hours) {
    s.chapter = idx;
    s.hours = hours != null ? hours : DAY_HOURS;
    emit();
  }

  /** `idx` is the index of the chapter just finished. */
  function clearChapter(cityId, idx, total) {
    s.cleared[cityId] = true;
    s.unlocked = Math.max(s.unlocked, Math.min(idx + 2, total));
    emit();
  }

  // ═══════════════════════════════════════════════════════════
  // HOURS
  // ═══════════════════════════════════════════════════════════

  /**
   * Spend hours. If the day runs out you sleep and a new day begins — lodging is
   * charged only if you can afford it. Returns what happened so the UI can narrate.
   */
  function spendHours(n) {
    if (!(n > 0)) return { slept: false, paid: 0 };
    s.hours -= n;
    let slept = false, paid = 0;
    while (s.hours <= 0) {
      slept = true;
      s.day += 1;
      s.hours += DAY_HOURS;
      if (s.kyat >= LODGING) {
        s.kyat -= LODGING;
        paid += LODGING;
      } else {
        s.sleptRough += 1;   // a monastery floor costs nothing but pride
      }
    }
    emit();
    return { slept, paid };
  }

  /** 0 at dawn → 1 at dusk. Drives the scene tint. */
  function dayFraction() {
    return Math.max(0, Math.min(1, 1 - s.hours / DAY_HOURS));
  }

  function timeLabel() {
    const f = dayFraction();
    if (f < 0.18) return { my: "မနက်စော", en: "early morning" };
    if (f < 0.4) return { my: "မနက်", en: "morning" };
    if (f < 0.6) return { my: "နေ့လယ်", en: "midday" };
    if (f < 0.8) return { my: "ညနေ", en: "afternoon" };
    if (f < 0.94) return { my: "ညနေခင်း", en: "dusk" };
    return { my: "ည", en: "night" };
  }

  // ═══════════════════════════════════════════════════════════
  // KYAT
  // ═══════════════════════════════════════════════════════════
  function earn(n) {
    s.kyat += Math.max(0, Math.round(n));
    emit();
  }

  function canAfford(n) {
    return s.kyat >= n;
  }

  function spend(n) {
    if (s.kyat < n) return false;
    s.kyat -= n;
    emit();
    return true;
  }

  function formatKyat(n) {
    return n.toLocaleString("en-US");
  }

  // ═══════════════════════════════════════════════════════════
  // FLAGS (knowledge + quest progress)
  // ═══════════════════════════════════════════════════════════
  const flag = (name) => Boolean(s.flags[name]);

  function setFlag(name, on = true) {
    if (!name) return;
    if (on) s.flags[name] = true;
    else delete s.flags[name];
    emit();
  }

  /** Flags scoped to a chapter get wiped when it restarts. */
  function clearFlagsWithPrefix(prefix) {
    for (const k of Object.keys(s.flags)) {
      if (k.startsWith(prefix)) delete s.flags[k];
    }
    emit();
  }

  // ═══════════════════════════════════════════════════════════
  // INVENTORY
  // ═══════════════════════════════════════════════════════════
  const has = (id) => Boolean(s.bag[id]);

  function give(id) {
    if (!id) return;
    s.bag[id] = true;
    emit();
  }

  function take(id) {
    delete s.bag[id];
    emit();
  }

  const bagIds = () => Object.keys(s.bag);

  // ═══════════════════════════════════════════════════════════
  // ROUTE BOOK
  // ═══════════════════════════════════════════════════════════
  function record(kind, id) {
    const list = s.journal[kind];
    if (list && id && !list.includes(id)) {
      list.push(id);
      emit();
      return true;
    }
    return false;
  }

  const recorded = (kind, id) => (s.journal[kind] || []).includes(id);

  // ═══════════════════════════════════════════════════════════
  // CONDITION LANGUAGE
  // Used by dialogue choices, quest steps and world objects alike:
  //   "flagName"                       → flag is set
  //   "!flagName"                      → flag is NOT set
  //   { flag, notFlag, item, notItem, kyat, cleared }
  //   [ ...any of the above ]          → all must hold
  // ═══════════════════════════════════════════════════════════
  function test(cond) {
    if (cond == null) return true;
    if (Array.isArray(cond)) return cond.every(test);
    if (typeof cond === "string") {
      return cond.startsWith("!") ? !flag(cond.slice(1)) : flag(cond);
    }
    if (typeof cond === "function") return Boolean(cond(api));
    if (typeof cond === "object") {
      if (cond.flag && !flag(cond.flag)) return false;
      if (cond.notFlag && flag(cond.notFlag)) return false;
      if (cond.item && !has(cond.item)) return false;
      if (cond.notItem && has(cond.notItem)) return false;
      if (cond.kyat != null && s.kyat < cond.kyat) return false;
      if (cond.cleared && !s.cleared[cond.cleared]) return false;
      return true;
    }
    return true;
  }

  /**
   * Apply the side effects a dialogue node or world action declares.
   * Shape: { learn, forget, give, take, kyat: +/-n, hours: n, record: {kind, id} }
   * Returns false when a cost could not be paid, so callers can refuse the action.
   */
  function apply(effect) {
    if (!effect) return true;
    if (effect.kyat != null && effect.kyat < 0 && !canAfford(-effect.kyat)) return false;

    for (const name of [].concat(effect.learn || [])) setFlag(name, true);
    for (const name of [].concat(effect.forget || [])) setFlag(name, false);
    for (const id of [].concat(effect.give || [])) give(id);
    for (const id of [].concat(effect.take || [])) take(id);
    if (effect.kyat != null) {
      if (effect.kyat < 0) spend(-effect.kyat);
      else earn(effect.kyat);
    }
    if (effect.record) record(effect.record.kind, effect.record.id);
    if (effect.hours) spendHours(effect.hours);
    emit();
    return true;
  }

  // ═══════════════════════════════════════════════════════════
  // QUESTS — objectives are derived from flags, never from a step counter,
  // so progress can be driven from anywhere (dialogue, pickups, twists).
  // ═══════════════════════════════════════════════════════════

  /** The first step whose `done` condition isn't satisfied, or null when complete. */
  function activeStep(quest) {
    if (!quest || !quest.steps) return null;
    for (const step of quest.steps) {
      if (step.if && !test(step.if)) continue;   // step not applicable yet
      if (!test(step.done)) return step;
    }
    return null;
  }

  const questDone = (quest) => activeStep(quest) === null;

  function questProgress(quest) {
    if (!quest || !quest.steps) return { done: 0, total: 0 };
    const applicable = quest.steps.filter((st) => !st.if || test(st.if));
    return {
      done: applicable.filter((st) => test(st.done)).length,
      total: applicable.length,
    };
  }

  // ═══════════════════════════════════════════════════════════
  const api = {
    DAY_HOURS,
    START_KYAT,
    LODGING,

    load,
    save: persist,
    reset() { s = blank(); emit(); return s; },
    state: () => s,
    /** Replace state wholesale — used by the economy simulation in the tests. */
    restore(next) { s = Object.assign(blank(), next); emit(); },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    beginChapter,
    clearChapter,

    hours: () => s.hours,
    day: () => s.day,
    spendHours,
    dayFraction,
    timeLabel,

    kyat: () => s.kyat,
    earn,
    spend,
    canAfford,
    formatKyat,

    flag,
    setFlag,
    clearFlagsWithPrefix,

    has,
    give,
    take,
    bagIds,

    record,
    recorded,
    journal: () => s.journal,

    test,
    apply,

    activeStep,
    questDone,
    questProgress,
  };

  return api;
})();
