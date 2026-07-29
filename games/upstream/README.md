# Upstream — မြစ်ဆုံခရီး

A 3D river-runner built with three.js. Phoe Yay, a Pakokku-born deckhand
working in Yangon, pilots the old longtail *Shwe Hintha* up the Ayeyarwady
to Myitsone — where the N'Mai Kha and Mali Kha meet — to fetch a bottle of
confluence water for his grandmother's 80th birthday blessing.

## The route

Ten legs, each introducing one new hazard:

| # | Leg | New hazard |
|---|-----|------------|
| 1 | Yangon → Pyay | barge & ferry traffic |
| 2 | Pyay → Magway | sandbars |
| 3 | Magway → Bagan | whirlpools |
| 4 | Bagan → **Pakokku** 🏠 | fishing nets + Chindwin crosscurrents |
| 5 | Pakokku → Mandalay | night run, red vs gold lanterns |
| 6 | Mandalay → Kyaukmyaung | monsoon storm debris |
| 7 | Kyaukmyaung → Katha | teak log rafts |
| 8 | Katha → Bhamo | the defile — narrowed river, rocks |
| 9 | Bhamo → Myitkyina | rock shoals, racing current |
| 10 | Myitkyina → Myitsone | rapids finale, two-color confluence water |

Pakokku is the homecoming chapter: grandma gives you your grandfather's
brass compass (a free coin-magnet charm).

## Architecture

- `legs.js` — pure data: the ten legs, hazard spawn weights, palettes, upgrades
- `story.js` — pure writing: prologue, one bilingual scene per town, epilogue
- `audio.js` — procedural WebAudio (pentatonic themes, river noise, sfx); the
  sequencer interval never stops while muted, so mute/unmute cannot strand it
- `game.js` — the engine (ES module importing three.js via importmap)
- `vendor/` — vendored three.js r185 (`three.module.js` + `three.core.js`)

Engine principles (learned the hard way elsewhere in this repo):

- **Sim-time everything.** Obstacles are positioned each frame from
  `traveled distance − spawn mark`; banners, invulnerability, sinking and
  docking all run on clamped-dt sim time. No gameplay `setTimeout`s.
- **Deterministic legs.** Each leg's spawn plan comes from a seeded PRNG
  (`mulberry32(0xA5EED + legIdx * 977)`), so the same leg always plays the
  same layout and the E2E suite can reason about it (`UpstreamDebug.plan()`).
- **Guarded saves.** `localStorage` reads *and* writes are wrapped and merged
  over defaults; a corrupt save can't break boot, private mode can't break wins.
- **Input hygiene.** `blur`/`visibilitychange` clear held keys and boost.
- "New Journey" over a meaningful save requires a second confirming click.

## Debug hooks

`window.UpstreamDebug` (used by `tests/e2e/upstream.mjs`): `state`,
`startLeg(i)`, `skipTo(frac)`, `finishLeg()`, `damage()`, `addCoins(n)`,
`setBoatX(x)`, `plan()`, `wipeSave()`, `grantSave(s)`.
