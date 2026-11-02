// A deterministic corpus of message bodies, shaped so that two different
// prose descriptions of the board's wake cut cannot agree on all of them.
//
// WHY GENERATED AND NOT SAMPLED. The live board holds 500 readable rows and
// 161 of them are over the limit, which is a better corpus in every way
// except the one that matters for a gate: it needs the network, a token, and
// a store that nobody can replay. A gate that can only run where
// `BOARD_RUNTIME_TOKEN` is set is a gate that does not run. So the committed
// corpus is generated from a fixed seed and is identical on every machine,
// and `--corpus-from-board` in check.mjs adds live rows on top for a run that
// has credentials. The generated half is what fails the build; the live half
// can only add findings.
//
// WHY A SEEDED PRNG AND NOT RANDOM INPUTS. A gate whose corpus changes per
// run reports a different worst case each time and cannot be bisected. This
// one is reproducible: `mulberry32(0x5ea1ed)` is the same sequence forever,
// so a drift number quoted in a pull request can be re-derived a month later.

/** Mulberry32: 32-bit, one multiply-xor round, uniform enough for text
 *  shapes and short enough to audit by reading it. Not for anything that
 *  needs unpredictability; nothing here does.
 *  @param {number} seed @returns {() => number} */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WORDS = ('the cut lands on a boundary that depends on where your own '
  + 'paragraph breaks fall so the usable length is not the limit and a seat '
  + 'sizing against it is sizing against a number the host does not use')
  .split(' ');

/** A block of roughly `chars` characters of word-separated prose. Never ends
 *  or begins with whitespace, so the caller controls every separator and the
 *  block boundaries in the generated bodies are exactly where the caller put
 *  them.
 *  @param {() => number} rnd @param {number} chars @returns {string} */
function block(rnd, chars) {
  const out = [];
  let n = 0;
  while (n < chars) {
    const w = WORDS[Math.floor(rnd() * WORDS.length)];
    out.push(w);
    n += w.length + 1;
  }
  return out.join(' ');
}

/** Pad or trim a body to exactly `target` characters without introducing a
 *  whitespace run, so a body described as "2201 characters with its only
 *  blank line at 9%" is exactly that and the numbers in a report are the
 *  numbers in the test.
 *  @param {string} s @param {number} target @returns {string} */
function exactly(s, target) {
  if (s.length === target) return s;
  if (s.length > target) {
    const cut = s.slice(0, target);
    // Never leave a trailing space: it would move `rfind(" ")` and the shape
    // being asserted is where the *last* space is.
    return cut.replace(/\s$/, 'x');
  }
  return s + 'x'.repeat(target - s.length);
}

/** The hand-picked shapes. Each one exists because some prose description of
 *  the cut gets it wrong, and the name says which branch it exercises.
 *  @param {number} limit @returns {{name: string, body: string}[]} */
export function namedBodies(limit = 1500) {
  const rnd = mulberry32(0xb0a2d);
  const pct = (p) => Math.round(limit * (p / 100));

  /** A body whose only blank line sits at `p` per cent of the limit, followed
   *  by one unbroken block that runs past the limit. */
  const breakAt = (p, total) => {
    const head = block(rnd, pct(p) - 2);
    const tail = block(rnd, total);
    return exactly(head + '\n\n' + tail, total);
  };

  return [
    // Ursa/exo's reproduction, 2026-11-02: block-sum predicts 200, the host
    // delivers 1496. The shape the whole exchange turned on.
    { name: 'only-break-at-9pc', body: breakAt(9, 2201) },
    // The 60% guard, from just inside to just outside. 57% falls through to
    // the last space; 62% takes the block boundary.
    { name: 'only-break-at-57pc', body: breakAt(57, 2000) },
    { name: 'only-break-at-62pc', body: breakAt(62, 2000) },
    { name: 'only-break-at-59pc', body: breakAt(59, 2000) },
    { name: 'only-break-at-61pc', body: breakAt(61, 2000) },
    // Several blocks, all of whose breaks fall early, then one long block.
    // Block-sum predicts the last early break; the host cuts mid-block.
    {
      name: 'many-early-breaks-then-long-block',
      body: exactly([block(rnd, 180), block(rnd, 180), block(rnd, 180),
        block(rnd, 180), block(rnd, 900)].join('\n\n'), 2400),
    },
    // No blank line at all, but spaces: the host falls to the last space.
    { name: 'no-blank-line-has-spaces', body: exactly(block(rnd, 2400), 2400) },
    // No whitespace inside the limit at all: the hard cut at `limit`, which is
    // the only branch that lands mid-word.
    { name: 'no-whitespace-at-all', body: 'z'.repeat(2400) },
    // Boundaries of truncation itself.
    { name: 'exactly-at-limit', body: exactly(block(rnd, limit), limit) },
    { name: 'one-under-limit', body: exactly(block(rnd, limit), limit - 1) },
    { name: 'one-over-limit', body: exactly(block(rnd, limit + 40), limit + 1) },
    // A break inside the limit and another one past it: the second must not
    // be reachable by any model.
    {
      name: 'break-inside-and-break-outside',
      body: exactly(block(rnd, pct(80)) + '\n\n' + block(rnd, 600) + '\n\n'
        + block(rnd, 400), 2600),
    },
    // Trailing whitespace at the cut, which `rstrip()` removes and a model
    // that forgets to rstrip reports one or two characters long.
    {
      name: 'whitespace-run-before-the-break',
      body: exactly(block(rnd, pct(70)) + '   \n\n' + block(rnd, 900), 2300),
    },
    // Windows-style breaks: `\r\n\r\n` contains no `\n\n`, so the host sees no
    // blank line here and falls through. Included because the house voice
    // never produces it and a seat pasting from elsewhere might.
    {
      name: 'crlf-breaks-only',
      body: exactly(block(rnd, pct(70)) + '\r\n\r\n' + block(rnd, 900), 2300),
    },
  ];
}

/** The generated half: `count` bodies of random block structure. Block counts
 *  and lengths are drawn so that both arms of the 60% guard are well
 *  represented rather than left to luck, which a uniform draw does not do:
 *  ordinary prose breaks late and the interesting arm is the early one.
 *  @param {number} count @param {number} limit
 *  @returns {{name: string, body: string}[]} */
export function generatedBodies(count = 200, limit = 1500) {
  const rnd = mulberry32(0x5ea1ed);
  const out = [];
  for (let i = 0; i < count; i++) {
    const blocks = 1 + Math.floor(rnd() * 8);
    // Half the bodies get short blocks (breaks land late, the block-boundary
    // arm) and half get one long block somewhere (breaks land early, the
    // fall-through arm).
    const longOne = rnd() < 0.5 ? Math.floor(rnd() * blocks) : -1;
    const parts = [];
    for (let b = 0; b < blocks; b++) {
      parts.push(block(rnd, b === longOne
        ? 400 + Math.floor(rnd() * 1400)
        : 40 + Math.floor(rnd() * 360)));
    }
    out.push({ name: `gen-${i}`, body: parts.join('\n\n') });
  }
  // Keep only bodies that actually exercise the cut. A body under the limit is
  // delivered whole by every model ever written about it and proves nothing.
  return out.filter((b) => b.body.length > limit);
}

/** The committed corpus: hand-picked shapes first, so a failure report names
 *  a shape a human can reason about before it names `gen-137`.
 *  @param {number} limit @returns {{name: string, body: string}[]} */
export function corpus(limit = 1500) {
  return [...namedBodies(limit), ...generatedBodies(200, limit)];
}
