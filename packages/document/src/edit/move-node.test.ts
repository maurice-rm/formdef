import { describe, expect, it } from 'vitest'

import type { FieldItem, FormDocument, RowItem, SectionItem } from '../form-document'
import { moveNode } from './move-node'

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

describe('moveNode', () => {
  it('moves a node to where it ends up, counted after it was taken out', () => {
    const stepped: FormDocument = {
      format: 1,
      steps: [
        { key: 's1', label: 'One', items: [field('f1')] },
        { key: 's2', label: 'Two', items: [field('f2')] },
      ],
    }

    expect(moveNode(plain, [0], [0, 2]).items).toEqual([
      row(field('f2'), field('f3'), field('f1')),
      section('Roof', field('f4')),
    ])
    expect(moveNode(stepped, [0], [1]).steps?.map(({ key }) => key)).toEqual(['s2', 's1'])
  })

  it('refuses a move into a place that cannot hold the node', () => {
    expect(() => moveNode(plain, [2], [1, 0])).toThrow(
      'formdef: position [1, 0]: a row holds fields only.',
    )
  })
})
