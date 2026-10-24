#!/usr/bin/env python3
"""Three-way merge of an append-only, date-keyed register, by entry.

    tools/merge-register.py --heading '^### ' BASE OURS THEIRS > MERGED

Why this is not `git merge-file --union`. A union merge is textual and
line-aligned, so when two branches append entries that happen to share a line,
git aligns that line and interleaves the rest. Two seats filing an entry under
the same date and name on the same day produced exactly this:

    ### 2026-10-01 — same name
    - Trigger: mine
    - Trigger: yours different

One heading, two bodies, no conflict marker, and every heading-level check
passes because the corruption is inside the entry. That is a silently wrong
ledger entry, which is worse than the conflict it replaced.

So merge entries, not lines. An entry is a heading line and everything up to
the next heading; its identity is the heading itself (standards/pm.md §4: an
entry is keyed by its date and name). For a date-keyed register the result is
THEIRS in theirs' own order, then the entries only OURS has. Nothing is ever
blended: every entry in the output is byte-for-byte an entry from one of the
inputs.

Theirs' order, not the base's, and the order is not a detail. Both call sites
pass the already-published side as `theirs` (`tools/unjam-ledger.sh` merges the
mainline into a branch, so stage 2 `ours` is the branch and stage 3 `theirs` is
the mainline). Rebuilding the result from the base's order instead cost
something measurable: on PR #130, a branch adding one 13-line entry, the diff
against `main` came to 113 insertions and 107 deletions, and none of those 220
lines was content. The reason is that this ledger is not maintained by
appending. Entries are inserted in date order, so `main` does not equal the
base plus appends, and rebuilding from the base relocates everything `main`
inserted. Worse, it compounds: the relocated order becomes the next merge's
mainline, so the following rebase from a different base moves the same entries
again. Taking theirs' order verbatim ends that. The result's diff against the
published side is exactly the entries this branch adds, at the tail, which is
also where a register's newest entries belong.

A numbered register keeps the base's order instead, and that is a deliberate
exception rather than an oversight. See the paragraph on order below: its tail
is read by the rule that allocates the next number, so the highest number has
to land last, and that cannot be reconciled with following theirs' order when
ours took a lower number than theirs did. A noisier diff is the smaller cost.

It refuses, rather than guessing, when:
  - both sides wrote a different entry under the same heading (an identifier
    collision: the thing to do is rename one, which is a judgment call)
  - both sides changed the same existing entry differently
  - either side deleted an entry the other kept (grooming is not an append)
  - the two sides disagree about the text before the first entry
  - `--identifier` is given and the merge would be what made two entries share
    one identifier (see below)

`--identifier REGEX` makes the register sequence-numbered rather than date-keyed:
an entry carries a short id in its heading (`## ADR-040 — …`, `## Incident 7 — …`)
that other files cite by that id alone. Entry-by-entry merging is still the
right mechanism there, because the entries themselves are appends that disagree
about nothing. The one thing a numbered register adds is that the number is
allocated from a counter in the file, so two branches that both read the same
tail take the same number, and keeping both appends would publish two entries
answering to one name (L-A18, whose repair is to renumber the newer entry and
record the old number in it, never to merge the collision quietly).

The test is whether *this merge* is what created the sharing, not whether the
result contains a duplicate at all: an id's count in the output may not exceed
its count on both sides. A duplicate already present on both sides predates the
merge and is some other branch's repair to make. One the merge would introduce
is refused, named, and left to a human, because choosing the replacement number
is an allocation and the citations of the old one have to move with it.

Order matters here in a way it does not for a date-keyed register, and getting
it wrong manufactures the next collision rather than today's. The rule that
allocates these numbers is "read the register's own tail and take the next free
one". Appending each side's entries in side order put ADR-040 above ADR-039 on
a real branch of this repository, so the file's last entry was 039 and the next
author reading the tail would have taken 040 a second time. So the entries
*this merge adds* are ordered by their identifier, which leaves the highest
number last whenever it was last on both sides. Base entries keep the base's
order untouched, because the base's order is not this merge's to normalise, and
an added entry carrying no identifier sorts after the numbered ones, which is
where an appendix belongs. The post-condition is checked, not assumed.

`--key REGEX` makes an entry's identity part of its heading line rather than
the whole of it, which is what a markdown table needs. A row carries its
content on the line that carries its name, so keyed by the line, a row one side
edited is a delete plus an add and the merge sees a disagreement where there is
none; keyed by its first cell it is an edit, which three-way merging already
knows how to do. Everything else is unchanged: the identity is still what two
sides may not both invent differently, and the bytes emitted are still one
side's.

`--section REGEX` says the register is one section of a document rather than
the whole file, and `--section-end` (default `^## `) says where it ends. The
growth ledger of `docs/architecture/agentic-system.md` is the case this was
built for: decision 056 made that file an every-run register on 2026-10-17, and
by 2026-10-18 four of the six unmergeable `engineer/` branches conflicted in
that one section and nowhere else in the file. The file could not simply be
declared a register, because the rest of it is prose a reader checks against
the host, and keeping both sides of a prose disagreement is how a drawing stops
being true. So the section is merged entry by entry and the rest is merged by
`git merge-file` -- git's own answer, so the only difference this tool makes to
a file is inside the section it was pointed at -- and a real conflict out there
is refused by name rather than resolved.

Exit 0 and the merged register on stdout, or exit 1 and the reason on stderr.
"""
import argparse
import os
import re
import sys


