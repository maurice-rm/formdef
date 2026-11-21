import { describe, expect, it } from 'vitest'

import { rule } from './rule'

describe('rule', () => {
  it('leaves out a bound that is not set, so settings can pass it straight through', () => {
    expect(rule.min(undefined)).toBeUndefined()
    expect(rule.max(undefined)).toBeUndefined()
    expect(rule.maxLength(undefined)).toBeUndefined()
    expect(rule.minCount(undefined)).toBeUndefined()
    expect(rule.maxCount(undefined)).toBeUndefined()
    expect(rule.earliest(undefined)).toBeUndefined()
    expect(rule.latest(undefined)).toBeUndefined()
  })

  it('carries a code and its parameters for the error text', () => {
    expect(rule.min(2)).toMatchObject({ code: 'min', params: { min: 2 } })
    expect(rule.maxLength(200)).toMatchObject({ code: 'maxLength', params: { maxLength: 200 } })
  })

  it('compares numbers and decimals written with a comma or a dot', () => {
    const atLeastTwo = rule.min(2)

    expect(atLeastTwo?.passes(2)).toBe(true)
    expect(atLeastTwo?.passes(1)).toBe(false)
    expect(atLeastTwo?.passes('2,5')).toBe(true)
    expect(atLeastTwo?.passes('1.5')).toBe(false)
    expect(rule.max(10)?.passes('10,0')).toBe(true)
    expect(rule.max(10)?.passes(11)).toBe(false)
  })

  it('tells a decimal and a whole number apart', () => {
    expect(rule.decimal().passes('120,5')).toBe(true)
    expect(rule.decimal().passes('120.5')).toBe(true)
    expect(rule.decimal().passes('ca. 120')).toBe(false)
    expect(rule.integer().passes(3)).toBe(true)
    expect(rule.integer().passes(3.5)).toBe(false)
    expect(rule.integer().passes('3')).toBe(true)
    expect(rule.integer().passes('3,5')).toBe(false)
  })

  it('checks the length of text and the count of choices', () => {
    expect(rule.maxLength(3)?.passes('abc')).toBe(true)
    expect(rule.maxLength(3)?.passes('abcd')).toBe(false)
    expect(rule.minCount(1)?.passes(['a'])).toBe(true)
    expect(rule.minCount(1)?.passes([])).toBe(false)
    expect(rule.maxCount(2)?.passes(['a', 'b', 'c'])).toBe(false)
  })

  it('compares dates as ISO strings', () => {
    expect(rule.earliest('2026-01-01')?.passes('2026-01-01')).toBe(true)
    expect(rule.earliest('2026-01-01')?.passes('2025-12-31')).toBe(false)
    expect(rule.latest('2026-01-01')?.passes('2026-01-02')).toBe(false)
  })

  it('compares the day of a date with a time', () => {
    expect(rule.latest('2026-01-01')?.passes('2026-01-01T10:00')).toBe(true)
    expect(rule.earliest('2026-01-02')?.passes('2026-01-01T23:59')).toBe(false)
  })

  it('checks the shape of an email address', () => {
    expect(rule.email().passes('anna@example.com')).toBe(true)
    expect(rule.email().passes('anna@example')).toBe(false)
    expect(rule.email().passes('anna example.com')).toBe(false)
    expect(rule.email().passes('anna@.example')).toBe(false)
    expect(rule.email().passes('anna@example.')).toBe(false)
    expect(rule.email().passes('anna@mail.example.com')).toBe(true)
    expect(rule.email().passes('an@na@example.com')).toBe(false)
  })

  it('checks a long address in linear time, as a server receives any input', () => {
    const crafted = `!@!.${'!.'.repeat(100_000)} `
    const started = performance.now()

    expect(rule.email().passes(crafted)).toBe(false)
    expect(performance.now() - started).toBeLessThan(100)
  })

  it('takes a rule of the project’s own, such as a national postal code', () => {
    const postalCode = rule.custom({
      code: 'postalCode',
      passes: (value: string) => /^\d{5}$/.test(value),
    })

    expect(postalCode).toMatchObject({ code: 'postalCode', params: {} })
    expect(postalCode.passes('50189')).toBe(true)
    expect(postalCode.passes('5018')).toBe(false)
  })
})
