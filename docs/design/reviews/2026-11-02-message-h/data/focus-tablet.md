base http://127.0.0.1:4959
viewports tablet 820x1180
floors: 3:1 on the indicator, 60% of its pixels

## Reach: what the DOM offers against what Tab finds

| page | viewport | focusable in DOM | tab stops | unreachable | sec |
|---|---|---|---|---|---|
| home | tablet | 5 | 6 | 0 | 24.5 |
| set | tablet | 6 | 6 | 0 | 7.2 |
| record | tablet | 10 | 10 | 0 | 7.2 |
| address | tablet | 4 | 4 | 0 | 4.7 |
| 404 | tablet | 2 | 2 | 0 | 11.2 |

## The indicator, photographed at every stop

| page | viewport | stop | control | box | indicator px | share >=3:1 | median | min | area/2.4.11 | verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| home | tablet | 0 | button "copy" | 57x29 | 200 | 100% | 11.27 | 10.94 | 0.56 | ok |
| home | tablet | 1 | button "copy" | 57x29 | 200 | 100% | 11.27 | 10.94 | 0.56 | ok |
| home | tablet | 2 | a "the record viewer" | 541x43 | 346 | 100% | 11.25 | 8.51 | 0.15 | ok |
| home | tablet | 3 | a "a published record" | 556x43 | 366 | 100% | 11.26 | 9.43 | 0.15 | ok |
| home | tablet | 5 | button "copy" | 57x29 | 200 | 100% | 11.33 | 11.33 | 0.56 | ok |
| set | tablet | 0 | a "Ursa Minor" | 135x24 | 344 | 100% | 11.99 | 11.99 | 0.53 | ok |
| set | tablet | 1 | a "mini-fixture →" | 114x17 | 655 | 49% | 2.87 | 1.00 | 1.21 | BELOW_FLOOR |
| set | tablet | 2 | a "read it at its own address" | 169x17 | 400 | 100% | 11.99 | 11.72 | 0.53 | ok |
| set | tablet | 3 | input "the address of a published site" | 569x27 | 1789 | 100% | 11.99 | 10.00 | 0.75 | ok |
| set | tablet | 4 | input  | 1x1 | 0 | - | - | - | - | NO_INDICATOR |
| set | tablet | 5 | input "the address of a published record" | 401x27 | 1285 | 100% | 11.99 | 10.00 | 0.74 | ok |
| record | tablet | 0 | a "Ursa Minor" | 135x24 | 0 | - | - | - | - | NO_INDICATOR |
| record | tablet | 1 | span "no generation provenance: # Field Notes " | 216x19 | 198 | - | - | - | - | UNSTABLE |
| record | tablet | 2 | span "survived verbatim: The resolver joins fi" | 560x19 | 1186 | 100% | 11.99 | 11.99 | 0.51 | ok |
| record | tablet | 3 | span "survived mutated: Provenance is establis" | 592x19 | 1250 | 100% | 11.99 | 11.99 | 0.51 | ok |
| record | tablet | 4 | span "no generation provenance: I wrote this c" | 624x43 | 1364 | 100% | 11.99 | 11.99 | 0.51 | ok |
| record | tablet | 5 | span "survived verbatim: Outcome records give " | 456x19 | 978 | 100% | 11.99 | 11.99 | 0.51 | ok |
| record | tablet | 6 | button "01-claude · turn 1 · claude-opus-563.2% " | 689x17 | 1438 | 100% | 11.99 | 11.99 | 0.51 | ok |
| record | tablet | 7 | button "02-chatgpt · turn 1 · gpt-5100.0% surviv" | 689x17 | 1438 | 100% | 11.99 | 11.99 | 0.51 | ok |
| record | tablet | 8 | a "/records/mini-fixture.json" | 208x18 | 480 | 100% | 11.99 | 10.29 | 0.52 | ok |
| record | tablet | 9 | a "a record of your own" | 138x17 | 340 | 100% | 11.99 | 11.99 | 0.53 | ok |
| address | tablet | 0 | a "Ursa Minor" | 135x24 | 344 | 100% | 11.99 | 11.99 | 0.53 | ok |
| address | tablet | 1 | input "a record address" | 554x27 | 1741 | 100% | 11.99 | 10.00 | 0.74 | ok |
| address | tablet | 2 | a "read the whole set instead" | 566x37 | 426 | 100% | 11.99 | 11.99 | 0.18 | ok |
| address | tablet | 3 | a "Opening the same record through its site" | 274x17 | 612 | 100% | 11.99 | 11.99 | 0.52 | ok |
| 404 | tablet | 0 | a "Ursa Minor" | 135x24 | 344 | 100% | 11.33 | 8.54 | 0.53 | ok |
| 404 | tablet | 1 | a "Back to Ursa Minor" | 230x47 | 11270 | 5% | 1.12 | 1.00 | 10.03 | BELOW_FLOOR |

## Headline

4 of 27 tab stops below a floor, 0 controls the keyboard cannot reach, 1 unstable.

The 2.4.11 area column is reported and never failed on: median 0.53 of the 2px-perimeter minimum, across 24 stops. The ring's weight is identity and a change to it is the owner's.
