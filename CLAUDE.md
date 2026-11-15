# Rob's Game Night: architecture and rules

Static site on GitHub Pages (robertrono0/gamenight). No build step. The TV is a laptop browser; guests join from their phones by QR.

## Files
- `index.html` hub: check-in QR, player wall, settings bar (Spicy, Big text, Team night, TV is the host, Party playlist, Theme), game catalog, leaderboard.
- `buzzer.js` TV-side phone system (PeerJS). Persistent peer id in localStorage `tg-buzz-id`, so phones follow the TV between pages. API: `TGB.ask(spec,names)`, `askEach(map)`, `players()`, `link('p')`, `qr()`, `host()`.
- `buzz.html` phone page. Renders specs: msg, role, choice, text, draw, photo, tap, grid, dial, hand, pad.
- `tg-shell.js` + `tg-shell.css` shared TV helpers ($, LS, SFX, music, FX/FXX, teamSetup, lobbyHTML, tgConfirm, tgAuto, tgSay).
- `tg-party.js` PG engine for phone party games: lobby, collect, vote, next, board, end, CPU bots.
- `tg-night.js` loaded on every page: themes + theme music, playlist pill, title emoji fix, sticky start buttons, name tidy.
- Old-style games (jeopardy, feud, spelling, dond, imposter, charades, emoji, tictac, pluck, likely, price, bingo) carry their own inline shell code.

## localStorage keys
`tg-roster`, `tg-night` (leaderboard log, awards 5/3/1), `tg-settings` {spicy,big,team,auto,theme}, `tg-playlist`, `tg-night-teams`, `tg-avatars`, `tg-profiles`, per game `tg-<game>`.

## Rules for changes
- Test at Rob's screen size: 1190x770, settings {spicy,big,team,theme:'lunar'}, 9+ roster names.
- Game screens must never zoom; Big text applies only to the hub and recap.
- Every phone game must work with robot phones end to end (see /tmp/audit.py pattern) before pushing.
- CPU players never earn Game Night leaderboard points.
- Traitors: classic rules by default; Mafia roles optional. Prizes (shield, potion, dagger, Seer) are secret. Traitors can never be revived.
- Any "new game" reset during play goes through `tgConfirm`.
- Writing for Rob: no em dashes.

## Open list
1. UNO versions in Color Clash: Flex, Dare, Party (teams), Triple Play, DOS.
2. Prove "TV is the host" mode end to end.
3. Emoji Decode add-your-own, Most Likely To "guess who voted", Arabic on TV screens, holiday question packs.
