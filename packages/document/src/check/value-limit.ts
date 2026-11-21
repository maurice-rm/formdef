import type { NumberLimit } from './number-limit-broken'

/** A constraint of a text or number setting that a value breaks, as a problem's params name it. */
export type ValueLimit = { maxLength: number } | NumberLimit
