// `--state` entry point. The drive and the reasoning are in
// `at-error-states.mjs`; this file exists because `--state` takes a module
// with one default export and there are four states.
import { statusRefused } from './at-error-states.mjs'
export default async (page) => { await statusRefused(page) }
