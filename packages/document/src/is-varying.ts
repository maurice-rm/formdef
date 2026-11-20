import type { JsonValue, Varying } from './form-document'
import { looksVarying } from './looks-varying'

/** Whether a setting's value follows an answer, `{ cases, otherwise }`, rather than being plain. */
export function isVarying(value: JsonValue | Varying): value is Varying {
  return looksVarying(value)
}
