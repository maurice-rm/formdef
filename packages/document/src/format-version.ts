/**
 * The version of the form document format this release reads and writes.
 *
 * Every form document carries the version it was written with. A newer version is refused, since
 * this release cannot know its shape.
 *
 * @example
 * ```ts
 * const empty = { format: FORMAT_VERSION, items: [] }
 * ```
 */
export const FORMAT_VERSION: 1 = 1
