import type { ConfigParts } from './config-parts'
import type { LevelFields } from './field-entry'
import type { LayoutEntry } from './layout-entry'

/**
 * The `fields` and `layout` of a root level whose values are `TValues`, with the parts `TParts`:
 * what a form config holds for its fields, and what `Fields` takes.
 */
export type LevelConfig<TParts extends ConfigParts, TValues> = {
  /** The field entries of the root level. */
  fields: LevelFields<TParts, TValues, TValues>
  /**
   * The order and grouping of the root level.
   *
   * @defaultValue the fields in the order `fields` declares them
   */
  layout?: LayoutEntry<TParts, keyof TValues & string, TValues>[]
}
