import { defineValueType } from './define-value-type'
import { setting } from './setting'
import type { ValueType } from './value-type'

type Counted = {
  /** The number of entries. */
  value: number
}

const NUMBER = setting.number({ label: 'Number', integer: true, required: true })

const countOf = (answer: number | undefined): number => answer ?? 0

/**
 * The value type of a repeat as a condition reads it: its number of entries, filled with one
 * entry or more. A repeat without entries, or one that does not show, counts as 0, so `atMost`
 * holds for it.
 */
export const entryCount: ValueType<number, 'entries', Counted> = defineValueType({
  name: 'entries',
  emptyValue: undefined,
  fits: (value): value is number => typeof value === 'number' && Number.isInteger(value),
  isFilled: (value) => value > 0,
  describe: (value): Counted => ({ value }),
  toText: String,
  operators: {
    atLeast: { compares: NUMBER, holds: (answer, compared) => countOf(answer) >= compared },
    atMost: { compares: NUMBER, holds: (answer, compared) => countOf(answer) <= compared },
  },
})
