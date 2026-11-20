import type { FieldItem } from '../form-document'
import type { BlockKind } from '../kinds/block-kind'
import type { DisplayKind } from '../kinds/display-kind'
import type { FieldKind } from '../kinds/field-kind'
import type { Problem } from './problem'

/** A field already passed in document order, which later conditions may compare. */
export type EarlierField = {
  field: FieldItem
  kind: FieldKind<unknown> | undefined
}

/** What a check of one document carries along while it walks the document in order. */
export type CheckWalk = {
  /** The field kind of this name, or `undefined` when none is registered. */
  kindNamed: (name: string) => FieldKind<unknown> | undefined
  /** The block kind of this name, or `undefined` when none is registered. */
  blockKindNamed: (name: string) => BlockKind<unknown> | undefined
  /** The display kind of this name, or `undefined` when none is registered. */
  displayKindNamed: (name: string) => DisplayKind<unknown> | undefined
  /** The languages the document names; `undefined` when its texts are strings. */
  languages: readonly string[] | undefined
  allFieldKeys: ReadonlySet<string>
  earlier: Map<string, EarlierField>
  problems: Problem[]
}
