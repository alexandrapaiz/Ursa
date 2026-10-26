'use client'

// The tuning dashboard: the surface where the owner reads what Ursa has
// concluded about her, sees the evidence under each conclusion, and is
// handed the way to withdraw one.
//
// WHAT IT IS AND IS NOT. It is a reader. `src/serve.ts` serves the store
// the resolver wrote and every route on it is a GET, by a decision that
// file states at length: the resolver writes the store and the server
// shows what the resolver wrote. So this page never writes. Where a
// revoke button would go, it discloses the command that revokes
// (`ursa consent revoke-axiom`), which already exists and is the only
// door revocation has. A button that cannot work is worse than a line of
// text that does.
//
// WHY IT READS LOOPBACK AND NOT A BUILD-TIME FIXTURE. The board item
// this answers asks for "a real local web app rather than a static
// mock", and the reason is in src/serve.ts's own note: a mock is the one
// thing that cannot prove the chain works. Everything below is drawn
// from one fetch of /store, whose shape is `StorePayload` in
// ursa-major/src/serve.ts. If that shape changes this page breaks
// visibly, which is the correct failure.
//
// WHY NOTHING POLLS. The panel polls because it is watching a live
// session. This is a reading surface for a store that changes only when
// the owner runs the resolver, and a page that re-fetches under her while
// she reads a statement is a page that moves. `reread` is a control she
// presses, which is also the honest answer to "is this current": the
// payload carries `readAt` and the header shows it.

import { useCallback, useEffect, useState } from 'react'
import './dashboard.css'

type SpanClass = 'survived_verbatim' | 'survived_mutated' | 'no_generation_provenance'

/** `ResolverIdentity` in ursa-major/src/types.ts, both arms. */
type ResolverIdentity =
  | { basis: 'git_commit'; commit: string; dirty?: boolean }
  | { basis: 'bundle_digest'; bundleDigest: string }
  | { basis: string; [k: string]: unknown }

interface TuningUnit {
  id: string
  statement: string
  domain: string
  polarity: 'prefer' | 'avoid'
  basis: 'stated' | 'tacit' | 'mixed'
  evidenceCount: number
  tension: boolean
  contradicts: string[]
  status: 'active' | 'user-edited' | 'revoked'
  firstSeen: string
  lastSeen: string
}

interface RecordSummary {
  id: string
  artifactKind: string
  generatedAt: string
  finished: boolean
  accepted: boolean | null
  finalChars: number
  coveredChars: number
  charsByClass: Record<SpanClass, number>
  humanDeletedChars: number
  distilled: boolean
  resolvedBy: ResolverIdentity | null
}

interface StorePayload {
  schemaVersion: string
  project: string
  store: string
  storeExists: boolean
  readAt: string
  recordCount: number
  records: RecordSummary[]
  tuning: TuningUnit[]
}

const DEFAULT_PORT = 7818

/** A whole number with thin separators, never a locale's commas, because
 *  the figures sit in a tabular-nums column beside each other. */
function n(value: number): string {
  return value.toLocaleString('en-US')
}

/** One decimal always, which is the formatter the record viewer settled
 *  on for a column: `24%` under `41.2%` shifts every digit two cells. */
function pct(part: number, whole: number): string {
  if (whole <= 0) return '—'
  return `${((part / whole) * 100).toFixed(1)}%`
}

function day(iso: string): string {
  return iso.slice(0, 10)
}

function clock(iso: string): string {
  return iso.slice(11, 19)
}

/** `ax-003` out of a resolver identity, short enough for a row. */
function resolver(r: ResolverIdentity | null): string {
  if (!r) return 'no resolver identified'
  if (r.basis === 'git_commit' && typeof r.commit === 'string') {
    return `commit ${r.commit.slice(0, 7)}${r.dirty ? ' (dirty tree)' : ''}`
  }
  if (r.basis === 'bundle_digest' && typeof r.bundleDigest === 'string') {
    return `bundle ${String(r.bundleDigest).slice(0, 12)}`
  }
  return String(r.basis)
}

/** Characters in the finished work that no span covered at all. */
function uncovered(r: RecordSummary): number {
  return Math.max(0, r.finalChars - r.coveredChars)
}

/**
 * The three painted segments. The fourth quantity, `uncovered`, is the
 * bare track they are laid on, so it needs no fill and gets none: the
 * bar's width is always the whole finished work, and what is painted is
 * what some span accounted for. The stylesheet's note says why four
 * fills cannot be told apart in this palette.
 *
 * `flexGrow` is the character count and `flexBasis` is 0, so the
 * segments divide the track in exact proportion to the figures printed
 * under them.
 */
