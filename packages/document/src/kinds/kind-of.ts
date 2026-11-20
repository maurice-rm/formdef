import { failAt } from '../fail-at'
import type { FieldItem } from '../form-document'
import type { FieldKinds } from './create-field-kinds'
import type { FieldKind } from './field-kind'

/**
 * The field kind of a field.
 *
 * @throws When the field kind is not registered.
 */
export function kindOf(kinds: FieldKinds<unknown>, field: FieldItem): FieldKind<unknown> {
  const kind = kinds.byName(field.kind)
  return kind ?? failAt(`${field.key}.kind`, `the field kind "${field.kind}" is not registered.`)
}
