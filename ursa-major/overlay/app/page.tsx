'use client'

// The window (plan §16.5). Three regions: header (project, session
// file, last sync), body (tuning, one line per unit; rules and cases
// distinct; tensions in their own color), footer (the verdict line,
// then a single run button). No buttons for satisfied or unsatisfied:
// the verdict line is a reading, and its only control is `misread?`,
// which opens the quoted prompt so the owner can see why.

import { useCallback, useEffect, useRef, useState } from 'react'
import { deriveKeys, decryptJson, type DerivedKeys } from '../lib/crypto'

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

export default function Overlay() {
  const [keys, setKeys] = useState<DerivedKeys | null>(null)
  const [phrase, setPhrase] = useState('')
  const [deriving, setDeriving] = useState(false)
  const [payload, setPayload] = useState<Payload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showQuote, setShowQuote] = useState(false)
  const [showRun, setShowRun] = useState(false)
  const [running, setRunning] = useState(false)
  const lastHash = useRef('')

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

  if (!keys) {
    return (
      <main>
        <header style={{ marginBottom: 12 }}>
          <span style={{ color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.02em' }}>Ursa</span>
        </header>
        <form onSubmit={unlock}>
          <input
            type="password"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder="passphrase"
            autoFocus
            className="mono"
            style={{
              width: '100%', padding: '8px 10px', background: 'var(--panel)',
              border: '1px solid var(--line)', borderRadius: 6, color: 'var(--ink)',
              fontSize: 13, outline: 'none',
            }}
          />
          <p style={{ color: 'var(--dim)', marginTop: 8, fontSize: 12 }}>
            {deriving ? 'deriving the key…' : 'held in memory only; it never leaves this page'}
          </p>
        </form>
      </main>
    )
  }

  const v = payload?.verdict
  const verdictColor = v?.accepted === true ? 'var(--satisfied)'
    : v?.accepted === false ? 'var(--unsatisfied)' : 'var(--dim)'
  const verdictText = v?.accepted === true ? `reads as satisfied at step ${v.step}`
    : v?.accepted === false ? `reads as unsatisfied at step ${v.step}`
    : 'no verdict yet — tell the model when it’s right'

  return (
    <main>
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        borderBottom: '1px solid var(--line)', paddingBottom: 8, marginBottom: 10,
      }}>
        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{payload?.project ?? '…'}</span>
        <span className="mono" style={{ color: 'var(--dim)', fontSize: 10 }}>
          {payload?.sessionFile ? `${payload.sessionFile.slice(0, 8)}… · ` : ''}
          {payload ? new Date(payload.updatedAt).toLocaleTimeString() : error ?? 'connecting'}
        </span>
      </header>

      <section>
        {payload && payload.tuning.length === 0 && (
          <p style={{ color: 'var(--dim)' }}>nothing distilled for this project yet</p>
        )}
        {payload?.tuning.map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, padding: '3px 0', alignItems: 'baseline' }}>
            <span className="mono" style={{
              fontSize: 10, minWidth: 34, textAlign: 'right',
              color: t.tension ? 'var(--tension)' : t.evidenceCount > 1 ? 'var(--accent)' : 'var(--dim)',
            }}>
              {t.tension ? 'tension' : t.evidenceCount > 1 ? `rule ×${t.evidenceCount}` : 'case'}
            </span>
            <span style={{ color: t.tension ? 'var(--tension)' : 'var(--ink)' }}>
              <span className="mono" style={{ color: t.polarity === 'prefer' ? 'var(--satisfied)' : 'var(--unsatisfied)', fontSize: 10 }}>
                {t.polarity === 'prefer' ? '+' : '−'}
              </span>{' '}
              {t.statement}
            </span>
          </div>
        ))}
      </section>

      {showRun && payload?.lastRunSummary && (
        <pre className="mono" style={{
          marginTop: 10, padding: 10, background: 'var(--panel)', borderRadius: 6,
          border: '1px solid var(--line)', fontSize: 10.5, whiteSpace: 'pre-wrap',
          maxHeight: 220, overflowY: 'auto', color: 'var(--ink)',
        }}>{payload.lastRunSummary}</pre>
      )}

      <footer style={{ borderTop: '1px solid var(--line)', marginTop: 12, paddingTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <span style={{ color: verdictColor }}>
            {payload ? verdictText : error ?? '…'}
            {v?.accepted !== null && v?.quote && (
              <button
                onClick={() => setShowQuote(!showQuote)}
                style={{
                  background: 'none', border: 'none', color: 'var(--dim)', cursor: 'pointer',
                  fontSize: 11, marginLeft: 6, textDecoration: 'underline dotted', padding: 0,
                }}
              >misread?</button>
            )}
          </span>
          <button
            onClick={run}
            disabled={running}
            className="mono"
            style={{
              background: 'var(--panel)', color: 'var(--accent)', border: '1px solid var(--line)',
              borderRadius: 6, padding: '4px 14px', cursor: running ? 'wait' : 'pointer', fontSize: 12,
            }}
          >{running ? 'running…' : 'run'}</button>
        </div>
        {showQuote && v?.quote && (
          <p className="mono" style={{ color: 'var(--dim)', fontSize: 11, marginTop: 6 }}>
            step {v.step}: “{v.quote}”
          </p>
        )}
        {v?.accepted !== null && (payload?.declaredRecords?.length ?? 0) > 0 && (
          <p className="mono" style={{ color: 'var(--dim)', fontSize: 10, marginTop: 6 }}>
            written into {payload!.declaredRecords.length} record
            {payload!.declaredRecords.length === 1 ? '' : 's'} · your words are the label
          </p>
        )}
      </footer>
    </main>
  )
}
