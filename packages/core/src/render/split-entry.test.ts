import { describe, expect, it } from 'vitest'

import { OWN_ENTRY_KEYS, splitEntry } from './split-entry'

const OWN_VALUE = 'formdef reads this'

describe('splitEntry', () => {
  it.each(OWN_ENTRY_KEYS)('keeps `%s` with formdef', (key) => {
    const { own, fieldOptions } = splitEntry({ [key]: OWN_VALUE })

    expect(own).toEqual({ [key]: OWN_VALUE })
    expect(fieldOptions).toEqual({})
  })

  it("hands TanStack's field options to the field", () => {
    const validators = { onBlur: () => undefined }
    const listeners = { onChange: () => undefined }

    const { own, fieldOptions } = splitEntry({
      widget: 'text',
      validators,
      listeners,
      asyncDebounceMs: 300,
    })

    expect(own).toEqual({ widget: 'text' })
    expect(fieldOptions).toEqual({ validators, listeners, asyncDebounceMs: 300 })
  })

  it('hands a key formdef does not own to the field, such as an option TanStack adds later', () => {
    expect(splitEntry({ widget: 'text', futureOption: true }).fieldOptions).toEqual({
      futureOption: true,
    })
  })

  it('keeps a key named __proto__ as a key instead of a prototype', () => {
    const entry: object = JSON.parse('{"widget":"text","__proto__":{"isPolluted":true}}')

    const { fieldOptions } = splitEntry(entry)

    expect(Object.keys(fieldOptions)).toEqual(['__proto__'])
    expect(Object.getPrototypeOf(fieldOptions)).toBe(Object.prototype)
  })

  it('reads only the entry’s own keys, not inherited ones', () => {
    const entry: object = Object.create({ widget: 'inherited' })

    expect(splitEntry(entry)).toEqual({ own: {}, fieldOptions: {} })
  })
})
