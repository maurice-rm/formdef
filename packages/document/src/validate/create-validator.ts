import { refuseProblems } from '../check/refuse-problems'
import type { DocumentValues } from '../document-values'
import { evaluate, type ShownField } from '../evaluate/evaluate'
import { isFilled } from '../evaluate/is-filled'
import { isMissing } from '../evaluate/is-missing'
import type { FormDocument, JsonValue } from '../form-document'
import type { Catalog } from '../kinds/create-catalog'
import { optionOf } from '../kinds/option-of'
import { optionsOf } from '../kinds/options-of'
import type { ValueType } from '../kinds/value-type'
import { nestValues } from '../nest-values'
import { DEFAULT_MESSAGES, FALLBACK_MESSAGE, type Messages } from './messages'

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
    /** The type of the answers, for inference only; never set at runtime. */
    readonly types?: { readonly input: DocumentValues; readonly output: DocumentValues } | undefined
  }
}

/** What {@link createValidator} takes besides the document and its catalog. */
export type ValidatorOptions = {
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
  const choices: unknown[] = Array.isArray(value) ? value : [value]
  const options = optionsOf(field)
  return choices.every((choice) => optionOf(options, choice) !== undefined)
}

const failureOf = (shown: ShownField): Failure | undefined => {
  const { kind, value } = shown
  const { valueType } = kind
  if (!isMissing(value) && !valueType.fits(value)) {
    return { code: 'type', params: { expected: valueType.name } }
  }
  if (!isFilled(value, valueType)) {
    return shown.isRequired ? { code: 'required', params: {} } : undefined
  }
  if (valueType.readsOptions && !fitsOptions(shown)) {
    return { code: 'option', params: {} }
  }
  const failed = kind
    .rules(shown.settings)
    .find((entry) => entry !== undefined && !entry.passes(value as never))
  return failed === undefined ? undefined : { code: failed.code, params: failed.params }
}

const answersOf = (shown: readonly ShownField[]): DocumentValues =>
  nestValues(shown.filter(({ value }) => value !== undefined))

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
 * @param document - The document, as {@link readDocument} returns it.
 * @param catalog - The catalog with the kinds the document uses.
 * @param options - The error texts.
 * @param options.messages - The error texts, by issue code; a code left out keeps its English
 *   text, and a code without any text gets a general one.
 * @defaultValue `options.messages`: the English texts.
 * @returns The validator; it returns the answers of the fields that show, nested like the values
 *   given, or every issue in document order.
 * @throws When the document has problems, as {@link checkDocument} reports them.
 *
 * @example
 * ```ts
 * const validator = createValidator(document, catalog, { messages: germanMessages })
 * const result = validator['~standard'].validate(values)
 * if (result.issues) return { issues: result.issues }
 * await saveAnswers(result.value)
 * ```
 */
export function createValidator(
  document: FormDocument,
  catalog: Catalog<unknown, ValueType>,
  options: ValidatorOptions = {},
): DocumentValidator {
  refuseProblems(document, catalog)
  const messages: Messages = { ...DEFAULT_MESSAGES, ...options.messages }

  const issueOf = (shown: ShownField): ValidationIssue | undefined => {
    const failure = failureOf(shown)
    if (failure === undefined) {
      return undefined
    }
    const message = messages[failure.code]?.(failure.params) ?? FALLBACK_MESSAGE
    return { message, path: shown.path, ...failure }
  }

  const validate = (values: unknown): ValidationResult => {
    const { shown } = evaluate(document, catalog, values)
    const issues = shown.flatMap((field) => issueOf(field) ?? [])
    return issues.length > 0 ? { issues } : { value: answersOf(shown) }
  }

  return { '~standard': { version: 1, vendor: VENDOR, validate } }
}
