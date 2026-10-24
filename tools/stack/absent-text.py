#!/usr/bin/env python3
"""absent-text.py — is the text of an older branch still in the tip?

    python3 tools/stack/absent-text.py <old-ref> <tip-ref> [--base REF]
                                       [--cover 0.90] [--rewritten 0.50]
                                       [--json out.json] [--quiet]

Exit 0 when nothing is absent or rewritten, 1 when something is, 2 on usage.
So it is usable as the gate in front of "close this one as superseded".

WHY THIS EXISTS, which is the part worth reading before trusting the number.

This seat closes its own older pull requests as contained in its newer tip.
Until 2026-10-24 the question was asked with `git merge-base --is-ancestor`,
and that instrument answers a question these chains stopped posing: the
twenty-eighth window retargeted by *copying content* onto a fresh root, so
every later branch is a complete in-lane superset of its predecessor while
sharing no history with it past the old base. `--is-ancestor` correctly
reports "neither contains the other" and tells you nothing about whether a
line is at risk. `merge-tree` reports a conflict count equal to the size of
this seat's file set, six, whether nothing diverged or everything did.

So the question is content. The charter's first content instrument was
`diff | grep -c '^<'`, which is POSITIONAL: re-level one heading and every
line under it reads as absent until the next anchor realigns. Its second was
`comm -23` over normalised, sorted, de-duplicated lines, which is SET-WISE
and so immune to moves — and which still reports a line as absent whenever
the tip CHANGED it at all, including by making it say more.

That last case is not hypothetical and it is not rare. HQ's exo-centralizer
built the same check with a symmetric similarity ratio and measured three
defects in it against this repository's real branches on 2026-10-24; the
third was an attribute row this seat's newer branch had grown a forty-word
reason. Every character of the old line was present in the new one. Symmetric
similarity scored it 0.264, because a symmetric measure punishes a line for
saying more, and the tool reported a deliberate improvement as a loss.

THE RULE, which is the reusable piece and is separate from this tool:

    the measure is COVERAGE, not SIMILARITY —
    matched characters over the length of the OLD line.

Coverage is asymmetric on purpose. It asks the only question a containment
check is for: is the old text still here? A tip line that says everything the
old line said plus forty words scores 1.00 and is reported as `extended`. The
same pair under any symmetric ratio scores near zero.

The four classes this prints, and what each one means you should do:

  exact      the old line is in the tip verbatim (after normalising heading
             level and trailing space). Nothing to do.
  extended   coverage >= --cover. The tip says all of it and more. Nothing to
             do, and this is the class a similarity measure loses.
  rewritten  --rewritten <= coverage < --cover. READ IT. It is either a
             superseded wording or a loss, and no number can tell you which.
  absent     coverage < --rewritten. READ IT, same reason, higher odds of loss.

AND ONE CLASS ABOVE THE LINE, which keeps the other four readable: a file
every window replaces wholesale is reported as `replaced` and its lines are
not enumerated. `docs/agents/merge-order.md` is rewritten from scratch by
this charter's own instruction each window, so a line absent from the newer
copy is the point of the file rather than a loss. Enumerating it buried the
one register row a reader actually had to check under ninety-two deliberately
rewritten lines. A file counts as replaced when fewer than --replaced of its
old lines are exact or extended in the tip.

Nothing here decides anything. A non-zero exit means a human reads lines, in
the order this prints them, which is the order the charter already requires:
a count is not evidence, only the sentence tells you which you have.
"""
import argparse
import json
import re
import subprocess
import sys
from collections import defaultdict
from difflib import SequenceMatcher

HEADING = re.compile(r"^#+[ \t]*")
WORD = re.compile(r"[A-Za-z0-9_]+")


def git(*args):
    return subprocess.run(
        ["git", *args], capture_output=True, text=True, check=False
    )


def show(ref, path):
    r = git("show", f"{ref}:{path}")
    return r.stdout if r.returncode == 0 else None


def norm(line):
    """Heading level and trailing space are formatting, not text.

    This seat re-levels headings routinely, because each window appends a
    section and the levels get normalised when the file grows a layer. A
    re-level is not a change to what the file says.
    """
    return HEADING.sub("", line).rstrip()


def lines_of(blob):
    if blob is None:
        return []
    return [n for n in (norm(l) for l in blob.splitlines()) if n]


def coverage(old, cand):
    """Matched characters of `old` found in `cand`, over len(old).

    Asymmetric by construction: `cand` may be arbitrarily longer than `old`
    and still score 1.00. That is the whole point of the measure.
    """
    if not old:
        return 1.0
    matched = sum(b.size for b in SequenceMatcher(None, old, cand, autojunk=False).get_matching_blocks())
    return matched / len(old)


def best_coverage(old, tip_lines, index, topk):
    """Coverage of the best candidate in the tip, with a word prefilter.

    The precise measure is O(len(old) * len(cand)) per pair, and this seat's
    charter is four thousand lines, so comparing every pair is minutes. Shared
    words narrow the field first; a line whose text survives in the tip shares
    words with the line that carries it, so the prefilter cannot drop the true
    best match unless the overlap is zero, in which case coverage is near zero
    anyway and the class is the same.
    """
    words = set(WORD.findall(old.lower()))
    if not words:
        return 0.0, None
    hits = defaultdict(int)
    for w in words:
        for i in index.get(w, ()):  # noqa: PERF401 - explicit is cheaper to read here
            hits[i] += 1
    if not hits:
        return 0.0, None
    ranked = sorted(hits.items(), key=lambda kv: -kv[1])[:topk]
    best, best_i = 0.0, None
    for i, _ in ranked:
        c = coverage(old, tip_lines[i])
        if c > best:
            best, best_i = c, i
        if best >= 1.0:
            break
    return best, best_i


