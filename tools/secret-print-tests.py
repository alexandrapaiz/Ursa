#!/usr/bin/env python3
"""HQ's test suite for the vendored secret-print checker, run against Ursa.

    python3 tools/secret-print-tests.py

Why this wrapper exists rather than `python3 -m unittest discover -s
tools/tests`. The suite is vendored from alexandra-systems alongside the
checker and says "do not edit here", and two of its 74 tests assert against
HQ's directory layout rather than against the checker:

  TheSafeFormsAreNeverFlagged.test_check_actions_reach_is_clean
      scans `tools/check-actions-reach.sh`, HQ's Actions-reachability probe,
      as the standing false-positive reference for all four safe shapes at
      once. Ursa does not have that tool, so the checker exits 2 (refused,
      cannot read) where the test wants 0.

  TheRegisterTheRuleLivesIn.test_the_register_is_still_scannable_when_a_caller_names_it
      names `standards/lessons.md`. Ursa keeps the register at
      `docs/standards/lessons.md`, so again 2 rather than the expected 1.

Both are absent fixtures and neither is a defect in the checker. Editing the
vendored file to skip them would be dropped by the next re-vendor without
telling anybody, so the knowledge lives here instead.

This runner fails if anything outside that pair fails, and it also fails if
either of the pair starts passing, because that means the fixture arrived and
this exemption should be deleted rather than carried.

THE EXEMPTION HAS TO CARRY ITS OWN PREMISE (added 2026-11-09, Ursa's security
seat, measured)

Each entry is keyed on a test NAME and its reason is a claim about the tree:
"Ursa has not got this file." Until today nothing checked the claim. The
exemption subtracted the name from the failure set whatever the tree looked
like, so the one state it exists to protect against was the state it hid.

Measured before the repair. A file was created at `standards/lessons.md` with
no idiom in it, so the checker exited 0 where that test wants 1. The fixture
was PRESENT and the test failed for a reason that had nothing to do with
absence. This runner printed `2 exempt as absent fixtures, 0 unexpected`,
then `the vendored checker passes every test that is about the checker`, and
exited 0. `tools/secret-print-exemptions.py` was green beside it, because the
only direction it read on this surface was the `review_by` date, which was
still months away.

The NOW GREEN check below does not cover it. That fires when an exempted test
starts PASSING, so it catches the fixture arriving clean. It cannot catch the
fixture arriving broken, and for the first of the two entries that is the
serious case: `tools/check-actions-reach.sh` is the standing false-positive
reference for all four safe shapes, so if Ursa vendors it and it genuinely
prints a value, the test goes red for exactly the reason the suite was written
and this file calls it an absent fixture.

So every entry now names the path whose absence is the condition, in
`absent_path`, and the premise is read off the filesystem on every run. If the
path exists the entry no longer applies, any failure under it is unexpected
again, and the entry is reported as a premise that has gone false. An entry
with no `absent_path` is red rather than trusted, so the next edit to this
dict cannot drop the check by omission.

This is the gate's own `stale` direction, which
`tools/secret-print-exemptions.py` already argues at length for baseline
entries and for inline markers, reaching the third surface those two were
written to cover. The argument there is that an exemption outlives the line it
was keyed on and then clears the next line that happens to match. An
exemption keyed on nothing but a name never had a line to outlive.

It does not decide whether either exemption is still worth carrying. That is
`tools/secret-print-exemptions.py`, which reads `EXPECTED_ABSENT_FIXTURES`
off this module and exits 1 once an entry's `review_by` is past or its
`absent_path` has appeared.

THE PREMISE WAS READ AND THE FAILURE WAS NOT (added 2026-11-09, Ursa's
security seat, measured; Ursa's ExO seat named the direction)

`absent_path` closed one of the two ways an absent-fixture exemption goes
stale. It catches the fixture ARRIVING. It says nothing about the case where
the fixture stays absent and the exempted test starts failing for a second
reason, because the exemption subtracts a test NAME from the failure set and
a name carries no reason.

Measured before this repair, on the tree as it then stood. One extra
assertion was added inside `test_check_actions_reach_is_clean`, asserting
that the checker flags `echo hello` as a print, which it does not and should
not. That is a red about the checker, in the shape a real regression takes.
This runner printed `2 exempt as absent fixtures, 0 unexpected`, then `the
vendored checker passes every test that is about the checker`, and exited 0.
The premise held the whole time, because `tools/check-actions-reach.sh` was
still absent, so nothing on the `absent_path` path could have fired.

The reason the first repair could not reach this is worth stating, because it
is the general form. `absent_path` is a claim about the tree and it was
checked against the tree. "This test fails BECAUSE of that absence" is a
claim about causation, and no reading of the filesystem decides it.

So the reason is executed rather than read. For each exempted test that
actually failed, this runner materialises the missing fixture at
`absent_path`, re-runs that one test, and removes the stand-in again. The
exemption applies only if the test PASSES with the fixture present. If it
fails both ways, the failure was never about absence and is reported
unexplained.

That makes `why` an assertion instead of a sentence. Ursa's frontend seat
supplied the instrument on the same night, from the test side: it had a case
that passed for the wrong condition, and what settled it was running the new
cases against the OLD code and finding four red there and four green here. A
green case cannot tell you which premise it was green for. Changing the
premise and watching the colour move can.

WHAT THIS DOES NOT COVER, SO THE NEXT READER DOES NOT ASSUME IT DOES

The stand-in is declared per entry in `stand_in`, and a WRONG stand-in reads
as "still fails with the fixture present", which is red. That bias is
deliberate: an exemption that swallows a genuine red is worse than one that
lingers, since the suite then reports the absence of the thing it exists to
find. A false alarm here costs a reader one minute and names the entry.

The probe writes into the working tree and removes the stand-in in a
`finally`. A run killed mid-probe leaves the stand-in behind, and the next
run's `absent_path` check then reports the fixture as arrived. That is wrong
but it is RED, and it is self-describing: the paths are named below.
"""
import os
import shutil
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Each entry carries three things, and all three are checked. A `why` for the
# reader, a `review_by` that `tools/secret-print-exemptions.py` exits 1 past,
# and an `absent_path` that is the CONDITION in machine-readable form.
#
# The staleness half was here from the start in the NOW GREEN check below: an
# exemption whose test starts passing is a failure, because the fixture
# arrived. Two directions were missing. The date was added first, because
# neither of these says "Ursa cannot have HQ's file", it says "Ursa has not
# got it", which is a decision this seat may revisit and therefore has to be
# asked again. The premise was added second, because the same sentence is also
# a claim that something is true of the filesystem right now, and a claim
# nothing reads is a permission with nothing under it.
#
# Both dates are security run dates (the 1st and the 15th), so the run that
# finds them due is one that is already reading this file.
EXPECTED_ABSENT_FIXTURES = {
    "test_secret_print.TheSafeFormsAreNeverFlagged.test_check_actions_reach_is_clean": {
        "why": "tools/check-actions-reach.sh is HQ's and Ursa does not have it",
        # The condition, checked on every run. If this path appears, the
        # exemption stops applying rather than absorbing whatever the test
        # then does. This is the entry where that matters most: the file is
        # the standing false-positive reference for all four safe shapes, so a
        # red under it once the file exists is the suite working.
        "absent_path": "tools/check-actions-reach.sh",
        # How to materialise the fixture for the differential below. The test
        # asserts the checker finds NOTHING in this file, so any file with no
        # idiom in it reproduces the pass; empty is the smallest such file.
        "stand_in": {"empty": True},
        # Ask then: should Ursa vendor that probe? It is the standing
        # false-positive reference for all four safe shapes at once, so
        # having it would make this test real here rather than exempt.
        "review_by": "2026-12-15",
    },
    "test_secret_print.TheRegisterTheRuleLivesIn"
    ".test_the_register_is_still_scannable_when_a_caller_names_it": {
        "why": "the register is at docs/standards/lessons.md here, not standards/",
        # HQ syncs standards into this repository, so this path appearing is a
        # thing that can happen without anyone editing this file.
        "absent_path": "standards/lessons.md",
        # The test asserts the register is still SCANNABLE: exit 1, meaning
        # L-X5's own two recorded commands are still found in its prose. Only
        # the real register reproduces that, and Ursa has it at the other
        # path, so the stand-in is a copy of Ursa's own.
        "stand_in": {"copy_of": "docs/standards/lessons.md"},
        # Ask then: is HQ's `standards/` path reachable here yet, or should
        # this test be pointed at Ursa's own register instead of exempted?
        "review_by": "2026-12-15",
    },
}


