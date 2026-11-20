import type { FieldItem } from '../form-document'
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
  allFieldKeys: ReadonlySet<string>
  earlier: Map<string, EarlierField>
  problems: Problem[]
}
