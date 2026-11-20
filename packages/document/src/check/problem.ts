import type { Position } from '../position'

/**
 * What a problem of a form document is about:
 *
 * - `duplicateKey`: a step key used twice, or a key of fields, blocks, computed values and repeats
 *   used twice;
 * - `invalidKey`: a step, field, block, computed value or repeat key that is empty or holds a dot
 *   or a bracket;
 * - `overlappingKey`: a step key that starts with another step's key, such as `s10` after `s1`;
 * - `duplicateOption`: an option value used twice in one field;
 * - `unknownKind`: a field, block or display of a kind that is not registered;
 * - `misplacedDisplay`: a display where its kind does not apply, such as a section's on a row, or
 *   the form's in a form without steps;
 * - `misplacedSubmit`: the label of a submit button in a form of steps, whose stepper submits;
 * - `unknownField`: a condition on, or an expression that reads, a field the document does not
 *   hold;
 * - `laterField`: a condition on, or an expression that reads, a field that comes later, or the
 *   field itself;
 * - `repeatField`: a condition on, or an expression that reads, a field inside a repeat from
 *   outside it, where no entry is meant;
 * - `operatorMismatch`: an operator that does not fit the value type of the field compared;
 * - `unknownOption`: a compared value that is no option of the choice compared;
 * - `valueMismatch`: a compared value of the wrong type, such as text for a number;
 * - `empty`: a step, section, row or repeat without items, or a form of steps without steps;
 * - `tooDeep`: a section inside a section inside a section, counting those around a repeat;
 * - `nestedRepeat`: a repeat inside a repeat;
 * - `minAboveMax`: a repeat whose fewest entries are more than its most;
 * - `unknownSetting`: a setting the field kind does not have;
 * - `missingSetting`: a required setting left out;
 * - `settingMismatch`: a setting of the wrong type;
 * - `notVarying`: a setting that follows an answer, which its field kind does not allow;
 * - `settingLimit`: a setting outside its constraints, such as too long or too few options;
 * - `missingTranslation`: a translated text that leaves out a language of the document;
 * - `unknownLanguage`: a translation into a language the document does not name;
 * - `fixedText`: a placeholder in the label of a step or section, a display's setting, the intro,
 *   the submit button or the texts of a repeat, which name no answers; those of each entry name its number as `{n}`;
 * - `unknownParam`: a placeholder in a field's error text that its issue code has no param for;
 * - `unknownStep`: a jump to a step the document does not hold;
 * - `backwardJump`: a jump to the step itself or an earlier one, which could loop;
 * - `unknownEnding`: a jump that ends the form with an ending the document does not hold;
 * - `fallbackNotLast`: an ending without a condition before the last, which hides those after it;
 * - `unknownOperation`: an operation of an expression the package does not know;
 * - `operandMismatch`: an operand of the wrong kind or number, such as text to `add`, or an
 *   answer that is no number, text or date;
 * - `resultMismatch`: a computed value of a value type other than `number`, `text` or `date`, or
 *   whose expression comes to another.
 *
 * A placeholder, or a `valueFrom`, on a field that does not exist or comes later is reported as
 * `unknownField` or `laterField`, like a condition or an expression.
 */
export type ProblemCode = keyof ProblemParams

type NoParams = Record<never, never>
type NamesField = { field: string }
type NamesSetting = { setting: string }
type NamesLanguage = { language: string }
type NamesStep = { step: string }

/**
 * What the text of each problem names, by code, as {@link checkDocument} reports it; every text
 * receives the `label` of the item concerned besides.
 */
export type ProblemParams = {
  /** The key used twice. */
  duplicateKey: { key: string }
  /** The key that is no plain name. */
  invalidKey: { key: string }
  /** The step key, and the other step key it starts with. */
  overlappingKey: { key: string; start: string }
  /** The option value used twice. */
  duplicateOption: { value: string }
  /** The kind that is not registered. */
  unknownKind: { kind: string }
  /** The display kind, and what it applies to. */
  misplacedDisplay: { kind: string; appliesTo: string }
  /** The label of a submit button in a form of steps. */
  misplacedSubmit: NoParams
  /** The field the document does not hold. */
  unknownField: NamesField
  /** The field that comes later. */
  laterField: NamesField
  /** The field inside a repeat, named from outside it. */
  repeatField: NamesField
  /** The operator, and the value type of the field compared. */
  operatorMismatch: { op: string; valueType: string }
  /** The field, and the value that is no option of it. */
  unknownOption: { field: string; value: string }
  /** The type expected: a setting type, or `nothing`. */
  valueMismatch: { expected: string }
  /** A step, section, row or repeat without items, or a form of steps without steps. */
  empty: NoParams
  /** A section nested too deep. */
  tooDeep: NoParams
  /** A repeat inside a repeat. */
  nestedRepeat: NoParams
  /** The fewest and the most entries of the repeat. */
  minAboveMax: { min: number; max: number }
  /** The setting the kind does not have. */
  unknownSetting: NamesSetting
  /** The required setting left out. */
  missingSetting: NamesSetting
  /** The setting, and the type it has. */
  settingMismatch: { setting: string; type: string }
  /** The setting that follows an answer, which its kind does not allow. */
  notVarying: NamesSetting
  /** The setting, and the constraint it is outside of. */
  settingLimit: NamesSetting & ({ minCount: number } | { maxLength: number } | { integer: true })
  /** The language a translated text leaves out. */
  missingTranslation: NamesLanguage
  /** The language the document does not name. */
  unknownLanguage: NamesLanguage
  /** The field a text names that names no answers. */
  fixedText: NamesField
  /** The placeholder, and the issue code that has no param for it. */
  unknownParam: { param: string; code: string }
  /** The step the document does not hold. */
  unknownStep: NamesStep
  /** The step itself or an earlier one a jump goes to. */
  backwardJump: NamesStep
  /** The ending the document does not hold. */
  unknownEnding: { ending: string }
  /** An ending without a condition before the last. */
  fallbackNotLast: NoParams
  /** The operation the package does not know. */
  unknownOperation: { op: string }
  /** The operation, and what it expects. */
  operandMismatch: { op: string; expected: string }
  /** The value type given, and what the expression comes to when that is the mismatch. */
  resultMismatch: { valueType: string; result?: string }
}

type FoundOf<TCode extends ProblemCode> = {
  /** What the problem is about. */
  code: TCode
  /** Where in the document, such as `document.steps[0].items[2].settings.unit`. */
  path: string
  /** What its text names, such as the key used twice. */
  params: ProblemParams[TCode]
}

/** A problem as the check finds it, before it is placed and put into words. */
export type FoundProblem = { [Code in ProblemCode]: FoundOf<Code> }[ProblemCode]

/**
 * One problem {@link checkDocument} found in a form document: what it is about, where, what its
 * text names, and the text.
 */
export type Problem = FoundProblem & {
  /**
   * The position of the step or item it sits on, as the edit operations take it; left out for a
   * problem of the document itself, its intro or its endings.
   */
  position?: Position
  /** The text, the project's for its code or the package's English one. */
  message: string
}
