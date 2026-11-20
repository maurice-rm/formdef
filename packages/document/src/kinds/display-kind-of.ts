import { failAt } from '../fail-at'
import type { Display } from '../form-document'
import type { Catalog } from './create-catalog'
import type { DisplayKind } from './display-kind'
import type { ValueType } from './value-type'

/**
 * The display kind of a display.
 *
 * @throws When the display kind is not registered.
 */
export function displayKindOf(
  catalog: Catalog<unknown, ValueType>,
  display: Display,
): DisplayKind<unknown> {
  const kind = catalog.findDisplayKind(display.kind)
  return kind ?? failAt('display.kind', `the display kind "${display.kind}" is not registered.`)
}
