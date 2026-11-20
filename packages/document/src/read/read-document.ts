import { DOCUMENT_PATH } from '../document-path'
import { failAt } from '../fail-at'
import type { FormDocument } from '../form-document'
import { FORMAT_VERSION } from '../format-version'
import { checkCounts } from './check-counts'
import { checkInput } from './check-input'
import { hasKey } from './has-key'
import { readDisplay } from './read-display'
import { readEndings } from './read-endings'
import { readIntro } from './read-intro'
import { readItems } from './read-items'
import { readLanguages } from './read-languages'
import { READ_LIMITS, type ReadLimits } from './read-limits'
import { readOnlyKeys } from './read-only-keys'
import { readShape, type Shape } from './read-shape'
import { readSteps } from './read-steps'
import { withOptional } from './with-optional'

const DOCUMENT_KEYS = ['format', 'languages', 'display', 'intro', 'endings', 'steps', 'items']

const checkFormat = (value: unknown): void => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    failAt(`${DOCUMENT_PATH}.format`, 'expected a whole number of 1 or more.')
  }
  if (value > FORMAT_VERSION) {
    failAt(
      `${DOCUMENT_PATH}.format`,
      `format ${value} is newer than format ${FORMAT_VERSION} this release reads.`,
    )
  }
}

/** What {@link readDocument} takes besides the input. */
export type ReadOptions = {
  /**
   * The limits the document has to keep within; a limit left out keeps its default.
   *
   * @defaultValue depth 32, items 2000, conditions 2000, options 1000, textLength 20000
   */
  limits?: { [Name in keyof ReadLimits]?: ReadLimits[Name] | undefined }
}

const limitsOf = (given: ReadOptions['limits'] = {}): ReadLimits => {
  const limits = { ...READ_LIMITS }
  for (const name of Object.keys(READ_LIMITS) as (keyof ReadLimits)[]) {
    limits[name] = given[name] ?? READ_LIMITS[name]
  }
  return limits
}

const readShapeOf = (shape: Shape): FormDocument => {
  readOnlyKeys(shape, DOCUMENT_KEYS, DOCUMENT_PATH)
  checkFormat(shape.format)
  const hasSteps = hasKey(shape, 'steps')
  const hasItems = hasKey(shape, 'items')

  if (hasSteps && hasItems) {
    failAt(DOCUMENT_PATH, 'expected either steps or items, not both.')
  }
  const head = {
    format: FORMAT_VERSION,
    ...withOptional(
      'languages',
      shape.languages === undefined
        ? undefined
        : readLanguages(shape.languages, `${DOCUMENT_PATH}.languages`),
    ),
    ...readDisplay(shape, DOCUMENT_PATH),
    ...withOptional(
      'intro',
      shape.intro === undefined ? undefined : readIntro(shape.intro, `${DOCUMENT_PATH}.intro`),
    ),
    ...withOptional(
      'endings',
      shape.endings === undefined
        ? undefined
        : readEndings(shape.endings, `${DOCUMENT_PATH}.endings`),
    ),
  }
  if (hasSteps) {
    return { ...head, steps: readSteps(shape.steps, `${DOCUMENT_PATH}.steps`) }
  }
  if (hasItems) {
    return { ...head, items: readItems(shape.items, `${DOCUMENT_PATH}.items`) }
  }

  return failAt(DOCUMENT_PATH, 'expected either steps or items.')
}

/**
 * Reads a form document from storage, a request or a builder, and checks its shape: every key and
 * every value where the format expects it, and nothing the format does not know. It keeps the
 * document within limits on its nesting, its number of items, comparisons and options, and the
 * length of its texts, refuses the keys `__proto__`, `constructor` and `prototype` anywhere, and
 * builds the document it returns from fresh objects.
 *
 * It checks the shape only. Whether the document makes sense as a form, such as unique keys or
 * conditions on fields that exist, is a separate check.
 *
 * @param input - The parsed JSON, of unknown shape.
 * @param options - The limits.
 * @param options.limits - The limits the document has to keep within; a limit left out keeps its
 *   default.
 * @defaultValue `options.limits`: depth 32, items 2000, conditions 2000, options 1000, textLength
 *   20000.
 * @returns A copy of the document in the current format; the input is not changed.
 * @throws When the input is not a form document, naming the path of the first problem; when it is
 *   beyond a limit, naming the limit; or when its format is newer than this release reads.
 *
 * @example
 * ```ts
 * const document = readDocument(JSON.parse(row.document), { limits: { items: 500 } })
 * ```
 */
export function readDocument(input: unknown, options: ReadOptions = {}): FormDocument {
  const limits = limitsOf(options.limits)
  checkInput(input, { limits, path: DOCUMENT_PATH })
  const document = readShapeOf(readShape(input, DOCUMENT_PATH))
  checkCounts(document, limits)
  return document
}
