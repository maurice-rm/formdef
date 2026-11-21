import { describe, expect, it } from 'vitest'

import type { FieldItem, FormDocument, SectionItem } from '../form-document'
import { duplicateNode } from './duplicate-node'

const field = (key: string, extra: Partial<FieldItem> = {}): FieldItem => ({
  type: 'field',
  key,
  kind: 'text',
  label: key,
  ...extra,
})

const heating: SectionItem = {
  type: 'section',
  label: 'Heating',
  items: [
    field('f2'),
    field('f3', { label: 'Since {f2}', visibleWhen: { field: 'f2', op: 'isFilled' } }),
    field('f4', { visibleWhen: { field: 'f1', op: 'isFilled' } }),
  ],
}

const plain: FormDocument = {
  format: 1,
  items: [field('f1'), heating, field('f5', { visibleWhen: { field: 'f2', op: 'isFilled' } })],
}

const KEY = /^f[0-9a-z]{8}$/

describe('duplicateNode', () => {
  it('puts a copy right after the node, with new keys its own conditions and texts follow', () => {
    const result = duplicateNode(plain, [1])
    const copy = result.items?.[2] as SectionItem
    const [f2, f3, f4] = copy.items as FieldItem[]

    expect(result.items?.map((item) => item.type)).toEqual(['field', 'section', 'section', 'field'])
    expect(copy.label).toBe('Heating')
    expect(f2?.key).toMatch(KEY)
    expect(f3).toMatchObject({
      label: `Since {${f2?.key}}`,
      visibleWhen: { field: f2?.key },
    })
    expect(f4?.visibleWhen).toEqual({ field: 'f1', op: 'isFilled' })
  })

  it('leaves the original, and what names it from outside the copy, as they were', () => {
    const result = duplicateNode(plain, [1])

    expect(result.items?.[1]).toEqual(heating)
    expect(result.items?.[3]).toEqual(plain.items?.[2])
    expect(plain.items).toHaveLength(3)
  })

  it('gives a copied step a new key, keeping its jumps to other steps', () => {
    const stepped: FormDocument = {
      format: 1,
      steps: [
        {
          key: 's1',
          label: 'Contact',
          next: [{ when: { field: 'f1', op: 'isFilled' }, step: 's2' }],
          items: [field('f1')],
        },
        { key: 's2', label: 'House', items: [field('f2')] },
      ],
    }

    const [, copy] = duplicateNode(stepped, [0]).steps ?? []
    const [copied] = (copy?.items ?? []) as FieldItem[]

    expect(copy?.key).toMatch(/^s[0-9a-z]{8}$/)
    expect(copy?.next).toEqual([{ when: { field: copied?.key, op: 'isFilled' }, step: 's2' }])
  })

  it('keeps the jumps of a copied step and what it names outside, whatever keys they share', () => {
    const stepped: FormDocument = {
      format: 1,
      endings: [{ key: 'thanks', items: [] }],
      steps: [
        { key: 's1', label: 'Contact', items: [field('house')] },
        {
          key: 'house',
          label: 'For {house}',
          visibleWhen: { field: 'house', op: 'isFilled' },
          next: [{ when: { field: 'thanks', op: 'isFilled' }, end: 'thanks' }],
          items: [field('thanks')],
        },
      ],
    }

    const [, , copy] = duplicateNode(stepped, [1]).steps ?? []
    const [copied] = (copy?.items ?? []) as FieldItem[]

    expect(copy).toMatchObject({
      label: 'For {house}',
      visibleWhen: { field: 'house' },
      next: [{ when: { field: copied?.key }, end: 'thanks' }],
    })
    expect(copy?.key).not.toBe('house')
  })

  it('refuses a position that holds nothing', () => {
    expect(() => duplicateNode(plain, [7])).toThrow('formdef: position [7]: there is nothing here.')
  })
})