def canon(block):
    """An entry's content, without the blank lines that separate it from the next.

    Identity and equality use this; emission uses the original bytes. Trailing
    blank lines belong to neither entry, and treating them as content made
    appending an entry look like an edit of the entry before it, because that
    block absorbs the new blank line.
    """
    return block.rstrip("\n")


def parse(text, heading_re, key_re=None):
    """Split a register into (preamble, [(key, block)]) preserving order.

    Blocks keep their own bytes, so concatenating them reproduces the file
    exactly. This register is not uniformly spaced (a few entries sit directly
    against the next one), and imposing a separator would put whitespace churn
    in a diff the owner has to read.

    An entry's key is its heading line, which is right when the heading is a
    name and nothing else (`### 2026-10-02 — the thing`). It is wrong when the
    entry is a markdown table row, where the line carrying the identity also
    carries the whole content: `| 2026-W43 | what grew | cost |` keyed by the
    whole line is a key that changes every time the row is edited, so a
    three-way merge sees a delete and an add rather than an edit. `--key` names
    the part of the line that is the identity -- group 1 if the pattern has one
    -- and the rest of the merge is unchanged.
    """
    lines = text.splitlines(keepends=True)
    starts = [i for i, l in enumerate(lines) if heading_re.match(l)]
    if not starts:
        return "".join(lines), []
    preamble = "".join(lines[: starts[0]])
    entries = []
    for n, i in enumerate(starts):
        end = starts[n + 1] if n + 1 < len(starts) else len(lines)
        head = lines[i].rstrip("\n")
        entries.append((key_of(head, key_re), "".join(lines[i:end])))
    return preamble, entries


def key_of(heading, key_re):
    """The identity of an entry whose heading line is `heading`."""
    if key_re is None:
        return heading
    m = key_re.search(heading)
    if not m:
        raise KeyError(heading)
    return (m.group(1) if m.lastindex else m.group(0)).strip()


def emit(preamble, blocks):
    """Reassemble a register from the original bytes of each entry.

    Separation between entries is left exactly as the side that wrote it had it,
    including where that means no blank line above a heading. Supplying one was
    tried and reverted in the run that reordered the sides: both real registers
    in this repository already contain a heading with no blank line above it, so
    normalising reformatted the file in places the merge never touched, which is
    the diff noise the reorder exists to remove. `TheRealLedgerTest` and
    `TheRealDecisionsRegisterTest` pin that invariant.
    """
    out = [preamble]
    for n, block in enumerate(blocks):
        last = n == len(blocks) - 1
        # A heading must always start a line, whatever the file's spacing is.
        if not last and not block.endswith("\n"):
            block += "\n"
        out.append(block)
    return "".join(out)


def widest(a, b):
    """Of two byte-equal entries, the one carrying the larger separator.

    When one side appended after an entry, that side's copy of it gained the
    blank line; keeping the wider one is what a hand merge produces and leaves
    the file's spacing untouched everywhere else.
    """
    return a if len(a) >= len(b) else b


