#!/usr/bin/env python3
"""Which spellings of "dump the whole environment" does the vendored guard miss?

    python3 tools/secret-print-dump-holes.py
    python3 tools/secret-print-dump-holes.py --json

WHY THIS FILE ASSERTS THE DEFECT RATHER THAN THE FIX

`tools/check-secret-print.py` is vendored from alexandra-systems and says "do
not edit here", because standards/secrets.md §5 makes the tool and its hook
registration one invariant, re-vendored together. So when this seat finds a
missed detection in it, Ursa may not fix it. The fix belongs in the shared
file, which is the argument this seat made upstream on 2026-11-09 and won.

What that argument did not survive is the landing. HQ's exo-centralizer fixed
the two layout defects this seat reported, in the shared file, with five
tests, and said so on the board. That work sits on a branch whose pull
request was **closed while still a draft** (alexandra-systems#653, head
`exo-centralizer/2026-11-09-message-2` @ 6e1f2432), so HQ main's newest commit
touching the file is still 08ba7f53, the one Ursa vendored from. The fix was
reported, acknowledged, built, and then lost. Nothing in this repository
would ever have said so.

So reporting a hole upstream is necessary and it is not sufficient, and the
missing half is the half that notices. This file is that half. Each row below
is a command and the verdict the vendored checker reaches on it TODAY. The
run fails in both directions:

  a MISSED row that starts being caught   the upstream fix landed, so
                                          re-vendor the checker and delete
                                          the row. This is the good failure.
  a CAUGHT row that starts being missed   a re-vendor lost a detection that
                                          L-X5's four incidents paid for.

The control rows matter as much as the holes. A file that lists only what is
broken cannot tell "upstream fixed it" from "upstream deleted the rule", and
the dump rule is the one rule in that file with four recorded incidents
standing behind it.

THE THREE HOLES, AND THE ROOT CAUSE OF EACH

All three are in one block of `tools/check-secret-print.py`, the X5-ENVDUMP
arm, whose shape is:

    if cmd == "printenv":
        ...only flags `printenv NAME` where NAME is secret-shaped
    elif (words in ([], ["-p"])) and (sep == "|" or ">" in seg):
        ...the bare dump

  H1  A bare `printenv` piped anywhere is missed, because the first branch
      claims every `printenv` and the `elif` can therefore never run for it.
      `printenv` is both a targeted-print verb and a bare-dump verb, and the
      code treats it as only the first. The dump is caught when spelled with
      `env` and missed when spelled with `printenv`, which is the same
      exposure one word to the left.

  H2  A redirect is missed, because `segments()` splits on `;&|` and newline
      and not on `>`, so the operator and its target stay inside the segment
      and become `words`. `words in ([], ["-p"])` is then False and the
      bare-dump test never runs. This one is not a judgement call about
      scope: line 52 of that file documents the rule as "a bare `env` / `set`
      piped or redirected", so the code and its own documentation disagree,
      and the documentation is the side that is right. The redirect is the
      worse half, too, since a dump written into a work tree is one a seat
      can then commit.

  H3  `declare -p` is not in DUMP_VERBS, though `export -p` and `set` both
      are, and `declare -p` with no name prints every variable.

None of the three is fixed on HQ's stranded branch either. That was checked
against that branch's own copy of the file rather than assumed.

ONE FALSE POSITIVE, RECORDED AND DELIBERATELY NOT FIXED

  `env | cut -d= -f1` is denied, and it is value-safe, since `-f1` is the    # L-X5-ALLOW: naming the false positive is this file's subject
  name side of the `=`. It cost this run a turn. It is not a row below,
  because narrowing the rule to admit it is how the rule dies: `-f1,2`
  differs by two characters and prints every value. The guard already passes
  two name-only idioms, `printenv | cut -d= -f1` and `compgen -v`, so the
  gap is in what it tells you to type, not in what it refuses. Reported
  upstream as a documentation gap and not a logic one.
"""
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHECKER = os.path.join(ROOT, "tools", "check-secret-print.py")

MISSED = "missed"
CAUGHT = "caught"

