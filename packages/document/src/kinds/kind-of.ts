import type { FieldItem } from '../form-document'
import type { FieldKinds } from './create-field-kinds'
import type { FieldKind } from './field-kind'

/**
 * The field kind of a field.
 *
 * @throws Error when the field kind is not registered.
 */
export const kindOf = (kinds: FieldKinds<unknown>, field: FieldItem): FieldKind<unknown> => {
  const kind = kinds.byName(field.kind)
  if (kind === undefined) {
    throw new Error(`formdef: ${field.key}.kind: the field kind ${field.kind} is not registered.`)
  }
  return kind
}
