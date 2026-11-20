import { describe, expect, it } from 'vitest'

import type { Condition } from '../condition'
import type { FieldItem, FormDocument } from '../form-document'
import { renameKey } from './rename-key'

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

describe('renameKey', () => {
  it('renames a field key and every condition that names it', () => {
    const renamed = renameKey(document, 'f1', 'houseType')
    const isHouseBlock = { ...isBlock, field: 'houseType' }

    expect(renamed.steps?.[0]?.items[0]).toEqual({ ...field('f1'), key: 'houseType' })
    expect(renamed.steps?.[0]?.items[1]).toEqual(field('f2', { visibleWhen: isHouseBlock }))
    expect(renamed.steps?.[1]?.visibleWhen).toEqual({
      any: [isHouseBlock, { field: 'f2', op: 'isFilled' }],
    })
    expect(renamed.steps?.[1]?.items[0]).toEqual({
      type: 'section',
      label: 'Flats',
      visibleWhen: isHouseBlock,
      items: [
        field('f3', {
          required: { all: [isHouseBlock] },
          settings: { unit: { cases: [{ when: isHouseBlock, value: 'm²' }], otherwise: 'ft²' } },
        }),
      ],
    })
    expect(document.steps?.[0]?.items[0]).toEqual(field('f1'))
  })

  it('renames a step key', () => {
    expect(renameKey(document, 's2', 'heating').steps?.map(({ key }) => key)).toEqual([
      's1',
      'heating',
    ])
  })
})
