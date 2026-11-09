base http://127.0.0.1:4982
viewports phone 390x844, tablet 820x1180, desktop 1440x900
state .fe-run-1109b/declare-pre.mjs
floors: 3:1 on the indicator, 60% of its pixels

## Reach: what the DOM offers against what Tab finds

| page | viewport | focusable in DOM | tab stops | unreachable | sec |
|---|---|---|---|---|---|
| home | phone | 8 | 8 | 0 | 21.6 |
| home | tablet | 6 | 6 | 0 | 40.1 |
| home | desktop | 6 | 6 | 0 | 54.9 |

## The indicator, photographed at every stop

| page | viewport | stop | control | box | indicator px | clearing px | share >=3:1 | ring 1px | median | min | area/2.4.11 | verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| home | phone | 0 | pre "git clone https://github.com/alexandrapa" | 292x41 | 0 | - | - | - | - | - | - | NO_INDICATOR |
| home | phone | 1 | button "copy" | 57x29 | 200 | 200 | 100% | 1.14 | 11.25 | 7.65 | 0.56 | ok |
| home | phone | 2 | pre "npx tsx src/bin/ursa.ts run ~/code/your-" | 292x21 | 0 | - | - | - | - | - | - | NO_INDICATOR |
| home | phone | 3 | button "copy" | 57x29 | 200 | 200 | 100% | 1.14 | 11.25 | 7.65 | 0.56 | ok |
| home | phone | 4 | a "the record viewer" | 116x17 | 294 | 294 | 100% | 1.09 | 11.26 | 11.24 | 0.54 | ok |
| home | phone | 5 | a "a published record" | 278x43 | 364 | 364 | 100% | 0.56 | 11.26 | 7.80 | 0.28 | ok |
| home | phone | 6 | pre "mkdir -p .github/workflows curl -fsSL ht" | 292x41 | 0 | - | - | - | - | - | - | NO_INDICATOR |
| home | phone | 7 | button "copy" | 57x29 | 200 | 200 | 100% | 1.14 | 11.25 | 7.65 | 0.56 | ok |
| home | tablet | 0 | button "copy" | 57x29 | 200 | 200 | 100% | 1.14 | 11.27 | 10.94 | 0.56 | ok |
| home | tablet | 1 | button "copy" | 57x29 | 200 | 200 | 100% | 1.14 | 11.27 | 10.94 | 0.56 | ok |
| home | tablet | 2 | a "the record viewer" | 541x43 | 346 | 346 | 100% | 0.30 | 11.25 | 8.51 | 0.15 | ok |
| home | tablet | 3 | a "a published record" | 556x43 | 366 | 366 | 100% | 0.30 | 11.26 | 9.43 | 0.15 | ok |
| home | tablet | 4 | pre "mkdir -p .github/workflows curl -fsSL ht" | 574x44 | 0 | - | - | - | - | - | - | NO_INDICATOR |
| home | tablet | 5 | button "copy" | 57x29 | 200 | 200 | 100% | 1.14 | 11.33 | 11.33 | 0.56 | ok |
| home | desktop | 0 | button "copy" | 57x29 | 200 | 200 | 100% | 1.14 | 11.25 | 9.50 | 0.56 | ok |
| home | desktop | 1 | button "copy" | 57x29 | 200 | 200 | 100% | 1.14 | 11.25 | 9.50 | 0.56 | ok |
| home | desktop | 2 | a "the record viewer" | 541x43 | 346 | 346 | 100% | 0.30 | 11.18 | 8.87 | 0.15 | ok |
| home | desktop | 3 | a "a published record" | 556x43 | 364 | 364 | 100% | 0.30 | 11.18 | 9.96 | 0.15 | ok |
| home | desktop | 4 | pre "mkdir -p .github/workflows curl -fsSL ht" | 493x44 | 0 | - | - | - | - | - | - | NO_INDICATOR |
| home | desktop | 5 | button "copy" | 57x29 | 200 | 200 | 100% | 1.14 | 11.25 | 9.50 | 0.56 | ok |

## Headline

5 of 20 tab stops below a floor, 0 controls the keyboard cannot reach, 0 unstable.

By verdict: 15 ok, 5 NO_INDICATOR.

The 2.4.11 area column is reported and never failed on: median 0.56 of the 2px-perimeter minimum, across 15 stops. The ring's weight is identity and a change to it is the owner's.
