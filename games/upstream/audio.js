/* =============================================================
   Upstream — audio
   All-procedural WebAudio: river ambience, small pentatonic
   themes per mood, and one-shot sfx. No assets.
   The sequencer interval keeps running while muted (it just
   skips emitting notes), so mute/unmute can never strand it.
   ============================================================= */
(function () {
  "use strict";

  let ctx = null;
  let master = null, musicBus = null, sfxBus = null;
  let muted = false;
  let started = false;
  let mood = null;
  let step = 0;
  let seqTimer = null;
  let noise = null, noiseGain = null, noiseFilter = null;

  const THEMES = {
    // pentatonic-ish riffs; 0 = rest. Midi numbers.
    day:    { bpm: 92,  bass: [50, 0, 57, 0, 55, 0, 57, 0], lead: [74, 0, 76, 79, 0, 76, 74, 0, 69, 0, 74, 0, 76, 0, 0, 0], pluck: 0.28 },
    home:   { bpm: 84,  bass: [48, 0, 55, 0, 53, 0, 55, 0], lead: [72, 0, 74, 0, 79, 0, 76, 74, 0, 72, 0, 69, 0, 72, 0, 0], pluck: 0.32 },
    night:  { bpm: 70,  bass: [45, 0, 0, 0, 52, 0, 0, 0],   lead: [69, 0, 0, 72, 0, 0, 74, 0, 0, 0, 76, 0, 72, 0, 0, 0], pluck: 0.2 },
    storm:  { bpm: 108, bass: [43, 43, 0, 43, 50, 0, 43, 0], lead: [67, 0, 70, 0, 72, 70, 0, 67, 0, 65, 0, 67, 0, 0, 70, 0], pluck: 0.3 },
    finale: { bpm: 100, bass: [50, 0, 57, 57, 55, 0, 60, 0], lead: [74, 76, 79, 0, 81, 0, 79, 76, 74, 0, 76, 79, 0, 81, 0, 84], pluck: 0.34 },
  };

  function ensureCtx() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0.5;
    musicBus.connect(master);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.7;
    sfxBus.connect(master);
    buildRiverNoise();
    return true;
  }

  function buildRiverNoise() {
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02; // brown-ish
      d[i] = last * 3.2;
    }
    noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 480;
    noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.0;
    noise.connect(noiseFilter).connect(noiseGain).connect(master);
    noise.start();
  }

  function midiHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  /* saung-style pluck */
  function pluck(midi, t, dur, gainV, bus) {
    const o = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o2.type = "sine";
    o.frequency.value = midiHz(midi);
    o2.frequency.value = midiHz(midi) * 2.001;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gainV, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const g2 = ctx.createGain();
    g2.gain.value = 0.25;
    o.connect(g);
    o2.connect(g2).connect(g);
    g.connect(bus);
    o.start(t); o2.start(t);
    o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }

  function bassNote(midi, t, dur) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = midiHz(midi);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(musicBus);
    o.start(t); o.stop(t + dur + 0.05);
  }

  /* Lookahead sequencer: interval always runs; notes only emitted
     when unmuted and a mood is set. */
  let nextNoteTime = 0;
  function schedulerTick() {
    if (!ctx) return;
    const theme = THEMES[mood];
    if (!theme || muted) { nextNoteTime = ctx.currentTime + 0.05; return; }
    const spb = 60 / theme.bpm / 2; // 8th notes
    while (nextNoteTime < ctx.currentTime + 0.12) {
      const i16 = step % 16;
      const i8 = step % 8;
      const lead = theme.lead[i16];
      const bass = theme.bass[i8];
      if (bass) bassNote(bass, nextNoteTime, spb * 1.8);
      if (lead) pluck(lead, nextNoteTime, spb * 2.2, theme.pluck, musicBus);
      nextNoteTime += spb;
      step++;
    }
  }

  function startSequencer() {
    if (seqTimer) return;
    nextNoteTime = ctx.currentTime + 0.06;
    seqTimer = setInterval(schedulerTick, 40);
  }

  const api = {
    unlock() {
      if (!ensureCtx()) return;
      if (ctx.state === "suspended") ctx.resume();
      if (!started) { started = true; startSequencer(); }
    },
    setMood(m, riverLevel) {
      mood = m in THEMES ? m : null;
      step = 0;
      if (ctx && noiseGain) {
        const target = muted ? 0 : (riverLevel == null ? 0.12 : riverLevel);
        noiseGain.gain.linearRampToValueAtTime(target, ctx.currentTime + 0.8);
      }
    },
    setRiver(level) {
      if (ctx && noiseGain && !muted) noiseGain.gain.linearRampToValueAtTime(level, ctx.currentTime + 0.5);
    },
    setMuted(m) {
      muted = m;
      if (!ctx) return;
      master.gain.linearRampToValueAtTime(m ? 0 : 0.9, ctx.currentTime + 0.1);
      if (noiseGain) noiseGain.gain.linearRampToValueAtTime(m ? 0 : 0.12, ctx.currentTime + 0.1);
    },
    get muted() { return muted; },

    sfx(name) {
      if (!ctx || muted) return;
      const t = ctx.currentTime;
      switch (name) {
        case "coin": {
          pluck(88, t, 0.18, 0.3, sfxBus);
          pluck(93, t + 0.06, 0.22, 0.24, sfxBus);
          break;
        }
        case "padauk": {
          [84, 88, 91, 96].forEach((m, i) => pluck(m, t + i * 0.06, 0.3, 0.26, sfxBus));
          break;
        }
        case "hit": {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = "sawtooth";
          o.frequency.setValueAtTime(130, t);
          o.frequency.exponentialRampToValueAtTime(40, t + 0.3);
          g.gain.setValueAtTime(0.4, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          o.connect(g).connect(sfxBus);
          o.start(t); o.stop(t + 0.4);
          api.sfx("splash");
          break;
        }
        case "splash": {
          const len = ctx.sampleRate * 0.3;
          const buf = ctx.createBuffer(1, len, ctx.sampleRate);
          const d = buf.getChannelData(0);
          for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
          const s = ctx.createBufferSource();
          s.buffer = buf;
          const f = ctx.createBiquadFilter();
          f.type = "bandpass"; f.frequency.value = 900; f.Q.value = 0.7;
          const g = ctx.createGain(); g.gain.value = 0.5;
          s.connect(f).connect(g).connect(sfxBus);
          s.start(t);
          break;
        }
        case "boost": {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = "square";
          o.frequency.setValueAtTime(90, t);
          o.frequency.linearRampToValueAtTime(180, t + 0.25);
          g.gain.setValueAtTime(0.12, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
          o.connect(g).connect(sfxBus);
          o.start(t); o.stop(t + 0.35);
          break;
        }
        case "whirl": {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = "sine";
          o.frequency.setValueAtTime(300, t);
          o.frequency.exponentialRampToValueAtTime(120, t + 0.5);
          g.gain.setValueAtTime(0.15, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
          o.connect(g).connect(sfxBus);
          o.start(t); o.stop(t + 0.55);
          break;
        }
        case "chime": {
          [79, 84, 88].forEach((m, i) => pluck(m, t + i * 0.09, 0.5, 0.3, sfxBus));
          break;
        }
        case "buy": {
          pluck(76, t, 0.15, 0.3, sfxBus);
          pluck(83, t + 0.08, 0.3, 0.3, sfxBus);
          break;
        }
        case "deny": {
          pluck(52, t, 0.25, 0.3, sfxBus);
          break;
        }
        case "ui": {
          pluck(72, t, 0.1, 0.18, sfxBus);
          break;
        }
        case "finale": {
          [67, 74, 79, 83, 86, 91].forEach((m, i) => pluck(m, t + i * 0.14, 0.9, 0.3, sfxBus));
          break;
        }
      }
    },
  };

  window.UpstreamAudio = api;
})();
