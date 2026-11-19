import type { FormDocument } from './form-document'
import { FORMAT_VERSION } from './format-version'
import { readItems, readSteps } from './read/read-items'
import { failAt, hasKey, readOnlyKeys, readShape } from './read/reader'

const ROOT = 'document'
const ROOT_KEYS = ['format', 'steps', 'items']

const checkFormat = (value: unknown): void => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    failAt(`${ROOT}.format`, 'expected a whole number of 1 or more.')
    return
  }
  if (value > FORMAT_VERSION) {
    failAt(
      `${ROOT}.format`,
      `format ${value} is newer than format ${FORMAT_VERSION} this release reads.`,
    )
  }
}

/**
 * Reads a form document from storage, a request or a builder, and checks its shape: every key and
 * every value where the format expects it, and nothing the format does not know. A document of an
 * older format is upgraded to the current one.
 *
 * It checks the shape only. Whether the document makes sense as a form, such as unique keys or
 * conditions on fields that exist, is a separate check.
 *
 * @param input - The parsed JSON, of unknown shape.
 * @returns A copy of the document in the current format; the input is not changed.
 * @throws Error when the input is not a form document, naming the path of the first problem, or
 *   when its format is newer than this release reads.
 *
 * @example
 * ```ts
 * const document = readDocument(JSON.parse(row.document))
 * ```
 */
export const readDocument = (input: unknown): FormDocument => {
  const shape = readShape(input, ROOT)
  readOnlyKeys(shape, ROOT_KEYS, ROOT)
  checkFormat(shape.format)
  const hasSteps = hasKey(shape, 'steps')
  const hasItems = hasKey(shape, 'items')

  if (hasSteps && hasItems) failAt(ROOT, 'expected either steps or items, not both.')
  if (hasSteps) return { format: FORMAT_VERSION, steps: readSteps(shape.steps, `${ROOT}.steps`) }
  if (hasItems) return { format: FORMAT_VERSION, items: readItems(shape.items, `${ROOT}.items`) }

  return failAt(ROOT, 'expected either steps or items.')
}
