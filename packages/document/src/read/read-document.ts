import { DOCUMENT_PATH } from '../document-path'
import { failAt } from '../fail-at'
import type { FormDocument } from '../form-document'
import { FORMAT_VERSION } from '../format-version'
import { hasKey } from './has-key'
import { readItems } from './read-items'
import { readOnlyKeys } from './read-only-keys'
import { readShape } from './read-shape'
import { readSteps } from './read-steps'

const DOCUMENT_KEYS = ['format', 'steps', 'items']

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
 * @throws When the input is not a form document, naming the path of the first problem, or when its
 *   format is newer than this release reads.
 *
 * @example
 * ```ts
 * const document = readDocument(JSON.parse(row.document))
 * ```
 */
export function readDocument(input: unknown): FormDocument {
  const shape = readShape(input, DOCUMENT_PATH)
  readOnlyKeys(shape, DOCUMENT_KEYS, DOCUMENT_PATH)
  checkFormat(shape.format)
  const hasSteps = hasKey(shape, 'steps')
  const hasItems = hasKey(shape, 'items')

  if (hasSteps && hasItems) {
    failAt(DOCUMENT_PATH, 'expected either steps or items, not both.')
  }
  if (hasSteps) {
    return { format: FORMAT_VERSION, steps: readSteps(shape.steps, `${DOCUMENT_PATH}.steps`) }
  }
  if (hasItems) {
    return { format: FORMAT_VERSION, items: readItems(shape.items, `${DOCUMENT_PATH}.items`) }
  }

  return failAt(DOCUMENT_PATH, 'expected either steps or items.')
}
