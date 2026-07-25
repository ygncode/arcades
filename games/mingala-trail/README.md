# Mingala Trail · မင်္ဂလာခရီး

> Phoe Chit's grandfather wrote ten letters before he died, and left instructions that
> the boy deliver them by hand. He didn't say why.

U Ba Nyein (ဦးဘငြိမ်း) spent forty years as a postal runner. Ten envelopes, ten towns,
in route order. Each recipient knew him at a different point in his life, and none of
them tell the same story about him. The tenth envelope has Phoe Chit's own name on it.

A chaptered walk-around adventure across Myanmar — talk, explore, decide, deliver.

## The route

| # | Town | The complication | Twist |
|---|------|------------------|-------|
| 1 | ရန်ကုန် Yangon | The printer is across a road that doesn't stop | `traffic` |
| 2 | ပဲခူး Bago | The abbot is mid alms-round | `balance` |
| 3 | မန္တလေး Mandalay | The bridge planks are out | `planks` |
| 4 | ပုဂံ Bagan | The envelope has a sketch instead of an address | `spot` |
| 5 | အင်းလေး Inle | The weaver moved her loom onto the water | `rowing` |
| 6 | ကလော Kalaw | The school is an hour and a half up the ridge | `climb` |
| 7 | ပြင်ဦးလွင် Pyin Oo Lwin | **She refuses the letter** | `flowers` |
| 8 | မြောက်ဦး Mrauk U | **He died last year** — you read it at the grave | `fog` |
| 9 | ဘားအံ Hpa-An | **He is still angry**, with cause | `cave` |
| 10 | ငပလီ Ngapali | The last envelope is addressed to you | `tide` |

Each chapter is ~10 minutes: arrive, ask around to find the recipient, hit the
complication, resolve it, and deliver. Plus 4–6 NPCs with real conversations, two side
quests and one hidden keepsake per town.

## Systems

**⏳ Hours** — a chapter is one day. Talking is free; a twist attempt costs an hour, side
work costs two or three. When the day runs out you sleep and a new one starts: lodging
costs kyat if you have it, nothing if you don't.

**◈ Kyat** — earned mostly as လမ်းစရိတ်, the travel money recipients press on you at the
door. Spent on transport, tea, guides and favours.

They interlock on the map screen, which is the game's core decision: **pay to save time,
or spend time to save money.**

| | Cost | You arrive with |
|---|---|---|
| 🥾 On foot | free | 5 hours |
| 🚌 Night bus | 1,500 | 7 hours |
| 🚂 Train | 4,000 | 10 hours |
| ✈️ Flight | 11,000 | 12 hours |

Walking is always free, which is the **anti-soft-lock guarantee**: however broke you are,
there is always a way to the next town. The E2E suite asserts it.

**📖 Route book** — letters delivered, people met, keepsakes found, and the fragments of
who your grandfather actually was. This is the completion meter; the arc only becomes
visible here.

## Controls

| | |
|---|---|
| Walk | Arrows / WASD, or the on-screen D-pad |
| Talk · pick up · enter · begin | `Space` / `Enter` / `E`, or the action button |
| Pick a dialogue option | `1`–`4`, or tap it |
| Route book | `J` |
| Pause | `Esc` |

Progress saves to `localStorage` under `mingala-trail-v2`.

## Files

| File | Holds |
|------|-------|
| `index.html` | screens, overlays, HUD, controls |
| `art.js` | every sprite, portrait and parallax backdrop — inline SVG |
| `systems.js` | the rules: hours, kyat, flags, inventory, route book |
| `cities.js` | **world layout** — areas, parallax bands, props, npc placement, ambient |
| `story.js` | **all the writing** — dialogue trees, the ten letters, quests |
| `twists.js` | the ten minigames |
| `map.js` | the Myanmar map and the transport choice |
| `game.js` | engine: camera, parallax, interaction, dialogue runner, quest engine |
| `audio.js` | synthesised music + SFX |

No build step, no bundler, no modules — plain `<script src>` and IIFEs, matching the rest
of the arcade. **Zero binary assets**: every sprite is inline SVG, the whole soundtrack is
generated with WebAudio, and the Myanmar map is a hand-drawn SVG path.

