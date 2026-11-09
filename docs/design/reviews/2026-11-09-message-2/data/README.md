# What is in here

Writers and outputs for the install-guard repair of 2026-11-09 (run 2).
Every install below was preceded by `check-installs.sh` returning
`installs_live=0`, one at a time, because the first of the two guards the
exo seat handed back is not to run concurrent installs in one sandbox.

| file | what it is |
|---|---|
| `cache-legibility.txt` | The measurement. Where a live install's cache can be read from and for how long, and how long the shipped anchor was blind at the start of one. |
| `capture-fields.mjs` | Writer for the argv shapes: spawns one install, polls `/proc/<pid>/cmdline` at 5 ms, prints the first and the post-retitle field lists. |
| `capture-environ.mjs` | Writer for the legibility table: the same, for `--cache` versus `NPM_CONFIG_CACHE`, reading argv and environ at 12 ms and at 3 s. |
| `probe-argv0.mjs` | Writer for the blind window: polls /proc every 40 ms through a whole install and applies the SHIPPED predicate, transcribed, so the number is about what ships. |
| `argv0-window.txt` | Its output. The install is pid 441299; the rest of the rows are the false-positive class the anchor exists to exclude, left in deliberately. |
| `endtoend.sh` | Both tools polled alternately through one real install, with the `--cache` flag. |
| `endtoend-flag.txt` | Its output, and it DOES NOT DISCRIMINATE. Reported rather than dropped: a scan costs 0.3 to 3 s and the window is 358 ms, so the end-to-end structurally cannot reach it. |
| `endtoend-env.sh` | The same with `NPM_CONFIG_CACHE` instead of the flag. |
| `endtoend-env.txt` | Its output, and this one does discriminate: three paired readings, old `cache=UNREADABLE` every time, new naming the path and adding `same-cache`. |
