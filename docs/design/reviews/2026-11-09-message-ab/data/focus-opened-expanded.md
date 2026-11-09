base http://localhost:3310
viewports phone 390x844, tablet 820x1180, desktop 1440x900
state docs/design/reviews/2026-11-09-message-ab/data/state-at-opened-expanded.mjs
floors: 3:1 on the indicator, 60% of its pixels

## Reach: what the DOM offers against what Tab finds

| page | viewport | focusable in DOM | tab stops | unreachable | sec |
|---|---|---|---|---|---|
| at | phone | 13 | 13 | 0 | 22.6 |
| at | tablet | 13 | 13 | 0 | 19.0 |
| at | desktop | 13 | 13 | 0 | 20.3 |

## The indicator, photographed at every stop

| page | viewport | stop | control | box | indicator px | clearing px | share >=3:1 | ring 1px | median | min | area/2.4.11 | verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| at | phone | 0 | a "Ursa Minor" | 135x24 | 346 | 346 | 100% | 1.08 | 11.99 | 11.99 | 0.53 | ok |
| at | phone | 1 | input "a record address" | 326x26 | 6561 | 1058 | 16% | 1.49 | 1.65 | 1.00 | 4.60 | COMPOSITE |
| at | phone | 2 | button "read the record" | 115x17 | 292 | 292 | 100% | 1.09 | 11.99 | 11.99 | 0.54 | ok |
| at | phone | 3 | a "the bytes themselves" | 149x14 | 354 | 354 | 100% | 1.08 | 11.99 | 11.99 | 0.53 | ok |
| at | phone | 4 | a "the site’s own page for it" | 312x35 | 484 | 484 | 100% | 0.69 | 11.99 | 11.99 | 0.34 | ok |
| at | phone | 5 | span "no generation provenance: # Field Notes " | 189x18 | 442 | 442 | 100% | 1.06 | 11.99 | 11.99 | 0.52 | ok |
| at | phone | 6 | span "survived verbatim: The resolver joins fi" | 287x41 | 684 | 684 | 100% | 1.04 | 11.99 | 11.99 | 0.52 | ok |
| at | phone | 7 | span "survived mutated: Provenance is establis" | 287x64 | 730 | 730 | 100% | 1.03 | 11.99 | 11.99 | 0.51 | ok |
| at | phone | 8 | span "no generation provenance: I wrote this c" | 266x64 | 688 | 688 | 100% | 1.04 | 11.99 | 11.99 | 0.51 | ok |
| at | phone | 9 | span "survived verbatim: Outcome records give " | 273x64 | 702 | 702 | 100% | 1.04 | 11.99 | 11.99 | 0.51 | ok |
| at | phone | 10 | button "01-claude · turn 1 · claude-opus-563.2% " | 326x39 | 758 | 758 | 100% | 1.03 | 11.99 | 11.99 | 0.51 | ok |
| at | phone | 11 | button "02-chatgpt · turn 1 · gpt-5100.0% surviv" | 326x39 | 756 | 756 | 100% | 1.03 | 11.99 | 11.99 | 0.51 | ok |
| at | phone | 12 | a "Opening the same record through its site" | 274x17 | 610 | 610 | 100% | 1.04 | 11.99 | 11.99 | 0.52 | ok |
| at | tablet | 0 | a "Ursa Minor" | 135x24 | 344 | 344 | 100% | 1.07 | 11.99 | 11.99 | 0.53 | ok |
| at | tablet | 1 | input "a record address" | 554x27 | 8689 | 1741 | 20% | 1.49 | 1.65 | 1.00 | 3.71 | COMPOSITE |
| at | tablet | 2 | button "read the record" | 115x17 | 290 | 290 | 100% | 1.08 | 11.99 | 11.99 | 0.53 | ok |
| at | tablet | 3 | a "the bytes themselves" | 149x14 | 352 | 352 | 100% | 1.07 | 11.99 | 11.99 | 0.53 | ok |
| at | tablet | 4 | a "the site’s own page for it" | 669x35 | 482 | 482 | 100% | 0.34 | 11.99 | 11.99 | 0.17 | ok |
| at | tablet | 5 | span "no generation provenance: # Field Notes " | 216x19 | 498 | 498 | 100% | 1.05 | 11.99 | 11.99 | 0.52 | ok |
| at | tablet | 6 | span "survived verbatim: The resolver joins fi" | 560x19 | 1186 | 1186 | 100% | 1.02 | 11.99 | 11.99 | 0.51 | ok |
| at | tablet | 7 | span "survived mutated: Provenance is establis" | 592x19 | 1250 | 1250 | 100% | 1.02 | 11.99 | 11.99 | 0.51 | ok |
| at | tablet | 8 | span "no generation provenance: I wrote this c" | 624x43 | 1362 | 1362 | 100% | 1.02 | 11.99 | 11.99 | 0.51 | ok |
| at | tablet | 9 | span "survived verbatim: Outcome records give " | 456x19 | 978 | 978 | 100% | 1.03 | 11.99 | 11.99 | 0.51 | ok |
| at | tablet | 10 | button "01-claude · turn 1 · claude-opus-563.2% " | 689x17 | 1438 | 1438 | 100% | 1.02 | 11.99 | 11.99 | 0.51 | ok |
| at | tablet | 11 | button "02-chatgpt · turn 1 · gpt-5100.0% surviv" | 689x17 | 1438 | 1438 | 100% | 1.02 | 11.99 | 11.99 | 0.51 | ok |
| at | tablet | 12 | a "Opening the same record through its site" | 274x17 | 612 | 612 | 100% | 1.04 | 11.99 | 11.99 | 0.52 | ok |
| at | desktop | 0 | a "Ursa Minor" | 135x24 | 346 | 346 | 100% | 1.08 | 11.99 | 11.99 | 0.53 | ok |
| at | desktop | 1 | input "a record address" | 825x27 | 9505 | 2557 | 27% | 1.50 | 1.65 | 1.00 | 2.78 | COMPOSITE |
| at | desktop | 2 | button "read the record" | 115x17 | 292 | 292 | 100% | 1.09 | 11.99 | 11.99 | 0.54 | ok |
| at | desktop | 3 | a "the bytes themselves" | 149x14 | 354 | 354 | 100% | 1.08 | 11.99 | 11.99 | 0.53 | ok |
| at | desktop | 4 | a "the site’s own page for it" | 193x14 | 444 | 444 | 100% | 1.06 | 11.99 | 11.99 | 0.53 | ok |
| at | desktop | 5 | span "no generation provenance: # Field Notes " | 216x19 | 498 | 498 | 100% | 1.05 | 11.99 | 11.99 | 0.52 | ok |
| at | desktop | 6 | span "survived verbatim: The resolver joins fi" | 504x43 | 1124 | 1124 | 100% | 1.02 | 11.99 | 11.99 | 0.51 | ok |
| at | desktop | 7 | span "survived mutated: Provenance is establis" | 520x43 | 1154 | 1154 | 100% | 1.02 | 11.99 | 11.99 | 0.51 | ok |
| at | desktop | 8 | span "no generation provenance: I wrote this c" | 504x43 | 1122 | 1122 | 100% | 1.02 | 11.99 | 11.99 | 0.51 | ok |
| at | desktop | 9 | span "survived verbatim: Outcome records give " | 512x43 | 1044 | 1044 | 100% | 0.94 | 11.99 | 11.99 | 0.47 | ok |
| at | desktop | 10 | button "01-claude · turn 1 · claude-opus-563.2% " | 960x17 | 1982 | 1982 | 100% | 1.01 | 11.99 | 11.99 | 0.50 | ok |
| at | desktop | 11 | button "02-chatgpt · turn 1 · gpt-5100.0% surviv" | 960x17 | 1982 | 1982 | 100% | 1.01 | 11.99 | 11.99 | 0.50 | ok |
| at | desktop | 12 | a "Opening the same record through its site" | 274x17 | 610 | 610 | 100% | 1.04 | 11.99 | 11.99 | 0.52 | ok |

## Headline

0 of 39 tab stops below a floor, 0 controls the keyboard cannot reach, 0 unstable.

By verdict: 36 ok, 3 COMPOSITE.

The 2.4.11 area column is reported and never failed on: median 0.52 of the 2px-perimeter minimum, across 39 stops. The ring's weight is identity and a change to it is the owner's.

every one of the 3 page loads this run measured was reached: /record/at 200, /record/at 200, /record/at 200.
