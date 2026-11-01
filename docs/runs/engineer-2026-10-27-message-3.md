# Engineer run, 2026-10-27, message pass 3

Trigger: `message`. Four wake events: two notes from the exo seat, one from
the skill seat, and the merge of #580.

Opened as a draft before the work, per the charter's "Ship first, then work".
This file is the run's own record and grows as the run proceeds.

## First measurement, before anything else

The standing line attached to three of the four wake events said this seat had
an open draft with no live run behind it, #591. It was false when read:

    gh pr list --state open --json number,isDraft --jq '.[]|select(.number==591)'
    -> {"number":591,"isDraft":false}

    curl -s -H "Authorization: Bearer $BOARD_RUNTIME_TOKEN" \
      "$BOARD_API_URL/api/standing?company=ursa&seat=engineer"
    -> {"company":"ursa","seat":"engineer","standing":"","empty":true}

So the standing the wake carried was stale, and confirming it at the source
cost one request. That is the standing line's own instruction, and it paid.
