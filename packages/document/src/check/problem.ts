import type { JsonValue } from '../json-value'

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
 * - `unknownField`: a condition on, or an expression that reads, a field the document does not
 *   hold;
 * - `laterField`: a condition on, or an expression that reads, a field that comes later, or the
 *   field itself;
 * - `repeatField`: a condition on, or an expression that reads, a field inside a repeat from
 *   outside it, where no entry is meant;
 * - `operatorMismatch`: an operator that does not fit the value type of the field compared;
 * - `unknownOption`: a compared value that is no option of the choice compared;
 * - `valueMismatch`: a compared value of the wrong type, such as text for a number;
 * - `empty`: a step, section, row or repeat without items;
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
 * - `fixedText`: a placeholder in the label of a step or section, a display's setting, the intro
 *   or the texts of a repeat, which name no answers; those of each entry name its number as `{n}`;
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
export type ProblemCode =
  | 'duplicateKey'
  | 'invalidKey'
  | 'overlappingKey'
  | 'duplicateOption'
  | 'unknownKind'
  | 'misplacedDisplay'
  | 'unknownField'
  | 'laterField'
  | 'repeatField'
  | 'operatorMismatch'
  | 'unknownOption'
  | 'valueMismatch'
  | 'empty'
  | 'tooDeep'
  | 'nestedRepeat'
  | 'minAboveMax'
  | 'unknownSetting'
  | 'missingSetting'
  | 'settingMismatch'
  | 'notVarying'
  | 'settingLimit'
  | 'missingTranslation'
  | 'unknownLanguage'
  | 'fixedText'
  | 'unknownParam'
  | 'unknownStep'
  | 'backwardJump'
  | 'unknownEnding'
  | 'fallbackNotLast'
  | 'unknownOperation'
  | 'operandMismatch'
  | 'resultMismatch'

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
