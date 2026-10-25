import { describe, expect, it } from 'vitest'

import { fieldId } from './field-id'

describe('fieldId', () => {
  it('prefixes a top-level field with the form id', () => {
    expect(fieldId('signup', 'email')).toBe('signup-email')
  })

  it('folds the dots of a nested path into a selector-safe id', () => {
    expect(fieldId('signup', 'address.zip')).toBe('signup-address__zip')
  })

  it('folds the brackets of an array path into a selector-safe id', () => {
    expect(fieldId('signup', 'contacts[0].name')).toBe('signup-contacts__0__name')
  })

  it('produces an id that a css selector finds without escaping', () => {
    const id = fieldId('signup', 'contacts[0].name')
    document.body.innerHTML = `<input id="${id}">`

    expect(document.querySelector(`#${id}`)).not.toBeNull()
  })
})
