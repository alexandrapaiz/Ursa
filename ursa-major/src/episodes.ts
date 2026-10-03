// Episode segmenter: one episode per commit pair. Boundaries are
// explicit per ADR-003 — the user named the project, git bounds the
// work; 'idle-timeout' does not exist in the type.

import { basename } from 'node:path'
import type { CommitPair } from './pairfinder'

export interface Episode {
  id: string
  projectPath: string
  status: 'closed'
  openedAt: string
  closedAt: string
  /**
   * How this episode's boundary was decided. 'git-commit-pair' is M0's
   * local-history adapter (src/pairfinder.ts); 'github-pr' is the PR
   * adapter (src/adapters/github-pr.ts), where the pull request bounds
   * the work and the merge closes it. Never a timeout, per ADR-003.
   */
  closureHeuristic: 'git-commit-pair' | 'github-pr'
  touchedFiles: string[]
  generatedSha: string
  finalSha: string
  agentMarker: string
  subject: string
  distilled: boolean
}

export function buildEpisodes(pairs: CommitPair[], projectPath: string): Episode[] {
  const slug = basename(projectPath).toLowerCase().replace(/[^a-z0-9-]+/g, '-')
  return pairs.map((p) => ({
    id: `${slug}-${p.generatedAt.slice(0, 10)}-${p.generatedSha.slice(0, 7)}`,
    projectPath,
    status: 'closed',
    openedAt: p.generatedAt,
    closedAt: p.finalAt,
    closureHeuristic: 'git-commit-pair',
    touchedFiles: p.paths,
    generatedSha: p.generatedSha,
    finalSha: p.finalSha,
    agentMarker: p.agentMarker,
    subject: p.subject,
    distilled: false,
  }))
}
