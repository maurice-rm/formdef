type NoLevel<TName extends string> =
  `formdef: the step "${TName}" names a field entry without fields`

type StepNamesIn<TEntry> = TEntry extends { step: infer TName extends string } ? TName : never

type NamesWithoutLevel<TConfig> = TConfig extends {
  layout: readonly (infer TEntry)[]
  fields: infer TFields
}
  ? {
      [Name in StepNamesIn<TEntry>]: Name extends keyof TFields
        ? TFields[Name] extends { fields: object }
          ? never
          : Name
        : never
    }[StepNamesIn<TEntry>]
  : never

/**
 * Checks the steps of a config written as `TConfig`: a step renders the `fields` and `layout` of
 * the entry it names, so a step naming an entry of another shape, a widget or `render`, turns
 * `layout` into a message naming it.
 */
export type StepsNameLevels<TConfig> = [NamesWithoutLevel<TConfig>] extends [never]
  ? unknown
  : { layout: NoLevel<NamesWithoutLevel<TConfig> & string> }
