import { describe, expect, it } from 'vitest'

import { renamePlaceholder } from './rename-placeholder'

describe('renamePlaceholder', () => {
  it('renames a key in every placeholder, and leaves braces written as braces', () => {
    expect(renamePlaceholder('{f1}, {{f1}}, {f10}', { from: 'f1', to: 'name' })).toBe(
      '{name}, {{f1}}, {f10}',
    )
  })
})
