import type { FormDocument } from '../form-document'
import type { FieldKind } from '../kinds/field-kind'
import type { Position } from './position'
import { failAt, isStep } from './tree'
import { updateNode } from './update-node'

/**
 * Gives a field of a form document another field kind, leaving the document given as it was. The
 * field keeps the settings the new kind has, by name, and drops the others. A condition on the
 * field whose operator no longer fits, or a required setting now missing, `checkDocument` reports.
 *
 * @param document - The document.
 * @param position - Where the field sits.
 * @param kind - The new field kind.
 * @returns The document with the field of the new kind.
 * @throws Error when no node sits at the position, or it is no field.
 *
 * @example
 * ```ts
 * const textarea = fieldKinds.byName('textarea')
 * if (textarea !== undefined) setDocument(changeKind(document, position, textarea))
 * ```
 */
export const changeKind = (
  document: FormDocument,
  position: Position,
  kind: FieldKind<unknown>,
): FormDocument =>
  updateNode(document, position, (node) => {
    if (isStep(node) || node.type !== 'field') return failAt(position, 'expected a field.')
    const { settings, ...field } = node
    const kept = Object.entries(settings ?? {}).filter(([name]) =>
      Object.hasOwn(kind.settings, name),
    )
    return {
      ...field,
      kind: kind.name,
      ...(kept.length === 0 ? {} : { settings: Object.fromEntries(kept) }),
    }
  })
