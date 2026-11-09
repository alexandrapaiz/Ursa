# Frontend run, 2026-11-09 (fifth message wake, run e)

Every number in this file was taken this run unless it carries another
run's name. A number that is not here was not taken.

## 0. What I took, and why

The wake was the merge of `#783` and asked for the next item in this
seat's lane on the board.

**The lane has nothing open on it.** All fifteen frontend cards are in
Done; the board's other four columns hold no card with `seat=frontend`.
So, as run `-c` did under the same condition, the authority falls back to
this seat's own record of what it owes. Two things were named there:

- `reviews/2026-11-09-message-c/NOTES.md` §5.3: "A frame of the real
  `/record` set view is still owed, and is the first thing to take on a
  run that has disk."
- `reviews/2026-11-09-k/NOTES.md` §3.5: a press state that arrived on
  three invocations out of five, attributed to the set view replacing its
  row nodes, and explicitly handed on: "worth someone's attention on its
  own, and it is not this change's."

They turned out to be one item, and the second one's stated cause is
wrong. That is §2.

## 1. The host, measured before anything was attempted

The charter's run begins with `npm install`. At 04:20Z the volume `/tmp`
and `/srv/asc` share was at 100 per cent with **392M** free, of 45G, and
it is a single filesystem: `/`, `/tmp` and the npm cache are all on
`/dev/sda1`, and about twenty seats' checkouts are on it. The npm cache
held 47M, so an install would have fetched essentially everything.

I did not attempt it at that point, and that is a decision rather than an
omission. Run `-c` did attempt it at a comparable figure and the attempt
"consumed all of it and left the tree half-unpacked", which is the
anti-idempotent failure `runner-facts.md` §18/§82 describes: every repair
in a seat's bootstrap acquires something, so each retry needs more room
than the last. Deciding not to try is the cheaper half of that lesson.

**What made the run possible anyway.** Playwright's chromium (build 1254)
and a Python playwright 1.64.1 are both cached under `/srv/asc/home/`,
outside the checkout, so driving a browser costs no disk at all. Two
things about that path are worth the next run's time:

- **This host is `aarch64`.** The kit's `CHROMIUM_LIBS` prefix is laid out
  under `usr/lib/aarch64-linux-gnu`, not the `x86_64-linux-gnu` the
  launcher's own code joins onto `LD_LIBRARY_PATH`.
- **The full `chrome` binary does not start here and the headless shell
  does.** With the libs prefix on the path, `ldd` reports
  `libatk-bridge-2.0.so.0`, `libcups.so.2`, `libcairo.so.2` and
  `libpango-1.0.so.0` missing from `chrome`, and reports nothing missing
  from `chrome-headless-shell`. So the zero-fetch launch on this host is
  `executable_path=` the headless shell. Six libraries went into
  `CHROMIUM_LIBS` this morning one failed launch at a time; this is four
  more that are not needed at all if the shell is what you launch.

Python playwright 1.64.1 wants build 1248 and 1254 is what is installed,
which is why `executable_path` is passed explicitly rather than letting
the library resolve it.

## 2. The defect, and why the last run's cause for it is not the cause

`components/record/published-site.tsx` renders each record row as

```tsx
<button disabled={opening !== null}>
```

`opening` is one piece of state naming the record being fetched
(`openRecord` sets it, then awaits a `fetch`, then clears it in a
`finally`). So activating any row disables **every** row in the list for
the length of a network round trip, including the one the person is
standing on. A disabled button is not focusable, so the browser takes
focus off it and puts it on `<body>`.

Measured at 1440x900, activating row 2 of 3 from the keyboard, each arm
over the stylesheet that arm actually had:

| | `disabled` | `aria-disabled` |
|---|---|---|
| `document.activeElement` after Enter | **BODY** | the row |
| still BODY once the fetch settles | **yes** | — |
| Tab presses back to that row | **7** | **0** |
| the row's DOM node survives the change | yes | yes |

Row 2 of 3, so that a focus loss could not be read as the top of the
list. Seven is what two rows of two stops each cost with the address
field ahead of them; on a real index it is however long the list is.

### 2.1 The last row of the table is what the table is for

Run `k` saw a press state arrive three times in five and attributed it to
the set view replacing its row nodes when the fetched index lands. The
rows carry `key={s.id}` (`published-site.tsx:364`), so React's reconciler
keeps the node across this state change. The fixture holds node identity
— asserted, not assumed — and reproduces the focus loss anyway.

**So the cause named is not the cause.** The attribute is, and the flake
run `k` saw through a pointer is this same defect.

### 2.2 I built the fixture twice, and the first one would have agreed with the wrong answer

The first version re-rendered the list with `innerHTML` on every state
change. That destroys focus **by itself**, in both arms, because it
replaces the node focus was on. It would have reported a focus loss under
`disabled`, reported one under `aria-disabled` too, and the honest reading
of that pair is run `k`'s hypothesis. The second version builds the list
once and only ever sets and removes attributes, which is what the
reconciler does.

A fixture that reproduces the symptom is not evidence about the cause
unless it rules out the other cause first. This one does it with an
assertion rather than with a paragraph, because the next reader will
change the fixture before they change the paragraph.

## 3. The fix

