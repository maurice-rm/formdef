import { failAt } from '../fail-at'
import type { BlockItem } from '../form-document'
import type { BlockKind } from './block-kind'
import type { Catalog } from './create-catalog'
import type { ValueType } from './value-type'

/**
 * The block kind of a block.
 *
 * @throws When the block kind is not registered.
 */
export function blockKindOf(
  catalog: Catalog<unknown, ValueType>,
  block: BlockItem,
): BlockKind<unknown> {
  const kind = catalog.findBlockKind(block.kind)
  return kind ?? failAt(`${block.key}.kind`, `the block kind "${block.kind}" is not registered.`)
}