def premise_failures():
    """Entries whose claim about the tree is no longer true, or unreadable.

    Returned as (name, note) so the caller can print why the exemption
    stopped applying. An entry with no `absent_path` is listed here too: the
    check cannot be performed, and an exemption whose condition cannot be read
    is not one this runner will honour."""
    out = []
    for name, value in sorted(EXPECTED_ABSENT_FIXTURES.items()):
        path = value.get("absent_path") if isinstance(value, dict) else None
        if not path:
            out.append((name, "carries no `absent_path`, so the condition it "
                              "was accepted under cannot be checked"))
            continue
        if os.path.exists(os.path.join(ROOT, path)):
            out.append((name, f"{path} exists, so this is no longer an absent "
                              "fixture and a failure under it is unexplained"))
            continue
        if not isinstance(value.get("stand_in"), dict):
            out.append((name, "carries no `stand_in`, so the claim that this "
                              "test fails BECAUSE of the absence cannot be "
                              "executed and only its name is doing the work"))
    return out


def _materialise(spec, dest):
    """Write the declared stand-in at `dest`. Returns the dirs it created,
    outermost last, so the caller can remove exactly what it added."""
    created = []
    head = os.path.dirname(dest)
    while head and not os.path.isdir(head):
        created.append(head)
        head = os.path.dirname(head)
    for d in reversed(created):
        os.mkdir(d)
    if spec.get("empty"):
        open(dest, "w").close()
    elif spec.get("copy_of"):
        src = os.path.join(ROOT, str(spec["copy_of"]))
        if not os.path.exists(src):
            raise CannotProbe(f"stand-in source {spec['copy_of']} does not "
                              "exist, so the differential cannot be run")
        shutil.copyfile(src, dest)
    else:
        raise CannotProbe("`stand_in` names neither `empty` nor `copy_of`")
    return created


