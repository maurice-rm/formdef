/**
 * Where a step or item sits in a form document: the index at each level, from the root down. In a
 * document with steps the first index is the step's, in one without it is the item's; `[1, 0, 2]`
 * is the third item of the first section or row of the second step. Rows and sections have no
 * keys, so a builder addresses them by position.
 */
export type Position = readonly number[]
