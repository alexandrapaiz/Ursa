#!/usr/bin/env python3
"""Is every suppressed secret-print finding accounted for by a live exemption?

    python3 tools/secret-print-exemptions.py              # the gate
    python3 tools/secret-print-exemptions.py --json
    python3 tools/secret-print-exemptions.py --today 2027-03-01   # what will fail

exit 0 = every suppression is decided and in date
        1 = at least one is undecided, expired or stale
        2 = could not run

WHY THIS EXISTS, AND WHOSE QUESTION IT ANSWERS

`tools/check-secret-print.py` is HQ's vendored L-X5 checker and it has two
ways to suppress a finding it is right about: an inline `L-X5-ALLOW` marker,
and an entry in `tools/secret-print-baseline.txt`. Both of them require a
written reason, and neither of them can ever come due. On 2026-11-09 HQ's
engineer fixed two layout defects this seat had reported in that checker and
left the third to this seat in one sentence: "I agree the exemption that
cannot expire is the dangerous half, and I have left it to you rather than
guessing at the shape, since your runner is the thing that would carry it."

This is the shape. The dangerous half is not the exemption, it is the
CONDITION the exemption was accepted under. Both of Ursa's baseline entries
are accepted because `.github/workflows/` belongs to HQ and no seat token may
write there (docs/standards/pm.md §9), so the fix is HQ's across every
product at once. That is true today. The day it stops being true, nothing in
the repository notices, because a suppressed finding produces no output of
any kind, and this file's whole subject is the difference between a finding
that is clean and a finding that is silent.

HOW IT GETS THE SUPPRESSED SET, WHICH IS THE ONE DESIGN DECISION HERE

Not by inventorying suppression mechanisms. It runs the vendored checker
TWICE over the identical file list and subtracts:

    D   every suppression off      --no-allow, no --baseline
    S   as the repository runs it  markers honoured, --baseline passed
    suppressed = keys(D) - keys(S)

So the set is computed by the checker rather than listed here. If a
re-vendor adds a third way to suppress a finding, findings leave S, the
difference grows, and the new member arrives here with nothing to account
for it and goes red. A gate that instead enumerated "marker, baseline" would
go green on a mechanism it had never heard of, which is the same defect one
layer up: Ursa's exo seat measured the cost of it the same day this file was
written, where a lint emitted three codes and its gate decided two, and the
third was detected on every run and decided by nothing. The rule out of that
is to read the set off the place that holds it. The place that holds the
suppressed set is the checker, so this asks the checker.

WHAT IT DECIDES, AND IN WHICH DIRECTION

Both directions, because an exemption has two failure modes and only one of
them is the obvious one.

  undecided     a suppressed finding with no exemption that accounts for it,
                or a baseline entry with no `review-by` above it
  expired       an entry whose `review-by` is in the past
  stale         an entry, or a `specimen-file`, that accounts for nothing
                any more: the line it was written for is gone, so the
                exemption is now a standing argument for a finding that does
                not exist. Exo's gate found exactly this in itself on its
                first run, which is the only kind of check worth its line.

A stale entry is exit 1 and not a warning. It is the form in which an
exemption quietly widens: the text it was keyed on disappears, the entry
stays, and the next line that happens to match it is cleared by an argument
written about something else.

WHAT IT DOES NOT DO

It does not decide whether a suppression is CORRECT. That is a human
reading the reason in the baseline file. It decides whether somebody is
still on the hook for having written one.
"""
import datetime
import fnmatch
import importlib.util
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHECKER = os.path.join(ROOT, "tools", "check-secret-print.py")
SWEEP = os.path.join(ROOT, "tools", "secret-print-sweep.sh")
BASELINE = os.path.join(ROOT, "tools", "secret-print-baseline.txt")
TEST_RUNNER = os.path.join(ROOT, "tools", "secret-print-tests.py")