function segments(r: RecordSummary) {
  return [
    { key: 'verbatim', cls: 'dash-seg-verbatim', chars: r.charsByClass.survived_verbatim },
    { key: 'mutated', cls: 'dash-seg-mutated', chars: r.charsByClass.survived_mutated },
    { key: 'none', cls: 'dash-seg-none', chars: r.charsByClass.no_generation_provenance },
  ].filter((s) => s.chars > 0)
}

/** The pairs behind the tension review, each one once. A contradicts B
 *  and B contradicts A are one question, not two. */
function tensionPairs(units: TuningUnit[]): [TuningUnit, TuningUnit][] {
  const byId = new Map(units.map((u) => [u.id, u]))
  const seen = new Set<string>()
  const pairs: [TuningUnit, TuningUnit][] = []
  for (const u of units) {
    if (u.status === 'revoked') continue
    for (const otherId of u.contradicts) {
      const other = byId.get(otherId)
      if (!other || other.status === 'revoked') continue
      const key = [u.id, other.id].sort().join('|')
      if (seen.has(key)) continue
      seen.add(key)
      pairs.push([u, other])
    }
  }
  return pairs
}

export default function Dashboard() {
  const [payload, setPayload] = useState<StorePayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [port, setPort] = useState(DEFAULT_PORT)
  const [openRevoke, setOpenRevoke] = useState<string | null>(null)
  const [openForget, setOpenForget] = useState<string | null>(null)

  // The port is read once from the query string rather than from an
  // input, because `ursa serve --port N` is where the number is already
  // chosen and a second place to type it is a second place to get it
  // wrong.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('port')
    const parsed = q ? Number(q) : NaN
    if (Number.isInteger(parsed) && parsed > 0 && parsed < 65536) setPort(parsed)
  }, [])

  const read = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await fetch(`http://127.0.0.1:${p}/store`, { cache: 'no-store' })
      if (!res.ok) {
        setError(`the store server answered ${res.status}`)
        return
      }
      setPayload((await res.json()) as StorePayload)
      setError(null)
    } catch {
      // A fetch to loopback that throws is almost always nothing
      // listening, which is a thing the owner can fix in one line. Say
      // that rather than "failed to fetch".
      setError('nothing is listening')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void read(port) }, [read, port])

  const serveCmd = `ursa serve <your project>${port === DEFAULT_PORT ? '' : ` --port ${port}`}`

  if (error) {
    return (
      <div className="dash">
        <div className="dash-page">
          <h1>No store to read</h1>
          <p className="dash-empty">
            {error} on 127.0.0.1:{port}. This page reads the store your own
            machine already holds, so it needs the command that serves it.
            Nothing here reaches the network.
          </p>
          <code className="dash-cmd dash-mono">{serveCmd}</code>
          <p style={{ marginTop: '1.5rem' }}>
            <button className="dash-action dash-hit dash-mono" onClick={() => void read(port)}>
              {loading ? 'looking…' : 'look again'}
            </button>
          </p>
        </div>
      </div>
    )
  }

  if (!payload) {
    return (
      <div className="dash">
        <div className="dash-page">
          <h1>Reading your store</h1>
          <p className="dash-empty dash-mono">127.0.0.1:{port}</p>
        </div>
      </div>
    )
  }

  const active = payload.tuning.filter((u) => u.status !== 'revoked')
  const revoked = payload.tuning.filter((u) => u.status === 'revoked')
  const pairs = tensionPairs(payload.tuning)
  // `tension` on the payload is `contradicts.length > 0`, which stays
  // true after the other side of the contradiction is withdrawn. Marking
  // a row from that would print "in tension" on a row with no entry in
  // the review below it, so the mark is derived from the live pairs.
  const inTension = new Set(pairs.flatMap(([a, b]) => [a.id, b.id]))

  return (
    <div className="dash">
      <div className="dash-page">
        <header className="dash-head">
          <h1>{payload.project}</h1>
          <p className="dash-meta dash-mono">
            {payload.store}/ · {n(payload.recordCount)} record{payload.recordCount === 1 ? '' : 's'} ·{' '}
            {n(active.length)} unit{active.length === 1 ? '' : 's'}
            <br />
            read at {clock(payload.readAt)} ·{' '}
            <button className="dash-action dash-hit dash-mono" onClick={() => void read(port)}>
              {loading ? 'rereading…' : 'reread'}
            </button>
          </p>
        </header>

        {!payload.storeExists && (
          <p className="dash-empty">
            This project has never been resolved, so there is no store yet.
            That is an honest empty and not an error: run the resolver once
            and reread this page. Nothing on it is cached.
          </p>
        )}

        {/* ---------- the tuning units ---------- */}
        <section className="dash-section">
          <h2>What Ursa has concluded about you</h2>
          {active.length === 0 ? (
            <p className="dash-empty">
              Nothing has been distilled for this project yet. The units
              appear here after the interpretation pass has read a record;
              until then this page has records to show you and no
              conclusions, which is the right way round.
            </p>
          ) : (
            <div style={{ marginTop: '1.25rem' }}>
              {active.map((u) => (
                <article key={u.id} className={`dash-row dash-row-stated${inTension.has(u.id) ? ' dash-tension' : ''}`}>
                  <p className="dash-statement">
                    <span className="dash-tag">{u.polarity}</span>
                    <span className="dash-statement-text">{u.statement}</span>
                  </p>
                  <p className="dash-meta dash-mono">
                    {u.domain} · {u.basis} · evidence ×{n(u.evidenceCount)} ·{' '}
                    {day(u.firstSeen) === day(u.lastSeen) ? (
                      <span className="dash-nowrap">{day(u.firstSeen)}</span>
                    ) : (
                      <>
                        <span className="dash-nowrap">{day(u.firstSeen)}</span> to{' '}
                        <span className="dash-nowrap">{day(u.lastSeen)}</span>
                      </>
                    )}
                    {u.status === 'user-edited' ? ' · edited by you' : ''}
                    {inTension.has(u.id) ? <span className="dash-tag-mark"> · in tension</span> : ''}
                    {' · '}
                    <button
                      className="dash-action dash-hit dash-mono"
                      aria-expanded={openRevoke === u.id}
                      onClick={() => setOpenRevoke(openRevoke === u.id ? null : u.id)}
                    >
                      withdraw this
                    </button>
                  </p>
                  {openRevoke === u.id && (
                    <>
                      <p className="dash-ask">
                        Withdrawing keeps the statement on your machine as a
                        tombstone and stops it being applied or disclosed. The
                        tombstone is what stops a later pass from concluding it
                        again, and it is the receipt that your withdrawal held.
                      </p>
                      <code className="dash-cmd dash-mono">
                        ursa consent revoke-axiom &lt;your project&gt; --axiom {u.id}
                      </code>
                    </>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ---------- the tension review ----------

            It asks rather than averaging. Two statements that contradict
            each other are not a mean of each other, and a dashboard that
            resolved them silently would be inventing a preference she
            never expressed. So both are shown whole, and the only thing
            offered is the way to withdraw either one. */}
        {pairs.length > 0 && (
          <section className="dash-section">
            <h2>Two things that cannot both be you</h2>
            {pairs.map(([a, b]) => (
              <article key={`${a.id}|${b.id}`} className="dash-row dash-row-stated">
                <p className="dash-ask">
                  These two contradict each other. Ursa has not picked between
                  them and will not average them, because the average is a
                  preference you never stated.
                </p>
                {[a, b].map((u) => (
                  <div key={u.id} style={{ marginTop: '0.9rem' }}>
                    <p className="dash-statement">
                      <span className="dash-tag">{u.polarity}</span>
                      <span className="dash-statement-text">{u.statement}</span>
                    </p>
                    <p className="dash-meta dash-mono">
                      {u.domain} · {u.basis} · evidence ×{n(u.evidenceCount)}
                    </p>
                    <code className="dash-cmd dash-mono">
                      ursa consent revoke-axiom &lt;your project&gt; --axiom {u.id}
                    </code>
                  </div>
                ))}
              </article>
            ))}
          </section>
        )}

        {/* ---------- the tombstones ----------

            Shown under their own heading rather than struck through in
            the list above, in evidence order with the live ones. The
            server sorts by evidence count, so a withdrawn statement with
            a lot of evidence behind it would otherwise sit above live
            ones, which reads as current. A tombstone is a receipt and
            belongs where a receipt belongs. */}
        {revoked.length > 0 && (
          <section className="dash-section">
            <h2>Withdrawn, and kept as the receipt</h2>
            <p className="dash-empty">
              These are no longer applied and are never disclosed. They stay
              on your machine so a later pass cannot conclude them again.
            </p>
            <div style={{ marginTop: '1.25rem' }}>
              {revoked.map((u) => (
                <article key={u.id} className="dash-row dash-row-stated dash-revoked">
                  <p className="dash-statement">
                    <span className="dash-tag">{u.polarity}</span>
                    <span className="dash-statement-text">{u.statement}</span>
                  </p>
                  <p className="dash-meta dash-mono">
                    {u.domain} · withdrawn · last seen{' '}
                    <span className="dash-nowrap">{day(u.lastSeen)}</span>
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ---------- the records ---------- */}
        <section className="dash-section">
          <h2>The work these conclusions came from</h2>
          {payload.records.length === 0 ? (
            <p className="dash-empty">
              No records in {payload.store}/ yet. A record is written when the
              resolver finds a generation and a finished piece of work it can
              join, so a project with no agent commits in its history has
              nothing here and nothing is wrong.
            </p>
          ) : (
            <>
              <div className="dash-legend" style={{ marginTop: '1rem' }}>
                <span><i className="dash-swatch dash-seg-verbatim" /> kept as written</span>
                <span><i className="dash-swatch dash-seg-mutated" /> kept and edited</span>
                <span><i className="dash-swatch dash-seg-none" /> yours, no generation behind it</span>
                <span><i className="dash-swatch dash-swatch-track" /> covered by no span</span>
              </div>
              <div style={{ marginTop: '1.25rem' }}>
                {payload.records.map((r) => {
                  const segs = segments(r)
                  // A record whose finished work has no characters has no
                  // shares to show, and every figure on the line below is
                  // `pct`'s `—`. Four dashes under a full empty track read
                  // as a row that failed to load, and the track is worse
                  // than silent: the legend calls a bare track "covered by
                  // no span", so the bar asserts 100% of something while
                  // the figures beside it refuse to say anything at all.
                  // Both come out, and the row says the one thing it knows.
                  const empty = r.finalChars === 0
                  return (
                    <article key={r.id} className="dash-row">
                      <p className="dash-mono" style={{ fontSize: '0.8rem', lineHeight: 1.55 }}>
                        {r.id}
                      </p>
                      <p className="dash-meta dash-mono">
                        <span className="dash-nowrap">{day(r.generatedAt)}</span> ·{' '}
                        {r.artifactKind} ·{' '}
                        {r.accepted === true
                          ? 'you declared it satisfied'
                          : r.accepted === false
                            ? 'you declared it unsatisfied'
                            : 'undeclared'}
                        {r.finished ? '' : ' · abandoned'}
                        {r.distilled ? ' · read by the interpretation pass' : ''}
                        {' · '}
                        {resolver(r.resolvedBy)}
                        {' · '}
                        <button
                          className="dash-action dash-hit dash-mono"
                          aria-expanded={openForget === r.id}
                          onClick={() => setOpenForget(openForget === r.id ? null : r.id)}
                        >
                          forget this
                        </button>
                      </p>
                      {!empty && <div
                        className="dash-bar"
                        role="img"
                        aria-label={`of ${n(r.finalChars)} characters: ${pct(
                          r.charsByClass.survived_verbatim,
                          r.finalChars,
                        )} kept as written, ${pct(
                          r.charsByClass.survived_mutated,
                          r.finalChars,
                        )} kept and edited, ${pct(
                          r.charsByClass.no_generation_provenance,
                          r.finalChars,
                        )} yours with no generation behind it, ${pct(
                          uncovered(r),
                          r.finalChars,
                        )} covered by no span`}
                      >
                        {segs.map((s) => (
                          <span
                            key={s.key}
                            className={s.cls}
                            // Percent of the whole finished work, not of
                            // what was covered: a record the model barely
                            // touched has to draw a nearly empty bar.
                            style={{ width: `${(s.chars / Math.max(1, r.finalChars)) * 100}%` }}
                          />
                        ))}
                      </div>}
                      {empty ? (
                        <p className="dash-meta dash-nothing">
                          No characters in the finished work, so there are no
                          shares to show. Why a record ends up empty is in the
                          record and not in this index.
                        </p>
                      ) : (
                        <p className="dash-meta dash-mono">
                          {n(r.finalChars)} chars ·{' '}
                          {pct(r.charsByClass.survived_verbatim, r.finalChars)} as written ·{' '}
                          {pct(r.charsByClass.survived_mutated, r.finalChars)} edited ·{' '}
                          {pct(r.charsByClass.no_generation_provenance, r.finalChars)} yours ·{' '}
                          {pct(uncovered(r), r.finalChars)} no span
                        </p>
                      )}
                      {/* A separate line because it has a separate whole.
                          Everything above is a share of the finished work;
                          this is a count of generated text that never
                          reached it, so putting them in one sentence
                          invites the reader to add them up. */}
                      <p className="dash-meta dash-mono">
                        and {n(r.humanDeletedChars)} generated characters you saw and did not keep
                      </p>
                      {openForget === r.id && (
                        <>
                          <p className="dash-ask">
                            Forgetting erases this piece of work and anything
                            concluded only from it. A conclusion that also rests
                            on work you have not erased keeps its statement and
                            loses this record&rsquo;s evidence. That is the
                            difference between forgetting work and withdrawing a
                            conclusion.
                          </p>
                          <code className="dash-cmd dash-mono">
                            ursa forget &lt;your project&gt; --record {r.id}
                          </code>
                        </>
                      )}
                    </article>
                  )
                })}
              </div>
            </>
          )}
        </section>

        <hr className="dash-rule" style={{ marginTop: '3rem' }} />
        <p className="dash-empty">
          Everything on this page was read from {payload.store}/ on this
          machine, over loopback, by a server that has no writer. Nothing was
          sent anywhere to draw it.
        </p>
      </div>
    </div>
  )
}
