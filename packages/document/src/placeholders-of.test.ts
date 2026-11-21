import { describe, expect, it } from 'vitest'

import { placeholdersOf } from './placeholders-of'

describe('placeholdersOf', () => {
  it('finds the keys a text names, in order', () => {
    expect(placeholdersOf('Thank you, {f1}, for {f2} and {f1}.')).toEqual(['f1', 'f2', 'f1'])
    expect(placeholdersOf('No placeholders')).toEqual([])
  })

  it('reads {{ and }} as a brace, and braces around a space as no placeholder', () => {
    expect(placeholdersOf('{{f1}} is written as is')).toEqual([])
    expect(placeholdersOf('a { b } c')).toEqual([])
  })
})
