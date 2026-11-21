import { DOCUMENT_PATH } from './document-path'
import type { Position } from './position'

// The steps and items right after the document, such as `document.steps[1].items[0]`.
const LEADING_ENTRIES = /^(?:\.(?:steps|items)\[\d+\])+/
const INDEX = /\[(\d+)\]/g

/**
 * The position of the step or item a path of a document runs through, as the edit operations take
 * it; `undefined` for a path of the document itself, its intro or its endings.
 */
export function positionOfPath(path: string): Position | undefined {
  if (!path.startsWith(DOCUMENT_PATH)) {
    return undefined
  }
  const entries = LEADING_ENTRIES.exec(path.slice(DOCUMENT_PATH.length))?.[0]
  if (entries === undefined) {
    return undefined
  }
  return Array.from(entries.matchAll(INDEX), (match) => Number(match[1]))
}
