# YGN Arcade

A multi-game browser arcade, ready for **GitHub Pages**.

```
ygn-arcade/
├── index.html       # hub landing page
├── hub.css
├── hub.js
├── games.json       # catalog (add games here)
└── games/
    ├── pagoda-patch/   # ခြံစောင့် — Plants vs Zombies style
    │   ├── index.html
    │   ├── game.js
    │   ├── audio.js
    │   └── style.css
    └── mingala-trail/  # မင်္ဂလာခရီး — ten letters, ten towns
        ├── index.html
        ├── game.js     # engine: camera, parallax, dialogue runner, quests
        ├── systems.js  # rules: hours, kyat, flags, route book
        ├── cities.js   # world layout (where things stand)
        ├── story.js    # all the writing (what they say)
        ├── twists.js   # per-chapter minigames
        ├── map.js      # the Myanmar map + transport choice
        ├── art.js      # inline-SVG sprites, portraits, backdrops
        ├── audio.js
        └── style.css
```

## Local play

```bash
# from this folder
npx serve .
# open http://localhost:3000
```

> Open via a static server (not `file://`) so `games.json` can load.

## Deploy to GitHub Pages

1. Create a new GitHub repo (e.g. `ygn-arcade` or `username.github.io`).
2. Push this folder:

```bash
git init
git add .
git commit -m "Initial YGN Arcade hub + Pagoda Patch"
git branch -M main
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

3. On GitHub: **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: `main` / `/ (root)` → Save

4. Site URL will be:
   - Project repo: `https://YOUR_USER.github.io/YOUR_REPO/`
   - User site repo (`username.github.io`): `https://YOUR_USER.github.io/`

5. Optional: set `"github"` in `games.json` to your repo URL so the hub nav links work.

### If the repo is NOT at domain root

Paths already use relative URLs (`./games/...`), so project Pages work without a base-href hack.

## Add a new game

1. Create a folder:

```bash
mkdir -p games/my-cool-game
# put index.html (+ css/js) inside — must be playable at that path
```

2. Register it in `games.json`:

```json
{
  "id": "my-cool-game",
  "title": "My Cool Game",
  "subtitle": "optional",
  "emoji": "🚀",
  "blurb": "One-line pitch.",
  "tags": ["action", "arcade"],
  "cover": "linear-gradient(135deg, #333, #666)",
  "badge": "New",
  "status": "live"
}
```

Use `"status": "coming-soon"` for teaser cards that don't link yet.

3. Commit & push — the hub picks it up automatically.

### Game checklist

- [ ] `games/<id>/index.html` is the entry point
- [ ] Assets use **relative** paths (`./style.css`, not `/style.css`)
- [ ] Works when opened under a subpath (`/games/<id>/`)
- [ ] Entry added to `games.json`

## E2E tests

Three Playwright scripts, run in sequence by `npm test`:

| Script | Covers |
|--------|--------|
| `test:e2e:layout` | hub, campaign navigation, portrait rotate gate, landscape layout |
| `test:e2e:gameplay` | Pagoda Patch — touch planting, shooting, damage, sun, pause/resume, shovel, mute, viewport bounds |
| `test:e2e:mingala` | Mingala Trail — content linter, dialogue-graph validation, economy solvency, twist winnability, a full chapter played on touch, save persistence, rotate gate, viewport bounds |

```bash
npm install
npm run install:browsers
npm run dev

# in another terminal
npm test                      # or: BASE_URL=http://localhost:3111 npm test
```

Tested landscape sizes include 568×320, 667×375, 740×360, 844×390,
and 1024×768. Generated screenshots are written to `e2e-shots/` and ignored by Git.

Most of the Mingala Trail suite is **static analysis**, because that game is mostly data.
It fails on: an unknown sprite/backdrop/portrait, an unresolvable dialogue, door or quest
target, a missing translation, an unreachable or dead-end dialogue node, a quest step
gated on a flag nothing ever sets, a solid prop parked in the walking lane, a twist that
can't be won, or an economy in which a broke player could get stranded. Adding a chapter
without running it is how you ship an unwinnable one.

## Games

| ID | Title | Notes |
|----|--------|--------|
| `pagoda-patch` | Pagoda Patch (ခြံစောင့်) | PvZ-style campaign, Burmese theme |
| `mingala-trail` | Mingala Trail (မင်္ဂလာခရီး) | 10-chapter narrative adventure. Deliver a dead postman's last ten letters across Myanmar. Side-scrolling towns, dialogue trees, an hours-vs-kyat economy. Adding a chapter is a data edit — see its [README](games/mingala-trail/README.md) |

## License

Add your preferred license. Game code is original; keep third-party assets' licenses if you add any.
