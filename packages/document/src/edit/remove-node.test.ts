import { describe, expect, it } from 'vitest'

import type { FieldItem, FormDocument, RowItem, SectionItem } from '../form-document'
import { removeNode } from './remove-node'

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

describe('removeNode', () => {
  it('removes the node at a position with everything inside it', () => {
    const stepped: FormDocument = {
      format: 1,
      steps: [
        { key: 's1', label: 'One', items: [field('f1')] },
        { key: 's2', label: 'Two', items: [field('f2')] },
      ],
    }

    expect(removeNode(plain, [2]).items).toEqual([field('f1'), row(field('f2'), field('f3'))])
    expect(removeNode(plain, [1, 0]).items?.[1]).toEqual(row(field('f3')))
    expect(removeNode(stepped, [0]).steps?.map(({ key }) => key)).toEqual(['s2'])
  })

  it('refuses a position that holds nothing', () => {
    expect(() => removeNode(plain, [3])).toThrow('formdef: position [3]: there is nothing here.')
    expect(() => removeNode(plain, [])).toThrow('formdef: position []: there is nothing here.')
  })
})
