import { describe, expect, it } from 'vitest'

import { optionId } from '@/lib/formdef/options'

describe('optionId', () => {
  it('builds an id below the control that no generated id shares', () => {
    expect(optionId('signup-plan', 'description')).toBe('signup-plan-option-description')
    expect(optionId('signup-plan', 'description')).not.toBe('signup-plan-description')
  })

  it('encodes a value, so it never splits a list of ids', () => {
    expect(optionId('signup-plan', 'a b')).toBe('signup-plan-option-a%20b')
    expect(optionId('signup-plan', 'a b')).not.toMatch(/\s/)
  })

  it('keeps two values apart that differ only in characters an id would lose', () => {
    expect(optionId('plan', 'a/b')).not.toBe(optionId('plan', 'a-b'))
  })
})
