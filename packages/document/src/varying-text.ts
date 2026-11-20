import type { Condition } from './condition'
import type { Text } from './text'

/**
 * A text that may follow an answer: a {@link Text}, or the text of the first case whose condition
 * holds, otherwise the fallback. Every text position takes it but the labels of steps and
 * sections, which the stepper and the section show for the whole form.
 *
 * @example
 * ```ts
 * const label: VaryingText = {
 *   cases: [{ when: { field: 'f1', op: 'equals', value: 'o2' }, value: 'Number of radiators' }],
 *   otherwise: 'Number of heating circuits',
 * }
 * ```
 */
export type VaryingText =
  | Text
  | {
      /** The cases, checked in order. */
      cases: {
        /** The condition under which this case applies. */
        when: Condition
        /** The text in this case. */
        value: Text
      }[]
      /** The text when no case applies. */
      otherwise: Text
    }
