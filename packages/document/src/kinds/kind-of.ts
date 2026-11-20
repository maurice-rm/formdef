import { failAt } from '../fail-at'
import type { FieldItem } from '../form-document'
import type { Catalog } from './create-catalog'
import type { FieldKind } from './field-kind'

/**
 * The field kind of a field.
 *
 * @throws When the field kind is not registered.
 */
export function kindOf(catalog: Catalog<unknown>, field: FieldItem): FieldKind<unknown> {
  const kind = catalog.findFieldKind(field.kind)
  return kind ?? failAt(`${field.key}.kind`, `the field kind "${field.kind}" is not registered.`)
}
