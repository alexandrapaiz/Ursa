base http://localhost:3310
viewports phone 390x844, tablet 820x1180, desktop 1440x900
state docs/design/reviews/2026-11-09-message-ab/data/state-at-could-not-read.mjs
floors: 3:1 on the indicator, 60% of its pixels

## Reach: what the DOM offers against what Tab finds

| page | viewport | focusable in DOM | tab stops | unreachable | sec |
|---|---|---|---|---|---|
| at | phone | 4 | 4 | 0 | 11.1 |
| at | tablet | 4 | 4 | 0 | 9.4 |
| at | desktop | 4 | 4 | 0 | 8.4 |

## The indicator, photographed at every stop

| page | viewport | stop | control | box | indicator px | clearing px | share >=3:1 | ring 1px | median | min | area/2.4.11 | verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| at | phone | 0 | a "Ursa Minor" | 135x24 | 346 | 346 | 100% | 1.08 | 11.99 | 11.99 | 0.53 | ok |
| at | phone | 1 | input "a record address" | 326x26 | 6561 | 1058 | 16% | 1.49 | 1.65 | 1.00 | 4.60 | COMPOSITE |
| at | phone | 2 | button "read the record" | 115x17 | 292 | 292 | 100% | 1.09 | 11.99 | 11.99 | 0.54 | ok |
| at | phone | 3 | a "Opening the same record through its site" | 274x17 | 610 | 610 | 100% | 1.04 | 11.99 | 11.99 | 0.52 | ok |
| at | tablet | 0 | a "Ursa Minor" | 135x24 | 344 | 344 | 100% | 1.07 | 11.99 | 11.99 | 0.53 | ok |
| at | tablet | 1 | input "a record address" | 554x27 | 8689 | 1741 | 20% | 1.49 | 1.65 | 1.00 | 3.71 | COMPOSITE |
| at | tablet | 2 | button "read the record" | 115x17 | 290 | 290 | 100% | 1.08 | 11.99 | 11.99 | 0.53 | ok |
| at | tablet | 3 | a "Opening the same record through its site" | 274x17 | 612 | 612 | 100% | 1.04 | 11.99 | 11.99 | 0.52 | ok |
| at | desktop | 0 | a "Ursa Minor" | 135x24 | 346 | 346 | 100% | 1.08 | 11.99 | 11.99 | 0.53 | ok |
| at | desktop | 1 | input "a record address" | 825x27 | 9505 | 2557 | 27% | 1.50 | 1.65 | 1.00 | 2.78 | COMPOSITE |
| at | desktop | 2 | button "read the record" | 115x17 | 292 | 292 | 100% | 1.09 | 11.99 | 11.99 | 0.54 | ok |
| at | desktop | 3 | a "Opening the same record through its site" | 274x17 | 610 | 610 | 100% | 1.04 | 11.99 | 11.99 | 0.52 | ok |

## Headline

0 of 12 tab stops below a floor, 0 controls the keyboard cannot reach, 0 unstable.

By verdict: 9 ok, 3 COMPOSITE.

The 2.4.11 area column is reported and never failed on: median 0.53 of the 2px-perimeter minimum, across 12 stops. The ring's weight is identity and a change to it is the owner's.

every one of the 3 page loads this run measured was reached: /record/at 200, /record/at 200, /record/at 200.
