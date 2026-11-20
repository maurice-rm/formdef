import { failAt } from '../fail-at'
import type { Catalog } from './create-catalog'
import type { ValueType } from './value-type'

/**
 * The value type of the catalog of this name, such as the one a computed value names.
 *
 * @throws When the catalog holds no value type of this name.
 */
export function valueTypeNamed(catalog: Catalog<unknown, ValueType>, name: string): ValueType {
  const valueType = catalog.valueTypes.find((entry) => entry.name === name)
  return valueType ?? failAt('valueType', `the value type "${name}" is not in the catalog.`)
}
