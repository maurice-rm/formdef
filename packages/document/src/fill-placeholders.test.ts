import { describe, expect, it } from 'vitest'

import { fillPlaceholders } from './fill-placeholders'

describe('fillPlaceholders', () => {
  it('fills each placeholder with the text of its key', () => {
    const texts: Record<string, string> = { f1: 'Ada', f2: '' }
    expect(fillPlaceholders('Thank you, {f1}{f2}.', (key) => texts[key] ?? '')).toBe(
      'Thank you, Ada.',
    )
  })

  it('writes {{ and }} as braces', () => {
    expect(fillPlaceholders('{{f1}} and {f1}', () => 'Ada')).toBe('{f1} and Ada')
  })

  it('leaves a lone brace as it is', () => {
    expect(fillPlaceholders('a { b } c', () => 'x')).toBe('a { b } c')
  })
})
