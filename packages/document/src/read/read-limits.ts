/**
 * The limits {@link readDocument} keeps a document within, so that a document built to be huge or
 * deeply nested cannot take a server down. The defaults hold any reasonable form.
 */
export type ReadLimits = {
  /**
   * The most levels objects and lists may nest, the document itself being the first.
   *
   * @defaultValue `32`
   */
  depth: number
  /**
   * The most items of the whole document, counting those inside rows and sections.
   *
   * @defaultValue `2000`
   */
  items: number
  /**
   * The most comparisons in all conditions of the document together.
   *
   * @defaultValue `2000`
   */
  conditions: number
  /**
   * The most options of one field.
   *
   * @defaultValue `1000`
   */
  options: number
  /**
   * The most characters of one text, such as a label or a setting.
   *
   * @defaultValue `20000`
   */
  textLength: number
}

export const READ_LIMITS: ReadLimits = {
  depth: 32,
  items: 2000,
  conditions: 2000,
  options: 1000,
  textLength: 20_000,
}
