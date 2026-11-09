base http://127.0.0.1:4959
viewports phone 390x844
floors: 3:1 on the indicator, 60% of its pixels

## Reach: what the DOM offers against what Tab finds

| page | viewport | focusable in DOM | tab stops | unreachable | sec |
|---|---|---|---|---|---|
| home | phone | 5 | 6 | 1 | 18.7 |
| set | phone | 6 | 6 | 0 | 11.5 |
| record | phone | 10 | 10 | 0 | 15.7 |
| address | phone | 4 | 4 | 0 | 6.3 |
| 404 | phone | 2 | 2 | 0 | 9.4 |

Unreachable, one line each:

- home/phone button.cta.rec-hit@49,3257 57x29 offscreen "copy"

## The indicator, photographed at every stop

| page | viewport | stop | control | box | indicator px | clearing px | share >=3:1 | ring 1px | median | min | area/2.4.11 | verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| home | phone | 0 | pre "git clone https://github.com/alexandrapa" | 292x41.4375 | - | - | - | - | - | - | - | UNDECLARED |
| home | phone | 1 | button "copy" | 57x29 | 200 | 200 | 100% | 1.14 | 11.25 | 7.65 | 0.56 | ok |
| home | phone | 2 | pre "npx tsx src/bin/ursa.ts run ~/code/your-" | 292x20.71875 | - | - | - | - | - | - | - | UNDECLARED |
| home | phone | 3 | button "copy" | 57x29 | 200 | 200 | 100% | 1.14 | 11.25 | 7.65 | 0.56 | ok |
| home | phone | 4 | a "the record viewer" | 116x17 | 294 | 294 | 100% | 1.09 | 11.26 | 11.24 | 0.54 | ok |
| home | phone | 5 | a "a published record" | 278x43 | 364 | 364 | 100% | 0.56 | 11.26 | 7.80 | 0.28 | ok |
| set | phone | 0 | a "Ursa Minor" | 135x24 | 346 | 346 | 100% | 1.08 | 11.99 | 11.99 | 0.53 | ok |
| set | phone | 1 | a "mini-fixture →" | 114x17 | 290 | 290 | 100% | 1.09 | 11.99 | 11.99 | 0.54 | ok |
| set | phone | 2 | a "read it at its own address" | 169x17 | 400 | 400 | 100% | 1.06 | 11.99 | 7.27 | 0.53 | ok |
| set | phone | 3 | input "the address of a published site" | 326x26 | 1058 | 1058 | 100% | 1.49 | 11.99 | 10.00 | 0.74 | ok |
| set | phone | 4 | input  | 1x1 | 0 | - | - | - | - | - | - | NO_INDICATOR |
| set | phone | 5 | input "the address of a published record" | 326x26 | 1058 | 1058 | 100% | 1.49 | 11.99 | 10.00 | 0.74 | ok |
| record | phone | 0 | a "Ursa Minor" | 135x24 | 346 | 346 | 100% | 1.08 | 11.99 | 11.99 | 0.53 | ok |
| record | phone | 1 | span "no generation provenance: # Field Notes " | 189x18 | 442 | 442 | 100% | 1.06 | 11.99 | 11.99 | 0.52 | ok |
| record | phone | 2 | span "survived verbatim: The resolver joins fi" | 287x41 | 684 | 684 | 100% | 1.04 | 11.99 | 11.99 | 0.52 | ok |
| record | phone | 3 | span "survived mutated: Provenance is establis" | 287x64 | 732 | 732 | 100% | 1.04 | 11.99 | 11.99 | 0.52 | ok |
| record | phone | 4 | span "no generation provenance: I wrote this c" | 266x64 | 688 | 688 | 100% | 1.04 | 11.99 | 11.99 | 0.51 | ok |
| record | phone | 5 | span "survived verbatim: Outcome records give " | 273x64 | 702 | 702 | 100% | 1.04 | 11.99 | 11.99 | 0.51 | ok |
| record | phone | 6 | button "01-claude · turn 1 · claude-opus-563.2% " | 326x39 | 756 | 756 | 100% | 1.03 | 11.99 | 11.99 | 0.51 | ok |
| record | phone | 7 | button "02-chatgpt · turn 1 · gpt-5100.0% surviv" | 326x39 | 758 | 758 | 100% | 1.03 | 11.99 | 11.99 | 0.51 | ok |
| record | phone | 8 | a "/records/mini-fixture.json" | 208x18 | 480 | 480 | 100% | 1.05 | 11.99 | 11.91 | 0.52 | ok |
| record | phone | 9 | a "a record of your own" | 138x17 | 338 | 338 | 100% | 1.07 | 11.99 | 11.99 | 0.53 | ok |
| address | phone | 0 | a "Ursa Minor" | 135x24 | 346 | 346 | 100% | 1.08 | 11.99 | 11.99 | 0.53 | ok |
| address | phone | 1 | input "a record address" | 326x26 | 1058 | 1058 | 100% | 1.49 | 11.99 | 10.00 | 0.74 | ok |
| address | phone | 2 | a "read the whole set instead" | 277x37 | 426 | 426 | 100% | 0.67 | 11.99 | 11.99 | 0.33 | ok |
| address | phone | 3 | a "Opening the same record through its site" | 274x17 | 610 | 610 | 100% | 1.04 | 11.99 | 11.99 | 0.52 | ok |
| 404 | phone | 0 | a "Ursa Minor" | 135x24 | 346 | 346 | 100% | 1.08 | 11.33 | 9.41 | 0.53 | ok |
| 404 | phone | 1 | a "Back to Ursa Minor" | 230x47 | 11319 | 582 | 5% | 1.04 | 1.12 | 1.00 | 10.07 | COMPOSITE |

## Headline

1 of 28 tab stops below a floor, 1 controls the keyboard cannot reach, 0 unstable.

By verdict: 24 ok, 2 UNDECLARED, 1 NO_INDICATOR, 1 COMPOSITE.

The 2.4.11 area column is reported and never failed on: median 0.53 of the 2px-perimeter minimum, across 25 stops. The ring's weight is identity and a change to it is the owner's.
