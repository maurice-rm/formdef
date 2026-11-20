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

  it("renames the field in a field's checks and the placeholders of their messages", () => {
    const checked: FormDocument = {
      format: 1,
      items: [
        field('f1'),
        field('f2', {
          checks: [{ when: { field: 'f2', op: 'atMost', valueFrom: 'f1' }, message: 'Max {f1}' }],
        }),
      ],
    }

    expect(renameKey(checked, 'f1', 'area').items?.[1]).toEqual(
      field('f2', {
        checks: [{ when: { field: 'f2', op: 'atMost', valueFrom: 'area' }, message: 'Max {area}' }],
      }),
    )
  })

  it('renames a computed value and the answers its expression reads', () => {
    const computed: FormDocument = {
      format: 1,
      items: [
        field('f1'),
        {
          type: 'computed',
          key: 'c1',
          label: 'Twice {f1}',
          valueType: 'number',
          expression: {
            cases: [
              {
                when: { field: 'f1', op: 'isFilled' },
                value: { op: 'add', args: [{ field: 'f1' }, { field: 'f1' }] },
              },
            ],
            otherwise: { op: 'count', field: 'f1' },
          },
        },
        field('f2', { visibleWhen: { field: 'c1', op: 'atLeast', value: 2 } }),
      ],
    }
    const renamed = renameKey(renameKey(computed, 'f1', 'rooms'), 'c1', 'twice')

    expect(renamed.items?.[1]).toEqual({
      type: 'computed',
      key: 'twice',
      label: 'Twice {rooms}',
      valueType: 'number',
      expression: {
        cases: [
          {
            when: { field: 'rooms', op: 'isFilled' },
            value: { op: 'add', args: [{ field: 'rooms' }, { field: 'rooms' }] },
          },
        ],
        otherwise: { op: 'count', field: 'rooms' },
      },
    })
    expect(renamed.items?.[2]).toEqual(
      field('f2', { visibleWhen: { field: 'twice', op: 'atLeast', value: 2 } }),
    )
  })

  it('renames a step a jump goes to, and the field in the jump condition', () => {
    const jumping: FormDocument = {
      format: 1,
      steps: [
        {
          key: 's1',
          label: 'House',
          items: [field('f1')],
          next: [{ when: { field: 'f1', op: 'isFilled' }, step: 's2' }],
        },
        { key: 's2', label: 'Owner', items: [field('f2')] },
      ],
    }
    const renamed = renameKey(renameKey(jumping, 's2', 'owner'), 'f1', 'rented')

    expect(renamed.steps?.[0]?.next).toEqual([
      { when: { field: 'rented', op: 'isFilled' }, step: 'owner' },
    ])
  })

  it('renames an ending a jump names, and fields in endings', () => {
    const ending: FormDocument = {
      format: 1,
      steps: [
        {
          key: 's1',
          label: 'House',
          items: [field('f1')],
          next: [{ when: { field: 'f1', op: 'isEmpty' }, end: 'e1' }],
        },
      ],
      endings: [
        {
          key: 'e1',
          when: { field: 'f1', op: 'isFilled' },
          items: [{ type: 'block', key: 'b1', kind: 'notice', settings: { body: 'Hi {f1}' } }],
        },
      ],
    }
    const renamed = renameKey(renameKey(ending, 'e1', 'notOwned'), 'f1', 'owner')

    expect(renamed.steps?.[0]?.next).toEqual([
      { when: { field: 'owner', op: 'isEmpty' }, end: 'notOwned' },
    ])
    expect(renamed.endings).toEqual([
      {
        key: 'notOwned',
        when: { field: 'owner', op: 'isFilled' },
        items: [{ type: 'block', key: 'b1', kind: 'notice', settings: { body: 'Hi {owner}' } }],
      },
    ])
  })

  it('renames the field a comparison compares with', () => {
    const compared: FormDocument = {
      format: 1,
      items: [
        field('f1'),
        field('f2', { visibleWhen: { field: 'f2', op: 'atMost', valueFrom: 'f1' } }),
      ],
    }

    expect(renameKey(compared, 'f1', 'area').items?.[1]).toEqual(
      field('f2', { visibleWhen: { field: 'f2', op: 'atMost', valueFrom: 'area' } }),
    )
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

  it("renames a block's key, and placeholders in its settings", () => {
    const withBlock: FormDocument = {
      format: 1,
      items: [
        field('f1'),
        { type: 'block', key: 'b1', kind: 'notice', settings: { body: '{f1}' } },
      ],
    }

    expect(renameKey(withBlock, 'b1', 'intro').items?.[1]).toMatchObject({ key: 'intro' })
    expect(renameKey(withBlock, 'f1', 'name').items?.[1]).toMatchObject({
      settings: { body: '{name}' },
    })
  })

  it("renames a repeat's key, and the fields inside it with the conditions that name them", () => {
    const withRepeat: FormDocument = {
      format: 1,
      items: [
        {
          type: 'repeat',
          key: 'r1',
          label: 'Residents',
          addLabel: 'Add',
          removeLabel: 'Remove {n}',
          items: [field('f1'), field('f2', { visibleWhen: { field: 'f1', op: 'isFilled' } })],
        },
      ],
    }

    expect(renameKey(withRepeat, 'r1', 'residents').items?.[0]).toMatchObject({
      key: 'residents',
    })
    expect(renameKey(withRepeat, 'f1', 'name').items?.[0]).toMatchObject({
      removeLabel: 'Remove {n}',
      items: [{ key: 'name' }, { visibleWhen: { field: 'name' } }],
    })
  })

  it('renames a step key', () => {
    expect(renameKey(document, 's2', 'heating').steps?.map(({ key }) => key)).toEqual([
      's1',
      'heating',
    ])
  })
})
