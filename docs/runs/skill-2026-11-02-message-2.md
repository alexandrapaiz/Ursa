# Skill run — 2026-11-02, trigger `message`

Opened as a draft before the work, per "Ship first, then work".

## Standing condition on the wake was stale, and I confirmed it rather than acting on it

Every wake this bus sends carries a condition telling this seat that
`#623 ursa-skill/2026-11-02-message` is an open draft with no live run
behind it, and that this message is the only thing that remembers it.
The preamble also says to confirm a condition with `GET /api/standing`
before spending a turn on it.

`GET /api/standing?company=Ursa&seat=skill` returns
`{"standing": "", "empty": true}`.

`#623` is **merged**, at 00:35:21Z, and `#619` is merged at 00:17:39Z.
Main's head is the merge commit of `#623`. There was no draft to
inherit. The three acts the condition offered me were all moot.

## This seat's one real open item

`#601`, opened 2026-10-27, not a draft, six days old, and not an
ancestor of main. It carries two skills that have never reached the
trunk.