def _id(heading, id_re):
    m = id_re.search(heading)
    if not m:
        return None
    return m.group(1) if m.lastindex else m.group(0)


def _rank(heading, id_re):
    """Sort key for an added entry in a numbered register: its number.

    The identifier's numbers, leading one first, so `ADR-040` and `Incident 10`
    both work and `ADR-007 amendment 2` sorts directly after `ADR-007` rather
    than among the single digits. An entry with no identifier sorts last; two
    entries with the same number keep the order they were given, since the
    duplicate check has the final say on those.
    """
    ident = _id(heading, id_re)
    if ident is None:
        return (1,)
    return (0,) + tuple(int(d) for d in re.findall(r"[0-9]+", ident))


def highest_is_last(headings, id_re):
    """Does the largest identifier belong to the last entry that carries one?

    This is the property the allocation rule depends on: a seat appending to a
    numbered register reads the tail and takes the next number. When it holds,
    the tail is the whole file's high-water mark; when it does not, reading the
    tail hands out a number that is already in use further up.
    """
    ranked = [_rank(h, id_re) for h in headings if _id(h, id_re) is not None]
    if not ranked:
        return True
    # Compare the leading number only. An amendment appended under the decision
    # it amends is where it belongs, and is not the register's high-water mark.
    return max(r[1] for r in ranked) == ranked[-1][1]


def identifiers(blocks, id_re):
    """Every identifier the given entry headings carry, in order, with repeats.

    Group 1 of the regex if the pattern has one, else the whole match. A heading
    the pattern does not match carries no identifier and is simply not counted;
    a numbered register is allowed to hold an unnumbered note.
    """
    return [i for i in (_id(h, id_re) for h in blocks) if i is not None]


def tally(values):
    counts = {}
    for v in values:
        counts[v] = counts.get(v, 0) + 1
    return counts


def refuse(message):
    print("merge-register: %s" % message, file=sys.stderr)
    raise SystemExit(1)


