'use client'

// The tuning dashboard, in the finalized surfaces design.
//
// WHAT IT IS AND IS NOT. It is a reader. `src/serve.ts` serves the store the
// resolver wrote and every route on it is a GET. So this page never writes.
// Where a revoke or forget button would go, it discloses the command that
// does it, which already exists. A button that cannot work is worse than a
// line of text that does. That is also why the design's `edit` action and
// the tension review's "this one is me" buttons are not drawn here: neither
// has a door in the product yet (docs/design/tuning-dashboard.md).
//
// WHY IT READS LOOPBACK. Everything is drawn from one fetch of /store, whose
// shape is `StorePayload` in ursa-major/src/serve.ts. If that shape changes
// this page breaks visibly, which is the correct failure.
//
// WHY NOTHING POLLS. This is a reading surface for a store that changes only
// when the owner runs the resolver. `reread` is a control she presses; it
// also sets off the aurora's substorm, the only motion on the page besides
// the aurora that follows her pointer over the sky.

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { REVOCATION_HOLDS_FORWARD, revocationCannotReachPastedCopies } from '../../lib/revocation-reach'
import './dashboard.css'

const AuroraSky = dynamic(() => import('../components/AuroraSky').then((m) => m.AuroraSky), { ssr: false })

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

type Section = 'tuning' | 'records' | 'tensions' | 'exports'

const DEFAULT_PORT = 7818

function n(value: number): string { return value.toLocaleString('en-US') }
/** One decimal always, so a column of figures does not shift. */
function pct(part: number, whole: number): string {
  if (whole <= 0) return '—'
  return `${((part / whole) * 100).toFixed(1)}%`
}
function day(iso: string): string { return iso.slice(0, 10) }
function clock(iso: string): string { return iso.slice(11, 19) }

function resolver(r: ResolverIdentity | null): string {
  if (!r) return 'no resolver identified'
  if (r.basis === 'git_commit' && typeof r.commit === 'string') return `commit ${r.commit.slice(0, 7)}${r.dirty ? ' (dirty tree)' : ''}`
  if (r.basis === 'bundle_digest' && typeof r.bundleDigest === 'string') return `bundle ${String(r.bundleDigest).slice(0, 12)}`
  return String(r.basis)
}

function uncovered(r: RecordSummary): number { return Math.max(0, r.finalChars - r.coveredChars) }

/** The pairs behind the tension review, each one once, live ones only. */
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

/** Rule when more than one piece of evidence stands behind it, case when one. */
function Kind({ u, tension }: { u: TuningUnit; tension: boolean }) {
  if (tension) return <span className="kind kind-tension">tension</span>
  if (u.evidenceCount > 1) return <span className="kind kind-rule">rule <small>×{u.evidenceCount}</small></span>
  return <span className="kind kind-case">case</span>
}

function Cmd({ children }: { children: React.ReactNode }) {
  return <code className="cmd" tabIndex={0} role="group" aria-label="command, scrolls sideways">{children}</code>
}

