#!/usr/bin/env python3
"""Is every suppressed secret-print finding accounted for by a live exemption?

    python3 tools/secret-print-exemptions.py              # the gate
    python3 tools/secret-print-exemptions.py --json
    python3 tools/secret-print-exemptions.py --today 2027-03-01   # what will fail

exit 0 = every suppression is decided and in date
        1 = at least one is undecided, expired, stale or inert
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

All three directions, because a suppression is a claim about the tree and a
claim fails in three ways, not two. Ursa's exo seat stated the general rule
on 2026-11-09, having hit all three in its own gate as three unrelated
accidents: an input claiming too much goes red loudly, an input claiming
nothing goes quiet, and the quiet direction rots.

  undecided     a suppressed finding with no exemption that accounts for it,
                or a baseline entry with no `review-by` above it
  expired       an entry whose `review-by` is in the past
  stale         an entry, or a `specimen-file`, that accounts for nothing
                any more: the line it was written for is gone, so the
                exemption is now a standing argument for a finding that does
                not exist. Exo's gate found exactly this in itself on its
                first run, which is the only kind of check worth its line.
  inert         a marker that suppresses nothing, outside a declared
                specimen file. The same widening as `stale`, in the surface
                this gate could not see until markers were enumerated from
                the tree: see `marker_census`, which is where the reason
                that direction was unreachable rather than merely unwritten
                is set out.

A stale or inert exemption is exit 1 and not a warning. It is the form in
which an exemption quietly widens: the text it was keyed on disappears, the
entry stays, and the next line that happens to match it is cleared by an
argument written about something else.

Two things are counted and never red, both of them properties of HQ's
vendored marker test rather than of this tree, and both set out in `decide`:
a line that names the marker token without claiming anything by it, and a
marker that suppresses while naming no reason. The census prints on every
run, clean or red, so that the quiet direction stays visible without this
gate demanding edits to a file whose first line reads "do not edit here".

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
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHECKER = os.path.join(ROOT, "tools", "check-secret-print.py")
SWEEP = os.path.join(ROOT, "tools", "secret-print-sweep.sh")
BASELINE = os.path.join(ROOT, "tools", "secret-print-baseline.txt")
TEST_RUNNER = os.path.join(ROOT, "tools", "secret-print-tests.py")

REVIEW_BY = re.compile(r"^#\s*review-by:\s*(\d{4})-(\d{2})-(\d{2})\s*$")
SPECIMEN = re.compile(r"^#\s*specimen-file:\s*(?P<path>[^|]+?)\s*\|\s*(?P<why>.+?)\s*$")

# A marker that CLAIMS, as against a line that merely names the token. The
# vendored checker's own test is `re.compile(r"L-X5-ALLOW")`, a bare substring
# with no reason requirement, so the two are the same line to it and this is
# the only place the difference is drawn. Measured 2026-11-09: a comment
# reading "the checker uses L-X5-ALLOW as its marker token" suppresses a real
# finding on the line below it, and a bare `# L-X5-ALLOW` with no reason
# suppresses too, though line 137 of the checker documents the marker as
# carrying "a reason". Both are reported upstream; neither is this
# repository's to patch, and this gate has to classify what the checker
# actually honours rather than what its documentation describes.
MARKER_REASON = re.compile(r"L-X5-ALLOW\s*[:=-]\s*\S")
NEUTRAL = "X5-MARKER-REMOVED"


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
    assert against HQ's directory layout.

    All three directions are read here now, the same three the rest of this
    file reads over baseline entries and markers.

    The staleness half looked covered. That runner fails when an exempted test
    starts PASSING, so the fixture arriving clean is caught. The date was
    added because "Ursa does not have HQ's file" is a decision Ursa can
    revisit and not a fact about the world.

    What neither reached was the premise. The entry is keyed on a test NAME,
    and its reason is a claim that a path does not exist. Measured 2026-11-09:
    with a file created at `standards/lessons.md`, the exempted test failed
    for a reason that was not absence, the runner called it an absent fixture
    and exited 0, and this gate was green beside it because the date was
    months away. So the exemption cleared a failure written about a different
    state of the tree, which is this file's own `stale` argument arriving in
    the surface it had not been pointed at. Each entry now names its
    `absent_path` and the premise is read off the filesystem."""
    mod = load_vendored(TEST_RUNNER, "_ursa_secret_print_tests")
    got = getattr(mod, "EXPECTED_ABSENT_FIXTURES", None)
    if not isinstance(got, dict):
        raise CannotRun("tools/secret-print-tests.py no longer exposes "
                        "EXPECTED_ABSENT_FIXTURES as a dict, so this gate "
                        "cannot see that surface and will not pretend to")
    out = []
    for name, value in sorted(got.items()):
        if not isinstance(value, dict) or "review_by" not in value:
            out.append({"name": name, "review_by": None, "why": str(value),
                        "absent_path": None, "premise_holds": None})
            continue
        claimed = value.get("absent_path")
        row = {
            "name": name,
            "why": str(value.get("why", "")),
            "absent_path": str(claimed) if claimed else None,
            # None means the entry named no path, so the premise could not be
            # read. That is a distinct verdict from a premise that is false.
            "premise_holds": (
                None if not claimed
                else not os.path.exists(os.path.join(ROOT, str(claimed)))),
        }
        try:
            y, m, d = (int(p) for p in str(value["review_by"]).split("-"))
            row["review_by"] = datetime.date(y, m, d)
        except (ValueError, TypeError):
            row["review_by"] = None
        out.append(row)
    return out


