import type { JsonValue, Varying } from './form-document'
import { isPlainObject } from './is-plain-object'

/** Whether an untrusted value has the shape of a setting that follows an answer, `{ cases, … }`. */
export const looksVarying = (value: unknown): value is Record<string, unknown> =>
  isPlainObject(value) && Object.hasOwn(value, 'cases')

/** Whether a setting's value follows an answer, `{ cases, otherwise }`, rather than being plain. */
export const isVarying = (value: JsonValue | Varying): value is Varying => looksVarying(value)
