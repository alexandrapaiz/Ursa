'use client'

// The capture panel (plan §16.5), in the finalized surfaces design.
//
// The window is a pane of real glass (components/GlassCard.tsx) with the 3D
// aurora inside it. It is still at rest. It turns once when a run starts
// and nods once when new data lands, and does nothing else.
//
// What it says is unchanged from the panel it replaces: a header (project,
// session file, last sync), the tuning (one line per unit, rules and cases
// distinct, tensions in their own colour), then the verdict line and a
// single run button. No buttons for satisfied or unsatisfied: the verdict
// line is a reading, and its only control is `misread?`, which opens the
// quoted prompt so the owner can see why. The error has one home, above the
// list (reviews/2026-10-26 §7.1), and the sync slot says which kind of
// nothing it has rather than restating the error.

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { deriveKeys, decryptJson, type DerivedKeys } from '../lib/crypto'

// three.js needs a browser, so the glass loads on the client only.
const GlassCard = dynamic(() => import('./components/GlassCard').then((m) => m.GlassCard), { ssr: false })

interface Verdict {
  accepted: boolean | null
  step: number | null
  quote: string | null
  basis: 'read-from-chat' | 'undeclared'
  confidence: 'stated'
}
interface TuningLine {
  statement: string
  domain: string
  polarity: 'prefer' | 'avoid'
  basis: 'stated' | 'tacit' | 'mixed'
  evidenceCount: number
  tension: boolean
  status: string
}
interface Payload {
  schemaVersion: string
  project: string
  sessionFile: string | null
  updatedAt: string
  userTurns: number
  verdict: Verdict
  tuning: TuningLine[]
  declaredRecords: string[]
  lastRunSummary: string | null
}

const BRIDGE = 'http://127.0.0.1:7817'
const POLL_MS = 4000
const MAX_W = 380 // the window's design width (§16.5)

