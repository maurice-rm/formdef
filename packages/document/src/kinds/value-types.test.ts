import { describe, expect, it } from 'vitest'

import { valueTypes } from './value-types'

const OPTIONS = [
  { value: 'o1', label: 'Detached' },
  { value: 'o2', label: 'Apartment block' },
]

describe('valueTypes', () => {
  it('start each field with the empty value the shadcn widgets declare', () => {
    expect(valueTypes.text.emptyValue).toBe('')
    expect(valueTypes.choice.emptyValue).toBe('')
    expect(valueTypes.choices.emptyValue).toEqual([])
    expect(valueTypes.boolean.emptyValue).toBe(false)
    expect(valueTypes.number.emptyValue).toBeUndefined()
    expect(valueTypes.decimal.emptyValue).toBe('')
    expect(valueTypes.date.emptyValue).toBe('')
  })

  it('recognise values of their shape', () => {
    expect(valueTypes.text.fits('Ada')).toBe(true)
    expect(valueTypes.text.fits(1)).toBe(false)
    expect(valueTypes.choices.fits(['o1'])).toBe(true)
    expect(valueTypes.choices.fits(['o1', 2])).toBe(false)
    expect(valueTypes.boolean.fits(false)).toBe(true)
    expect(valueTypes.number.fits(Number.NaN)).toBe(false)
    expect(valueTypes.number.fits(Number.POSITIVE_INFINITY)).toBe(false)
    expect(valueTypes.decimal.fits('120,5')).toBe(true)
    expect(valueTypes.date.fits('2026-01-31')).toBe(true)
    expect(valueTypes.date.fits('2026-01-31T09:30:00Z')).toBe(true)
    expect(valueTypes.date.fits('2026-02-31')).toBe(false)
    expect(valueTypes.date.fits('2026-01-31 09:30')).toBe(false)
  })

  it('count blank text, no choice and an unticked boolean as empty', () => {
    expect(valueTypes.text.isFilled('  ')).toBe(false)
    expect(valueTypes.choice.isFilled('')).toBe(false)
    expect(valueTypes.choices.isFilled([])).toBe(false)
    expect(valueTypes.boolean.isFilled(false)).toBe(false)
    expect(valueTypes.boolean.isFilled(true)).toBe(true)
    expect(valueTypes.number.isFilled(0)).toBe(true)
  })

  it('offer the operators of their kind of answer, and isFilled and isEmpty', () => {
    const operatorsOf = Object.fromEntries(
      Object.values(valueTypes).map(({ name, operators }) => [name, Object.keys(operators)]),
    )
    const ordered = ['equals', 'notEquals', 'lessThan', 'atMost', 'greaterThan', 'atLeast']
    const filled = ['isFilled', 'isEmpty']

    expect(operatorsOf).toEqual({
      text: filled,
      choice: ['equals', 'notEquals', 'in', 'notIn', ...filled],
      choices: ['includes', 'excludes', ...filled],
      boolean: ['isTrue', 'isFalse', ...filled],
      number: [...ordered, ...filled],
      decimal: [...ordered, ...filled],
      date: ['equals', 'before', 'onOrBefore', 'after', 'onOrAfter', ...filled],
    })
  })

  it('compare with a setting: an option, a list of them, a number or a date', () => {
    expect(valueTypes.choice.operators.equals?.compares?.type).toBe('option')
    expect(valueTypes.choice.operators.in?.compares?.type).toBe('optionList')
    expect(valueTypes.choices.operators.includes?.compares?.type).toBe('option')
    expect(valueTypes.decimal.operators.atLeast?.compares?.type).toBe('number')
    expect(valueTypes.date.operators.before?.compares?.type).toBe('date')
    expect(valueTypes.boolean.operators.isTrue?.compares).toBeUndefined()
  })

  it('read options for choices only', () => {
    const readers = Object.values(valueTypes).filter((valueType) => valueType.readsOptions)

    expect(readers.map((valueType) => valueType.name)).toEqual(['choice', 'choices'])
  })

  it('write an answer as text for a placeholder', () => {
    expect(valueTypes.text.toText('Ada', [])).toBe('Ada')
    expect(valueTypes.decimal.toText('120,5', [])).toBe('120,5')
    expect(valueTypes.date.toText('2026-01-31', [])).toBe('2026-01-31')
    expect(valueTypes.number.toText(6, [])).toBe('6')
    expect(valueTypes.choice.toText('o2', OPTIONS)).toBe('Apartment block')
    expect(valueTypes.choice.toText('o9', OPTIONS)).toBe('')
    expect(valueTypes.choices.toText(['o2', 'o1'], OPTIONS)).toBe('Apartment block, Detached')
    expect(valueTypes.boolean.toText(true, [])).toBe('')
  })

  it('describe a choice by its option, and leave out one that is no option', () => {
    expect(valueTypes.choice.describe('o2', OPTIONS)).toEqual(OPTIONS[1])
    expect(valueTypes.choice.describe('o9', OPTIONS)).toBeUndefined()
    expect(valueTypes.choices.describe(['o2', 'o1'], OPTIONS)).toEqual({
      values: [OPTIONS[1], OPTIONS[0]],
    })
    expect(valueTypes.choices.describe(['o1', 'o9'], OPTIONS)).toBeUndefined()
    expect(valueTypes.number.describe(3, [])).toEqual({ value: 3 })
    expect(valueTypes.boolean.describe(true, [])).toEqual({ value: true })
    expect(valueTypes.decimal.describe('120,5', [])).toEqual({ value: '120,5' })
  })
})
