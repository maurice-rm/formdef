import { isPlainObject } from './is-plain-object'

/** Whether an untrusted value has the shape of a setting that follows an answer, `{ cases, … }`. */
export function looksVarying(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value) && Object.hasOwn(value, 'cases')
}
