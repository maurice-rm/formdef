import { fieldId } from '../widget/field-id'

const comesFirst = (first: HTMLElement, second: HTMLElement): number =>
  first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1

/**
 * The control of the first of these fields in document order, found by its field id; `undefined`
 * when none of them renders one.
 */
export function firstControlOf(formId: string, paths: readonly string[]): HTMLElement | undefined {
  return paths
    .map((path) => document.getElementById(fieldId(formId, path)))
    .filter((control) => control !== null)
    .sort(comesFirst)[0]
}
