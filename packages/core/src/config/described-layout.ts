type NamesIn<TEntry> = TEntry extends string
  ? TEntry
  : TEntry extends { layout: readonly (infer TNested)[] }
    ? NamesIn<TNested>
    : TEntry extends { row: readonly (infer TNested)[] }
      ? NamesIn<TNested>
      : never

type UndescribedNames<TConfig> = TConfig extends {
  layout: readonly (infer TEntry)[]
  fields: infer TFields
}
  ? Exclude<NamesIn<TEntry>, keyof TFields>
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
