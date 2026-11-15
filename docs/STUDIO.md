# Game Night Studio: how we build

## Roles
- Executive Producer / Director: plans milestones, assigns work, reviews, ships.
- Creative Director: keeps these docs; every game has a page in /docs/games.
- Gameplay Engineers: build features, one file owner at a time.
- Systems & AI Architect: game flow, CPU players, auto host, save and resume, audio.
- QA / Bug Hunter: independent review before anything ships.

## The bar every game must meet ("done")
1. Plays start to finish with robot phones, no page errors.
2. Fits Rob's laptop screen (1190x770) and a TV; nothing cut off; game screens never zoom.
3. Nobody waits more than about 30 seconds without something to do or watch.
4. Clear how-to screen; first round understandable in under a minute.
5. Works with phones, and degrades gracefully without them where possible.
6. CPU players where it makes sense; CPUs never earn Game Night points.
7. Every reset during play asks "Are you sure?".
8. A big reveal moment and a final-round swing so the ending is dramatic.
9. Reviewed by QA, then a verification trace is shown to Rob.

## Pipeline
Design doc -> build -> robot playthrough + screenshots -> QA review -> live test with Rob's phones -> push to GitHub.

## House rules
- No em dashes in anything written for Rob or players.
- Family friendly by default; Spicy toggle for adults.
- Original content and names (no copyrighted songs, logos, or brand names in UI).
