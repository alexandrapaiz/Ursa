// `--state` entry point for the opened record. See `at-error-states.mjs`.
import { openedAtAddress } from './at-error-states.mjs'
export default async (page) => { await openedAtAddress(page) }
