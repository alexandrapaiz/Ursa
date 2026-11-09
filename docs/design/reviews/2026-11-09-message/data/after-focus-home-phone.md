base http://127.0.0.1:4981
viewports phone 390x844
floors: 3:1 on the indicator, 60% of its pixels

## Reach: what the DOM offers against what Tab finds

| page | viewport | focusable in DOM | tab stops | unreachable | sec |
|---|---|---|---|---|---|
| home | phone | 5 | 8 | 0 | 19.4 |

## The indicator, photographed at every stop

| page | viewport | stop | control | box | indicator px | clearing px | share >=3:1 | ring 1px | median | min | area/2.4.11 | verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| home | phone | 0 | pre "git clone https://github.com/alexandrapa" | 292x41.4375 | - | - | - | - | - | - | - | UNDECLARED |
| home | phone | 1 | button "copy" | 57x29 | 200 | 200 | 100% | 1.14 | 11.25 | 7.65 | 0.56 | ok |
| home | phone | 2 | pre "npx tsx src/bin/ursa.ts run ~/code/your-" | 292x20.71875 | - | - | - | - | - | - | - | UNDECLARED |
| home | phone | 3 | button "copy" | 57x29 | 200 | 200 | 100% | 1.14 | 11.25 | 7.65 | 0.56 | ok |
| home | phone | 4 | a "the record viewer" | 116x17 | 294 | 294 | 100% | 1.09 | 11.26 | 11.24 | 0.54 | ok |
| home | phone | 5 | a "a published record" | 278x43 | 364 | 364 | 100% | 0.56 | 11.26 | 7.80 | 0.28 | ok |
| home | phone | 6 | pre "mkdir -p .github/workflows curl -fsSL ht" | 292x41.4375 | - | - | - | - | - | - | - | UNDECLARED |
| home | phone | 7 | button "copy" | 57x29 | 200 | 200 | 100% | 1.14 | 11.25 | 7.65 | 0.56 | ok |

## Headline

0 of 8 tab stops below a floor, 0 controls the keyboard cannot reach, 0 unstable.

By verdict: 5 ok, 3 UNDECLARED.

The 2.4.11 area column is reported and never failed on: median 0.56 of the 2px-perimeter minimum, across 5 stops. The ring's weight is identity and a change to it is the owner's.
