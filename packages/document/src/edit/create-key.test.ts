import { describe, expect, it } from 'vitest'

import { createKey } from './create-key'

describe('createKey', () => {
  it('creates keys of one length after a prefix, so no key starts another', () => {
    const keys = Array.from({ length: 50 }, () => createKey('s'))

    expect(new Set(keys).size).toBe(50)
    expect(keys.every((key) => /^s[0-9a-z]{8}$/.test(key))).toBe(true)
  })
})
