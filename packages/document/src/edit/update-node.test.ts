import { describe, expect, it } from 'vitest'

import type { FieldItem, FormDocument, RowItem, SectionItem } from '../form-document'
import { updateNode } from './update-node'

const field = (key: string): FieldItem => ({ type: 'field', key, kind: 'text', label: key })
const row = (...items: FieldItem[]): RowItem => ({ type: 'row', items })
const section = (label: string, ...items: SectionItem['items']): SectionItem => ({
  type: 'section',
  label,
  items,
})

const plain: FormDocument = {
  format: 1,
  items: [field('f1'), row(field('f2'), field('f3')), section('Roof', field('f4'))],
}

describe('updateNode', () => {
  it('replaces the node at a position with what the update returns', () => {
    const result = updateNode(plain, [2, 0], (node) => ({ ...node, label: 'Roof insulated' }))

    expect(result.items?.[2]).toEqual(section('Roof', { ...field('f4'), label: 'Roof insulated' }))
    expect(plain.items?.[2]).toEqual(section('Roof', field('f4')))
  })

  it('refuses an update that turns a node into one its place cannot hold', () => {
    expect(() => updateNode(plain, [1, 0], () => section('Wall'))).toThrow(
      'formdef: position [1, 0]: a row holds fields and blocks only.',
    )
  })
})
