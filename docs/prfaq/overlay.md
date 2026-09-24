# PR/FAQ — The overlay: Ursa Major's first live surface

Status: draft, awaiting the owner's merge as the go/no-go decision
(docs/standards/pm.md §2c). Source design: docs/design/product-plan.md
§16 ("planned 2026-09-20, not yet built"). This document gates that
plan from entering any sprint until it is merged.

## Press release

**FOR IMMEDIATE RELEASE**

### Ursa Major now watches your work as you do it, and shows you what it learned

Today Ursa Major ships the overlay: a small, always-on-top window that
sits over your terminal while you work with an AI coding agent, and
reads your own reactions straight out of the conversation, the same way
a person who knows you would.

Every builder who uses an AI agent has typed some version of "yesss
finally" or "no, that's not it, try again" without ever filling out a
survey about it. That reaction already contains the verdict. Until now,
nothing captured it. Ursa Major's resolver could tell you what
survived in your code, but not why you accepted it, and it needed you
to finish the project and run a command afterward.

The overlay closes that gap while you work, not after. Point it at one
project. It tails that project's session log locally, on your machine,
and shows you three things in real time: a plain-language read of
whether your last exchange landed ("reads as satisfied at step 42," or
"no verdict yet" when it genuinely can't tell), the tuning it has
already learned from you for this project, and a `run` button that
produces the full provenance record on demand. There are no buttons for
"good" or "bad." The overlay never asks you to rate anything. It only
tells you what it read, and lets you correct a misreading the same way
you'd correct anyone: by saying so, in the conversation.

"I wanted something that watched the way a person would, not something
that stopped me to fill out a form," said Alexandra, Ursa's founder.
"The overlay reads the trace instead of interrupting it. That's the
whole idea of Ursa in miniature: your preferences are already visible
in how you actually work. We just have to look."

Getting started takes one command: `ursa bridge <project>`, then open
the overlay page in a small pinned browser window. It decrypts your own
data with a passphrase only you hold. Ursa's servers never see your
project in the clear, only the encrypted bytes.

"The first time it showed me 'reads as unsatisfied at step 19' right
after I'd typed something grumpy and moved on, I actually stopped and
went back to fix the thing properly instead of letting it slide," said
an early user. "It caught a correction I would have otherwise just
lived with."

The overlay is available today to anyone running Ursa Major locally.

## Customer FAQ

**What does it cost?**
Nothing. Ursa Major is free, permanently, by design (CLAUDE.md §0). The
overlay is part of Ursa Major.

**What does it watch?**
Exactly one project, the one you point it at with `ursa bridge
<project>`. It never reads a project you haven't named, and it stops
watching the moment you close it. It is not a background daemon; it
runs only while you have it open (ADR-003's launch-based rule extended,
not replaced).

**Does it see my code or my conversation?**
The raw text is read in only one place: the bridge process on your own
machine. Everything that leaves your machine is encrypted first, with a
key derived from a passphrase only you hold. Ursa's servers store and
serve ciphertext; they cannot read it.

**Does it ask me to rate the AI's work?**
No. It reads your existing words in the conversation and shows what it
read. If it misreads you, you correct it the same way you'd correct
anyone, by saying so in the chat. That correction becomes part of the
trace itself.

**What if it gets my verdict wrong?**
It will, sometimes. It tells you when it isn't sure ("no verdict yet"
rather than guessing), and every reading shows the exact quote it based
the call on, so you can see why. A `misread?` control opens that quote.

**Can I turn it off or delete what it captured?**
Yes. Close the window and the bridge stops. Delete the local `.ursa/`
directory and the synced ciphertext, and nothing is left, per Ursa's
standing no-dark-patterns rule (CLAUDE.md §0, load-bearing constraint
2).

**Does this change how Ursa Minor uses my data?**
No. The overlay changes how a record gets captured, not what happens
to it afterward. The same consent and aggregation rules in CLAUDE.md
§0 and §3 (Ursa Minor BMC) apply unchanged.

**What do I need to run it?**
A Mac today (the bridge is a local process launched the same way `ursa
run` is), a browser for the page, and a project whose AI agent writes
its session log where Ursa Major already knows to look (Claude Code
today; product-plan.md §13 tracks other tools).

## Internal FAQ

**What has to be true for this to work?**
Three things, in order of risk: (1) the verdict reader (§16.3) has to
read "yesss finally" and "i was dissatisfied with that product" style
language reliably enough that "no verdict yet" stays the honest
minority case, not the common one — this is unproven past the n=1
anecdote in product-plan.md §16.1; (2) the encrypted sync round-trip
(bridge → blob storage → browser decrypt) has to work without ever
handing Ursa's servers a plaintext byte, which is a new infrastructure
surface, not an extension of the CLI; (3) the owner (as the first and
so-far-only user) has to actually leave it open during real sessions
for it to capture anything, which is a habit, not a feature.

**What breaks if the verdict reader is wrong?**
A false "reads as satisfied" is the expensive direction: it would tell
`deriveSignals` a loop closed when it didn't, polluting exactly the
signal Ursa Minor sells (CLAUDE.md §1: "the label is supplied by the
artifact rather than a grader"). The design already defends against
this by defaulting to `undeclared` on silence (product-plan.md §16.3,
the 2026-09-19 rule) rather than inferring from retention. That default
must ship before any real capture does; it is not optional polish.

**What does it cost?**
Two new pieces of paid infrastructure not in Ursa's current $0 stack:
Vercel Blob and Neon (`sync_blobs`), both named in product-plan.md §12.
Per docs/standards/pm.md §9, new paid services need a ledger proposal
and the owner's merge, and a line in the HQ shared-services register,
before sign-up. This PR/FAQ is not that proposal; a ledger entry citing
this file is the next step if the owner greenlights the overlay.

**What are the dependencies on owner-only action?**
Standing up the Vercel + Neon accounts (secrets only the owner can
create, per every seat's boundary); choosing and remembering the
passphrase, since Ursa never stores it and losing it means losing
access to that project's synced data with no recovery path — this is
the sharpest edge in the design and belongs in the customer FAQ once
non-owner users exist, not only here.

**Why now rather than later?**
Every trial to date (n=1, n=2) captured the verdict after the fact, by
asking or by inferring from a commit. product-plan.md §16.1 names the
actual gap: the n=1 trace already contained explicit satisfaction
language that nothing captured live. KR1.3 (five-plus outcome records,
prose and multi-source) does not require the overlay, and should not
wait for it. The overlay is what turns capture from a launched command
into a lived-in habit, which is what a corpus past n=5 will need. It is
sequenced behind KR1.2 and KR1.3 in the O1 plan, not ahead of them.

**What does not ship in v0 of the overlay, even if approved?**
Anything beyond Claude Code sessions (product-plan.md §13's other
rows), anything beyond one project at a time, and any UI control that
asks the owner to rate rather than read her own words back to her. All
three are explicit non-goals in the source design (§16.1, §16.5) and
should stay that way unless a future PR/FAQ argues otherwise.

## Decision

Not yet made. Owner's merge of this file is the go decision per
docs/standards/pm.md §2c. Until then, product-plan.md §16 is a design,
not a backlog item, and no sprint should carry it.
