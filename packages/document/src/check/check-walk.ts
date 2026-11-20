import type { BlockKind } from '../kinds/block-kind'
import type { DisplayKind } from '../kinds/display-kind'
import type { FieldKind } from '../kinds/field-kind'
import type { ValueType } from '../kinds/value-type'
import type { Problem } from './problem'

/** An answer already passed in document order, which later conditions may compare. */
export type EarlierField = {
  /** The key the answer sits under. */
  key: string
  /** The value type of the answer; `undefined` when its kind is not registered. */
  valueType: ValueType | undefined
  /** The values of the options the answer chooses among. */
  optionValues: ReadonlySet<string>
}

/** What a check of one document carries along while it walks the document in order. */
export type CheckWalk = {
  /** The field kind of this name, or `undefined` when none is registered. */
  kindNamed: (name: string) => FieldKind<unknown> | undefined
  /** The block kind of this name, or `undefined` when none is registered. */
  blockKindNamed: (name: string) => BlockKind<unknown> | undefined
  /** The display kind of this name, or `undefined` when none is registered. */
  displayKindNamed: (name: string) => DisplayKind<unknown> | undefined
  /** The value type of this name, or `undefined` when the catalog holds none. */
  valueTypeNamed: (name: string) => ValueType | undefined
  /** The languages the document names; `undefined` when its texts are strings. */
  languages: readonly string[] | undefined
  allFieldKeys: ReadonlySet<string>
  earlier: Map<string, EarlierField>
  problems: Problem[]
}
