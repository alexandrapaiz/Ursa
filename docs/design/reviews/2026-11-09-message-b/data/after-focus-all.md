base http://127.0.0.1:4982
viewports phone 390x844, tablet 820x1180, desktop 1440x900
floors: 3:1 on the indicator, 60% of its pixels

## Reach: what the DOM offers against what Tab finds

| page | viewport | focusable in DOM | tab stops | unreachable | sec |
|---|---|---|---|---|---|
| home | phone | 8 | 8 | 0 | 17.4 |
| set | phone | 6 | 6 | 0 | 5.2 |
| record | phone | 10 | 10 | 0 | 6.9 |
| address | phone | 4 | 4 | 0 | 4.5 |
| 404 | phone | 2 | 2 | 0 | 6.6 |
| home | tablet | 6 | 6 | 0 | 28.7 |
| set | tablet | 6 | 6 | 0 | 6.2 |
| record | tablet | 10 | 10 | 0 | 8.9 |
| address | tablet | 4 | 4 | 0 | 5.4 |
| 404 | tablet | 2 | 2 | 0 | 10.0 |
| home | desktop | 6 | 6 | 0 | 36.8 |
| set | desktop | 6 | 6 | 0 | 6.2 |
| record | desktop | 10 | 10 | 0 | 7.5 |
| address | desktop | 4 | 4 | 0 | 4.4 |
| 404 | desktop | 2 | 2 | 0 | 10.4 |

## The indicator, photographed at every stop