The split is deliberate: `cities.js` says *where things stand*, `story.js` says *what they
say*, `systems.js` says *what the rules are*, and `game.js` knows about none of them
specifically.

## Geometry

The visible band is always **562 units tall**; an area is as many units **wide** as it
likes (2800–4200 = three to four screens). `--u` is px-per-unit, written on `<html>` by
`fitLayout()`, so a resize or rotation reflows the whole world without touching state.
Everything is anchored **bottom-centre**. The camera is horizontal only, soft-follow with
lookahead, and parallax is just `translate(-camera * depth)` per layer.

## Adding a chapter

`game.js` never names a city, so a new one is a data edit in `cities.js` + `story.js`.
Rules the E2E content linter enforces for you:

- `num` equals the city's position (1-based); `id` unique.
- Every sprite / backdrop / ambient / portrait name exists in `art.js`.
- Every npc `dialogue`, door `to`, thing `action` and letter reference resolves.
- **Solid props sit at `y <= walk.bottom - 40`.** There is no pathfinding, so nothing may
  block a lane — the player must always be able to walk in front of scenery. `cw` is the
  fraction of sprite width that actually collides (default `0.55`).
- Every quest step's `done` flag is set by *something* — a dialogue effect or a thing
  action. A flag nothing sets is an unwinnable chapter, and the suite fails on it.
- Both `my` and `en` on every objective, name, line, choice and letter paragraph.
- Every dialogue node is reachable from `start` and terminates (`choices` or a `to`).

### Dialogue shape

```js
"npc_id": {
  start: [{ if: "some_flag", to: "after" }, { to: "greet" }],   // first match wins
  nodes: {
    greet: {
      who: "ko-myint-swe",
      text: { my: "…", en: "…" },
      choices: [
        { text: { my: "…", en: "…" }, to: "printer" },
        { text: { my: "…", en: "…" }, if: { kyat: 300 },
          effect: { kyat: -300, learn: "had_tea" }, to: "tea" },
      ],
    },
    printer: { who: "…", text: {…}, effect: { learn: "yangon_knows_press" }, to: "end" },
  },
}
```

Effects: `{ learn, forget, give, take, kyat: ±n, hours: n, record: {kind, id} }`.
Conditions: `"flag"` · `"!flag"` · `{ flag, notFlag, item, kyat, cleared }` · arrays (all
must hold). A node may also carry `letter: "cityId"` to open the letter reader.

### Adding a twist

Register in `twists.js`; only `start(ctx)` is required, plus optionally
`update(dt) · press() · release() · move(dx,dy) · cleanup()`.
`ctx = { stage, city, sfx, meter(0..1), say(my,en), done(ok) }`.
Position things in the stage's `0..100` percentage space.

**Do not depend on `Math.random`** — the suite stubs it to a constant, and a twist that
needs luck can become unwinnable. Drive variation off a round counter, as `spot` and `fog`
do. If you add one, add its optimal-play strategy to `testTwists` in
`tests/e2e/mingala.mjs`; the suite fails any twist it can't win in 90 seconds.

## Dev surface

`window.TrailDebug` exists for debugging and for the E2E suite. The game never uses it.

```js
TrailDebug.state()            // live engine state
TrailDebug.sys()              // the systems API (hours, kyat, flags, journal)
TrailDebug.goCity(3)          // jump into chapter 4
TrailDebug.goArea("teashop")  // jump to an area of the current city
TrailDebug.warpTo(x, y)       // teleport (target updates on the NEXT frame)
TrailDebug.unlockAll()        // open the whole map
TrailDebug.reset()            // wipe progress
TrailDebug.say(id)            // run a dialogue tree by id
TrailDebug.choose(i)          // pick dialogue option i
TrailDebug.skipTyping()       // finish the typewriter
TrailDebug.completeTwist()    // win the open twist
TrailDebug.letter(id)         // open a letter
```

## On the artwork and the story

The look is an homage to mid-century Burmese newsprint comics — black line art, halftone
screentone, cream paper. **All of it is drawn from scratch** in `art.js`, and every
character, name and letter is original. Nothing here is traced from, named after, or
copied out of any published work.
