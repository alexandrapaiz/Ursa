base http://127.0.0.1:4959
viewports desktop 1440x900
floors: 3:1 on the indicator, 60% of its pixels

## Reach: what the DOM offers against what Tab finds

| page | viewport | focusable in DOM | tab stops | unreachable | sec |
|---|---|---|---|---|---|
| home | desktop | 5 | 6 | 0 | 50.8 |
| set | desktop | 6 | 6 | 0 | 8.3 |
| record | desktop | 10 | 10 | 0 | 14.5 |
| address | desktop | 4 | 4 | 0 | 5.0 |
| 404 | desktop | 2 | 2 | 0 | 18.8 |

## The indicator, photographed at every stop

| page | viewport | stop | control | box | indicator px | share >=3:1 | median | min | area/2.4.11 | verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| home | desktop | 0 | button "copy" | 57x29 | 200 | 100% | 11.25 | 9.50 | 0.56 | ok |
| home | desktop | 1 | button "copy" | 57x29 | 200 | 100% | 11.25 | 9.50 | 0.56 | ok |
| home | desktop | 2 | a "the record viewer" | 541x43 | 346 | 100% | 11.18 | 8.87 | 0.15 | ok |
| home | desktop | 3 | a "a published record" | 556x43 | 364 | 100% | 11.18 | 9.96 | 0.15 | ok |
| home | desktop | 5 | button "copy" | 57x29 | 200 | 100% | 11.25 | 9.50 | 0.56 | ok |
| set | desktop | 0 | a "Ursa Minor" | 135x24 | 346 | 100% | 11.99 | 11.99 | 0.53 | ok |
| set | desktop | 1 | a "mini-fixture →" | 114x17 | 500 | - | - | - | - | UNSTABLE |
| set | desktop | 2 | a "read it at its own address" | 169x17 | 400 | 100% | 11.99 | 7.27 | 0.53 | ok |
| set | desktop | 3 | input "the address of a published site" | 840x27 | 2604 | 100% | 11.99 | 10.00 | 0.75 | ok |
| set | desktop | 4 | input  | 1x1 | 0 | - | - | - | - | NO_INDICATOR |
| set | desktop | 5 | input "the address of a published record" | 672x27 | 2100 | 100% | 11.99 | 10.00 | 0.75 | ok |
| record | desktop | 0 | a "Ursa Minor" | 135x24 | 50 | 100% | 11.99 | 11.99 | 0.08 | ok |
| record | desktop | 1 | span "no generation provenance: # Field Notes " | 216x19 | 2171 | 83% | 11.99 | 1.00 | 2.27 | ok |
| record | desktop | 2 | span "survived verbatim: The resolver joins fi" | 504x43 | 1124 | 100% | 11.99 | 11.99 | 0.51 | ok |
| record | desktop | 3 | span "survived mutated: Provenance is establis" | 520x43 | 1154 | 100% | 11.99 | 11.99 | 0.51 | ok |
| record | desktop | 4 | span "no generation provenance: I wrote this c" | 504x43 | 1122 | 100% | 11.99 | 11.99 | 0.51 | ok |
| record | desktop | 5 | span "survived verbatim: Outcome records give " | 512x43 | 1044 | 100% | 11.99 | 11.99 | 0.47 | ok |
| record | desktop | 6 | button "01-claude · turn 1 · claude-opus-563.2% " | 960x17 | 1984 | 100% | 11.99 | 11.99 | 0.51 | ok |
| record | desktop | 7 | button "02-chatgpt · turn 1 · gpt-5100.0% surviv" | 960x17 | 1982 | 100% | 11.99 | 11.99 | 0.50 | ok |
| record | desktop | 8 | a "/records/mini-fixture.json" | 208x18 | 480 | 100% | 11.99 | 11.91 | 0.52 | ok |
| record | desktop | 9 | a "a record of your own" | 138x17 | 338 | 100% | 11.99 | 11.99 | 0.53 | ok |
| address | desktop | 0 | a "Ursa Minor" | 135x24 | 346 | 100% | 11.99 | 11.99 | 0.53 | ok |
| address | desktop | 1 | input "a record address" | 825x27 | 2557 | 100% | 11.99 | 10.00 | 0.75 | ok |
| address | desktop | 2 | a "read the whole set instead" | 566x37 | 4959 | - | - | - | - | UNSTABLE |
| address | desktop | 3 | a "Opening the same record through its site" | 274x17 | 610 | 100% | 11.99 | 11.99 | 0.52 | ok |
| 404 | desktop | 0 | a "Ursa Minor" | 135x24 | 346 | 100% | 11.26 | 9.96 | 0.53 | ok |
| 404 | desktop | 1 | a "Back to Ursa Minor" | 230x47 | 11319 | 5% | 1.12 | 1.00 | 10.07 | BELOW_FLOOR |

## Headline

2 of 27 tab stops below a floor, 0 controls the keyboard cannot reach, 2 unstable.

The 2.4.11 area column is reported and never failed on: median 0.53 of the 2px-perimeter minimum, across 24 stops. The ring's weight is identity and a change to it is the owner's.