`aria-disabled` plus a guard in the handler. The control keeps its focus,
keeps its place in the accessibility tree, and still refuses the second
activation; the refusal moves from the browser into one line.

**The CSS half was load-bearing.** Six rules guarded `.rec-row`'s hover
and press wash with `:not(:disabled)`. Once the attribute changes,
`:disabled` matches nothing on that control, so all six become guards that
can never fire. Nothing about that is visible: the resting page is
identical and only a pointer held over a busy row shows it.

`data/check-wash-guard.py` asserts the guard from both sides in both arms
— idle+hover and idle+press wash, busy+hover and busy+press do not —
twelve assertions. **Two of them fail when the old guard is restored**,
which is the only reason the other ten mean anything. A guard that never
matches and a guard that always passes produce the same frame, which is
L61's and L63's shape in a third medium.

### 3.1 One thing moved out of Tailwind, and the reason is a limitation of this run

`disabled:cursor-wait` was a Tailwind utility on the button. The natural
replacement is `aria-disabled:cursor-wait`, and I could not build the
stylesheet to see whether that variant was emitted, so I did not ship a
class I could not watch compile. The rule is declared in `globals.css`
beside the control's other states instead. If a later run with a working
build prefers the utility, the value is unchanged and the move is a
one-liner either way.

## 4. The frames

`before/` against `after/`, by `review-kit/diff-frames.py`:

| frame | before vs after |
|---|---|
| `row-rest.png` | **0 px, identical** |
| `row-focused.png` | **0 px, identical** |
| `row-activated.png` | 2513 px, 4.040%, rows 2-61, cols 2-969 |

Only the busy state moves. Read by eye as well as diffed: in `before`, the
ring and the id's underline both vanish the instant Enter is pressed while
the row says "— fetching…", so the person is told the row is working and
told nothing about where they are. In `after` both survive.

### 4.1 An instrument that was wrong before the site was

The first pass reported **367 px** on the focused frame, which should be
identical between arms. Every one of those pixels was on one row, under
the id, and every one was a single step on a single channel:
`(115,136,173)` against `(115,137,174)`. That is the 160ms
`text-decoration-color` fade photographed at two instants, not a
difference in what is drawn. The shot now settles past the transition and
reads zero.

L48's determinism floor, arriving on a frame that has a declared
transition on it. Worth saying plainly because the number was small,
plausible, and in the right place to be read as a real regression in the
focus ring.

## 4.2 The disk came back, and the real component was reached after all

At 04:36Z the volume read 2269M free, having been at 392M sixteen minutes
earlier; other seats had finished. So the install was attempted at that
point and succeeded, 611 packages in three minutes, and §1's decision cost
nothing because the increment had already shipped without it.

`real/` is the same measurement against the shipped React, driven to the
set view through a fixture site the app serves out of its own `public/`.
The `before` arm is `origin/main`'s two files checked into the tree and
recompiled, then restored, so both arms are this component:

| | before | after |
|---|---|---|
| busy attributes | **`disabled=true`** | `aria-disabled=true`, `aria-busy=true` |
| `activeElement` after Enter | **BODY** | the row |
| row's DOM node survived | **yes** | yes |

**Node identity holds in the real component too.** That is what moves §2.1
from an argument about the reconciler to a measurement of it.

`real/README.md` says why no pixel diff is published for this arm, and
records one thing discharged on the way: run `-c` owed a frame of the
provenance legend's swatches from the real component rather than a fixture,
and these frames have it.

### Three traps between a dev server and a driven page

All three present as a broken page rather than a waiting one, and none logs
anything that names itself. They are in the drive script's header and in the
kit README.

- **`localhost`, never `127.0.0.1`.** Next refuses dev requests from an
  origin outside `allowedDevOrigins`, so the client runtime never starts and
  the page stays as server HTML. Typed text lands in the DOM, `address`
  state stays empty, and `disabled={busy || !address}` holds the submit
  button down forever. The only symptom is a failed HMR websocket.
- **The address field cannot be clicked.** `.rec-field` is a label overlay
  carrying the 44px press, so a click at the input's own box is intercepted
  and times out. Focus it and type. This is the kit's own L29 met live.
- **`/record` has two address forms.** A bare `button[type="submit"]`
  resolves to two elements and takes the other one, which is disabled for
  the same reason, so the failure reads as a hung page.

## 5. What this run did not do

- **No second interaction refinement**, though the charter allows two.
  The same file's `readSite` submit button is `disabled={busy}` and has
  the same defect at a smaller size: one stop lost instead of seven, and
  the form's `onSubmit` would need the same guard. It is recorded in L65
  and left. Three consecutive runs of this seat were killed at the
  60-minute wall by attempting the whole charter in one hour.
- **No web trip, and no external source of any kind was read.** L32 is
  decided law on the hover question and run `k` discharged the benchmark
  by audit this morning.
- **The three charter files still do not exist.** `canon.md`,
  `ban-list.md` and `tuning.md` are named in the charter as law and none
  is in this repository. Fourteen reviews have recorded it and Ursa's PM
  has it open with the owner; this run confirms it still holds and does
  not re-argue it. Nothing here introduces a colour, a value outside what
  the file already used, or a dependency.