def marker_census(checker, files):
    """Every line the checker treats as a marker, and whether it suppresses.

    THE THIRD DIRECTION, AND WHY IT WAS THE ONE MISSING

    A suppression is a claim about the tree, and a claim fails in three
    directions, not two. This gate already ran the other two: a declaration
    covering nothing is `stale`, and a suppression nothing declared is
    `undecided`. Both of those are reached by walking the SUPPRESSED SET, and
    that is exactly why the third was invisible. A marker that suppresses
    nothing produces no suppressed finding, so no walk of that set can ever
    arrive at it. It had to be enumerated from the tree instead.

    Ursa's exo seat named the shape on 2026-11-09, having hit all three in its
    own gate as three separate accidents: "an input claiming too much goes red
    loudly; an input claiming nothing goes quiet, and the quiet direction
    rots." The cost here is not hypothetical. The run before this one wrote
    five inline markers, found that one of them suppressed anything, and
    removed the other four by hand. Nothing would have reported them.

    WHY AN INERT MARKER IS A DEFECT AND NOT UNTIDINESS

    It is a standing permission with nothing under it. The line it was written
    for is gone, the marker is not, and the next finding written on or under
    it is cleared by a reason composed about something else. That is the
    identical argument this file already makes for a stale baseline entry, in
    the one surface where it never looked.

    HOW A MARKER IS ATTRIBUTED, WHICH IS THE DESIGN DECISION

    Not by re-deriving the coverage rule. `allowed_lines` covers the marker
    line, the line below it, and the fenced block the marker opens, and it has
    already been widened once; a copy of it here would be a second thing to
    re-vendor and would disagree silently. So each marker is attributed by
    asking the checker directly: neutralise every marker token in the file,
    scan that, then restore ONE marker and scan again. The marker is live if
    restoring it removes a finding.

    Restoring one at a time rather than deleting one at a time is deliberate.
    Deleting one marker from a line that two markers cover leaves the other
    one standing, so both would read as suppressing nothing and the gate would
    demand that both be deleted. Adding one at a time makes each verdict
    independent of every other marker in the file.
    """
    out = []
    for path in files:
        try:
            with open(path, "r", encoding="utf-8", errors="replace") as fh:
                text = fh.read()
        except OSError:
            # A file the sweep listed and this cannot read is the checker's
            # own problem to report, not a marker verdict to invent.
            continue
        lines = text.splitlines()
        marked = [i for i, line in enumerate(lines, start=1)
                  if checker.ALLOW_MARKER.search(line)]
        if not marked:
            continue

        blanked = [checker.ALLOW_MARKER.sub(NEUTRAL, line) for line in lines]
        suffix = os.path.splitext(path)[1]
        base = _scan_variant(checker, blanked, suffix)
        if base is None:
            continue

        for i in marked:
            one = list(blanked)
            one[i - 1] = lines[i - 1]
            got = _scan_variant(checker, one, suffix)
            if got is None:
                continue
            live = bool(base - got)
            out.append({
                "path": os.path.relpath(os.path.abspath(path), ROOT),
                "lineno": i,
                "live": live,
                "has_reason": bool(MARKER_REASON.search(lines[i - 1])),
                "suppresses": len(base - got),
            })
    return out


