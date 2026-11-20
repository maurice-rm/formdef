import type { Answers } from './answers'

/** Answers where none is given yet, such as for the intro, or for an entry that is not there. */
export const NO_ANSWERS: Answers = {
  get: () => undefined,
  valueTypeOf: () => undefined,
  entriesOf: () => [],
  repeatOf: () => undefined,
}
