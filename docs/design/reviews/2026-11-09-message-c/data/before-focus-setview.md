base http://127.0.0.1:4983
viewports phone 390x844, tablet 820x1180, desktop 1440x900
state docs/design/reviews/2026-11-09-message-c/data/state-set-view.mjs
floors: 3:1 on the indicator, 60% of its pixels

## Reach: what the DOM offers against what Tab finds

| page | viewport | focusable in DOM | tab stops | unreachable | sec |
|---|---|---|---|---|---|
| set | phone | 11 | 6 | 5 | 10.2 |
| set | tablet | 11 | 6 | 5 | 10.0 |
| set | desktop | 11 | 6 | 5 | 10.9 |

Unreachable, one line each:

- set/phone a.mark-link@32,-1359 135x24 offscreen "Ursa Minor"
- set/phone a.rec-action.font-mono@32,23 114x17 "mini-fixture →"
- set/phone a.rec-action.text-[var(--polar)]@154,317 169x17 "read it at its own address"
- set/phone input.w-full.min-w-0@32,371 326x26 "the address of a published site"
- set/phone button.rec-action.rec-hit@32,413 100x17 "read the site"
- set/tablet a.mark-link@66,-149 135x24 offscreen "Ursa Minor"
- set/tablet a.rec-action.font-mono@66,891 114x17 "mini-fixture →"
- set/tablet a.rec-action.text-[var(--polar)]@459,1108 169x17 "read it at its own address"
- set/tablet input.w-full.min-w-0@66,1162 569x27 "the address of a published site"
- set/tablet button.rec-action.rec-hit@655,1163 100x17 "read the site"
- set/desktop a.mark-link@96,-412 135x24 offscreen "Ursa Minor"
- set/desktop a.rec-action.font-mono@240,611 114x17 "mini-fixture →"
- set/desktop a.rec-action.text-[var(--polar)]@633,828 169x17 "read it at its own address"
- set/desktop input.w-full.min-w-0@240,882 840x27 "the address of a published site"
- set/desktop button.rec-action.rec-hit@1100,883 100x17 "read the site"

## The indicator, photographed at every stop

| page | viewport | stop | control | box | indicator px | clearing px | share >=3:1 | ring 1px | median | min | area/2.4.11 | verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| set | phone | 0 | button "their-repo-2026-10-17-9f8e7d62026-10-17 " | 326x176 | 1030 | 1030 | 100% | 1.02 | 11.99 | 11.99 | 0.51 | ok |
| set | phone | 1 | a "a link to this record alone" | 201x14 | 458 | 458 | 100% | 1.06 | 11.99 | 11.99 | 0.52 | ok |
| set | phone | 2 | button "their-repo-2026-10-18-a1b2c3d2026-10-18 " | 326x176 | 1032 | 1032 | 100% | 1.02 | 11.99 | 11.99 | 0.51 | ok |
| set | phone | 3 | a "a link to this record alone" | 201x14 | 458 | 458 | 100% | 1.06 | 11.99 | 11.99 | 0.52 | ok |
| set | phone | 4 | input  | 182x47 (ancestor:label) | 486 | 486 | 100% | 1.05 | 11.99 | 11.99 | 0.52 | ok |
| set | phone | 5 | input "the address of a published record" | 326x26 | 1058 | 1058 | 100% | 1.49 | 11.99 | 10.00 | 0.74 | ok |
| set | tablet | 0 | button "their-repo-2026-10-17-9f8e7d62026-10-17 " | 689x106 | 1836 | 1835 | 100% | 1.15 | 11.99 | 2.58 | 0.57 | ok |
| set | tablet | 1 | a "a link to this record alone" | 201x14 | 456 | 456 | 100% | 1.05 | 11.99 | 11.99 | 0.52 | ok |
| set | tablet | 2 | button "their-repo-2026-10-18-a1b2c3d2026-10-18 " | 689x106 | 1836 | 1835 | 100% | 1.15 | 11.99 | 2.58 | 0.57 | ok |
| set | tablet | 3 | a "a link to this record alone" | 201x14 | 456 | 456 | 100% | 1.05 | 11.99 | 11.99 | 0.52 | ok |
| set | tablet | 4 | input  | 182x47 (ancestor:label) | 486 | 486 | 100% | 1.05 | 11.99 | 11.99 | 0.52 | ok |
| set | tablet | 5 | input "the address of a published record" | 401x27 | 1285 | 1285 | 100% | 1.49 | 11.99 | 10.00 | 0.74 | ok |
| set | desktop | 0 | button "their-repo-2026-10-17-9f8e7d62026-10-17 " | 960x106 | 2380 | 2379 | 100% | 1.11 | 11.99 | 1.15 | 0.56 | ok |
| set | desktop | 1 | a "a link to this record alone" | 201x14 | 458 | 458 | 100% | 1.06 | 11.99 | 11.99 | 0.52 | ok |
| set | desktop | 2 | button "their-repo-2026-10-18-a1b2c3d2026-10-18 " | 960x106 | 2380 | 2379 | 100% | 1.11 | 11.99 | 1.15 | 0.56 | ok |
| set | desktop | 3 | a "a link to this record alone" | 201x14 | 458 | 458 | 100% | 1.06 | 11.99 | 11.99 | 0.52 | ok |
| set | desktop | 4 | input  | 182x47 (ancestor:label) | 488 | 488 | 100% | 1.06 | 11.99 | 11.99 | 0.52 | ok |
| set | desktop | 5 | input "the address of a published record" | 672x27 | 2100 | 2100 | 100% | 1.50 | 11.99 | 10.00 | 0.75 | ok |

## Headline

0 of 18 tab stops below a floor, 15 controls the keyboard cannot reach, 0 unstable.

By verdict: 18 ok.

The 2.4.11 area column is reported and never failed on: median 0.52 of the 2px-perimeter minimum, across 18 stops. The ring's weight is identity and a change to it is the owner's.
