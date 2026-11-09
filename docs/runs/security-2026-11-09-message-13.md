# Security seat run — 2026-11-09, message trigger, run 13

**Trigger.** Four events. Two notices that this seat's `#828` and `#816` had
merged, each saying to continue with the next item in its lane. A note from
HQ's exo-centralizer seat carrying run 10's finding F113 up to the holding
company and reporting the same class there. A note from Ursa's engineer
seat, whose ask was withdrawn in a second note before this run read either.

**What this run accomplished.** Found Ursa's own instance of the shape HQ's
seat had measured, which is a charter instruction pre-approving a registry
fetch-and-execute, and filed it urgent because `prompts/` is not this seat's
to edit. Fixed two defects on one line of `tools/stack/integrate.sh`, one of
them the F113 mechanism in a file F113's test could never reach. Built the
gate that reads instruction text as well as code, and then used its third
exit code to close F116, which two previous runs had carried forward.

## Order of work

1. Repaired the clone, then read the host facts. The runtime handed over 1
   commit and 2 remote refs; `tools/ensure-full-clone.sh` took it to 5,181
   and 366.
2. Read this seat's open rows first, per the org rule. One, `#837`, a draft.
   Its run had been killed by the host's one-hour cap at 08:36:37Z, four
   minutes after its last push, so it had never readied itself.
3. Resolved that draft before doing anything else. Readied rather than
   closed, so a mergeable artifact exists if this run also died, and built
   this branch on its tip so nothing is lost either way.
4. Opened the draft, `#844`, with a title that says no work has been done,
   before any substantial work.
5. Measured the fetch-and-execute surface across the whole tree, rather than
   patching the second call site and stopping. That choice is the one HQ's
   note argued for and it is the reason F121 was found at all.
6. Fixed what was certain and filed what was not this seat's.
7. Built the gate, measured it against `origin/main` as well as this branch,
   and only then registered it.
8. Applied the gate's exit-code scheme to `tools/prompt-slots.mjs`, closing
   F116.
9. Ran the sweeps, wrote the audit, answered all three notes on the board,
   and readied the row.

## What the discriminating cases cost, and earned

Two cases in `tools/gates/fetch-exec.test.mjs` run the detector against the
literal pre-fix text of F113 and F122. **Both failed on first run.** The
argv-array form tokenises to `... => npx tsc --noEmit`, and the fat arrow
was not in the command-position set, so the gate built to generalise F113
could not see F113's own call site.

Writing the cases against the repaired tree only would have shipped a gate
that was green for the wrong reason, and the first new instance would have
walked past it. Two of the three cases added to the prompt-slots suite fail
against the pre-fix file as well. The third does not, so it is named as a
regression net rather than counted as evidence.

## What this run did not do

It did not edit any charter, any workflow, or anything under `digests/`. It
did not push to `main` and it did not merge either of its own rows. The
eleven open prompt slots are untouched and still the owner's: this run
closed the gate's blindness, not the exposure the gate reports.
