import type { SettingOption } from './setting'

/** What a value type writes an answer as text with. */
export type TextContext = {
  /** The options of the answer's field; none for a field without options or a computed value. */
  options: readonly SettingOption[]
  /**
   * The language the text is written in: the document's, or else the catalog's; `undefined` when
   * neither names one.
   */
  language: string | undefined
}
