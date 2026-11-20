import type { JsonValue } from '../json-value'

/**
 * What a problem of a form document is about:
 *
 * - `duplicateKey`: a step key used twice, or a key of fields and blocks used twice;
 * - `invalidKey`: a step, field or block key that is empty or holds a dot or a bracket;
 * - `overlappingKey`: a step key that starts with another step's key, such as `s10` after `s1`;
 * - `duplicateOption`: an option value used twice in one field;
 * - `unknownKind`: a field or block of a kind that is not registered;
 * - `unknownField`: a condition on a field the document does not hold;
 * - `laterField`: a condition on a field that comes later, or on the field itself;
 * - `operatorMismatch`: an operator that does not fit the value type of the field compared;
 * - `unknownOption`: a compared value that is no option of the choice compared;
 * - `valueMismatch`: a compared value of the wrong type, such as text for a number;
 * - `empty`: a step, section or row without items;
 * - `tooDeep`: a section inside a section inside a section;
 * - `unknownSetting`: a setting the field kind does not have;
 * - `missingSetting`: a required setting left out;
 * - `settingMismatch`: a setting of the wrong type;
 * - `notVarying`: a setting that follows an answer, which its field kind does not allow;
 * - `settingLimit`: a setting outside its constraints, such as too long or too few options;
 * - `missingTranslation`: a translated text that leaves out a language of the document;
 * - `unknownLanguage`: a translation into a language the document does not name;
 * - `fixedText`: a placeholder in the label of a step or section, which names no answers;
 * - `unknownParam`: a placeholder in a field's error text that its issue code has no param for.
 *
 * A placeholder on a field that does not exist or comes later is reported as `unknownField` or
 * `laterField`, like a condition.
 */
export type ProblemCode =
  | 'duplicateKey'
  | 'invalidKey'
  | 'overlappingKey'
  | 'duplicateOption'
  | 'unknownKind'
  | 'unknownField'
  | 'laterField'
  | 'operatorMismatch'
  | 'unknownOption'
  | 'valueMismatch'
  | 'empty'
  | 'tooDeep'
  | 'unknownSetting'
  | 'missingSetting'
  | 'settingMismatch'
  | 'notVarying'
  | 'settingLimit'
  | 'missingTranslation'
  | 'unknownLanguage'
  | 'fixedText'
  | 'unknownParam'

/**
 * One problem {@link checkDocument} found in a form document: what it is about, where, and what an
 * error text names. The text itself comes from the project, keyed by the code.
 */
export type Problem = {
  /** What the problem is about. */
  code: ProblemCode
  /** Where in the document, such as `document.steps[0].items[2].settings.unit`. */
  path: string
  /** What an error text names, such as the key used twice. */
  params: Record<string, JsonValue>
}