class CannotProbe(Exception):
    """The differential could not be performed. Never a pass."""


TESTS_DIR = os.path.join(ROOT, "tools", "tests")


def _importable():
    """Put the vendored suite on `sys.path`, idempotently.

    This was `main()`'s first line and nothing else. The probe below loads one
    test BY NAME, so it needs the same path, and depending on a caller's side
    effect made it fail with `ImportError: Failed to import test module` when
    called as a unit. That answer was red, which is the safe direction, but it
    was red for the loader rather than for the test, and a guard that reports
    the wrong reason is the shape this whole file is about. Found by this
    file's own new case in `tools/secret-print-exemptions.test.mjs`."""
    if TESTS_DIR not in sys.path:
        sys.path.insert(0, TESTS_DIR)


def _first_raised(traceback_text):
    """The line that names what was raised, not the last line of the text.

    A unittest failure ends in the tail of an assertion diff, so `[-1]` here
    printed `+ []` and named nothing. The exception line is the one a reader
    needs, and it is the first line at column zero that looks like one."""
    for line in traceback_text.strip().splitlines():
        if line[:1].isalpha() and ("Error" in line.split(":")[0]
                                   or "Exception" in line.split(":")[0]):
            return line.strip()[:200]
    return traceback_text.strip().splitlines()[-1].strip()[:200]


