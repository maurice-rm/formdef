import type { FormDocument } from '../form-document'
import type { FieldKind } from '../kinds/field-kind'
import { failAtPosition } from './fail-at-position'
import { isField } from './is-field'
import type { Position } from './position'
import { updateNode } from './update-node'

/**
 * Gives a field of a form document another field kind, leaving the document given as it was. The
 * field keeps the settings the new kind has, by name, and drops the others. A condition on the
 * field whose operator no longer fits, or a required setting now missing, {@link checkDocument}
 * reports.
 *
 * @param document - The document.
 * @param position - Where the field sits.
 * @param kind - The new field kind.
 * @returns The document with the field of the new kind.
 * @throws When no node sits at the position, or it is no field.
 *
 * @example
 * ```ts
 * const textarea = fieldKinds.byName('textarea')
 * if (textarea !== undefined) setDocument(changeKind(document, position, textarea))
 * ```
 */
export function changeKind(
  document: FormDocument,
  position: Position,
  kind: FieldKind<unknown>,
): FormDocument {
  return updateNode(document, position, (node) => {
    if (!isField(node)) {
      return failAtPosition(position, 'expected a field.')
    }
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
}
