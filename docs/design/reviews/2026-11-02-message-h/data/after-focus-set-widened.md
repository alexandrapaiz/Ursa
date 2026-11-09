base http://127.0.0.1:4959
viewports phone 390x844, tablet 820x1180, desktop 1440x900
floors: 3:1 on the indicator, 60% of its pixels

## Reach: what the DOM offers against what Tab finds

| page | viewport | focusable in DOM | tab stops | unreachable | sec |
|---|---|---|---|---|---|
| set | phone | 6 | 6 | 0 | 6.4 |
| set | tablet | 6 | 6 | 0 | 7.1 |
| set | desktop | 6 | 6 | 0 | 6.4 |

## The indicator, photographed at every stop

| page | viewport | stop | control | box | indicator px | clearing px | share >=3:1 | ring 1px | median | min | area/2.4.11 | verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| set | phone | 0 | a "Ursa Minor" | 135x24 | 346 | 346 | 100% | 1.08 | 11.99 | 11.99 | 0.53 | ok |
| set | phone | 1 | a "mini-fixture →" | 114x17 | 290 | 290 | 100% | 1.09 | 11.99 | 11.99 | 0.54 | ok |
| set | phone | 2 | a "read it at its own address" | 169x17 | 400 | 400 | 100% | 1.06 | 11.99 | 7.27 | 0.53 | ok |
| set | phone | 3 | input "the address of a published site" | 326x26 | 1058 | 1058 | 100% | 1.49 | 11.99 | 10.00 | 0.74 | ok |
| set | phone | 4 | input  | 182x47 (ancestor:label) | 488 | 488 | 100% | 1.06 | 11.99 | 11.99 | 0.52 | ok |
| set | phone | 5 | input "the address of a published record" | 326x26 | 1058 | 1058 | 100% | 1.49 | 11.99 | 10.00 | 0.74 | ok |
| set | tablet | 0 | a "Ursa Minor" | 135x24 | 344 | 344 | 100% | 1.07 | 11.99 | 11.99 | 0.53 | ok |
| set | tablet | 1 | a "mini-fixture →" | 114x17 | 290 | 290 | 100% | 1.09 | 11.99 | 11.99 | 0.54 | ok |
| set | tablet | 2 | a "read it at its own address" | 169x17 | 400 | 400 | 100% | 1.06 | 11.99 | 11.72 | 0.53 | ok |
| set | tablet | 3 | input "the address of a published site" | 569x27 | 1789 | 1789 | 100% | 1.49 | 11.99 | 10.00 | 0.75 | ok |
| set | tablet | 4 | input  | 182x47 (ancestor:label) | 486 | 486 | 100% | 1.05 | 11.99 | 11.99 | 0.52 | ok |
| set | tablet | 5 | input "the address of a published record" | 401x27 | 1285 | 1285 | 100% | 1.49 | 11.99 | 10.00 | 0.74 | ok |
| set | desktop | 0 | a "Ursa Minor" | 135x24 | 346 | 346 | 100% | 1.08 | 11.99 | 11.99 | 0.53 | ok |
| set | desktop | 1 | a "mini-fixture →" | 114x17 | 290 | 290 | 100% | 1.09 | 11.99 | 11.99 | 0.54 | ok |
| set | desktop | 2 | a "read it at its own address" | 169x17 | 400 | 400 | 100% | 1.06 | 11.99 | 7.27 | 0.53 | ok |
| set | desktop | 3 | input "the address of a published site" | 840x27 | 2604 | 2604 | 100% | 1.50 | 11.99 | 10.00 | 0.75 | ok |
| set | desktop | 4 | input  | 182x47 (ancestor:label) | 488 | 488 | 100% | 1.06 | 11.99 | 11.99 | 0.52 | ok |
| set | desktop | 5 | input "the address of a published record" | 672x27 | 2100 | 2100 | 100% | 1.50 | 11.99 | 10.00 | 0.75 | ok |

## Headline

0 of 18 tab stops below a floor, 0 controls the keyboard cannot reach, 0 unstable.

By verdict: 18 ok.

The 2.4.11 area column is reported and never failed on: median 0.54 of the 2px-perimeter minimum, across 18 stops. The ring's weight is identity and a change to it is the owner's.