REVIEW_BY = re.compile(r"^#\s*review-by:\s*(\d{4})-(\d{2})-(\d{2})\s*$")
SPECIMEN = re.compile(r"^#\s*specimen-file:\s*(?P<path>[^|]+?)\s*\|\s*(?P<why>.+?)\s*$")


class CannotRun(Exception):
    """An environment fault, never a verdict on the tree. Exit 2."""


def load_vendored(path, name):
    """Import a module whose filename has hyphens in it. Used so that this
    gate shares the vendored checker's own `load_baseline` and finding key
    rather than reimplementing either: a second parser for a vendored format
    is a second thing to re-vendor, and it would disagree silently."""
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise CannotRun(f"cannot import {path}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def sweep_files():
    """Ursa's scan list, read off the one script that defines it."""
    out = subprocess.run(["bash", SWEEP, "--print-files"], cwd=ROOT,
                         capture_output=True)
    if out.returncode != 0:
        raise CannotRun("tools/secret-print-sweep.sh --print-files failed: "
                        + out.stderr.decode("utf-8", "replace").strip())
    files = [p for p in out.stdout.decode("utf-8").split("\0") if p]
    if not files:
        raise CannotRun("the sweep listed no files, which is a fault and not "
                        "a clean result")
    return files


def run_checker(files, args):
    out = subprocess.run([sys.executable, CHECKER, "--json", *args, *files],
                         cwd=ROOT, capture_output=True)
    if out.returncode == 2:
        raise CannotRun("the checker refused to run: "
                        + out.stderr.decode("utf-8", "replace").strip())
    try:
        return json.loads(out.stdout.decode("utf-8"))
    except ValueError as exc:
        raise CannotRun(f"the checker's --json output did not parse: {exc}")


def key_of(finding):
    """The checker's own `finding_key`, rebuilt from the JSON document. The
    document names the source line `source` where the internal record calls
    it `line` and uses `line` for the number, so this cannot just call
    `finding_key` on a dict."""
    return (f"{finding['path']} | {finding['code']} | "
            f"{finding['source'].strip()}")


def read_directives(path):
    """Ursa's two comment directives, plus the entry each `review-by` dates.

    An entry's date must be on the line directly above it. Deliberately no
    inheritance: a date that covered a whole block would exempt an appended
    entry on an argument written for a different line."""
    dated, specimens, undated = [], [], []
    previous_date = None
    with open(path, "r", encoding="utf-8") as fh:
        for lineno, raw in enumerate(fh, 1):
            line = raw.strip()
            m = REVIEW_BY.match(line)
            if m:
                previous_date = (datetime.date(*(int(g) for g in m.groups())),
                                 lineno)
                continue
            m = SPECIMEN.match(line)
            if m:
                specimens.append({"path": m.group("path"), "why": m.group("why"),
                                  "lineno": lineno})
                previous_date = None
                continue
            if not line or line.startswith("#"):
                previous_date = None
                continue
            parts = line.split("|", 2)
            if len(parts) != 3:
                previous_date = None
                continue
            entry = tuple(p.strip() for p in parts)
            if previous_date is None:
                undated.append({"entry": entry, "lineno": lineno})
            else:
                dated.append({"entry": entry, "review_by": previous_date[0],
                              "lineno": lineno})
            previous_date = None
    return dated, specimens, undated


def absent_fixture_exemptions():
    """The third exemption surface in this guard, read off the module that
    holds it. `tools/secret-print-tests.py` exempts two vendored tests that
    assert against HQ's directory layout. That exemption already fails when
    it stops being needed, which is the staleness half; what it lacked was
    the date, because "Ursa does not have HQ's file" is a decision Ursa can
    revisit and not a fact about the world."""
    mod = load_vendored(TEST_RUNNER, "_ursa_secret_print_tests")
    got = getattr(mod, "EXPECTED_ABSENT_FIXTURES", None)
    if not isinstance(got, dict):
        raise CannotRun("tools/secret-print-tests.py no longer exposes "
                        "EXPECTED_ABSENT_FIXTURES as a dict, so this gate "
                        "cannot see that surface and will not pretend to")
    out = []
    for name, value in sorted(got.items()):
        if not isinstance(value, dict) or "review_by" not in value:
            out.append({"name": name, "review_by": None, "why": str(value)})
            continue
        try:
            y, m, d = (int(p) for p in str(value["review_by"]).split("-"))
            when = datetime.date(y, m, d)
        except (ValueError, TypeError):
            out.append({"name": name, "review_by": None,
                        "why": str(value.get("why", ""))})
            continue
        out.append({"name": name, "review_by": when,
                    "why": str(value.get("why", ""))})
    return out


def decide(today):
    checker = load_vendored(CHECKER, "_ursa_check_secret_print")
    files = sweep_files()

    raw = run_checker(files, ["--no-allow"])
    live = run_checker(files, ["--baseline", BASELINE])

    raw_keys = {key_of(f) for f in raw["findings"]}
    live_keys = {key_of(f) for f in live["findings"]}
    accepted = set(live["accepted"])

    suppressed = raw_keys - live_keys
    if not accepted <= suppressed:
        raise CannotRun(
            "the two checker runs disagree: "
            f"{len(accepted - suppressed)} finding(s) the baseline accepted "
            "did not appear in the unsuppressed run at all. The gate cannot "
            "partition a set it cannot reproduce.")

    by_baseline = suppressed & accepted
    by_marker = suppressed - accepted

    dated, specimens, undated = read_directives(BASELINE)
    # The entry set this gate parsed must be the entry set the vendored
    # loader parsed. An entry form HQ accepts and this file drops would
    # otherwise be an undated exemption that no rule here ever looks at.
    mine = {d["entry"] for d in dated} | {tuple(u["entry"]) for u in undated}
    theirs = set(checker.load_baseline(BASELINE))
    if mine != theirs:
        raise CannotRun(
            "this gate and the vendored loader read different entries out of "
            f"{os.path.relpath(BASELINE, ROOT)}: "
            f"{len(theirs - mine)} only HQ sees, {len(mine - theirs)} only "
            "this gate sees. Re-read read_directives against load_baseline.")

    problems = []

    for u in undated:
        problems.append({
            "kind": "undecided",
            "where": f"{os.path.relpath(BASELINE, ROOT)}:{u['lineno']}",
            "what": " | ".join(u["entry"]),
            "why": "no `# review-by: YYYY-MM-DD` on the line directly above "
                   "it, so this exemption can never come due",
        })

    for d in dated:
        e_path, e_code, e_text = d["entry"]
        covers = sorted(
            k for k in by_baseline
            if (lambda p, c, t: c == e_code and t == e_text
                and fnmatch.fnmatch(p, e_path))(*k.split(" | ", 2)))
        if not covers:
            problems.append({
                "kind": "stale",
                "where": f"{os.path.relpath(BASELINE, ROOT)}:{d['lineno']}",
                "what": " | ".join(d["entry"]),
                "why": "accounts for no suppressed finding any more. The line "
                       "it was keyed on is gone, so delete the entry rather "
                       "than leaving an argument standing for the next line "
                       "that happens to match it.",
            })
        elif d["review_by"] < today:
            problems.append({
                "kind": "expired",
                "where": f"{os.path.relpath(BASELINE, ROOT)}:{d['lineno']}",
                "what": " | ".join(d["entry"]),
                "why": f"review-by was {d['review_by'].isoformat()}, today is "
                       f"{today.isoformat()}. It still clears "
                       f"{len(covers)} finding(s). Extend the date with a "
                       "fresh argument, or fix the findings.",
            })

    declared = {s["path"] for s in specimens}
    for s in specimens:
        covers = [k for k in by_marker if k.split(" | ", 1)[0] == s["path"]]
        if not covers:
            problems.append({
                "kind": "stale",
                "where": f"{os.path.relpath(BASELINE, ROOT)}:{s['lineno']}",
                "what": f"specimen-file: {s['path']}",
                "why": "holds no suppressed finding, so the declaration has "
                       "outlived its subject. A specimen file carries no "
                       "date, and this check is what stands in for one.",
            })

    for k in sorted(by_marker):
        where = k.split(" | ", 1)[0]
        if where not in declared:
            problems.append({
                "kind": "undecided",
                "where": where,
                "what": k,
                "why": "suppressed by an inline marker in a file this "
                       "repository has not declared a specimen file. Either "
                       "fix the line, or declare the file with a reason in "
                       f"{os.path.relpath(BASELINE, ROOT)}.",
            })

    for a in absent_fixture_exemptions():
        if a["review_by"] is None:
            problems.append({
                "kind": "undecided",
                "where": "tools/secret-print-tests.py",
                "what": f"EXPECTED_ABSENT_FIXTURES[{a['name']}]",
                "why": "carries no usable `review_by`, so an exempted test "
                       "failure can never come due",
            })
        elif a["review_by"] < today:
            problems.append({
                "kind": "expired",
                "where": "tools/secret-print-tests.py",
                "what": f"EXPECTED_ABSENT_FIXTURES[{a['name']}]",
                "why": f"review-by was {a['review_by'].isoformat()}, today is "
                       f"{today.isoformat()}. Ask again whether Ursa should "
                       "have the fixture, then extend or delete.",
            })

    return {
        "today": today.isoformat(),
        "files_scanned": len(files),
        "findings_unsuppressed": len(raw_keys),
        "findings_live": len(live_keys),
        "suppressed": len(suppressed),
        "suppressed_by_baseline": len(by_baseline),
        "suppressed_by_marker": len(by_marker),
        "baseline_entries": len(dated) + len(undated),
        "specimen_files": sorted(declared),
        "problems": problems,
        "clean": not problems,
    }


def main(argv):
    today = datetime.date.today()
    as_json = False
    i = 0
    while i < len(argv):
        arg = argv[i]
        if arg == "--json":
            as_json = True
        elif arg == "--today":
            i += 1
            if i >= len(argv):
                print("--today needs a YYYY-MM-DD date", file=sys.stderr)
                return 2
            try:
                y, m, d = (int(p) for p in argv[i].split("-"))
                today = datetime.date(y, m, d)
            except ValueError:
                print(f"--today: not a date: {argv[i]}", file=sys.stderr)
                return 2
        elif arg in ("-h", "--help"):
            print(__doc__)
            return 0
        else:
            print(f"unknown argument {arg}", file=sys.stderr)
            return 2
        i += 1

    try:
        report = decide(today)
    except CannotRun as exc:
        print(f"secret-print-exemptions: {exc}", file=sys.stderr)
        return 2
    except OSError as exc:
        print(f"secret-print-exemptions: {exc}", file=sys.stderr)
        return 2

    if as_json:
        print(json.dumps(report, indent=2))
        return 1 if report["problems"] else 0

    for p in report["problems"]:
        print(f"{p['kind'].upper():<10} {p['where']}")
        print(f"           {p['what']}")
        print(f"           {p['why']}")
        print("")

    scope = (f"{report['suppressed']} suppressed finding(s) over "
             f"{report['files_scanned']} files: "
             f"{report['suppressed_by_baseline']} by "
             f"{report['baseline_entries']} baseline entr(ies), "
             f"{report['suppressed_by_marker']} by markers in "
             f"{len(report['specimen_files'])} declared specimen file(s)")
    if report["problems"]:
        print(f"{len(report['problems'])} undecided, expired or stale "
              f"exemption(s). {scope}.")
        return 1
    print(f"every exemption is decided and in date ({scope})")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