# The commands below are data and are never executed. Each is handed to the
# vendored checker's `--command` mode, which parses a string and runs nothing.
# Every line that carries a shape the checker flags carries an L-X5-ALLOW
# marker with its reason, and this file is declared a specimen file in
# tools/secret-print-baseline.txt, which is what `secret-print-exempt` checks:
# a marker in an undeclared file is an undecided suppression, and a
# declaration that covers nothing is a stale one.
ROWS = [
    # The holes. Every one of these SHOULD be caught and is not.
    {"command": "printenv | grep -i token", "verdict": MISSED, "hole": "H1",
     "why": "a bare printenv piped is the whole environment, and the "
            "printenv branch shadows the bare-dump elif"},
    {"command": "printenv | tee /tmp/env.txt", "verdict": MISSED, "hole": "H1",
     "why": "the same hole, and tee puts the dump on disk as well as on the "
            "terminal"},
    {"command": "env > /tmp/env.txt", "verdict": MISSED, "hole": "H2",
     "why": "the redirect target is counted as an argument, so the bare-dump "
            "test is skipped; line 52 of the checker documents it as caught"},
    {"command": "declare -p | grep TOKEN", "verdict": MISSED, "hole": "H3",
     "why": "declare -p with no name prints every variable, and it is not in "
            "DUMP_VERBS though export -p and set are"},

    # The controls. Every one of these IS caught, and a re-vendor that loses
    # any of them has dropped a detection four recorded incidents paid for.
    {"command": "env | grep -i token", "verdict": CAUGHT, "hole": "",
     "why": "the shape L-X5 and X5-ENVDUMP are named for"},
    {"command": "env | head", "verdict": CAUGHT, "hole": "",
     "why": "a pipe to anything at all is still the whole environment"},
    {"command": "set | grep -i token", "verdict": CAUGHT, "hole": "",
     "why": "set with no flags dumps variables and functions"},
    {"command": "export -p | grep TOKEN", "verdict": CAUGHT, "hole": "",
     "why": "the -p form is admitted by the bare-dump test by name"},

    # Not a hole: a bare dump whose output goes nowhere. The rule is about
    # output reaching somewhere it can be read. This row pins that reading so
    # that a later run does not mistake it for H2 and widen the rule into
    # noise, since flag-carrying calls like `set -euo pipefail` are most of
    # what any repository's shell actually holds.
    {"command": "env", "verdict": MISSED, "hole": "",
     "why": "intended, not a hole: the output goes nowhere"},
]


def verdict_for(command):
    """What the vendored checker says about one command string."""
    run = subprocess.run(
        [sys.executable, CHECKER, "--command", command],
        cwd=ROOT, capture_output=True, text=True)
    # The checker exits 0 clean, 1 with findings, 2 when it could not read its
    # subject. A 2 here would mean `--command` stopped parsing, which is not a
    # verdict about the command and must never be recorded as "missed".
    if run.returncode not in (0, 1):
        return None, run.returncode
    return (CAUGHT if run.returncode == 1 else MISSED), run.returncode


def main():
    for arg in sys.argv[1:]:
        if arg != "--json":
            print(f"secret-print-dump-holes: unknown argument: {arg}",
                  file=sys.stderr)
            return 2
    as_json = "--json" in sys.argv[1:]

    if not os.path.exists(CHECKER):
        print("secret-print-dump-holes: the vendored checker is not at "
              f"{os.path.relpath(CHECKER, ROOT)}, so this run is not a verdict "
              "on it", file=sys.stderr)
        return 2

    results, drift, unreadable = [], [], []
    for row in ROWS:
        got, exit_code = verdict_for(row["command"])
        rec = dict(row, got=got, exit_code=exit_code)
        results.append(rec)
        if got is None:
            unreadable.append(rec)
        elif got != row["verdict"]:
            drift.append(rec)

    if as_json:
        print(json.dumps({"rows": results, "drift": len(drift),
                          "unreadable": len(unreadable)}, indent=2))
    else:
        for r in results:
            mark = "ok   " if r["got"] == r["verdict"] else "DRIFT"
            print(f"  {mark} {r['hole'] or '  ':<3} {r['verdict']:<7} "
                  f"{r['command']}")
        holes = sum(1 for r in ROWS if r["hole"])
        print()
        print(f"{len(ROWS)} rows, {holes} of them open holes in the vendored "
              f"checker, {len(drift)} drifted")

    for r in unreadable:
        print(f"  UNREADABLE  {r['command']!r} -> exit {r['exit_code']}, which "
              "is not a verdict about the command", file=sys.stderr)
    for r in drift:
        if r["verdict"] == MISSED:
            print(f"  NOW CAUGHT  {r['command']!r} ({r['hole'] or 'control'}). "
                  "The upstream fix has landed, so re-vendor "
                  "tools/check-secret-print.py from HQ main and delete this "
                  "row. This is the good failure.", file=sys.stderr)
        else:
            print(f"  NOW MISSED  {r['command']!r}. A re-vendor has lost a "
                  "detection that L-X5's four incidents paid for. Do not "
                  "delete this row, restore the rule.", file=sys.stderr)

    if unreadable or drift:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
