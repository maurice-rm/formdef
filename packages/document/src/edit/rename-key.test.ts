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

  it('renames the field in the conditions of texts that follow an answer', () => {
    const texts: FormDocument = {
      format: 1,
      steps: [
        {
          key: 's1',
          label: 'Building',
          description: { cases: [{ when: isBlock, value: 'Flats' }], otherwise: 'House' },
          items: [
            field('f1'),
            {
              type: 'section',
              label: 'Heating',
              description: { cases: [{ when: isBlock, value: 'Flats' }], otherwise: 'House' },
              items: [
                field('f2', {
                  label: { cases: [{ when: isBlock, value: 'Radiators' }], otherwise: 'Rooms' },
                  description: { cases: [{ when: isBlock, value: 'All' }], otherwise: 'Some' },
                  settings: {
                    options: [
                      {
                        value: 'o1',
                        label: { cases: [{ when: isBlock, value: 'Floor' }], otherwise: 'Wall' },
                      },
                    ],
                  },
                }),
              ],
            },
          ],
        },
      ],
    }

    const renamed = JSON.stringify(renameKey(texts, 'f1', 'house'))

    expect(renamed).not.toContain('"field":"f1"')
    expect(renamed.match(/"field":"house"/g)).toHaveLength(5)
  })

  it('renames the key in placeholders of texts and settings', () => {
    const texts: FormDocument = {
      format: 1,
      steps: [
        {
          key: 's1',
          label: 'Building',
          description: { de: 'Für {f1}', en: 'For {f1}' },
          items: [
            field('f1'),
            field('f2', {
              label: { cases: [{ when: isBlock, value: 'Hi {f1}' }], otherwise: '{f1}!' },
              settings: { placeholder: 'As {f1}', options: [{ value: 'o1', label: '{f1}' }] },
            }),
          ],
        },
      ],
    }

    const renamed = JSON.stringify(renameKey(texts, 'f1', 'name'))

    expect(renamed).not.toContain('{f1}')
    expect(renamed.match(/\{name\}/g)).toHaveLength(6)
  })

  it("renames the field in the conditions of a field's own error texts, not its params", () => {
    const texts: FormDocument = {
      format: 1,
      items: [
        field('f1'),
        field('f2', {
          messages: {
            required: { cases: [{ when: isBlock, value: '{f1}' }], otherwise: 'B' },
          },
        }),
      ],
    }

    expect(renameKey(texts, 'f1', 'house').items?.[1]).toEqual(
      field('f2', {
        messages: {
          required: {
            cases: [{ when: { ...isBlock, field: 'house' }, value: '{f1}' }],
            otherwise: 'B',
          },
        },
      }),
    )
  })

  it("leaves an option's value as it is, since it is a key and no text", () => {
    const options: FormDocument = {
      format: 1,
      items: [
        field('f1'),
        field('f2', { settings: { options: [{ value: '{f1}', label: 'One' }] } }),
      ],
    }

    expect(renameKey(options, 'f1', 'name').items?.[1]).toEqual(
      field('f2', { settings: { options: [{ value: '{f1}', label: 'One' }] } }),
    )
  })

  it('renames a step key', () => {
    expect(renameKey(document, 's2', 'heating').steps?.map(({ key }) => key)).toEqual([
      's1',
      'heating',
    ])
  })
})
