import { describe, expect, it } from 'vitest'

import { readDocument } from './read-document'

const STEPPED = {
  format: 1,
  steps: [
    {
      key: 's1',
      label: 'Building',
      description: 'Size and year',
      items: [
        {
          type: 'field',
          key: 'f1',
          kind: 'choice',
          label: 'House type',
          required: true,
          settings: {
            options: [
              { value: 'o1', label: 'Detached' },
              { value: 'o2', label: 'Apartment block' },
            ],
          },
        },
        {
          type: 'field',
          key: 'f2',
          kind: 'count',
          label: 'Number of flats',
          required: { field: 'f1', op: 'equals', value: 'o2' },
          visibleWhen: { field: 'f1', op: 'equals', value: 'o2' },
          settings: { min: 2 },
        },
        {
          type: 'row',
          items: [
            { type: 'field', key: 'f3', kind: 'year', label: 'Year built' },
            {
              type: 'field',
              key: 'f4',
              kind: 'count',
              label: 'Residents',
              description: 'Everyone living there',
            },
          ],
        },
        {
          type: 'section',
          label: 'Insulation',
          visibleWhen: {
            any: [
              { field: 'f3', op: 'lessThan', value: 1990 },
              { field: 'f4', op: 'isFilled' },
            ],
          },
          items: [
            {
              type: 'field',
              key: 'f5',
              kind: 'measure',
              label: 'Wall thickness',
              settings: {
                unit: {
                  cases: [{ when: { field: 'f1', op: 'in', value: ['o1'] }, value: 'cm' }],
                  otherwise: 'mm',
                },
              },
            },
          ],
        },
      ],
    },
  ],
}

const PLAIN = {
  format: 1,
  items: [{ type: 'field', key: 'f1', kind: 'text', label: 'Name', required: true }],
}

describe('readDocument', () => {
  it('reads a document with steps', () => {
    expect(readDocument(STEPPED)).toEqual(STEPPED)
  })

  it('reads a document without steps', () => {
    expect(readDocument(PLAIN)).toEqual(PLAIN)
  })

  it('returns a copy, not the input', () => {
    const document = readDocument(PLAIN)

    expect(document).not.toBe(PLAIN)
    expect('items' in document && document.items[0]).not.toBe(PLAIN.items[0])
  })

  it('refuses a format newer than this release', () => {
    expect(() => readDocument({ ...PLAIN, format: 2 })).toThrow(
      'formdef: document.format: format 2 is newer than format 1 this release reads.',
    )
  })

  it('refuses a document that is not an object', () => {
    expect(() => readDocument('{}')).toThrow('formdef: document: expected an object.')
  })

  it('refuses a document without a format', () => {
    expect(() => readDocument({ items: [] })).toThrow(
      'formdef: document.format: expected a whole number of 1 or more.',
    )
  })

  it.each([0, 1.5, '1', -1])(
    'refuses the format %j, which is no whole number of 1 or more',
    (format) => {
      expect(() => readDocument({ ...PLAIN, format })).toThrow(
        'formdef: document.format: expected a whole number of 1 or more.',
      )
    },
  )

  it('refuses a document with both steps and items', () => {
    expect(() => readDocument({ ...PLAIN, steps: [] })).toThrow(
      'formdef: document: expected either steps or items, not both.',
    )
  })

  it('refuses a document with neither steps nor items', () => {
    expect(() => readDocument({ format: 1 })).toThrow(
      'formdef: document: expected either steps or items.',
    )
  })

  it('names the path of a field without a key', () => {
    const broken = {
      format: 1,
      items: [{ type: 'row', items: [{ type: 'field', kind: 'text', label: 'Name' }] }],
    }

    expect(() => readDocument(broken)).toThrow(
      'formdef: document.items[0].items[0].key: expected text.',
    )
  })

  it('refuses an item of an unknown type', () => {
    const broken = { format: 1, items: [{ type: 'image', key: 'f1' }] }

    expect(() => readDocument(broken)).toThrow(
      'formdef: document.items[0].type: expected one of field, section, row.',
    )
  })

  it('refuses a row that holds something other than fields', () => {
    const broken = {
      format: 1,
      items: [{ type: 'row', items: [{ type: 'section', label: 'A', items: [] }] }],
    }

    expect(() => readDocument(broken)).toThrow(
      'formdef: document.items[0].items[0].type: a row holds fields only.',
    )
  })

  it('refuses a key it does not know, so a typo does not pass silently', () => {
    const broken = {
      format: 1,
      items: [{ type: 'field', key: 'f1', kind: 'text', label: 'Name', lable: 'x' }],
    }

    expect(() => readDocument(broken)).toThrow('formdef: document.items[0].lable: unknown key.')
  })

  it('refuses a condition with an unknown operator', () => {
    const broken = {
      format: 1,
      items: [
        {
          type: 'field',
          key: 'f1',
          kind: 'text',
          label: 'Name',
          visibleWhen: { field: 'f0', op: 'resembles', value: 'x' },
        },
      ],
    }

    expect(() => readDocument(broken)).toThrow(
      'formdef: document.items[0].visibleWhen.op: unknown operator "resembles".',
    )
  })

  it('refuses a comparison with a number JSON cannot store', () => {
    const broken = {
      format: 1,
      items: [
        {
          type: 'field',
          key: 'f1',
          kind: 'text',
          label: 'Name',
          visibleWhen: { field: 'f0', op: 'atLeast', value: Number.NaN },
        },
      ],
    }

    expect(() => readDocument(broken)).toThrow(
      'formdef: document.items[0].visibleWhen.value: expected text or a number.',
    )
  })

  it('refuses a comparison without the value it needs', () => {
    const broken = {
      format: 1,
      items: [
        {
          type: 'field',
          key: 'f1',
          kind: 'text',
          label: 'Name',
          visibleWhen: { field: 'f0', op: 'equals' },
        },
      ],
    }

    expect(() => readDocument(broken)).toThrow(
      'formdef: document.items[0].visibleWhen.value: expected text or a number.',
    )
  })

  it('refuses a list operator without a list', () => {
    const broken = {
      format: 1,
      items: [
        {
          type: 'field',
          key: 'f1',
          kind: 'text',
          label: 'Name',
          visibleWhen: { field: 'f0', op: 'in', value: 'o1' },
        },
      ],
    }

    expect(() => readDocument(broken)).toThrow(
      'formdef: document.items[0].visibleWhen.value: expected a list of text.',
    )
  })

  it('refuses a varying setting without its fallback', () => {
    const broken = {
      format: 1,
      items: [
        {
          type: 'field',
          key: 'f1',
          kind: 'measure',
          label: 'Use',
          settings: { unit: { cases: [{ when: { field: 'f0', op: 'isFilled' }, value: 'kWh' }] } },
        },
      ],
    }

    expect(() => readDocument(broken)).toThrow(
      'formdef: document.items[0].settings.unit.otherwise: expected a value.',
    )
  })
})
