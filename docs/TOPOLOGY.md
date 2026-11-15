# Topology map: anchors, bridges, blast radius

Read this before changing any shared file. Ask before crossing a file you don't own.

## Anchors (shared files, highest blast radius first)
| File | Loaded by | Blast radius |
|---|---|---|
| `tg-night.js` | all 40 pages incl. hub | Everything: themes, music, title emojis, sticky start buttons, tgConfirm fallback. A syntax error breaks every page. |
| `buzzer.js` | 39 pages (all but prize, recap) | Every phone connection. Peer id in `tg-buzz-id` must stay stable or phones lose the TV between pages. Changes need `?v=` bump on every page AND the BUILD constant. |
| `buzz.html` | the phone page | Every phone. Spec types (msg, role, choice, text, draw, photo, tap, grid, dial, hand, pad) are a contract with all games. Never rename spec fields. |
| `tg-shell.js` | 28 newer pages | Shared TV helpers, music engine, FX, tgConfirm, tgAuto, tgSay. Old pages do NOT load it. |
| `tg-party.js` | 22 phone party games | Lobby, collect, vote, next, scoring, CPU bots. |
| `tg-depth.js` | 28 newer pages | 3D tilt and stage layers only. |
| `tg-shell.css` | inlined into pages (file kept as source) | Edit the file AND re-inline, or styles drift. |
| `tg-feud-data.js` | fastmoney | Survey data shared with Feud. |

## Bridges (contracts between files)
- TV to phone: `TGB.ask(spec, names)` / `askEach(map)` -> phone renders spec -> phone sends `{t:'in', id, v}` -> game `onInput(name, id, v)`.
- Game to leaderboard: `tgNight(game, places)` writes `tg-night`; hub, recap and team totals read it. Name keys are normalized on hub and recap load.
- Hub to games: `tg-roster`, `tg-settings` {spicy, big, team, auto, theme}, `tg-night-teams`, `tg-playlist`.
- Phone identity: `tg-bz-name`, `tg-bz-prof`, selfie in `tg-bz-avatar`; TV stores `tg-avatars`, `tg-profiles` by name.

## Invariants (must always hold)
1. Game screens never zoom. Big text only on hub and recap.
2. CPU names start with "CPU " and never get Game Night points.
3. Traitors can never be revived; prizes only go to living players.
4. Any reset during play goes through `tgConfirm`.
5. One owner per file at a time when agents work in parallel.

## Old-style pages (own inline shell; tg-shell.js changes do not reach them)
jeopardy, feud, spelling, dond, imposter, charades, emoji, tictac, pluck, likely, price, bingo.
