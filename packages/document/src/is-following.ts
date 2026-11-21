import type { Text } from './text'
import type { VaryingText } from './varying-text'

/**
 * Whether a text follows an answer, `{ cases, otherwise }`, rather than being a text; no language
 * code is named `cases`.
 */
export function isFollowing(text: VaryingText): text is Exclude<VaryingText, Text> {
  return typeof text === 'object' && Array.isArray(text.cases)
}