export default function Dashboard() {
  const [payload, setPayload] = useState<StorePayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [port, setPort] = useState(DEFAULT_PORT)
  const [section, setSection] = useState<Section>('tuning')
  const [domain, setDomain] = useState('all')
  const [openUnit, setOpenUnit] = useState<string | null>(null)
  const [openForget, setOpenForget] = useState<string | null>(null)
  const [pulse, setPulse] = useState(0)

  // The port is read once from the query string, because `ursa serve --port N`
  // is where the number is already chosen.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('port')
    const parsed = q ? Number(q) : NaN
    if (Number.isInteger(parsed) && parsed > 0 && parsed < 65536) setPort(parsed)
  }, [])

  const read = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await fetch(`http://127.0.0.1:${p}/store`, { cache: 'no-store' })
      if (!res.ok) { setError(`the store server answered ${res.status}`); return }
      setPayload((await res.json()) as StorePayload)
      setError(null)
    } catch {
      // A fetch to loopback that throws is almost always nothing listening.
      setError('nothing is listening')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void read(port) }, [read, port])

  const reread = () => { setPulse((x) => x + 1); void read(port) }
  const serveCmd = `ursa serve <your project>${port === DEFAULT_PORT ? '' : ` --port ${port}`}`

  if (error || !payload) {
    return (
      <div className="dash">
        <div className="dash-solo">
          <p className="mark">✦ Ursa</p>
          <h1 className="dash-h1">{error ? 'No store to read' : 'Reading your store'}</h1>
          {error ? (
            <>
              <p className="dash-prose">
                {error} on 127.0.0.1:{port}. This page reads the store your own machine already
                holds, so it needs the command that serves it. Nothing here reaches the network.
              </p>
              <Cmd>{serveCmd}</Cmd>
              <p style={{ marginTop: 20 }}>
                <button className="quiet hit" onClick={() => void read(port)}>{loading ? 'looking…' : 'look again'}</button>
              </p>
            </>
          ) : (
            <p className="dash-prose mono">127.0.0.1:{port}</p>
          )}
        </div>
      </div>
    )
  }

  const pairs = tensionPairs(payload.tuning)
  const inTension = new Set(pairs.flatMap(([a, b]) => [a.id, b.id]))
  const active = payload.tuning.filter((u) => u.status !== 'revoked')
  const revoked = payload.tuning.filter((u) => u.status === 'revoked')
  const domains = Array.from(new Set(active.map((u) => u.domain)))
  const shown = active.filter((u) => domain === 'all' || u.domain === domain)
  const unit = payload.tuning.find((u) => u.id === openUnit) ?? null

  const NAV: { id: Section; label: string; count?: number }[] = [
    { id: 'tuning', label: 'tuning', count: active.length },
    { id: 'records', label: 'records', count: payload.recordCount },
    { id: 'tensions', label: 'tensions', count: pairs.length },
    { id: 'exports', label: 'exports' },
  ]
  const HEAD: Record<Section, [string, string]> = {
    tuning: [`${n(active.length)} unit${active.length === 1 ? '' : 's'},`, `${domains.length} domain${domains.length === 1 ? '' : 's'}`],
    records: ['The work it', 'came from'],
    tensions: ['Two things that cannot', 'both be you'],
    exports: ['Take it to', 'any model'],
  }

  return (
    <div className="dash">
      <nav className="dash-nav" aria-label="Sections">
        <p className="dash-brand"><span className="ursa-glyph">✦</span> <span>Ursa</span></p>
        {NAV.map((s) => (
          <button
            key={s.id}
            className="quiet hit dash-nav-item"
            aria-current={section === s.id ? 'page' : undefined}
            onClick={() => { setSection(s.id); setOpenUnit(null) }}
          >
            {s.label}
            {s.count !== undefined && <span className="dash-count">{n(s.count)}</span>}
          </button>
        ))}
        <div className="dash-nav-foot">
          <p className="mark">Local only</p>
          <p className="dash-small mono">{payload.store}/ · read at {clock(payload.readAt)}</p>
        </div>
      </nav>

      <main className="dash-main">
        <AuroraSky pulse={pulse} className="dash-sky" />
        <div className="dash-sky-room" aria-hidden="true" />

        <header className="dash-head">
          <div>
            <p className="mark">✦ {section === 'tuning' ? payload.project : section}</p>
            <h1 className="dash-h1">{HEAD[section][0]} <span className="dash-accent">{HEAD[section][1]}</span></h1>
          </div>
          <div className="dash-head-actions">
            <button className="quiet hit" onClick={reread}>{loading ? 'rereading…' : 'reread'}</button>
            {/* Up to four domains fit as tabs; past that (the owner's own store
                has eight, with long names) a menu holds them instead. */}
            {section === 'tuning' && domains.length > 4 && (
              <label className="dash-select-wrap">
                <span className="mark">domain</span>
                <select className="dash-select mono" value={domain} onChange={(e) => setDomain(e.target.value)}>
                  <option value="all">all</option>
                  {domains.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
            )}
            {section === 'tuning' && domains.length > 1 && domains.length <= 4 && (
              <div className="dash-seg" role="tablist" aria-label="Domain">
                {['all', ...domains].map((d) => (
                  <button key={d} role="tab" aria-selected={domain === d} className="dash-seg-item" onClick={() => setDomain(d)}>{d}</button>
                ))}
              </div>
            )}
          </div>
        </header>

        {!payload.storeExists && (
          <p className="dash-prose">
            This project has never been resolved, so there is no store yet. That is an honest
            empty and not an error: run the resolver once and reread this page.
          </p>
        )}

        {section === 'tuning' && (
          <section className="dash-glass">
            {shown.length === 0 ? (
              <p className="dash-prose">
                Nothing has been distilled for this project yet. The units appear here after the
                interpretation pass has read a record; until then this page has records to show
                you and no conclusions, which is the right way round.
              </p>
            ) : shown.map((u) => (
              <article key={u.id} className={`dash-row ${inTension.has(u.id) ? 'dash-row-tension' : ''}`}>
                <div className="dash-row-kind"><Kind u={u} tension={inTension.has(u.id)} /></div>
                <button className="dash-row-main" onClick={() => setOpenUnit(u.id)}>
                  <span className="dash-statement">{u.statement}</span>
                  <span className="dash-meta mono">
                    {u.polarity} · {u.domain} · {u.basis} · evidence ×{n(u.evidenceCount)} · {day(u.firstSeen) === day(u.lastSeen) ? day(u.firstSeen) : `${day(u.firstSeen)} to ${day(u.lastSeen)}`}
                    {u.status === 'user-edited' ? ' · edited by you' : ''}
                  </span>
                </button>
                <div className="dash-row-actions">
                  {inTension.has(u.id)
                    ? <button className="quiet hit" onClick={() => setSection('tensions')}>review</button>
                    : <button className="quiet hit" onClick={() => setOpenUnit(u.id)}>withdraw</button>}
                </div>
              </article>
            ))}

            {revoked.length > 0 && (
              <div className="dash-tombs">
                <p className="mark">Withdrawn, and kept as the receipt</p>
                <p className="dash-prose">
                  Ursa no longer applies these and never discloses them. They stay on your machine so
                  a later pass cannot conclude them again. A block you exported and pasted somewhere
                  before withdrawing is not covered by that: it is a copy in another product, and it
                  keeps working until you replace it.
                </p>
                {revoked.map((u) => (
                  <article key={u.id} className="dash-row dash-row-revoked">
                    <div className="dash-row-kind"><span className="kind">{u.polarity}</span></div>
                    <div className="dash-row-main">
                      <span className="dash-statement">{u.statement}</span>
                      <span className="dash-meta mono">{u.domain} · withdrawn · last seen {day(u.lastSeen)}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {section === 'records' && (
          <section className="dash-glass">
            {payload.records.length === 0 ? (
              <p className="dash-prose">
                No records in {payload.store}/ yet. A record is written when the resolver finds a
                generation and a finished piece of work it can join, so a project with no agent
                commits in its history has nothing here and nothing is wrong.
              </p>
            ) : (
              <>
                <div className="dash-legend mono">
                  <span><i className="sw sw-verbatim" /> kept as written</span>
                  <span><i className="sw sw-mutated" /> kept and edited</span>
                  <span><i className="sw sw-none" /> yours, no generation behind it</span>
                  <span><i className="sw sw-track" /> covered by no span</span>
                </div>
                {payload.records.map((r) => {
                  const empty = r.finalChars === 0
                  const segs = [
                    { k: 'verbatim', c: r.charsByClass.survived_verbatim },
                    { k: 'mutated', c: r.charsByClass.survived_mutated },
                    { k: 'none', c: r.charsByClass.no_generation_provenance },
                  ].filter((s) => s.c > 0)
                  return (
                    <article key={r.id} className="dash-row dash-row-record">
                      <div className="dash-row-main">
                        <span className="dash-record-id mono">{r.id}</span>
                        <span className="dash-meta mono">
                          {day(r.generatedAt)} · {r.artifactKind} ·{' '}
                          <span className={r.accepted === true ? 'dash-yes' : r.accepted === false ? 'dash-no' : ''}>
                            {r.accepted === true ? 'you declared it satisfied' : r.accepted === false ? 'you declared it unsatisfied' : 'undeclared'}
                          </span>
                          {r.finished ? '' : ' · abandoned'}{r.distilled ? ' · read by the interpretation pass' : ''} · {resolver(r.resolvedBy)}
                        </span>
                        {empty ? (
                          <span className="dash-meta">No characters in the finished work, so there are no shares to show.</span>
                        ) : (
                          <>
                            <span
                              className="dash-bar"
                              role="img"
                              aria-label={`of ${n(r.finalChars)} characters: ${pct(r.charsByClass.survived_verbatim, r.finalChars)} kept as written, ${pct(r.charsByClass.survived_mutated, r.finalChars)} kept and edited, ${pct(r.charsByClass.no_generation_provenance, r.finalChars)} yours, ${pct(uncovered(r), r.finalChars)} covered by no span`}
                            >
                              {segs.map((s) => <span key={s.k} className={`seg seg-${s.k}`} style={{ width: `${(s.c / Math.max(1, r.finalChars)) * 100}%` }} />)}
                            </span>
                            <span className="dash-meta mono">
                              {n(r.finalChars)} chars · {pct(r.charsByClass.survived_verbatim, r.finalChars)} as written · {pct(r.charsByClass.survived_mutated, r.finalChars)} edited · {pct(r.charsByClass.no_generation_provenance, r.finalChars)} yours · {pct(uncovered(r), r.finalChars)} no span
                            </span>
                          </>
                        )}
                        <span className="dash-meta mono">and {n(r.humanDeletedChars)} generated characters you saw and did not keep</span>
                        {openForget === r.id && (
                          <span className="dash-disclose">
                            <span className="dash-prose">
                              Forgetting erases this piece of work and anything concluded only from it. A
                              conclusion that also rests on work you have not erased keeps its statement and
                              loses this record&rsquo;s evidence.
                            </span>
                            <Cmd>ursa forget &lt;your project&gt; --record {r.id}</Cmd>
                          </span>
                        )}
                      </div>
                      <div className="dash-row-actions">
                        <button className="quiet hit" aria-expanded={openForget === r.id} onClick={() => setOpenForget(openForget === r.id ? null : r.id)}>forget</button>
                      </div>
                    </article>
                  )
                })}
              </>
            )}
          </section>
        )}

        {section === 'tensions' && (
          <section className="dash-glass-open">
            <p className="dash-prose">
              Each pair contradicts itself. Ursa has not picked between them and will not average
              them, because the average is a preference you never stated. Until you withdraw one,
              models are told to ask you.
            </p>
            {pairs.length === 0 && <p className="dash-prose">No tensions in your tuning right now.</p>}
            {pairs.map(([a, b]) => (
              <div key={`${a.id}|${b.id}`} className="dash-pair">
                {[a, b].map((u) => (
                  <div key={u.id} className="dash-pair-side">
                    <p className="mark" style={{ color: 'var(--tension)' }}>{u.domain} · evidence ×{n(u.evidenceCount)}</p>
                    <p className="dash-pair-statement">{u.statement}</p>
                    <p className="dash-meta mono">{u.polarity} · {u.basis}</p>
                    <Cmd>ursa consent revoke-axiom &lt;your project&gt; --axiom {u.id}</Cmd>
                  </div>
                ))}
              </div>
            ))}
          </section>
        )}

        {section === 'exports' && (
          <section className="dash-glass">
            <p className="dash-prose">
              Your tuning as one block of text, for any model&rsquo;s custom instructions. After you
              withdraw something, export again and paste the new block over the old one everywhere you
              put it: Ursa cannot reach a copy that lives in somebody else&rsquo;s settings.
            </p>
            <Cmd>ursa tuning export &gt; tuning.md</Cmd>
          </section>
        )}

        <p className="dash-foot">
          Everything on this page was read from {payload.store}/ on this machine, over loopback, by
          a server that has no writer. Nothing was sent anywhere to draw it.
        </p>
      </main>

      {unit && (
        <div className="dash-sheet-scrim" onClick={() => setOpenUnit(null)}>
          <aside className="dash-sheet" onClick={(e) => e.stopPropagation()} aria-label="Tuning unit">
            <div className="dash-sheet-head">
              <Kind u={unit} tension={inTension.has(unit.id)} />
              <span className="mark">{unit.domain} · {unit.basis}</span>
              <button className="quiet hit dash-sheet-close" aria-label="Close" onClick={() => setOpenUnit(null)}>×</button>
            </div>
            <h2 className="dash-sheet-title">{unit.statement}</h2>
            <dl className="dash-facts">
              <div><dt className="mark">polarity</dt><dd>{unit.polarity}</dd></div>
              <div><dt className="mark">evidence</dt><dd>×{n(unit.evidenceCount)}</dd></div>
              <div><dt className="mark">first seen</dt><dd className="mono">{day(unit.firstSeen)}</dd></div>
              <div><dt className="mark">last seen</dt><dd className="mono">{day(unit.lastSeen)}</dd></div>
            </dl>
            <div className="dash-sheet-foot">
              <p className="dash-prose">
                Withdrawing keeps the statement on your machine as a tombstone. {REVOCATION_HOLDS_FORWARD} The
                tombstone is what stops a later pass from concluding it again, and it is the receipt that
                your withdrawal held.
              </p>
              <p className="dash-prose">{revocationCannotReachPastedCopies('this page')}</p>
              <Cmd>ursa consent revoke-axiom &lt;your project&gt; --axiom {unit.id}</Cmd>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
