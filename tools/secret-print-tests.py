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
"""
import os
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
    return out


def main():
    sys.path.insert(0, os.path.join(ROOT, "tools", "tests"))
    suite = unittest.defaultTestLoader.discover(
        start_dir=os.path.join(ROOT, "tools", "tests"), top_level_dir=os.path.join(ROOT, "tools", "tests"))
    result = unittest.TextTestRunner(verbosity=1, stream=sys.stderr).run(suite)

    def name(test):
        return f"{test.__class__.__module__}.{test.__class__.__name__}.{test._testMethodName}"

    failed = {name(t) for t, _ in list(result.failures) + list(result.errors)}
    # An exemption applies only while its premise holds. Everything below is
    # computed against the entries that still apply, so a failure under an
    # entry whose fixture has arrived is unexpected again.
    broken = premise_failures()
    applicable = set(EXPECTED_ABSENT_FIXTURES) - {n for n, _ in broken}
    unexpected = sorted(failed - applicable)
    now_passing = sorted(applicable - failed)

    print()
    print(f"ran {result.testsRun}, "
          f"{len(failed & applicable)} exempt as absent fixtures, "
          f"{len(unexpected)} unexpected")

    for n in unexpected:
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

    if unexpected or now_passing or broken:
        return 1
    print("the vendored checker passes every test that is about the checker")
    return 0


if __name__ == "__main__":
    sys.exit(main())
