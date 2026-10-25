import { describe, expect, it } from 'vitest'

import { byName } from './by-name'

const widgets = { text: 'TextField', checkbox: 'CheckboxField' }

describe('byName', () => {
  it('finds what is registered under a name', () => {
    expect(byName(widgets, 'checkbox')).toBe('CheckboxField')
  })

  it('finds nothing under a name that is not registered', () => {
    expect(byName(widgets, 'date')).toBeUndefined()
  })

  it.each(['toString', 'constructor', '__proto__', 'hasOwnProperty'])(
    'finds nothing under `%s`, which every object inherits',
    (name) => {
      expect(byName(widgets, name)).toBeUndefined()
    },
  )
})
