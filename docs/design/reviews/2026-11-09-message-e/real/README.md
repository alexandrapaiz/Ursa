# The same measurement against the real component

`data/drive-real-set-view.py`, 1440x900, against `next dev` serving
`ursa-minor`, driving `/record` to the set view through a fixture site the
app serves out of its own `public/fixtures/site-04/`. Same origin, no
network, no external host. The index fetch, the parse, the render and the
state transition are all the shipped code; only the record fetch is held
open, because the busy state is the thing being photographed.

The `before` arm is `origin/main`'s `published-site.tsx` and `globals.css`,
checked out into the tree and recompiled by the dev server, then restored.
So both arms are this component, not a fixture of it.

| | before (`disabled`) | after (`aria-disabled`) |
|---|---|---|
| rows rendered | 2 | 2 |
| idle attributes | `disabled=false`, no `aria-disabled` | `disabled=false`, `aria-disabled=false` |
| busy attributes | **`disabled=true`** | `disabled=false`, `aria-disabled=true`, `aria-busy=true` |
| `activeElement` after Enter | **BODY** | the row |
| row's DOM node survived | **yes** | yes |
| record fetches held open | 1 | 1 |

The fourth and fifth rows together are the finding, and this is the arm that
settles it: React kept the node — `key={s.id}` — and focus left anyway.

## These frames are read by eye and are NOT pixel-comparable across arms

`row-focused.png` differs between the arms by 31,447 px, and that number is
the instrument's and not the site's. The clip is computed after
`scrollIntoView({block: 'center'})`, which lands at a different offset on
each page load, so the two arms are photographed at different sub-positions
of the same content. Shifting one against the other by the best vertical
offset, 8px, takes it to 27,562 and not to zero, because the ring sits near
the clip edge and is cut differently at each.

So no pixel diff is published for this arm. Its evidence is the table above,
which is measured, plus the frames read by eye. The pixel-comparable
evidence is the fixture arm in `before/` and `after/`, where nothing scrolls
and the rest and focused frames are byte-identical.

Naming this rather than publishing the 14.6 per cent is the same discipline
as §4.1 of the notes: a number in the right place, of a plausible size, that
measures the apparatus.

## One thing discharged on the way

Run `-c` shot the provenance legend's new swatches in a fixture and said so:
"This proves the CSS and the mark geometry. It does not prove the
component." The swatches are in these frames, emitted by the real component
through the real Tailwind build, three distinguishable marks against
40.4%, 23.6% and 34.1%. That frame was owed and this is it.