def failure_is_about_the_absence(name, value):
    """Execute the entry's `why`: does this test pass once the fixture exists?

    The exemption claims a causal thing, and the filesystem cannot be asked
    about causation. So the premise is CHANGED and the colour is watched. The
    stand-in is removed in a `finally`; if removal fails the caller is told,
    because a surviving stand-in makes the next run's `absent_path` check
    report the fixture as arrived.

    Returns (verdict, note). Verdict True means the failure really was the
    absence. False and None are both refusals to absorb it."""
    dest = os.path.join(ROOT, str(value["absent_path"]))
    if os.path.exists(dest):
        return None, "the path exists, so there was nothing to materialise"
    _importable()
    created = []
    try:
        created = _materialise(value["stand_in"], dest)
    except CannotProbe as exc:
        return None, str(exc)
    except OSError as exc:
        return None, f"the stand-in could not be written: {exc}"
    try:
        # Counted from a mark, not from emptiness: `main()` has already run
        # `discover()` on the same loader, so any error it collected is still
        # in this list and is not this probe's.
        seen = len(unittest.defaultTestLoader.errors)
        loaded = unittest.defaultTestLoader.loadTestsFromName(name)
        if len(unittest.defaultTestLoader.errors) > seen:
            return None, ("the exempted test could not be loaded, so nothing "
                          "was proved either way: " + _first_raised(
                              unittest.defaultTestLoader.errors[seen]))
        result = unittest.TextTestRunner(
            verbosity=0, stream=open(os.devnull, "w")).run(loaded)
        passed = not (result.failures or result.errors)
        if passed:
            return True, ""
        return False, ("it fails with the fixture PRESENT too, so this "
                       "failure is not about the absence: "
                       + _first_raised((result.failures + result.errors)[0][1]))
    finally:
        leftover = []
        try:
            os.remove(dest)
        except OSError:
            leftover.append(str(value["absent_path"]))
        for d in created:
            try:
                os.rmdir(d)
            except OSError:
                pass
        if leftover:
            print("  LEFTOVER  the stand-in could not be removed: "
                  + ", ".join(leftover) + " -- delete it by hand; until then "
                  "the next run reports this fixture as arrived",
                  file=sys.stderr)


def main():
    _importable()
    suite = unittest.defaultTestLoader.discover(
        start_dir=TESTS_DIR, top_level_dir=TESTS_DIR)
    result = unittest.TextTestRunner(verbosity=1, stream=sys.stderr).run(suite)

    def name(test):
        return f"{test.__class__.__module__}.{test.__class__.__name__}.{test._testMethodName}"

    failed = {name(t) for t, _ in list(result.failures) + list(result.errors)}
    # An exemption applies only while its premise holds. Everything below is
    # computed against the entries that still apply, so a failure under an
    # entry whose fixture has arrived is unexpected again.
    broken = premise_failures()
    applicable = set(EXPECTED_ABSENT_FIXTURES) - {n for n, _ in broken}

    # The premise holds, so the fixture really is missing. That still does not
    # say this failure was caused by the absence, and a name cannot say it.
    # So each one is executed: materialise the fixture, re-run that one test,
    # and absorb the failure only if it goes green. Anything else is a red the
    # exemption was never written about.
    unexplained = []
    for n in sorted(failed & applicable):
        verdict, note = failure_is_about_the_absence(
            n, EXPECTED_ABSENT_FIXTURES[n])
        if verdict is not True:
            unexplained.append((n, note))
    applicable -= {n for n, _ in unexplained}

    unexpected = sorted(failed - applicable)
    now_passing = sorted(applicable - failed)

    print()
    print(f"ran {result.testsRun}, "
          f"{len(failed & applicable)} exempt as absent fixtures, "
          f"{len(unexpected)} unexpected")

    notes = dict(unexplained)
    for n in unexpected:
        if n in notes:
            print(f"  FAIL      {n}")
            print(f"            exemption not applied: {notes[n]}")
        else:
            print(f"  FAIL      {n}")
    for n in now_passing:
        print(f"  NOW GREEN {n} -- {EXPECTED_ABSENT_FIXTURES[n]['why']}")
    if now_passing:
        print("  The fixture this exemption was written for now exists, so"
              " delete the entry from EXPECTED_ABSENT_FIXTURES.")
    for n, note in broken:
        print(f"  PREMISE   {n} -- {note}")
    if broken:
        print("  The exemption was accepted on a claim about the tree that is"
              " no longer true, so decide the test rather than exempting it.")

    if unexplained:
        print("  An exempted test failed for a reason that survives the"
              " fixture appearing, so the reason beside it does not describe"
              " this failure. Read the failure rather than the entry.")

    if unexpected or now_passing or broken:
        return 1
    print("the vendored checker passes every test that is about the checker")
    return 0


if __name__ == "__main__":
    sys.exit(main())
