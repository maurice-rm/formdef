import type { DocumentItem, FormDocument } from './form-document'

/** The top items of a form, those of each step in turn in a form of steps. */
export function formItemsOf(document: FormDocument): readonly DocumentItem[] {
  return document.steps === undefined
    ? document.items
    : document.steps.flatMap((step) => step.items)
}
