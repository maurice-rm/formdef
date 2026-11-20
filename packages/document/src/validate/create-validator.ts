import { checkDocument } from '../check/check-document'
import { optionValuesOf } from '../check/option-values'
import { fitsValueType, isFilled } from '../evaluate/answer-value'
import { evaluate, type ShownField } from '../evaluate/evaluate'
import type { FormDocument, JsonValue } from '../form-document'
import type { FieldKinds } from '../kinds/create-field-kinds'
import { DEFAULT_MESSAGES, FALLBACK_MESSAGE, type Messages } from './messages'

/** The answers of a form document: nested by step key in a document with steps, flat without. */
export type DocumentValues = Record<string, unknown>

/**
 * What is wrong with one answer, as Standard Schema reports it, with the code and parameters its
 * text was made from:
 *
 * - `required`: a required field left empty;
 * - `type`: a value of the wrong type, such as text for a number;
 * - `option`: a choice that is no option of the field;
 * - otherwise the code of the field kind's first rule the value fails, such as `min`.
 */
export type ValidationIssue = {
  /** The error text. */
  readonly message: string
  /** Where the field's value sits: the step key and field key, or the field key alone. */
  readonly path: readonly string[]
  /** What the issue is about. */
  readonly code: string
  /** What the text names, such as the bound that was missed. */
  readonly params: Readonly<Record<string, JsonValue>>
}

/** What a validator returns: the answers of the fields that show, or the issues. */
export type ValidationResult =
  | {
      /** The answers of the fields that show, nested like the values given. */
      readonly value: DocumentValues
      /** No issues. */
      readonly issues?: undefined
    }
  | {
      /** Every issue, in document order. */
      readonly issues: readonly ValidationIssue[]
    }

/** A validator of a form document's answers, implementing Standard Schema v1. */
export type DocumentValidator = {
  /** The Standard Schema properties. */
  readonly '~standard': {
    /** The version of Standard Schema. */
    readonly version: 1
    /** The library that made the validator. */
    readonly vendor: string
    /** Checks the answers of the document. */
    readonly validate: (values: unknown) => ValidationResult
  }
}

/** What `createValidator` takes besides the document. */
type ValidatorOptions = {
  /**
   * The error texts, by issue code; a code left out keeps its English text, and a code without
   * any text gets a general one.
   *
   * @defaultValue English texts
   */
  messages?: Messages
}

type Failure = Pick<ValidationIssue, 'code' | 'params'>

const VENDOR = 'formdef'

const fitsOptions = ({ field, value }: ShownField): boolean => {
  const options = optionValuesOf(field)
  const choices = Array.isArray(value) ? value : [value]
  return choices.every((choice) => options.has(choice))
}

const failureOf = (shown: ShownField): Failure | undefined => {
  const { kind, value } = shown
  const isMissing = value === undefined || value === null
  if (!isMissing && !fitsValueType(value, kind.valueType)) {
    return { code: 'type', params: { expected: kind.valueType } }
  }
  if (!isFilled(value, kind.valueType)) {
    return shown.isRequired ? { code: 'required', params: {} } : undefined
  }
  if ((kind.valueType === 'choice' || kind.valueType === 'choices') && !fitsOptions(shown)) {
    return { code: 'option', params: {} }
  }
  const failed = kind
    .rules(shown.settings)
    .find((entry) => entry !== undefined && !entry.passes(value as never))
  return failed === undefined ? undefined : { code: failed.code, params: failed.params }
}

const answersOf = (shown: readonly ShownField[]): DocumentValues => {
  const answers: DocumentValues = {}
  for (const { path, value } of shown) {
    if (value === undefined) continue
    const [first = '', second] = path
    if (second === undefined) answers[first] = value
    else answers[first] = { ...(answers[first] as DocumentValues | undefined), [second]: value }
  }
  return answers
}

const refuseProblems = (document: FormDocument, kinds: FieldKinds<unknown>): void => {
  const { length } = checkDocument(document, kinds)
  if (length === 1) {
    throw new Error('formdef: document: the document has 1 problem; checkDocument lists it.')
  }
  if (length > 1) {
    throw new Error(
      `formdef: document: the document has ${length} problems; checkDocument lists them.`,
    )
  }
}

/**
 * Builds a validator of a form document's answers, implementing Standard Schema v1: the same
 * validator checks the answers in the form and on the server.
 *
 * Only fields that show are checked; a field shows when it and every step, section and row
 * around it show for the answers given. A field left empty fails only when it is required, by
 * `required` or its condition. A filled field fails when its value has the wrong type, is no
 * option of a choice, or fails the first of its field kind's rules, with the settings that apply
 * to the answers.
 *
 * @param document - The document, as `readDocument` returns it.
 * @param kinds - The field kinds the document's fields are of.
 * @param options - The error texts.
 * @returns The validator; it returns the answers of the fields that show, nested like the values
 *   given, or every issue in document order.
 * @throws Error when the document has problems, as `checkDocument` reports them.
 *
 * @example
 * ```ts
 * const validator = createValidator(document, fieldKinds, { messages: germanMessages })
 * const result = validator['~standard'].validate(values)
 * if (result.issues) return { issues: result.issues }
 * await saveAnswers(result.value)
 * ```
 */
export const createValidator = (
  document: FormDocument,
  kinds: FieldKinds<unknown>,
  options: ValidatorOptions = {},
): DocumentValidator => {
  refuseProblems(document, kinds)
  const messages: Messages = { ...DEFAULT_MESSAGES, ...options.messages }

  const issueOf = (shown: ShownField): ValidationIssue | undefined => {
    const failure = failureOf(shown)
    if (failure === undefined) return undefined
    const message = messages[failure.code]?.(failure.params) ?? FALLBACK_MESSAGE
    return { message, path: shown.path, ...failure }
  }

  const validate = (values: unknown): ValidationResult => {
    const { shown } = evaluate(document, kinds, values)
    const issues = shown.flatMap((field) => issueOf(field) ?? [])
    return issues.length > 0 ? { issues } : { value: answersOf(shown) }
  }

  return { '~standard': { version: 1, vendor: VENDOR, validate } }
}