| page | viewport | stop | control | box | indicator px | clearing px | share >=3:1 | ring 1px | median | min | area/2.4.11 | verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| home | phone | 0 | pre "command, scrolls sideways" | 292x41 | 694 | 694 | 100% | 1.03 | 11.25 | 9.84 | 0.51 | ok |
| home | phone | 1 | button "copy" | 57x29 | 200 | 200 | 100% | 1.14 | 11.25 | 7.65 | 0.56 | ok |
| home | phone | 2 | pre "command, scrolls sideways" | 292x21 | 654 | 654 | 100% | 1.04 | 11.26 | 8.30 | 0.52 | ok |
| home | phone | 3 | button "copy" | 57x29 | 200 | 200 | 100% | 1.14 | 11.25 | 7.65 | 0.56 | ok |
| home | phone | 4 | a "the record viewer" | 116x17 | 294 | 294 | 100% | 1.09 | 11.26 | 11.24 | 0.54 | ok |
| home | phone | 5 | a "a published record" | 278x43 | 364 | 364 | 100% | 0.56 | 11.26 | 7.80 | 0.28 | ok |
| home | phone | 6 | pre "command, scrolls sideways" | 292x41 | 694 | 694 | 100% | 1.03 | 11.25 | 9.84 | 0.51 | ok |
| home | phone | 7 | button "copy" | 57x29 | 200 | 200 | 100% | 1.14 | 11.25 | 7.65 | 0.56 | ok |
| set | phone | 0 | a "Ursa Minor" | 135x24 | 346 | 346 | 100% | 1.08 | 11.99 | 11.99 | 0.53 | ok |
| set | phone | 1 | a "mini-fixture →" | 114x17 | 290 | 290 | 100% | 1.09 | 11.99 | 11.99 | 0.54 | ok |
| set | phone | 2 | a "read it at its own address" | 169x17 | 400 | 400 | 100% | 1.06 | 11.99 | 7.27 | 0.53 | ok |
| set | phone | 3 | input "the address of a published site" | 326x26 | 1058 | 1058 | 100% | 1.49 | 11.99 | 10.00 | 0.74 | ok |
| set | phone | 4 | input  | 182x47 (ancestor:label) | 488 | 488 | 100% | 1.06 | 11.99 | 11.99 | 0.52 | ok |
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
| home | tablet | 0 | button "copy" | 57x29 | 200 | 200 | 100% | 1.14 | 11.27 | 10.94 | 0.56 | ok |
| home | tablet | 1 | button "copy" | 57x29 | 200 | 200 | 100% | 1.14 | 11.27 | 10.94 | 0.56 | ok |
| home | tablet | 2 | a "the record viewer" | 541x43 | 346 | 346 | 100% | 0.30 | 11.25 | 8.51 | 0.15 | ok |
| home | tablet | 3 | a "a published record" | 556x43 | 366 | 366 | 100% | 0.30 | 11.26 | 9.43 | 0.15 | ok |
| home | tablet | 4 | pre "command, scrolls sideways" | 574x44 | 1262 | 1262 | 100% | 1.02 | 11.33 | 5.21 | 0.51 | ok |
| home | tablet | 5 | button "copy" | 57x29 | 200 | 200 | 100% | 1.14 | 11.33 | 11.33 | 0.56 | ok |
| set | tablet | 0 | a "Ursa Minor" | 135x24 | 344 | 344 | 100% | 1.07 | 11.99 | 11.99 | 0.53 | ok |
| set | tablet | 1 | a "mini-fixture →" | 114x17 | 290 | 290 | 100% | 1.09 | 11.99 | 11.99 | 0.54 | ok |
| set | tablet | 2 | a "read it at its own address" | 169x17 | 400 | 400 | 100% | 1.06 | 11.99 | 11.72 | 0.53 | ok |
| set | tablet | 3 | input "the address of a published site" | 569x27 | 1789 | 1789 | 100% | 1.49 | 11.99 | 10.00 | 0.75 | ok |
| set | tablet | 4 | input  | 182x47 (ancestor:label) | 486 | 486 | 100% | 1.05 | 11.99 | 11.99 | 0.52 | ok |
| set | tablet | 5 | input "the address of a published record" | 401x27 | 1285 | 1285 | 100% | 1.49 | 11.99 | 10.00 | 0.74 | ok |
| record | tablet | 0 | a "Ursa Minor" | 135x24 | 344 | 344 | 100% | 1.07 | 11.99 | 11.99 | 0.53 | ok |
| record | tablet | 1 | span "no generation provenance: # Field Notes " | 216x19 | 498 | 498 | 100% | 1.05 | 11.99 | 11.99 | 0.52 | ok |
| record | tablet | 2 | span "survived verbatim: The resolver joins fi" | 560x19 | 1186 | 1186 | 100% | 1.02 | 11.99 | 11.99 | 0.51 | ok |
| record | tablet | 3 | span "survived mutated: Provenance is establis" | 592x19 | 1250 | 1250 | 100% | 1.02 | 11.99 | 11.99 | 0.51 | ok |
| record | tablet | 4 | span "no generation provenance: I wrote this c" | 624x43 | 1364 | 1364 | 100% | 1.02 | 11.99 | 11.99 | 0.51 | ok |
| record | tablet | 5 | span "survived verbatim: Outcome records give " | 456x19 | 978 | 978 | 100% | 1.03 | 11.99 | 11.99 | 0.51 | ok |
| record | tablet | 6 | button "01-claude · turn 1 · claude-opus-563.2% " | 689x17 | 1438 | 1438 | 100% | 1.02 | 11.99 | 11.99 | 0.51 | ok |
| record | tablet | 7 | button "02-chatgpt · turn 1 · gpt-5100.0% surviv" | 689x17 | 1438 | 1438 | 100% | 1.02 | 11.99 | 11.99 | 0.51 | ok |
| record | tablet | 8 | a "/records/mini-fixture.json" | 208x18 | 480 | 480 | 100% | 1.05 | 11.99 | 10.29 | 0.52 | ok |
| record | tablet | 9 | a "a record of your own" | 138x17 | 340 | 340 | 100% | 1.08 | 11.99 | 11.99 | 0.53 | ok |
| address | tablet | 0 | a "Ursa Minor" | 135x24 | 344 | 344 | 100% | 1.07 | 11.99 | 11.99 | 0.53 | ok |
| address | tablet | 1 | input "a record address" | 554x27 | 1741 | 1741 | 100% | 1.49 | 11.99 | 10.00 | 0.74 | ok |
| address | tablet | 2 | a "read the whole set instead" | 566x37 | 426 | 426 | 100% | 0.35 | 11.99 | 11.99 | 0.18 | ok |
| address | tablet | 3 | a "Opening the same record through its site" | 274x17 | 612 | 612 | 100% | 1.04 | 11.99 | 11.99 | 0.52 | ok |
| 404 | tablet | 0 | a "Ursa Minor" | 135x24 | 344 | 344 | 100% | 1.07 | 11.33 | 8.54 | 0.53 | ok |
| 404 | tablet | 1 | a "Back to Ursa Minor" | 230x47 | 11270 | 580 | 5% | 1.04 | 1.12 | 1.00 | 10.03 | COMPOSITE |
| home | desktop | 0 | button "copy" | 57x29 | 200 | 200 | 100% | 1.14 | 11.25 | 9.50 | 0.56 | ok |
| home | desktop | 1 | button "copy" | 57x29 | 200 | 200 | 100% | 1.14 | 11.25 | 9.50 | 0.56 | ok |
| home | desktop | 2 | a "the record viewer" | 541x43 | 346 | 346 | 100% | 0.30 | 11.18 | 8.87 | 0.15 | ok |
| home | desktop | 3 | a "a published record" | 556x43 | 364 | 364 | 100% | 0.30 | 11.18 | 9.96 | 0.15 | ok |
| home | desktop | 4 | pre "command, scrolls sideways" | 493x44 | 1102 | 1102 | 100% | 1.02 | 11.25 | 8.29 | 0.51 | ok |
| home | desktop | 5 | button "copy" | 57x29 | 200 | 200 | 100% | 1.14 | 11.25 | 9.50 | 0.56 | ok |
| set | desktop | 0 | a "Ursa Minor" | 135x24 | 346 | 346 | 100% | 1.08 | 11.99 | 11.99 | 0.53 | ok |
| set | desktop | 1 | a "mini-fixture →" | 114x17 | 290 | 290 | 100% | 1.09 | 11.99 | 11.99 | 0.54 | ok |
| set | desktop | 2 | a "read it at its own address" | 169x17 | 400 | 400 | 100% | 1.06 | 11.99 | 7.27 | 0.53 | ok |
| set | desktop | 3 | input "the address of a published site" | 840x27 | 2604 | 2604 | 100% | 1.50 | 11.99 | 10.00 | 0.75 | ok |
| set | desktop | 4 | input  | 182x47 (ancestor:label) | 488 | 488 | 100% | 1.06 | 11.99 | 11.99 | 0.52 | ok |
| set | desktop | 5 | input "the address of a published record" | 672x27 | 2100 | 2100 | 100% | 1.50 | 11.99 | 10.00 | 0.75 | ok |
| record | desktop | 0 | a "Ursa Minor" | 135x24 | 346 | 346 | 100% | 1.08 | 11.99 | 11.99 | 0.53 | ok |
| record | desktop | 1 | span "no generation provenance: # Field Notes " | 216x19 | 498 | 498 | 100% | 1.05 | 11.99 | 11.99 | 0.52 | ok |
| record | desktop | 2 | span "survived verbatim: The resolver joins fi" | 504x43 | 1124 | 1124 | 100% | 1.02 | 11.99 | 11.99 | 0.51 | ok |
| record | desktop | 3 | span "survived mutated: Provenance is establis" | 520x43 | 1154 | 1154 | 100% | 1.02 | 11.99 | 11.99 | 0.51 | ok |
| record | desktop | 4 | span "no generation provenance: I wrote this c" | 504x43 | 1122 | 1122 | 100% | 1.02 | 11.99 | 11.99 | 0.51 | ok |
| record | desktop | 5 | span "survived verbatim: Outcome records give " | 512x43 | 1044 | 1044 | 100% | 0.94 | 11.99 | 11.99 | 0.47 | ok |
| record | desktop | 6 | button "01-claude · turn 1 · claude-opus-563.2% " | 960x17 | 1984 | 1984 | 100% | 1.01 | 11.99 | 11.99 | 0.51 | ok |
| record | desktop | 7 | button "02-chatgpt · turn 1 · gpt-5100.0% surviv" | 960x17 | 1982 | 1982 | 100% | 1.01 | 11.99 | 11.99 | 0.50 | ok |
| record | desktop | 8 | a "/records/mini-fixture.json" | 208x18 | 480 | 480 | 100% | 1.05 | 11.99 | 11.91 | 0.52 | ok |
| record | desktop | 9 | a "a record of your own" | 138x17 | 338 | 338 | 100% | 1.07 | 11.99 | 11.99 | 0.53 | ok |
| address | desktop | 0 | a "Ursa Minor" | 135x24 | 346 | 346 | 100% | 1.08 | 11.99 | 11.99 | 0.53 | ok |
| address | desktop | 1 | input "a record address" | 825x27 | 2557 | 2557 | 100% | 1.50 | 11.99 | 10.00 | 0.75 | ok |
| address | desktop | 2 | a "read the whole set instead" | 566x37 | 426 | 426 | 100% | 0.35 | 11.99 | 11.90 | 0.18 | ok |
| address | desktop | 3 | a "Opening the same record through its site" | 274x17 | 610 | 610 | 100% | 1.04 | 11.99 | 11.99 | 0.52 | ok |
| 404 | desktop | 0 | a "Ursa Minor" | 135x24 | 346 | 346 | 100% | 1.08 | 11.26 | 9.96 | 0.53 | ok |
| 404 | desktop | 1 | a "Back to Ursa Minor" | 230x47 | 11319 | 582 | 5% | 1.04 | 1.12 | 1.00 | 10.07 | COMPOSITE |

## Headline

0 of 86 tab stops below a floor, 0 controls the keyboard cannot reach, 0 unstable.

By verdict: 83 ok, 3 COMPOSITE.

The 2.4.11 area column is reported and never failed on: median 0.53 of the 2px-perimeter minimum, across 86 stops. The ring's weight is identity and a change to it is the owner's.
