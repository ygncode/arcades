# Tea for Two — လက်ဖက်ရည်နှစ်ဆိုင်

A game-theory classroom served on a Yangon tea-shop street. Two rival tea
shops on 32nd Street teach the core ideas of game theory through four
playable lessons and a bilingual (Burmese/English) theory glossary.

## The lessons

| # | Lesson | Concept | You play |
|---|--------|---------|----------|
| 1 | ဈေးစစ်ပွဲ · The Price War | Prisoner's dilemma, dominant strategy, Nash equilibrium, Pareto optimality | one morning's price decision, then explore the payoff board |
| 2 | တစ်ပတ်တာ အတွဲ · The Week | Iterated prisoner's dilemma, tit-for-tat, Axelrod's tournament | ten days of decisions against five AI shopkeepers with real strategies (always-fair, always-defect, tit-for-tat, forgiving, whimsical) |
| 3 | မျှဝေတဲ့ကန် · The Shared Pond | Tragedy of the commons, shared resources | ten days of fishing from a pond that only regrows three fish a day |
| 4 | ခွဲဝေပွဲ · The Split | Ultimatum game, fairness, rejection as punishment | six rounds of proposing and responding to splits of ten gold coins |

Each lesson ends with a one-question quiz and awards a badge. All four
badges are saved in `localStorage`. A Theory Room (သီအိုရီခန်း) glosses ten
concepts in simple Burmese with English subtitles.

## The math is real

- The payoff matrix is the classic prisoner's dilemma: mutual cooperation
  (30/30) beats mutual defection (10/10), but defection is dominant.
- The five shopkeepers in Lesson 2 implement the actual strategies —
  Always Cooperate, Always Defect, Tit-for-Tat, Tit-for-Two-Tats
  (the "forgiving" one), and Random.
- The AI-vs-AI tournament runs the classic field — Tit-for-Tat, Grudger,
  Tit-for-Two-Tats, Joss, Generous Tit-for-Tat, Random, Detective, Always
  Defect — round-robin over 50 rounds, seeded for deterministic results.
  As in Axelrod's 1980 tournament, the nice-but-retaliatory strategies
  top the table and Always Defect sinks toward the bottom.

## Files

```
games/tea-for-two/
├── index.html    # screens: start, lesson shell, quiz overlay
├── style.css     # golden-hour tea-shop theme, checkered-tablecloth motif
├── portraits.js  # SVG factory for the five shopkeepers × six moods
├── lessons.js    # the four lessons + AI strategies + tournament engines
├── theory.js     # glossary content + quiz bank
└── game.js       # router, badges, quizzes, sound, theory room
```

## Run

```bash
npx serve .   # from the repo root, then open /games/tea-for-two/
```

## Tests

`tests/e2e/tea-for-two.mjs` (run via `npm run test:e2e:teafortwo`) lints the
game-theory data, plays every lesson to completion, checks badges persist,
verifies the tournament result matches the lesson, and checks the mobile
portrait layout.
