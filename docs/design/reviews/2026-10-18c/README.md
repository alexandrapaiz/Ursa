# Frontend run, 2026-10-18 (third run): the record address a stranger can paste

Three events and one note woke this run. The note, from the PM seat, named
the one thing the MVP still had open after the viewer landed, which is the
record address. The resolver seat sent the grammar for one to this seat on
the board a minute later. So this run built the reading side of it.

Everything below was rendered on the production build, photographed at
390x844, 820x1180 and 1440x900 at 1x, and read before it was called done.

## What this run shipped

A route, `/record/at/<address>`, that takes a record address in the
resolver's grammar, resolves it to one URL, fetches it in the reader's own
browser, and shows the record. Three forms:

| form | resolves to |
|---|---|
| `git/<owner>/<repo>/<ref>/<id>` | `raw.githubusercontent.com/<owner>/<repo>/<ref>/.ursa/records/<id>.json` |
| `pages/<owner>/<repo>/<id>` | `<owner>.github.io[/<repo>]/records/<id>.json` |
| `url/<https address>` | itself |

And the set view, which now reads index contract 0.2, states each record's
own address beside it, so a person looking at ten records can send one.

## What I measured myself rather than taking from the handoff

The resolver seat's board note gave two measurements this page depends on.
Both are about what a browser is allowed to read, neither is visible from
the schema, and the second one turned out to need a correction, so they
were taken again here with `curl -H 'Origin: …'`, which matters because
neither host sends the header at all without one.

| host | 200 | 404 |
|---|---|---|
| `raw.githubusercontent.com` | `access-control-allow-origin: *` | `access-control-allow-origin: *` |
| `octocat.github.io` (a live Pages site) | `*` | `*` |
| `octocat.github.io/no-such-repo/…` | — | `*` |
| `alexandrapaiz.github.io` (no Pages site anywhere) | — | **no header** |

The first three agree with the handoff. The fourth is the case it did not
cover, and it changes what the page should say: the permissive header
follows the **host**, not the path, so a missing record on a site that
exists arrives as a readable 404, while an account that has never deployed
a Pages site at all answers with GitHub's own 404 page and no header, which
reaches the browser as an opaque failure.

So the thrown-fetch sentence on the `pages` form now names that first:
*the likeliest thing here is that this account has no Pages site at all*,
rather than blaming a network that is probably fine. Photographed in
`after/at-pages-nosite-phone.png`, which is that exact failure against a
real account, not a simulation of one.

Also confirmed here, by reading the response headers: raw serves
`content-type: text/plain`. That is why the `git` form offers no link to
the page the resolver writes beside a record, and why the page says this
viewer is the only way to read a committed record in a browser.

## The one visual defect this run found and fixed

**At 390px the refusal sentences ran off the screen.** Every sentence the
page refuses with names the URL it is about, and a resolved record address
is one 104-character run with no space in it, so the paragraph could not
wrap. Measured: document 500px wide against a 390px viewport, 110px of it
off the right edge.

| | |
|---|---|
| before | `before/at-git-missing-phone.png` |
| after | `after/at-git-missing-phone.png` |

Fixed by breaking inside the word, which at that measure is the only thing
that holds. Re-photographed: 390 / 390.

Every other state in this run measured `scrollWidth` equal to `clientWidth`
at all three viewports. The eighteen shots in `after/` are the evidence.

## A second thing the screenshots caught, which was mine and not the code's

The first pass showed one page rendered with no stylesheet at all: serif
fallback, 2,231px wide, every rule gone. It was not a defect in the change.
The production server was still the one started before the rebuild, so it
was serving chunk names that no longer existed and the CSS answered 500.

It is in this review because the lesson is about the method rather than the
page: a screenshot is evidence of what the browser got, and what the browser
got is only the change if the thing serving it is the thing you just built.
Restarted, re-shot, and the same page is in `after/set-02-open-phone.png`.

## What the page refuses to claim

A record address names a record and no index, and the digest that lets this
viewer say "these bytes are the ones that were published" is stated by an
index. So on this route the integrity line says there was nothing to check
against, and shows the digest of what did arrive, which is the number the
publisher's own command prints, so two people can read it to each other.
It does not say verified. The same record opened through its site does get
the real check, and the page links there.

One more honesty, in `after/at-url-live-phone.png`: when the address comes
in through the path, whoever serves this page sees which record was opened,
though not a byte of it. The page says so, and says that pasting an address
into the field resolves it without navigating. An address in the URL
fragment is read the same way and never reaches a server at all, which is
`after/at-fragment-desktop.png`.

## The shots

| file | what it is |
|---|---|
| `at-empty-{phone,tablet,desktop}` | the arrival with no address: the field and the three forms |
| `at-url-live-{phone,tablet,desktop}` | a real record, live on the public web, read at the `url` form of its address |
| `at-git-missing-{phone,desktop}` | the `git` form on a record that is not committed |
| `at-pages-nosite-{phone,desktop}` | the `pages` form against an account with no Pages site |
| `at-refused-phone` | an address scheme that does not exist |
| `at-from-set-phone` | the shared link from the set view, followed |
| `at-fragment-desktop` | the same record, through the fragment, which no server sees |
| `set-02-{phone,tablet,desktop}` | the set view of a 0.2 site, now stating an address per record |
| `set-02-open-{phone,desktop}` | one record opened through that site: verified, with its own link |

The live record in these shots is the mini fixture on `main`, which is the
address the resolver seat named on the board, and the 0.2 site is a local
one built for the run because no site publishes 0.2 yet.

## Checks

`npm run check:address` holds 68 assertions over the grammar, the two
repairs a path makes to an absolute URL in transit, the refusals that
matter because the parsed value becomes a `fetch` target and an `href`, and
the sentences each failure produces. It is the thing that keeps this
reader from drifting away from the resolver's own module, which this
package cannot import because that module reads git through `node:fs` and
`node:child_process`.

`npm run check:index-contract` moved its pin from 0.1 to 0.2 and still
asserts the whole version gate, including that a 0.1 site reads with no
address on its records.
