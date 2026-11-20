import type { VaryingText } from '../varying-text'

/** One choice of an options setting as a document holds it, its texts possibly varying. */
export type DocumentOption = {
  value: string
  label: VaryingText
  description?: VaryingText
  score?: number
}
