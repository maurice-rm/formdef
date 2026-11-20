import type { IssueParams } from '../issue-params'
import type { JsonValue } from '../json-value'

type WithLabel<TParams> = Readonly<
  TParams & {
    /** The label of the field, in the language the form is used in. */
    label: string
  }
>

// A method's parameter is bivariant, so a text of a known code also fits the index signature.
type ProjectMessage = {
  message(params: WithLabel<Readonly<Record<string, JsonValue>>>): string
}['message']

/**
 * The error texts of a validator, by issue code: each takes the issue's parameters, such as
 * `{ min: 2 }`, and the field's label, and returns the text. The parameters of the package's codes
 * are typed; a project's own code takes its rule's parameters, of which `label` is reserved for
 * the field's label. A code a project leaves out keeps its English text, and a field's own text in
 * the document wins over both.
 */
export type Messages = {
  readonly [Code in keyof IssueParams]?: (params: WithLabel<IssueParams[Code]>) => string
} & {
  readonly [code: string]: ProjectMessage | undefined
}

/** The text of an issue whose code has no text, such as a project's own rule. */
export const FALLBACK_MESSAGE = 'This value is not valid.'

export const DEFAULT_MESSAGES: Messages = {
  required: () => 'This field is required.',
  type: () => FALLBACK_MESSAGE,
  option: () => 'Choose one of the options.',
  integer: () => 'Enter a whole number.',
  decimal: () => 'Enter a number.',
  min: ({ min }) => `Enter at least ${min}.`,
  max: ({ max }) => `Enter at most ${max}.`,
  maxLength: ({ maxLength }) => `Enter at most ${maxLength} characters.`,
  minCount: ({ minCount }) => `Choose at least ${minCount}.`,
  maxCount: ({ maxCount }) => `Choose at most ${maxCount}.`,
  earliest: ({ earliest }) => `Enter a date on or after ${earliest}.`,
  latest: ({ latest }) => `Enter a date on or before ${latest}.`,
  email: () => 'Enter an email address.',
}
