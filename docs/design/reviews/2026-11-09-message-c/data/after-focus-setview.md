base http://127.0.0.1:4983
viewports phone 390x844, tablet 820x1180, desktop 1440x900
state docs/design/reviews/2026-11-09-message-c/data/state-set-view.mjs
floors: 3:1 on the indicator, 60% of its pixels

## Reach: what the DOM offers against what Tab finds

| page | viewport | focusable in DOM | tab stops | unreachable | sec |
|---|---|---|---|---|---|
| set | phone | 11 | 11 | 0 | 13.9 |
| set | tablet | 11 | 11 | 0 | 10.4 |
| set | desktop | 11 | 11 | 0 | 15.1 |

## The indicator, photographed at every stop

| page | viewport | stop | control | box | indicator px | clearing px | share >=3:1 | ring 1px | median | min | area/2.4.11 | verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| set | phone | 0 | a "Ursa Minor" | 135x24 | 346 | 346 | 100% | 1.08 | 11.99 | 11.99 | 0.53 | ok |
| set | phone | 1 | a "mini-fixture →" | 114x17 | 290 | 290 | 100% | 1.09 | 11.99 | 11.99 | 0.54 | ok |
| set | phone | 2 | a "read it at its own address" | 169x17 | 400 | 400 | 100% | 1.06 | 11.99 | 7.27 | 0.53 | ok |
| set | phone | 3 | input "the address of a published site" | 326x26 | 5659 | 1058 | 19% | 1.49 | 1.65 | 1.00 | 3.97 | COMPOSITE |
| set | phone | 4 | button "read the site" | 100x17 | 262 | 262 | 100% | 1.11 | 11.99 | 11.99 | 0.54 | ok |
| set | phone | 5 | button "their-repo-2026-10-17-9f8e7d62026-10-17 " | 326x176 | 1030 | 1030 | 100% | 1.02 | 11.99 | 11.99 | 0.51 | ok |
| set | phone | 6 | a "a link to this record alone" | 201x14 | 458 | 458 | 100% | 1.06 | 11.99 | 11.99 | 0.52 | ok |
| set | phone | 7 | button "their-repo-2026-10-18-a1b2c3d2026-10-18 " | 326x176 | 1032 | 1032 | 100% | 1.02 | 11.99 | 11.99 | 0.51 | ok |
| set | phone | 8 | a "a link to this record alone" | 201x14 | 458 | 458 | 100% | 1.06 | 11.99 | 11.99 | 0.52 | ok |
| set | phone | 9 | input  | 182x47 (ancestor:label) | 486 | 486 | 100% | 1.05 | 11.99 | 11.99 | 0.52 | ok |
| set | phone | 10 | input "the address of a published record" | 326x26 | 1058 | 1058 | 100% | 1.49 | 11.99 | 10.00 | 0.74 | ok |
| set | tablet | 0 | a "Ursa Minor" | 135x24 | 344 | 344 | 100% | 1.07 | 11.99 | 11.99 | 0.53 | ok |
| set | tablet | 1 | a "mini-fixture →" | 114x17 | 290 | 290 | 100% | 1.09 | 11.99 | 11.99 | 0.54 | ok |
| set | tablet | 2 | a "read it at its own address" | 169x17 | 400 | 400 | 100% | 1.06 | 11.99 | 11.72 | 0.53 | ok |
| set | tablet | 3 | input "the address of a published site" | 569x27 | 6620 | 1789 | 27% | 1.49 | 1.65 | 1.00 | 2.76 | COMPOSITE |
| set | tablet | 4 | button "read the site" | 100x17 | 260 | 260 | 100% | 1.10 | 11.99 | 11.99 | 0.54 | ok |
| set | tablet | 5 | button "their-repo-2026-10-17-9f8e7d62026-10-17 " | 689x106 | 1836 | 1835 | 100% | 1.15 | 11.99 | 2.58 | 0.57 | ok |
| set | tablet | 6 | a "a link to this record alone" | 201x14 | 456 | 456 | 100% | 1.05 | 11.99 | 11.99 | 0.52 | ok |
| set | tablet | 7 | button "their-repo-2026-10-18-a1b2c3d2026-10-18 " | 689x106 | 1836 | 1835 | 100% | 1.15 | 11.99 | 2.58 | 0.57 | ok |
| set | tablet | 8 | a "a link to this record alone" | 201x14 | 456 | 456 | 100% | 1.05 | 11.99 | 11.99 | 0.52 | ok |
| set | tablet | 9 | input  | 182x47 (ancestor:label) | 486 | 486 | 100% | 1.05 | 11.99 | 11.99 | 0.52 | ok |
| set | tablet | 10 | input "the address of a published record" | 401x27 | 1285 | 1285 | 100% | 1.49 | 11.99 | 10.00 | 0.74 | ok |
| set | desktop | 0 | a "Ursa Minor" | 135x24 | 346 | 346 | 100% | 1.08 | 11.99 | 11.99 | 0.53 | ok |
| set | desktop | 1 | a "mini-fixture →" | 114x17 | 290 | 290 | 100% | 1.09 | 11.99 | 11.99 | 0.54 | ok |
| set | desktop | 2 | a "read it at its own address" | 169x17 | 400 | 400 | 100% | 1.06 | 11.99 | 7.27 | 0.53 | ok |
| set | desktop | 3 | input "the address of a published site" | 840x27 | 7708 | 2604 | 34% | 1.50 | 1.65 | 1.00 | 2.21 | COMPOSITE |
| set | desktop | 4 | button "read the site" | 100x17 | 262 | 262 | 100% | 1.11 | 11.99 | 11.99 | 0.54 | ok |
| set | desktop | 5 | button "their-repo-2026-10-17-9f8e7d62026-10-17 " | 960x106 | 2380 | 2379 | 100% | 1.11 | 11.99 | 1.15 | 0.56 | ok |
| set | desktop | 6 | a "a link to this record alone" | 201x14 | 458 | 458 | 100% | 1.06 | 11.99 | 11.99 | 0.52 | ok |
| set | desktop | 7 | button "their-repo-2026-10-18-a1b2c3d2026-10-18 " | 960x106 | 2380 | 2379 | 100% | 1.11 | 11.99 | 1.15 | 0.56 | ok |
| set | desktop | 8 | a "a link to this record alone" | 201x14 | 458 | 458 | 100% | 1.06 | 11.99 | 11.99 | 0.52 | ok |
| set | desktop | 9 | input  | 182x47 (ancestor:label) | 488 | 488 | 100% | 1.06 | 11.99 | 11.99 | 0.52 | ok |
| set | desktop | 10 | input "the address of a published record" | 672x27 | 2100 | 2100 | 100% | 1.50 | 11.99 | 10.00 | 0.75 | ok |

## Headline

0 of 33 tab stops below a floor, 0 controls the keyboard cannot reach, 0 unstable.

By verdict: 30 ok, 3 COMPOSITE.

The 2.4.11 area column is reported and never failed on: median 0.53 of the 2px-perimeter minimum, across 33 stops. The ring's weight is identity and a change to it is the owner's.