def merge(base_text, ours_text, theirs_text, heading_re, id_re=None, key_re=None):
    try:
        base_pre, base_entries = parse(base_text, heading_re, key_re)
        ours_pre, ours_entries = parse(ours_text, heading_re, key_re)
        theirs_pre, theirs_entries = parse(theirs_text, heading_re, key_re)
    except KeyError as exc:
        refuse("no key could be read from the entry %r; fix that line first" % exc.args[0])

    for name, entries in (("ours", ours_entries), ("theirs", theirs_entries)):
        seen = set()
        for heading, _ in entries:
            if heading in seen:
                refuse("%s already contains %r twice; fix that side first" % (name, heading))
            seen.add(heading)

    base = dict(base_entries)
    ours = dict(ours_entries)
    theirs = dict(theirs_entries)

    # The text before the first entry: normal three-way, no blending.
    if ours_pre == theirs_pre:
        preamble = ours_pre
    elif base_pre == ours_pre:
        preamble = theirs_pre
    elif base_pre == theirs_pre:
        preamble = ours_pre
    else:
        refuse("both sides rewrote the text above the first entry differently")

    # Deleting an entry is a judgment call, not an append.
    for heading in base:
        if heading in ours and heading not in theirs:
            refuse("theirs deleted %r while ours kept it; resolve that by hand" % heading)
        if heading in theirs and heading not in ours:
            refuse("ours deleted %r while theirs kept it; resolve that by hand" % heading)

    chosen = {}
    for heading in set(ours) | set(theirs):
        o, t, b = ours.get(heading), theirs.get(heading), base.get(heading)
        if o is not None and t is not None:
            if canon(o) == canon(t):
                chosen[heading] = widest(o, t)
            elif b is None:
                refuse("both sides added a different entry under %r; rename one" % heading)
            elif canon(o) == canon(b):
                chosen[heading] = t
            elif canon(t) == canon(b):
                chosen[heading] = o
            else:
                refuse("both sides edited %r differently" % heading)
        else:
            chosen[heading] = o if o is not None else t

    if id_re is None:
        # Theirs' order verbatim, then the entries only ours has. Theirs is the
        # published side at both call sites, so this makes the result's diff
        # against it exactly the entries this branch adds, and nothing else
        # moves. Taking the BASE's order here instead is what made a one-entry
        # pull request read as a rewrite of the whole register: a register
        # maintained by inserting in date order, which this ledger is, does not
        # hold base order plus appends, so rebuilding it from the base fights
        # whatever order the mainline actually has, and the next merge from a
        # different base fights it again.
        order = [h for h, _ in theirs_entries if h in chosen]
        seen = set(order)
        order += [h for h, _ in ours_entries if h not in seen]
    else:
        # A numbered register cannot have theirs' order, and this is the one
        # place the two properties pull apart. Its tail is load-bearing: the
        # rule that allocates the next number reads it, so the highest number
        # must end up last. Theirs' order followed by ours' additions puts ours
        # last whatever number it took, which buries theirs' higher one and
        # manufactures the next collision -- ours ADR-040 after theirs ADR-047,
        # the fixture in test_two_appends_that_took_different_numbers_merge. So
        # here the entries this merge adds, from both sides, are ordered
        # together by identifier, and the base's order is kept for the rest.
        # The relocation that costs a date-keyed register a noisy diff is the
        # price of a tail a seat can read, and it is the smaller cost.
        order = [h for h, _ in base_entries if h in chosen]
        added = []
        for side in (ours_entries, theirs_entries):
            for h, _ in side:
                if h not in order and h not in added:
                    added.append(h)
        # Stable, so entries sharing a number keep side order.
        added.sort(key=lambda h: _rank(h, id_re))
        order += added

    out = emit(preamble, [chosen[h] for h in order])

    # Every entry in the output must be, byte for byte, an entry from an input.
    _, out_entries = parse(out, heading_re, key_re)
    if len(out_entries) != len(order):
        refuse("the merged register does not re-parse to the entries it was built from")
    for heading, block in out_entries:
        sides = [canon(x) for x in (ours.get(heading), theirs.get(heading)) if x is not None]
        if canon(block) not in sides:
            refuse("entry %r in the result matches neither side exactly" % heading)
    expected = set(ours) | set(theirs)
    if {h for h, _ in out_entries} != expected:
        refuse("the merged entry set is not the union of the two sides")

    # A numbered register: the merge may not be what made two entries share an id.
    if id_re is not None:
        result = tally(identifiers([h for h, _ in out_entries], id_re))
        ours_counts = tally(identifiers([h for h, _ in ours_entries], id_re))
        theirs_counts = tally(identifiers([h for h, _ in theirs_entries], id_re))
        minted = sorted(
            ident
            for ident, n in result.items()
            if n > max(ours_counts.get(ident, 0), theirs_counts.get(ident, 0))
        )
        headings = [h for h, _ in out_entries]
        if minted:
            detail = []
            for ident in minted:
                where = [h for h in headings if _id(h, id_re) == ident]
                detail.append("%s (%s)" % (ident, " | ".join(where)))
            refuse(
                "merging would give one identifier to two entries: %s; "
                "renumber the newer entry at its source and move its citations "
                "with it (L-A18), then merge again" % "; ".join(detail)
            )
        # The allocation rule reads the tail, so the merge may not bury the
        # highest number above it. Only checked where both sides had the
        # property: a register already out of order at the tail is not this
        # merge's doing, the same way an existing duplicate is not.
        ours_h = [h for h, _ in ours_entries]
        theirs_h = [h for h, _ in theirs_entries]
        if highest_is_last(ours_h, id_re) and highest_is_last(theirs_h, id_re):
            if not highest_is_last(headings, id_re):
                refuse(
                    "the merged register's highest identifier would no longer be "
                    "its last entry, so the next author reading the tail would "
                    "reuse a number; resolve this one by hand"
                )
    return out



def split_section(text, section_re, end_re, side):
    """(above, section, below) for the one section `section_re` opens.

    A register does not always get a file of its own. `docs/architecture/
    agentic-system.md` is prose a reader checks against the host, and its last
    section is a growth ledger every engineer run appends a row to -- so the
    file as a whole is not append-only and must not be merged as if it were,
    while that one section is and must be. The section runs from its own
    heading to the next line matching `end_re` (another heading of the same
    level by default), or to the end of the file.
    """
    lines = text.splitlines(keepends=True)
    starts = [i for i, l in enumerate(lines) if section_re.match(l)]
    if not starts:
        refuse("%s has no section matching %s" % (side, section_re.pattern))
    if len(starts) > 1:
        refuse("%s has %d sections matching %s; the pattern must name one"
               % (side, len(starts), section_re.pattern))
    start = starts[0]
    end = len(lines)
    for i in range(start + 1, len(lines)):
        if end_re.match(lines[i]):
            end = i
            break
    return "".join(lines[:start]), "".join(lines[start:end]), "".join(lines[end:])


