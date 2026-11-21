import { refuseProblems } from '../check/refuse-problems'
import { evaluate } from '../evaluate/evaluate'
import { holds } from '../evaluate/holds'
import type { Ending, FormDocument } from '../form-document'
import { jumpEndingsOf } from '../jump-endings-of'
import type { Catalog } from '../kinds/create-catalog'
import type { ValueType } from '../kinds/value-type'
import { languageOf } from '../language-of'

/** What {@link endingOf} takes besides the document and its catalog. */
export type EndingOptions = {
  /** The values given, nested by step key in a document with steps, flat without. */
  values: unknown
  /**
   * The language the conditions read option texts in; a language the document does not name gives
   * its first.
   *
   * @defaultValue the document's first language
   */
  language?: string
}

/**
 * Tells which ending of a form document applies to these answers: the one a jump ended the form
 * with, otherwise the first whose condition holds, otherwise the one without a condition. An
 * ending a jump names applies only through its jump. A server and a confirmation email use it to
 * agree with the page the person sees.
 *
 * @param document - The document, as {@link readDocument} returns it.
 * @param catalog - The catalog with the kinds the document uses.
 * @param options - The values given and the language.
 * @param options.values - The values given, nested by step key in a document with steps, flat
 *   without.
 * @param options.language - The language the conditions read option texts in.
 * @defaultValue `options.language`: the document's first language.
 * @returns The ending, or `undefined` when none applies or the document has none.
 * @throws When the document has problems, as {@link checkDocument} reports them.
 *
 * @example
 * ```ts
 * const ending = endingOf(document, catalog, { values: result.value })
 * await sendConfirmation(ending?.key ?? 'thanks')
 * ```
 */
export function endingOf(
  document: FormDocument,
  catalog: Catalog<unknown, ValueType>,
  options: EndingOptions,
): Ending | undefined {
  refuseProblems(document, catalog)
  const language = languageOf(document, options.language)
  const { end, answers } = evaluate(document, catalog, { values: options.values, language })
  const endings = document.endings ?? []
  if (end !== undefined) {
    return endings.find((ending) => ending.key === end.ending)
  }
  const jumpEndings = jumpEndingsOf(document)
  return endings.find(
    (ending) =>
      !jumpEndings.has(ending.key) && (ending.when === undefined || holds(ending.when, answers)),
  )
}
