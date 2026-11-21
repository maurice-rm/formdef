import type { ProblemCode, ProblemParams } from './problem'

type WithLabel<TParams> = TParams extends unknown
  ? { readonly [Name in keyof (TParams & { label: string })]: (TParams & { label: string })[Name] }
  : never

type MessageOf<TCode extends ProblemCode> = (params: WithLabel<ProblemParams[TCode]>) => string

/**
 * The texts of the problems {@link checkDocument} reports, by code: each takes the problem's params
 * and the `label` of the step or item concerned, in the language checked, empty without one. A
 * code left out keeps its English text.
 */
export type ProblemMessages = { readonly [Code in ProblemCode]?: MessageOf<Code> }

const NOTHING = 'nothing'

/** The package's English texts of every problem, which name no label. */
export const DEFAULT_PROBLEM_MESSAGES: { readonly [Code in ProblemCode]: MessageOf<Code> } = {
  duplicateKey: ({ key }) => `This key is used twice: ${key}.`,
  invalidKey: ({ key }) => `This key is empty or holds a dot or a bracket: ${key}.`,
  overlappingKey: ({ key, start }) => `This step key starts with another step's: ${key}, ${start}.`,
  duplicateOption: ({ value }) => `This option value is used twice: ${value}.`,
  unknownKind: ({ kind }) => `This content is of a kind that is not registered: ${kind}.`,
  misplacedDisplay: ({ kind, appliesTo }) =>
    `This display does not apply here: ${kind} applies to a ${appliesTo}.`,
  misplacedSubmit: () => 'A form of steps submits through its stepper, not a submit button.',
  unknownField: ({ field }) => `This names a field the form does not hold: ${field}.`,
  laterField: ({ field }) => `This names a field that comes later, or itself: ${field}.`,
  repeatField: ({ field }) =>
    `This names a field inside a repeat, where no entry is meant: ${field}.`,
  operatorMismatch: ({ op, valueType }) => `A ${valueType} answer has no operator ${op}.`,
  unknownOption: ({ field, value }) => `This is no option of ${field}: ${value}.`,
  valueMismatch: ({ expected }) =>
    expected === NOTHING ? 'This compares with nothing.' : `This value is no ${expected}.`,
  empty: () => 'This holds no items.',
  tooDeep: () => 'This section sits too deep: sections nest two levels at most.',
  nestedRepeat: () => 'A repeat cannot sit inside another repeat.',
  minAboveMax: ({ min, max }) => `The fewest entries, ${min}, are more than the most, ${max}.`,
  unknownSetting: ({ setting }) => `This kind has no setting ${setting}.`,
  missingSetting: ({ setting }) => `The setting ${setting} is required.`,
  settingMismatch: ({ setting, type }) => `The setting ${setting} is no ${type}.`,
  notVarying: ({ setting }) => `The setting ${setting} cannot follow an answer.`,
  settingLimit: ({ setting }) => `The setting ${setting} is outside its limits.`,
  valueLimit: ({ op }) => `The value ${op} compares with is outside its limits.`,
  missingTranslation: ({ language }) => `This text has no translation into ${language}.`,
  unknownLanguage: ({ language }) =>
    `This text is translated into ${language}, which the form does not name.`,
  invalidLanguage: ({ language }) => `This is no language code, such as de or de-CH: ${language}.`,
  fixedText: ({ field }) => `This text names no answers, so it cannot name ${field}.`,
  repeatPlaceholder: ({ field }) =>
    `This names the repeat ${field}, which writes nothing without entries; a computed count writes their number.`,
  unknownParam: ({ param, code }) => `The error text for ${code} has no placeholder ${param}.`,
  unknownStep: ({ step }) => `This jumps to a step the form does not hold: ${step}.`,
  backwardJump: ({ step }) => `This jumps back to ${step}, but a jump goes forward only.`,
  unknownEnding: ({ ending }) => `This ends the form with an ending it does not hold: ${ending}.`,
  fallbackNotLast: () => 'An ending without a condition comes last: those after it never apply.',
  unknownOperation: ({ op }) => `This operation is not known: ${op}.`,
  operandMismatch: ({ op, expected }) => `The operation ${op} expects ${expected}.`,
  resultMismatch: ({ valueType, result }) =>
    result === undefined
      ? `A computed value is a number, a text or a date, not a ${valueType}.`
      : `This comes to a ${result}, not a ${valueType}.`,
}
