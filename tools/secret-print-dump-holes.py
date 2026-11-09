#!/usr/bin/env python3
"""Where do the vendored guard's two environment rules disagree with themselves?

    python3 tools/secret-print-dump-holes.py
    python3 tools/secret-print-dump-holes.py --json
    python3 tools/secret-print-dump-holes.py --checker PATH   # a candidate

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

THE FOUR DEFECTS, AND THE ROOT CAUSE OF EACH

H1 to H3 are missed detections in one block of `tools/check-secret-print.py`,
the X5-ENVDUMP arm. H4 is the opposite direction in the sibling X5-ENVNAMES
rule, and it is here rather than in a file of its own because the two rules
are one subject and this gate is already registered. The arm's shape is:

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

  H4  X5-ENVNAMES over-catches, because it reasons over the whole physical
      line where X5-ENVDUMP reasons over `segments()`. Its three required
      parts are dotenv text, a split on `=`, and keeping the first field,
      and on one line those can come out of commands that have nothing to do
      with each other. The finding's sentence then says "this reads an env
      file for its names" about a line where nothing does. This is not a
      leak and it is not harmless either: a deny message that misdescribes
      the line is how a seat learns to route around the guard rather than
      read it, and this seat spent a turn on exactly that tonight.

H1, H2 and H3 are closed in HQ's `alexandra-systems#664`, open and not
merged as of 2026-11-09T04:14Z. That was verified here with `--checker`
against that branch's own copy rather than read off the message: all five
hole rows flip to caught and every control, safe, intended and clean row
holds. So the rows stay asserted until the re-vendor, and this gate going
red is the signal to do it. H4 is open on that branch too.

ONE DENIAL THIS SEAT RECORDED AS A FALSE POSITIVE, AND IT WAS NOT ONE

  `env | cut -d= -f1` is denied, and run 5 of this seat recorded that denial  # L-X5-ALLOW: the mistaken claim is this section's subject and has to be quotable
  as a value-safe false positive, on the ground that the first field is the
  name side of the `=`. The guard was right and the reasoning was wrong.
  `env` prints a multi-line value as its pair line followed by that value's
  own continuation lines, and a continuation line carries no `=`, so a
  first-field filter passes it through whole. Measured both halves: three
  lines through the filter, and the one with no separator came out verbatim
  while an anchored read dropped it; and `env -i` over a two-line value
  emits exactly that shape. It is the reason the sibling X5-ENVNAMES rule
  gives for refusing the same filter over an env file, and it does not stop
  being the reason when the dotenv text arrives down a pipe.

  Run 5 then compounded the error in prose, by telling a reader that the
  guard "already passes" the same filter spelled `printenv`. It does pass it
  here today, and that is H1 rather than a sanctioned idiom. The one
  spelling this file recommended is the one spelling that both leaks and is
  about to be refused, so it is a row below now, under H1.

  HQ closed the `printenv` hole on 2026-11-09 and gave the better reason for
  refusing this seat's third ask, which had been to name the filter in the
  deny message: the two spellings are symmetric once H1 is closed, so a
  names filter is denied in both and no message could honestly say otherwise.
  What to type instead, each measured passing under the vendored copy and
  under HQ's candidate. For names, a read anchored to the start of a line,
  which is what X5-ENVNAMES's own message already hands you, or `compgen -v`,
  which prints names and never a value. For one variable, a presence probe
  that expands to a fixed word rather than to the value.
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
    {"command": "printenv | cut -d= -f1", "verdict": MISSED, "hole": "H1",
     "why": "the row this file's own prose got wrong: H1 again, and not a "
            "name-only idiom, because a multi-line value's continuation "
            "lines carry no = and the filter passes them through whole"},

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
    {"command": "env | cut -d= -f1", "verdict": CAUGHT, "hole": "",
     "why": "a correct catch this seat filed as a false positive: the first "
            "field is the name side of the = only for values that fit on "
            "one line"},

    # The name-only forms that are safe and must stay passing. If either
    # starts being denied, the deny message is sending seats somewhere with
    # no exit, which is the failure this seat's own run 5 walked into from
    # the other side.
    {"command": "compgen -v", "verdict": MISSED, "hole": "", "kind": "safe",
     "why": "prints names, one per line, and never a value"},
    {"command": "grep -oE '^[A-Za-z_][A-Za-z0-9_]*=' /tmp/x | tr -d =",
     "verdict": MISSED, "hole": "", "kind": "safe",
     "why": "the anchored read X5-ENVNAMES's own deny message hands you, so "
            "the guard has to accept what it recommends"},
    {"command": '[ -n "${TOKEN:+set}" ] && echo present', "verdict": MISSED,
     "hole": "", "kind": "safe",
     "why": "a per-name presence probe: the expansion yields a fixed word "
            "rather than the value, which is presence and length and "
            "nothing else"},

    # Not a hole: a bare dump whose output goes nowhere. The rule is about
    # output reaching somewhere it can be read. This row pins that reading so
    # that a later run does not mistake it for H2 and widen the rule into
    # noise, since flag-carrying calls like `set -euo pipefail` are most of
    # what any repository's shell actually holds.
    {"command": "env", "verdict": MISSED, "hole": "", "kind": "intended",
     "why": "intended, not a hole: the output goes nowhere"},

    # The sibling rule, because the denial that found H4 was X5-ENVNAMES and
    # not X5-ENVDUMP. X5-ENVDUMP reasons over `segments()`; X5-ENVNAMES
    # reasons over the whole physical line. So its three required parts can
    # be assembled out of commands that have nothing to do with each other,
    # and the finding's own sentence then describes a line that does not
    # exist. The halves are pinned beside it: if either starts being flagged
    # on its own this stops being a composition defect and becomes a rule
    # change.
    {"command": "grep -c ssh /srv/asc/.env ; cut -d= -f1 /tmp/report.csv",   # L-X5-ALLOW: the composed over-catch is this row's subject and cannot be stated without it
     "verdict": CAUGHT, "hole": "H4", "kind": "overcatch",
     "why": "neither half is a names read of dotenv text and the line is "
            "flagged as one, because the dotenv source comes from the first "
            "command and the filter from the second"},
    {"command": "grep -c ssh /srv/asc/.env", "verdict": MISSED, "hole": "",
     "kind": "clean",
     "why": "half one alone: an env file read for a count, no filter"},
    {"command": "cut -d= -f1 /tmp/report.csv", "verdict": MISSED, "hole": "",
     "kind": "clean",
     "why": "half two alone: the checker's own cut_not_env fixture, a names "
            "filter over text that is not dotenv"},
]


# Every row is a claim about the vendored checker, and a claim that drifts
# needs the right sentence rather than a sentence picked off the direction it
# drifted in. The two directions are not two kinds: a row going from missed
# to caught is the fix landing for a hole and the rule widening into noise
# for a safe form, and those want opposite acts from the reader. So the kind
# is written down, defaulted from the fields the first four kinds already
# had, and the drift message is keyed on (kind, direction).
def kind_of(row):
    if "kind" in row:
        return row["kind"]
    if row["hole"]:
        return "hole"
    return "control" if row["verdict"] == CAUGHT else "intended"


DRIFT_ADVICE = {
    ("hole", CAUGHT): "The upstream fix has landed, so re-vendor "
                      "tools/check-secret-print.py from HQ main and delete "
                      "this row. This is the good failure.",
    ("control", MISSED): "A re-vendor has lost a detection that L-X5's four "
                         "incidents paid for. Do not delete this row, "
                         "restore the rule.",
    ("safe", CAUGHT): "A form this guard's own deny message recommends is "
                      "now denied, so a seat obeying the message has no "
                      "exit. Report it upstream before working around it.",
    ("intended", CAUGHT): "A bare dump going nowhere is now flagged, so the "
                          "rule has widened into noise and will be worked "
                          "around rather than obeyed. Report it upstream.",
    ("overcatch", MISSED): "An over-catch this seat reported upstream is "
                           "gone, so re-vendor and delete this row. This is "
                           "the other good failure.",
    ("clean", CAUGHT): "A line that was clean on its own is now flagged, so "
                       "the over-catch beside it has grown rather than "
                       "being fixed. Report it upstream.",
}


def verdict_for(command, checker=None):
    """What a checker says about one command string."""
    run = subprocess.run(
        [sys.executable, checker or CHECKER, "--command", command],
        cwd=ROOT, capture_output=True, text=True)
    # The checker exits 0 clean, 1 with findings, 2 when it could not read its
    # subject. A 2 here would mean `--command` stopped parsing, which is not a
    # verdict about the command and must never be recorded as "missed".
    if run.returncode not in (0, 1):
        return None, run.returncode
    return (CAUGHT if run.returncode == 1 else MISSED), run.returncode


def main():
    # --checker PATH points the rows at a copy that is not the vendored one,
    # which is how a candidate is measured BEFORE it is vendored rather than
    # after. HQ's 2026-11-09 fix for H1, H2 and H3 was verified this way: its
    # branch copy flips all four hole rows and holds every control. Without
    # it the only way to find out what a re-vendor does is to do it.
    as_json = False
    checker = CHECKER
    args = list(sys.argv[1:])
    while args:
        arg = args.pop(0)
        if arg == "--json":
            as_json = True
        elif arg == "--checker":
            if not args:
                print("secret-print-dump-holes: --checker needs a path",
                      file=sys.stderr)
                return 2
            checker = os.path.abspath(args.pop(0))
        elif arg.startswith("--checker="):
            checker = os.path.abspath(arg.split("=", 1)[1])
        else:
            print(f"secret-print-dump-holes: unknown argument: {arg}",
                  file=sys.stderr)
            return 2

    if not os.path.exists(checker):
        print("secret-print-dump-holes: no checker at "
              f"{os.path.relpath(checker, ROOT)}, so this run is not a verdict "
              "on it", file=sys.stderr)
        return 2

    results, drift, unreadable = [], [], []
    for row in ROWS:
        got, exit_code = verdict_for(row["command"], checker)
        rec = dict(row, kind=kind_of(row), got=got, exit_code=exit_code)
        results.append(rec)
        if got is None:
            unreadable.append(rec)
        elif got != row["verdict"]:
            drift.append(rec)

    if as_json:
        print(json.dumps({"checker": os.path.relpath(checker, ROOT),
                          "rows": results, "drift": len(drift),
                          "unreadable": len(unreadable)}, indent=2))
    else:
        for r in results:
            mark = "ok   " if r["got"] == r["verdict"] else "DRIFT"
            print(f"  {mark} {r['kind']:<9} {r['hole'] or '  ':<3} "
                  f"{r['verdict']:<7} {r['command']}")
        counts = {}
        for r in results:
            counts[r["kind"]] = counts.get(r["kind"], 0) + 1
        census = ", ".join(f"{n} {k}" for k, n in sorted(counts.items()))
        print()
        print(f"{len(ROWS)} rows against {os.path.relpath(checker, ROOT)} "
              f"({census}), {len(drift)} drifted")

    for r in unreadable:
        print(f"  UNREADABLE  {r['command']!r} -> exit {r['exit_code']}, which "
              "is not a verdict about the command", file=sys.stderr)
    for r in drift:
        headline = "NOW CAUGHT" if r["got"] == CAUGHT else "NOW MISSED"
        advice = DRIFT_ADVICE.get((r["kind"], r["got"]))
        if advice is None:
            # A kind with no sentence for the direction it moved in. Saying
            # so is the only honest output: a drift reported under the wrong
            # advice is worse than a drift reported without any.
            advice = (f"No advice is written for a {r['kind']} row going "
                      f"{r['got']}, so this gate cannot tell you what to do "
                      "with it. Add the sentence before acting.")
        print(f"  {headline}  {r['command']!r} "
              f"({r['kind']}{'/' + r['hole'] if r['hole'] else ''}). {advice}",
              file=sys.stderr)

    if unreadable or drift:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
