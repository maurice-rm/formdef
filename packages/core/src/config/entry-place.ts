/**
 * Where an entry renders, as its `visibleWhen` and derived `props` receive it next to the values of
 * the whole form.
 *
 * @example
 * ```ts
 * const sinceWhen = {
 *   widget: 'date',
 *   visibleWhen: (values, at) => (at.item as Person | undefined)?.works === true,
 * }
 * ```
 */
export type EntryPlace = {
  /**
   * The entry's path, such as `household[1].works`; for a section, row or other layout entry, the
   * path of the level it is placed in, empty at the root.
   */
  path: string
  /** The value of the innermost array item the entry belongs to; `undefined` outside arrays. */
  item: unknown
}
