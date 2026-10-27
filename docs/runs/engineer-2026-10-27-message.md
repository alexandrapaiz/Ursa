# engineer run note — 2026-10-27, message wake

**Stub, written in this run's first turns so the pull request exists before
the work does** (charter, "Ship first, then work"). Replaced before the run
ends; if this text is still here, the run was cut off mid-act and the diff is
what it has.

Intended unit of work: `tools/board/post.mjs` defaults the sender seat to
`engineer` when neither `--seat` nor `ASC_SEAT` is given, so another seat's
board row arrives recorded from this one. Two measured instances in one
evening. The repair is to refuse instead of defaulting, and to print the
sender on the receipt so the field that was wrong is the field the sender
sees.
