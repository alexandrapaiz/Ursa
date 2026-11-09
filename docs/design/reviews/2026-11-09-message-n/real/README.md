# The submit button on `/record`, both arms, against the real page

`../data/drive-submit-busy.py`, 1440x900, against `next dev` serving
`ursa-minor`, driving the real `readSite` path through a fixture site the
app serves out of its own `public/fixtures/site-04/`. Same origin, no
network. The index fetch alone is held open for 2.5s, because `busy` is
the state being photographed and it is the index fetch that sets it.

Both arms are this component. The `before` arm is the tree with
`published-site.tsx` and `globals.css` checked out, recompiled by the dev
server; the `after` arm is the same two files with this run's diff.

| | before | after |
|---|---|---|
| busy attributes | `disabled=true` | `disabled=false`, `aria-disabled=true`, `aria-busy=true` |
| `activeElement` after Enter | BODY | the submit button |
| once the fetch settles | BODY | the submit button |
| Tab presses back | 13 | 0 |
| node identity held | yes | yes |
| index fetches after two Enters | 1 | 1 |
| busy, under the pointer | `rgb(168,199,250)`, underline lit, `not-allowed` | `rgb(112,127,160)`, no underline, `wait` |
| selectors matching while busy | `:hover` `:disabled` | `:hover` `[aria-disabled="true"]` |

The last row is why the row above it counts. The after arm still matches
`:hover` and declines to light up, so the guard was tested in the case
where it has to refuse rather than only in the case where it is absent.

## What the frames show, read by eye

- `real-before-submit-focused.png` and `real-after-submit-focused.png` are
  the resting focused control, `read the site` inside its ring. They are
  the same in both arms and are here as the baseline the next frame is
  read against.
- `real-before-submit-busy-hover.png`: `reading…`, bright, **no ring**.
  Focus has gone to `<body>` and the pointer is lighting a control that
  refuses it.
- `real-after-submit-busy-hover.png`: `reading…`, dim, **ring held**. The
  person is still standing where they pressed.

## Two limitations, stated rather than left to be noticed

**These crops are small.** The clip is the button plus 10px, so each frame
is about 120x40 and roughly a kilobyte. That is legible for the two things
being claimed, the ring and the brightness, and it is not legible for
anything finer. Shooting them larger was affordable and was spent on the
measurement instead; a run that wants to read type or spacing on this
control should reshoot rather than zoom these.

**No pixel diff is published.** The busy label is `reading…` and the idle
label is `read the site`, so the button's own width changes from 100px to
61px between the states. A diff across the arms would be dominated by that
and would measure the label, not the fix.
