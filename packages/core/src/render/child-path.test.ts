import { describe, expect, it } from 'vitest'

import { childPath } from './child-path'

describe('childPath', () => {
  it('names a key of the root level by itself', () => {
    expect(childPath(undefined, 'email')).toBe('email')
  })

  it('joins a key of a nested level with a dot', () => {
    expect(childPath('address', 'zip')).toBe('address.zip')
  })

  it('puts the index of an array item in brackets', () => {
    expect(childPath('contacts', 0)).toBe('contacts[0]')
  })

  it('builds the path of a key inside an item of an array inside an object', () => {
    const items = childPath(childPath(undefined, 'order'), 'items')
    const sku = childPath(childPath(items, 2), 'sku')

    expect(sku).toBe('order.items[2].sku')
  })
})