def text_three_way(base, ours, theirs, what):
    """Ordinary line-level three-way merge, by git, for the prose outside the section.

    Not the entry merge and not a union: outside the register this is normal
    prose, where two different edits to one paragraph are a disagreement a
    person has to settle. `git merge-file` is used rather than reimplemented so
    that what lands outside the section is byte-for-byte what `git merge` would
    have produced there -- the only difference this tool makes to a file is
    inside the section it was pointed at.
    """
    if ours == theirs:
        return ours
    if base == ours:
        return theirs
    if base == theirs:
        return ours
    import subprocess
    import tempfile
    with tempfile.TemporaryDirectory() as d:
        paths = {}
        for name, body in (("base", base), ("ours", ours), ("theirs", theirs)):
            paths[name] = os.path.join(d, name)
            with open(paths[name], "w", encoding="utf-8") as fh:
                fh.write(body)
        run = subprocess.run(
            ["git", "merge-file", "-p", "--diff3",
             "-L", "ours", "-L", "base", "-L", "theirs",
             paths["ours"], paths["base"], paths["theirs"]],
            capture_output=True, text=True,
        )
    if run.returncode != 0:
        refuse("both sides changed %s in ways that do not merge; "
               "resolve that part by hand" % what)
    return run.stdout


def merge_document(base_text, ours_text, theirs_text, heading_re,
                   id_re=None, key_re=None, section_re=None, end_re=None):
    """Merge a whole file: the register section by entry, the rest as prose."""
    if section_re is None:
        return merge(base_text, ours_text, theirs_text, heading_re, id_re, key_re)
    end_re = end_re or re.compile(r"^## ")
    b_above, b_sec, b_below = split_section(base_text, section_re, end_re, "the base")
    o_above, o_sec, o_below = split_section(ours_text, section_re, end_re, "ours")
    t_above, t_sec, t_below = split_section(theirs_text, section_re, end_re, "theirs")
    above = text_three_way(b_above, o_above, t_above, "the text above the register section")
    section = merge(b_sec, o_sec, t_sec, heading_re, id_re, key_re)
    below = text_three_way(b_below, o_below, t_below, "the text below the register section")
    return above + section + below


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--heading", required=True, help="regex matching an entry's heading line")
    ap.add_argument(
        "--identifier",
        help="regex finding the cited id inside a heading, for a sequence-numbered "
        "register; group 1 if the pattern has one (e.g. '^## (ADR-[0-9]+) ')",
    )
    ap.add_argument(
        "--key",
        help="regex finding an entry's identity inside its heading line, for a "
        "register whose heading also carries content (a table row); group 1 if "
        "the pattern has one (e.g. '^\\| ([^|]+)'). Default: the whole heading line",
    )
    ap.add_argument(
        "--section",
        help="regex matching the heading of the one section that is the register, "
        "for a register that lives inside a prose document. Everything outside it "
        "is merged as ordinary prose",
    )
    ap.add_argument(
        "--section-end",
        default="^## ",
        help="regex matching the line that ends the --section (default: '^## ')",
    )
    ap.add_argument("base")
    ap.add_argument("ours")
    ap.add_argument("theirs")
    args = ap.parse_args()
    heading_re = re.compile(args.heading)
    id_re = re.compile(args.identifier) if args.identifier else None
    key_re = re.compile(args.key) if args.key else None
    section_re = re.compile(args.section) if args.section else None
    end_re = re.compile(args.section_end)

    def read(path):
        with open(path, encoding="utf-8") as fh:
            return fh.read()

    sys.stdout.write(
        merge_document(
            read(args.base), read(args.ours), read(args.theirs),
            heading_re, id_re, key_re, section_re, end_re,
        )
    )


if __name__ == "__main__":
    main()