def _scan_variant(checker, lines, suffix):
    """Findings for one variant of a file's text, as line/code pairs.

    Written through a real file with the original suffix rather than by
    calling `scan_text` directly, so the composition under test is the
    checker's own `scan_file`: it is the function that decides what
    `honour_allow` means, and a suffix is carried because this guard reads
    some suffixes differently from others."""
    fd, tmp = tempfile.mkstemp(suffix=suffix or ".txt",
                               prefix="secret-print-marker-")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            fh.write("\n".join(lines) + "\n")
        got = checker.scan_file(tmp, honour_allow=True)
        if got is None:
            return None
        return {(f.line_no, f.code) for f in got}
    finally:
        os.unlink(tmp)


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

    # The third direction. Outside a declared specimen file every marker
    # earns its own place and names its own reason; inside one the declaration
    # stands in for both, and that declaration has its own liveness check
    # eleven lines up. Scoping it this way is not a softening: a specimen file
    # is one whose SUBJECT is defective lines, so a blanket of markers over
    # fixtures is the correct state of it, and 19 of the 29 markers in HQ's
    # vendored suite suppress nothing for that reason alone. A gate that
    # demanded each one be deleted would be demanding edits to a file whose
    # first line reads "do not edit here".
    # Only one verdict comes out of the census, and the scoping below is why.
    # In an UNDECLARED file a marker that suppresses is already `undecided`
    # eleven lines up, so the only state that surface cannot already see is
    # the marker suppressing nothing. In a DECLARED one, blanket marking is
    # the point. So there is exactly one new red here and the rest of the
    # census is counted instead.
    #
    # A reasonless marker was a second verdict here until its own test killed
    # it. Live-and-reasonless is unreachable outside a declared file because
    # `undecided` fires first, and inside one it would be a red this
    # repository could not clear, since the file carrying the markers is HQ's
    # and its first line reads "do not edit here". The documented contract
    # does say a marker carries a reason and the checker does not enforce it;
    # that gap is reported upstream and counted below, which is the most a
    # gate can honestly do about somebody else's file.
    markers = marker_census(checker, files)
    for m in markers:
        if m["path"] in declared:
            continue
        if not m["live"] and m["has_reason"]:
            problems.append({
                "kind": "inert",
                "where": f"{m['path']}:{m['lineno']}",
                "what": "L-X5-ALLOW suppressing nothing",
                "why": "suppresses no finding, so it is a standing permission "
                       "with nothing under it: the next finding written on or "
                       "under this line is cleared by a reason composed about "
                       "a different one. Delete the marker, or declare the "
                       "file a specimen if its subject really is such lines.",
            })

    for a in absent_fixture_exemptions():
        if a["premise_holds"] is None:
            problems.append({
                "kind": "undecided",
                "where": "tools/secret-print-tests.py",
                "what": f"EXPECTED_ABSENT_FIXTURES[{a['name']}]",
                "why": "names no `absent_path`, so the condition this "
                       "exemption was accepted under cannot be read and the "
                       "entry suppresses a test failure on a claim nothing "
                       "checks",
            })
        elif not a["premise_holds"]:
            problems.append({
                "kind": "stale",
                "where": "tools/secret-print-tests.py",
                "what": f"EXPECTED_ABSENT_FIXTURES[{a['name']}]",
                "why": f"{a['absent_path']} exists, so this is no longer an "
                       "absent fixture. The exemption has outlived its "
                       "condition and now clears a failure written about a "
                       "different state of the tree. Decide the test, then "
                       "delete the entry.",
            })
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
        "markers": len(markers),
        "markers_live": sum(1 for m in markers if m["live"]),
        "markers_inert": sum(1 for m in markers if not m["live"]),
        # Lines that name the token without claiming anything with it, and so
        # hold a suppression they do not use. Counted and never red: the
        # repair is to narrow the checker's bare-substring test upstream, and
        # a gate that went red on these would be requiring that no file in
        # this repository describe how the marker works, which includes the
        # checker's own source and this gate's own docstring.
        "markers_incidental": sum(
            1 for m in markers
            if not m["live"] and not m["has_reason"]),
        # Suppressing, and naming no reason while doing it. The checker
        # documents the marker as carrying a reason and honours one without,
        # so this is the distance between the two, counted rather than gated
        # for the reason given in `decide`.
        "markers_reasonless_live": sum(
            1 for m in markers if m["live"] and not m["has_reason"]),
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
    # Printed on every run, including a clean one. An incidental marker is
    # not a defect this repository can fix and it is not nothing either: it is
    # a line holding a suppression it never uses, and the count moving is the
    # only signal that one was added.
    census = (f"{report['markers']} marker line(s): "
              f"{report['markers_live']} suppressing, "
              f"{report['markers_inert']} not, of which "
              f"{report['markers_incidental']} name the token without "
              f"claiming anything by it (the checker's marker test is a bare "
              f"substring, so those hold a suppression they do not use; "
              f"narrowing it is upstream's), "
              f"{report['markers_reasonless_live']} suppressing with no "
              f"reason written on them")
    if report["problems"]:
        print(f"{len(report['problems'])} undecided, expired, stale or "
              f"inert exemption(s). {scope}.")
        print(census)
        return 1
    print(f"every exemption is decided and in date ({scope})")
    print(census)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