def build_index(tip_lines):
    index = defaultdict(list)
    for i, line in enumerate(tip_lines):
        for w in set(WORD.findall(line.lower())):
            index[w].append(i)
    return index


def classify(cov, cover, rewritten):
    """`exact` is never returned here, and that is deliberate.

    A line can score 1.00 coverage without being in the tip verbatim -- that
    is precisely the `extended` case, the tip line saying all of it and more.
    Calling that `exact` would hide the one class this whole tool was built to
    name, so `exact` is assigned only by verbatim set membership, upstream.
    """
    if cov >= cover:
        return "extended"
    if cov >= rewritten:
        return "rewritten"
    return "absent"


def main(argv=None):
    p = argparse.ArgumentParser(
        prog="absent-text.py",
        description="Is the text of an older branch still in the tip? Coverage, not similarity.",
    )
    p.add_argument("old")
    p.add_argument("tip")
    p.add_argument("--base", default=None,
                   help="common base; default `git merge-base OLD TIP`")
    p.add_argument("--cover", type=float, default=0.90,
                   help="coverage at or above which a line counts as extended (default 0.90)")
    p.add_argument("--rewritten", type=float, default=0.50,
                   help="coverage at or above which a line counts as rewritten rather than absent (default 0.50)")
    p.add_argument("--replaced", type=float, default=0.25,
                   help="a file with fewer than this fraction of its lines exact-or-extended is reported as replaced wholesale (default 0.25)")
    p.add_argument("--topk", type=int, default=12,
                   help="candidate tip lines scored per old line, after the word prefilter")
    p.add_argument("--json", dest="json_out", default=None)
    p.add_argument("--quiet", action="store_true",
                   help="print the per-file summary only, not the lines")
    a = p.parse_args(argv)

    if git("rev-parse", "--verify", "--quiet", a.old).returncode != 0:
        print(f"absent-text: no such ref: {a.old}", file=sys.stderr)
        return 2
    if git("rev-parse", "--verify", "--quiet", a.tip).returncode != 0:
        print(f"absent-text: no such ref: {a.tip}", file=sys.stderr)
        return 2

    base = a.base
    if base is None:
        r = git("merge-base", a.old, a.tip)
        if r.returncode != 0 or not r.stdout.strip():
            print("absent-text: no common base; pass --base, and note that a "
                  "pair with no shared history at all is this seat's own "
                  "fresh-root split and not a sign of trouble", file=sys.stderr)
            return 2
        base = r.stdout.strip()

    files = [f for f in git("diff", "--name-only", base, a.old).stdout.splitlines() if f]
    report = {"old": a.old, "tip": a.tip, "base": base, "files": {}}
    exit_code = 0

    for path in files:
        old_lines = lines_of(show(a.old, path))
        tip_blob = show(a.tip, path)
        if tip_blob is None:
            report["files"][path] = {"class": "missing-in-tip", "old_lines": len(old_lines)}
            print(f"{path}: MISSING IN TIP ({len(old_lines)} lines of text)")
            exit_code = 1
            continue
        tip_lines = lines_of(tip_blob)
        tip_set = set(tip_lines)
        index = build_index(tip_lines)

        rows = []
        for line in old_lines:
            if line in tip_set:
                rows.append(("exact", 1.0, line, None))
                continue
            cov, i = best_coverage(line, tip_lines, index, a.topk)
            rows.append((classify(cov, a.cover, a.rewritten), cov, line,
                         tip_lines[i] if i is not None else None))

        counts = defaultdict(int)
        for cls, *_ in rows:
            counts[cls] += 1
        held = counts["exact"] + counts["extended"]
        frac = held / len(rows) if rows else 1.0
        file_class = "replaced" if rows and frac < a.replaced else "compared"

        report["files"][path] = {
            "class": file_class,
            "old_lines": len(rows),
            "held_fraction": round(frac, 3),
            "counts": dict(counts),
            "to_read": [
                {"class": cls, "coverage": round(cov, 3), "old": line, "nearest_in_tip": near}
                for cls, cov, line, near in rows
                if cls in ("rewritten", "absent")
            ] if file_class == "compared" else [],
        }

        if file_class == "replaced":
            print(f"{path}: REPLACED WHOLESALE ({held} of {len(rows)} lines held, "
                  f"{frac:.0%} < {a.replaced:.0%}); lines not enumerated")
            continue

        summary = " ".join(f"{k}={counts[k]}" for k in ("exact", "extended", "rewritten", "absent") if counts[k])
        print(f"{path}: {summary}")
        to_read = report["files"][path]["to_read"]
        if to_read:
            exit_code = 1
            if not a.quiet:
                for row in sorted(to_read, key=lambda r: r["coverage"]):
                    print(f"  [{row['class']} {row['coverage']:.2f}] {row['old']}")
                    if row["nearest_in_tip"]:
                        print(f"      nearest in tip: {row['nearest_in_tip']}")

    if a.json_out:
        with open(a.json_out, "w") as fh:
            json.dump(report, fh, indent=2)

    return exit_code


if __name__ == "__main__":
    sys.exit(main())
