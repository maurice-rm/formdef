import { describe, expect, it } from 'vitest'

import type { Condition } from '../condition'
import type { FieldItem, FormDocument } from '../form-document'
import { dependentsOf } from './dependents-of'

const isBlock: Condition = { field: 'f1', op: 'equals', value: 'o2' }

const field = (key: string, extra: Partial<FieldItem> = {}): FieldItem => ({
  type: 'field',
  key,
  kind: 'text',
  label: key,
  ...extra,
})

const document: FormDocument = {
  format: 1,
  steps: [
    { key: 's1', label: 'Building', items: [field('f1'), field('f2', { visibleWhen: isBlock })] },
    {
      key: 's2',
      label: 'Heating',
      visibleWhen: { any: [isBlock, { field: 'f2', op: 'isFilled' }] },
      items: [
        {
          type: 'section',
          label: 'Flats',
          visibleWhen: isBlock,
          items: [
            field('f3', {
              required: { all: [isBlock] },
              settings: { unit: { cases: [{ when: isBlock, value: 'm²' }], otherwise: 'ft²' } },
            }),
          ],
        },
      ],
    },
  ],
}

describe('dependentsOf', () => {
  it('lists the conditions outside a node that name a field inside it', () => {
    expect(dependentsOf(document, [0, 0])).toEqual([
      { path: 'document.steps[0].items[1].visibleWhen', field: 'f1' },
      { path: 'document.steps[1].visibleWhen', field: 'f1' },
      { path: 'document.steps[1].items[0].visibleWhen', field: 'f1' },
      { path: 'document.steps[1].items[0].items[0].required', field: 'f1' },
      { path: 'document.steps[1].items[0].items[0].settings.unit.cases[0].when', field: 'f1' },
    ])
  })

  it('leaves out the conditions that go with the node', () => {
    expect(dependentsOf(document, [0])).toEqual([
      { path: 'document.steps[1].visibleWhen', field: 'f1' },
      { path: 'document.steps[1].visibleWhen', field: 'f2' },
      { path: 'document.steps[1].items[0].visibleWhen', field: 'f1' },
      { path: 'document.steps[1].items[0].items[0].required', field: 'f1' },
      { path: 'document.steps[1].items[0].items[0].settings.unit.cases[0].when', field: 'f1' },
    ])
    expect(dependentsOf(document, [1])).toEqual([])
  })
})
