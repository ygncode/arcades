/**
 * Mingala Trail — audio.js
 *
 * Fully synthesised: no audio files ship with this game. A small step sequencer
 * drives a saung-ish pluck, a soft flute lead, hand percussion and a bell, with one
 * theme per kind of place. Same shape as the arcade's other game so the mute button,
 * gesture unlock and theme switching all behave identically.
 *
 * Exposes: window.TrailAudio
 */
window.TrailAudio = (() => {
  "use strict";

  let ctx = null, master, musicGain, sfxGain;
  let musicOn = true, sfxOn = true;
  let currentTheme = "menu";
  let musicTimer = null;
  let step = 0;
  let started = false;
  let prevMute = { musicOn: true, sfxOn: true };

  const A4 = 440;
  const f = (midi) => A4 * Math.pow(2, (midi - 69) / 12);

  // Anhemitonic pentatonic — the safe, pleasant core of a lot of Burmese melody.
  const N = {
    C3: 48, D3: 50, E3: 52, G3: 55, A3: 57,
    C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69,
    C5: 72, D5: 74, E5: 76, G5: 79, A5: 81, C6: 84, D6: 86, E6: 88,
    F3: 53, B3: 59, B4: 71, F5: 77,
  };

  /** Each theme is 16 sixteenth-note steps. */
  const THEMES = {
    menu: {
      bpm: 96,
      bass: [N.C3, 0, 0, N.G3, 0, 0, N.A3, 0, N.F3, 0, 0, N.C3, 0, N.G3, 0, 0],
      lead: [N.C5, 0, N.E5, N.G5, 0, N.E5, 0, N.D5, N.C5, 0, N.A4, 0, N.G4, 0, 0, 0],
      pluck: [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0],
      drum: [1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 0],
      bell: [N.C6, 0, 0, 0, 0, 0, N.G5, 0, 0, 0, 0, 0, N.E5, 0, 0, 0],
      air: 0.16,
    },
    map: {
      bpm: 88,
      bass: [N.G3, 0, 0, 0, N.D3, 0, 0, 0, N.E3, 0, 0, 0, N.C3, 0, 0, 0],
      lead: [N.G4, 0, N.A4, 0, N.C5, 0, N.D5, 0, N.E5, 0, N.D5, 0, N.C5, 0, 0, 0],
      pluck: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      drum: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0],
      bell: [0, 0, 0, 0, N.D6, 0, 0, 0, 0, 0, 0, 0, N.A5, 0, 0, 0],
      air: 0.22,
    },
    town: {
      bpm: 104,
      bass: [N.C3, 0, N.C3, 0, N.G3, 0, 0, N.A3, N.F3, 0, N.F3, 0, N.G3, 0, N.E3, 0],
      lead: [N.E5, N.G5, 0, N.A5, 0, N.G5, N.E5, 0, N.D5, 0, N.C5, 0, N.D5, N.E5, 0, 0],
      pluck: [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1],
      drum: [1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1],
      bell: [0, 0, N.C6, 0, 0, 0, 0, 0, 0, 0, N.G5, 0, 0, 0, 0, 0],
      air: 0.1,
    },
    hill: {
      bpm: 84,
      bass: [N.A3, 0, 0, 0, N.E3, 0, 0, 0, N.F3, 0, 0, 0, N.G3, 0, 0, 0],
      lead: [N.A4, 0, 0, N.C5, 0, N.D5, 0, 0, N.E5, 0, N.D5, 0, N.C5, 0, N.A4, 0],
      pluck: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
      drum: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
      bell: [N.E6, 0, 0, 0, 0, 0, 0, 0, N.C6, 0, 0, 0, 0, 0, 0, 0],
      air: 0.3,
    },
    water: {
      bpm: 78,
      bass: [N.D3, 0, 0, 0, 0, 0, N.A3, 0, N.G3, 0, 0, 0, 0, 0, N.D3, 0],
      lead: [N.D5, 0, 0, N.F5, 0, 0, N.A4, 0, N.G4, 0, N.A4, 0, 0, N.D5, 0, 0],
      pluck: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      drum: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
      bell: [0, 0, 0, 0, N.D6, 0, 0, 0, 0, 0, 0, 0, 0, 0, N.A5, 0],
      air: 0.34,
    },
    mist: {
      bpm: 70,
      bass: [N.A3, 0, 0, 0, 0, 0, 0, 0, N.F3, 0, 0, 0, 0, 0, 0, 0],
      lead: [N.A4, 0, 0, 0, N.C5, 0, 0, 0, N.B4, 0, 0, 0, N.A4, 0, 0, 0],
      pluck: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
      drum: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      bell: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, N.E5, 0, 0, 0],
      air: 0.45,
    },
  };

  // ═══════════════════════════════════════════════════════════
  // CORE
  // ═══════════════════════════════════════════════════════════
  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.7;
      master.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.gain.value = 0.32;
      musicGain.connect(master);
      sfxGain = ctx.createGain();
      sfxGain.gain.value = 0.5;
      sfxGain.connect(master);
    } catch (_) {
      ctx = null;
    }
    return ctx;
  }

  function osc(type, freq, dur, gain, dest, detune = 0) {
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(dest || sfxGain);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function noise(dur, gain, dest, freq = 1400, q = 1) {
    if (!ctx) return;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = freq;
    bp.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(bp);
    bp.connect(g);
    g.connect(dest || sfxGain);
    src.start();
  }

  /** Plucked string, roughly a saung harp. */
  function pluck(midi, gain = 0.16) {
    if (!ctx) return;
    const freq = f(midi);
    osc("triangle", freq, 0.9, gain, musicGain);
    osc("sine", freq * 2, 0.4, gain * 0.4, musicGain, 6);
  }

  /** Breathy flute-ish lead. */
  function flute(midi, gain = 0.13, dur = 0.5) {
    if (!ctx) return;
    osc("sine", f(midi), dur, gain, musicGain);
    osc("triangle", f(midi), dur * 0.7, gain * 0.35, musicGain, -8);
    noise(0.05, gain * 0.1, musicGain, f(midi) * 2, 8);
  }

  function drum(strong) {
    if (!ctx) return;
    osc("sine", strong ? 96 : 150, strong ? 0.22 : 0.13, strong ? 0.3 : 0.16, musicGain);
    noise(0.06, strong ? 0.06 : 0.035, musicGain, 2200, 1.4);
  }

  function bell(midi) {
    if (!ctx) return;
    osc("sine", f(midi), 1.5, 0.075, musicGain);
    osc("sine", f(midi) * 2.76, 1.1, 0.03, musicGain);
  }

  // ═══════════════════════════════════════════════════════════
  // SEQUENCER
  // ═══════════════════════════════════════════════════════════
  function tick() {
    if (!ctx || !musicOn) return;
    const th = THEMES[currentTheme] || THEMES.menu;
    const i = step % 16;

    if (th.bass[i]) pluck(th.bass[i] - 12, 0.17);
    if (th.lead[i]) flute(th.lead[i], 0.12, 0.42 + th.air);
    if (th.pluck[i]) pluck(th.lead[i] || th.bass[i] || N.C4, 0.07);
    if (th.drum[i]) drum(i % 8 === 0);
    if (th.bell[i]) bell(th.bell[i]);

    step++;
    const stepMs = 60000 / th.bpm / 4;
    musicTimer = setTimeout(tick, stepMs);
  }

  function startMusic(theme) {
    if (!ensure()) return;
    if (theme) currentTheme = theme;
    if (started) return;
    started = true;
    step = 0;
    clearTimeout(musicTimer);
    tick();
  }

  function stopMusic() {
    started = false;
    clearTimeout(musicTimer);
    musicTimer = null;
  }

  // ═══════════════════════════════════════════════════════════
  // SFX
  // ═══════════════════════════════════════════════════════════
  const sfx = {
    step: () => { if (sfxOn && ensure()) noise(0.05, 0.05, sfxGain, 900, 2); },
    talk: () => { if (sfxOn && ensure()) { osc("triangle", 520, 0.09, 0.12); setTimeout(() => osc("triangle", 660, 0.1, 0.1), 70); } },
    pick: () => { if (sfxOn && ensure()) { osc("square", 720, 0.07, 0.1); setTimeout(() => osc("square", 960, 0.09, 0.09), 60); } },
    give: () => { if (sfxOn && ensure()) { osc("sine", 620, 0.12, 0.13); setTimeout(() => osc("sine", 830, 0.16, 0.12), 90); } },
    good: () => { if (sfxOn && ensure()) { osc("sine", 880, 0.1, 0.14); setTimeout(() => osc("sine", 1170, 0.12, 0.11), 70); } },
    bad: () => { if (sfxOn && ensure()) { osc("sawtooth", 200, 0.18, 0.12); noise(0.12, 0.05, sfxGain, 400, 1); } },
    win: () => {
      if (!sfxOn || !ensure()) return;
      [N.C5, N.E5, N.G5, N.C6].forEach((n, i) => setTimeout(() => osc("triangle", f(n), 0.28, 0.15), i * 95));
    },
    chapter: () => {
      if (!sfxOn || !ensure()) return;
      [N.C5, N.G5, N.C6].forEach((n, i) => setTimeout(() => { osc("sine", f(n), 0.7, 0.16); bell(n); }, i * 170));
    },
    door: () => { if (sfxOn && ensure()) { osc("sine", 300, 0.14, 0.11); noise(0.1, 0.05, sfxGain, 700, 1.2); } },
    letter: () => { if (sfxOn && ensure()) { noise(0.22, 0.05, sfxGain, 3200, 0.8); setTimeout(() => noise(0.16, 0.04, sfxGain, 2400, 0.9), 130); } },
    click: () => { if (sfxOn && ensure()) osc("square", 440, 0.045, 0.07); },
  };

  // ═══════════════════════════════════════════════════════════
  // PUBLIC
  // ═══════════════════════════════════════════════════════════
  return {
    unlock() {
      if (!ensure()) return;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
    },
    startMusic,
    stopMusic,
    setTheme(name) {
      if (THEMES[name] && name !== currentTheme) {
        currentTheme = name;
        step = 0;
      }
    },
    setMusic(on) {
      musicOn = on;
      if (!on) stopMusic();
      else startMusic();
    },
    setSfx(on) { sfxOn = on; },
    toggleMute() {
      const muted = !musicOn && !sfxOn;
      if (muted) {
        musicOn = prevMute.musicOn;
        sfxOn = prevMute.sfxOn;
        if (musicOn) startMusic();
      } else {
        prevMute = { musicOn, sfxOn };
        musicOn = false;
        sfxOn = false;
        stopMusic();
      }
    },
    isMuted() { return !musicOn && !sfxOn; },
    sfx,
    get musicOn() { return musicOn; },
    get sfxOn() { return sfxOn; },
  };
})();
