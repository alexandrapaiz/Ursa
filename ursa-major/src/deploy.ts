// Deploy detection: given a repository's files as of one commit, work out
// whether that commit's finished work is also reachable at a URL, and which
// URL. This is what turns an `artifact.kind` of `repo` into `hosted`.
//
// Three rules, in priority order, all of them reading a committed file and
// none of them touching the network:
//
//   1. a GitHub Pages `CNAME` file, whose entire content is the custom
//      domain the site is served from;
//   2. `package.json`'s `homepage` field, the field npm, Create React App
//      and GitHub Pages tooling already agree means "where this is served";
//   3. `vercel.json`'s `alias` field, which names the production domains a
//      Vercel deployment is aliased to.
//
// A `vercel.json`, `netlify.toml` or Pages workflow with no domain in it is
// deliberately NOT enough. It proves a deploy pipeline exists; it does not
// tell us where to look at the result, and `renderRef` exists to be looked
// at. An artifact with a pipeline and no findable URL stays `repo`, which is
// the honest answer, rather than becoming a `hosted` record pointing nowhere.

/** Reads a repository-relative path, returning null when the file is absent. */
export type FileReader = (path: string) => string | null

export interface DeployDetection {
  /** absolute http(s) URL where the finished work can be seen */
  url: string
  /** repo-relative file and field the URL came from, so the claim is auditable */
  evidence: string
}

const CNAME_PATHS = ['CNAME', 'public/CNAME', 'docs/CNAME', 'static/CNAME']

// A hostname, not an arbitrary string: at least two dot-separated labels, no
// scheme, no path, no port. `example.com` and `docs.example.co.uk` pass;
// `localhost`, `# a comment`, and `https://example.com` do not.
const HOSTNAME = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1'])

function isPublicHost(host: string): boolean {
  const bare = host.toLowerCase().replace(/\.$/, '')
  if (LOCAL_HOSTS.has(bare)) return false
  if (bare.endsWith('.local') || bare.endsWith('.localhost')) return false
  return true
}

/** `example.com` → `https://example.com`, or null when it is not a hostname. */
function urlFromHostname(raw: string): string | null {
  const host = raw.trim().replace(/\.$/, '')
  if (!HOSTNAME.test(host) || !isPublicHost(host)) return null
  return `https://${host.toLowerCase()}`
}

/** Accepts an already-absolute http(s) URL, normalised, or null. */
function urlFromAbsolute(raw: string): string | null {
  const value = raw.trim()
  if (!/^https?:\/\//i.test(value)) return null
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return null
  }
  if (!isPublicHost(parsed.hostname)) return null
  return parsed.toString().replace(/\/$/, '')
}

function parseJson(text: string | null): Record<string, unknown> | null {
  if (text === null) return null
  try {
    const value = JSON.parse(text)
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/**
 * Find the deploy URL for the repository state `read` exposes, or null when
 * nothing in that state names one. Pure: the caller decides which commit's
 * files `read` returns, so a record can carry the URL as of its own commit
 * rather than as of whatever the working tree happens to hold today.
 */
export function detectDeploy(read: FileReader): DeployDetection | null {
  for (const path of CNAME_PATHS) {
    const text = read(path)
    if (text === null) continue
    // A CNAME file is one line holding one domain. Anything else is not one.
    const first = text.split('\n').map((l) => l.trim()).filter(Boolean)[0]
    if (!first) continue
    const url = urlFromHostname(first)
    if (url) return { url, evidence: `${path} (GitHub Pages custom domain)` }
  }

  const pkg = parseJson(read('package.json'))
  if (pkg && typeof pkg.homepage === 'string') {
    const url = urlFromAbsolute(pkg.homepage)
    if (url) return { url, evidence: 'package.json "homepage"' }
  }

  const vercel = parseJson(read('vercel.json'))
  if (vercel) {
    const alias = vercel.alias
    const first = typeof alias === 'string'
      ? alias
      : Array.isArray(alias) && typeof alias[0] === 'string' ? (alias[0] as string) : null
    if (first) {
      const url = urlFromAbsolute(first) ?? urlFromHostname(first)
      if (url) return { url, evidence: 'vercel.json "alias"' }
    }
  }

  return null
}