/** The card fills the window, up to the design width. */
function useCardSize() {
  const [size, setSize] = useState({ w: 340, h: 520 })
  useEffect(() => {
    const measure = () => setSize({
      w: Math.min(MAX_W, window.innerWidth) - 24,
      h: Math.max(320, window.innerHeight - 24),
    })
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  return size
}

export default function Overlay() {
  const [keys, setKeys] = useState<DerivedKeys | null>(null)
  const [phrase, setPhrase] = useState('')
  const [deriving, setDeriving] = useState(false)
  const [payload, setPayload] = useState<Payload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showQuote, setShowQuote] = useState(false)
  const [showRun, setShowRun] = useState(false)
  const [running, setRunning] = useState(false)
  const [readKey, setReadKey] = useState(0)
  const [landKey, setLandKey] = useState(0)
  const lastHash = useRef('')
  const { w, h } = useCardSize()

  const unlock = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phrase) return
    setDeriving(true)
    try {
      setKeys(await deriveKeys(phrase))
      setPhrase('')
      setError(null)
    } finally {
      setDeriving(false)
    }
  }, [phrase])

  useEffect(() => {
    if (!keys) return
    let stop = false
    const poll = async () => {
      try {
        const res = await fetch(`/api/sync/${keys.blobId}`, { cache: 'no-store' })
        if (res.status === 404) { setError('no data yet — is the bridge running?'); return }
        if (!res.ok) { setError(`sync ${res.status}`); return }
        const bytes = new Uint8Array(await res.arrayBuffer())
        const hash = `${bytes.length}:${bytes[12]}${bytes[13]}${bytes[20]}`
        if (hash === lastHash.current) return
        const next = await decryptJson<Payload>(keys, bytes)
        // A change after the first payload is new data landing: the card nods.
        if (lastHash.current) setLandKey((k) => k + 1)
        lastHash.current = hash
        setPayload(next)
        setError(null)
      } catch {
        setError('cannot decrypt — wrong passphrase?')
      }
    }
    void poll()
    const t = setInterval(() => { if (!stop) void poll() }, POLL_MS)
    return () => { stop = true; clearInterval(t) }
  }, [keys])

  const run = useCallback(async () => {
    setRunning(true)
    setReadKey((k) => k + 1)
    try {
      const res = await fetch(`${BRIDGE}/run`, { method: 'POST' })
      const body = await res.json().catch(() => null)
      if (body?.summary) setPayload((p) => p ? { ...p, lastRunSummary: body.summary } : p)
      setShowRun(true)
    } catch {
      setError('bridge unreachable on 127.0.0.1:7817')
    } finally {
      setRunning(false)
    }
  }, [])

  const v = payload?.verdict
  const verdictClass = v?.accepted === true ? 'pn-verdict-yes' : v?.accepted === false ? 'pn-verdict-no' : ''
  const verdictText = v?.accepted === true ? `reads as satisfied at step ${v.step}`
    : v?.accepted === false ? `reads as unsatisfied at step ${v.step}`
    : 'no verdict yet — tell the model when it’s right'

  return (
    <main className="pn-window">
      <GlassCard width={w} height={h} readKey={readKey} landKey={landKey}>
        {!keys ? (
          <div className="pn">
            <header className="pn-head">
              <span className="ursa-glyph">✦</span>
              <span className="mark mark-polar">Ursa</span>
            </header>
            <form onSubmit={unlock} className="pn-lock">
              <label className="pn-field">
                <span className="mark">Passphrase</span>
                <input
                  type="password"
                  value={phrase}
                  onChange={(e) => setPhrase(e.target.value)}
                  placeholder="passphrase"
                  autoFocus
                  className="pn-input mono"
                />
              </label>
              <p className="pn-caption">
                {deriving ? 'deriving the key…' : 'held in memory only; it never leaves this page'}
              </p>
            </form>
          </div>
        ) : (
          <div className="pn">
            <header className="pn-head">
              <span className="ursa-glyph">✦</span>
              <span className="mark mark-polar pn-project">Your tuning · {payload?.project ?? '…'}</span>
              <span className="pn-sync mono">
                {payload && <span className="live-dot" aria-hidden="true" />}
                {payload ? new Date(payload.updatedAt).toLocaleTimeString() : error ? 'not synced' : 'connecting'}
              </span>
            </header>
            {payload?.sessionFile && <p className="pn-session mono">session {payload.sessionFile.slice(0, 8)}…</p>}

            <section className="pn-list">
              {error && <p className="pn-note">{error}</p>}
              {payload && payload.tuning.length === 0 && <p className="pn-note">nothing distilled for this project yet</p>}
              {payload?.tuning.map((t, i) => (
                <div key={i} className={`pn-unit ${t.tension ? 'pn-unit-tension' : ''}`}>
                  <span className={`kind ${t.tension ? 'kind-tension' : t.evidenceCount > 1 ? 'kind-rule' : 'kind-case'}`}>
                    {t.tension ? 'tension' : t.evidenceCount > 1 ? <>rule <small>×{t.evidenceCount}</small></> : 'case'}
                  </span>
                  <div className="pn-unit-body">
                    <p className="pn-statement">
                      <span className={`mono pn-polarity ${t.polarity === 'prefer' ? 'pn-prefer' : 'pn-avoid'}`}>
                        {t.polarity === 'prefer' ? '+' : '−'}
                      </span>{' '}
                      {t.statement}
                    </p>
                    <p className="pn-meta mono">{t.domain} · {t.basis}</p>
                  </div>
                </div>
              ))}
            </section>

            {showRun && payload?.lastRunSummary && <pre className="pn-run mono">{payload.lastRunSummary}</pre>}

            <footer className="pn-foot">
              <p className={`pn-verdict ${verdictClass}`}>
                {payload ? verdictText : 'no verdict yet'}
                {v?.accepted !== null && v?.quote && (
                  <button onClick={() => setShowQuote(!showQuote)} className="quiet hit pn-misread" aria-expanded={showQuote}>
                    misread?
                  </button>
                )}
              </p>
              {showQuote && v?.quote && <p className="pn-quote mono">step {v.step}: “{v.quote}”</p>}
              <button onClick={run} disabled={running} className="cta hit pn-runbtn">
                {running ? 'running…' : 'run'}
              </button>
              {v?.accepted !== null && (payload?.declaredRecords?.length ?? 0) > 0 && (
                <p className="pn-caption mono">
                  written into {payload!.declaredRecords.length} record{payload!.declaredRecords.length === 1 ? '' : 's'} · your words are the label
                </p>
              )}
            </footer>
          </div>
        )}
      </GlassCard>
    </main>
  )
}
