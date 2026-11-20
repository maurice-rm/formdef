import type { JsonValue } from '../json-value'

/**
 * The error texts of a validator, by issue code: each takes the issue's parameters, such as
 * `{ min: 2 }`, and returns the text. A code a project leaves out keeps its English text.
 */
export type Messages = Readonly<
  Record<string, (params: Readonly<Record<string, JsonValue>>) => string>
>

/** The text of an issue whose code has no text, such as a project's own rule. */
export const FALLBACK_MESSAGE = 'This value is not valid.'

export const DEFAULT_MESSAGES: Messages = {
  required: () => 'This field is required.',
  type: () => FALLBACK_MESSAGE,
  option: () => 'Choose one of the options.',
  integer: () => 'Enter a whole number.',
  decimal: () => 'Enter a number.',
  min: ({ min }) => `Enter at least ${String(min)}.`,
  max: ({ max }) => `Enter at most ${String(max)}.`,
  maxLength: ({ maxLength }) => `Enter at most ${String(maxLength)} characters.`,
  minCount: ({ minCount }) => `Choose at least ${String(minCount)}.`,
  maxCount: ({ maxCount }) => `Choose at most ${String(maxCount)}.`,
  earliest: ({ earliest }) => `Enter a date on or after ${String(earliest)}.`,
  latest: ({ latest }) => `Enter a date on or before ${String(latest)}.`,
  email: () => 'Enter an email address.',
}
