// `TSeen` holds the entry types already walked: a layout annotated as `LayoutOf` nests its own
// recursive type, and a nested type assignable to a walked one names no name that one does not.
type NamesInEntries<TEntries, TSeen> = [TEntries] extends [TSeen]
  ? never
  : NamesIn<TEntries, TSeen | TEntries>

type NamesIn<TEntry, TSeen> = TEntry extends string
  ? TEntry
  : TEntry extends { layout: readonly (infer TNested)[] }
    ? NamesInEntries<TNested, TSeen>
    : TEntry extends { row: readonly (infer TNested)[] }
      ? NamesInEntries<TNested, TSeen>
      : never

type UndescribedNames<TConfig> = TConfig extends {
  layout: readonly (infer TEntry)[]
  fields: infer TFields
}
  ? Exclude<NamesInEntries<TEntry, never>, keyof TFields>
  : never

type UndescribedName<TName extends string> =
  `formdef: the layout names "${TName}", which fields does not describe`

/**
 * Checks the root `layout` of a config written as `TConfig`, sections and rows included: a name
 * `fields` does not describe turns `layout` into a message naming it.
 */
export type DescribedLayout<TConfig> = [UndescribedNames<TConfig>] extends [never]
  ? unknown
  : { layout: UndescribedName<UndescribedNames<TConfig> & string> }
