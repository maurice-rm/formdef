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

  it('reads a comparison of any operator and value, which checkDocument checks against the catalog', () => {
    const comparisons = [
      { field: 'f0', op: 'resembles', value: { near: 'x' } },
      { field: 'f0', op: 'equals' },
      { field: 'f0', op: 'in', value: 'o1' },
    ]
    const document = readDocument({
      format: 1,
      items: comparisons.map((visibleWhen, index) => ({
        type: 'field',
        key: `f${index + 1}`,
        kind: 'text',
        label: 'Name',
        visibleWhen,
      })),
    })

    expect('items' in document && document.items.map((item) => item.visibleWhen)).toEqual(
      comparisons,
    )
  })

  it('refuses a comparison without an operator', () => {
    const broken = {
      format: 1,
      items: [
        {
          type: 'field',
          key: 'f1',
          kind: 'text',
          label: 'Name',
          visibleWhen: { field: 'f0', value: 'x' },
        },
      ],
    }

    expect(() => readDocument(broken)).toThrow(
      'formdef: document.items[0].visibleWhen.op: expected text.',
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
      'formdef: document.items[0].visibleWhen.value: expected a value.',
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

describe('readDocument with languages', () => {
  it('reads the languages and texts as strings or their translations', () => {
    const translated = {
      format: 1,
      languages: ['de', 'en'],
      steps: [
        {
          key: 's1',
          label: { de: 'Gebäude', en: 'Building' },
          description: 'Bau',
          items: [
            {
              type: 'section',
              label: { de: 'Dämmung', en: 'Insulation' },
              description: { de: 'Wände', en: 'Walls' },
              items: [
                {
                  type: 'field',
                  key: 'f1',
                  kind: 'text',
                  label: { de: 'Name', en: 'Name' },
                  description: { de: 'Wie an der Klingel', en: 'As on the bell' },
                },
              ],
            },
          ],
        },
      ],
    }

    expect(readDocument(translated)).toEqual(translated)
  })

  it('refuses a language code that is none', () => {
    expect(() => readDocument({ format: 1, languages: ['German'], items: [] })).toThrow(
      'formdef: document.languages[0]: expected a language code, such as "de" or "de-CH".',
    )
    expect(() =>
      readDocument({
        format: 1,
        items: [{ type: 'field', key: 'f1', kind: 'text', label: { German: 'Name' } }],
      }),
    ).toThrow(
      'formdef: document.items[0].label.German: expected a language code, such as "de" or "de-CH".',
    )
  })

  it('refuses a language listed twice, and translations without any', () => {
    expect(() => readDocument({ format: 1, languages: ['de', 'de'], items: [] })).toThrow(
      'formdef: document.languages[1]: the language "de" is listed twice.',
    )
    expect(() =>
      readDocument({ format: 1, items: [{ type: 'field', key: 'f1', kind: 'text', label: {} }] }),
    ).toThrow('formdef: document.items[0].label: expected text or its translations.')
  })
})

const fieldOf = (key: string, extra: Record<string, unknown> = {}) => ({
  type: 'field',
  key,
  kind: 'text',
  label: 'Name',
  ...extra,
})

const nested = (levels: number): unknown => (levels === 0 ? 'deep' : { inner: nested(levels - 1) })

describe('readDocument within its limits', () => {
  it('refuses a document nested deeper than its limit', () => {
    const deep = { format: 1, items: [fieldOf('f1', { settings: { unit: 'kWh' } })] }

    expect(() => readDocument(deep, { limits: { depth: 3 } })).toThrow(
      'formdef: document.items[0].settings: nested more than 3 levels deep (limit depth).',
    )
  })

  it('refuses a setting nested beyond the default depth of 32', () => {
    const deep = { format: 1, items: [fieldOf('f1', { settings: { unit: nested(40) } })] }

    expect(() => readDocument(deep)).toThrow(/nested more than 32 levels deep \(limit depth\)\.$/)
  })

  it('refuses a text longer than its limit', () => {
    const long = { format: 1, items: [fieldOf('f1', { label: 'Living area' })] }

    expect(() => readDocument(long, { limits: { textLength: 5 } })).toThrow(
      'formdef: document.items[0].label: longer than 5 characters (limit textLength).',
    )
    expect(() =>
      readDocument({ format: 1, items: [fieldOf('f1', { label: 'x'.repeat(20_001) })] }),
    ).toThrow(/longer than 20000 characters/)
  })

  it('refuses more items than its limit, counting those inside rows and sections', () => {
    const many = {
      format: 1,
      items: [fieldOf('f1'), { type: 'row', items: [fieldOf('f2')] }],
    }

    expect(readDocument(many, { limits: { items: 3 } })).toBeDefined()
    expect(() => readDocument(many, { limits: { items: 2 } })).toThrow(
      'formdef: document: more than 2 items (limit items).',
    )
  })

  it('refuses more comparisons than its limit, in every condition of the document', () => {
    const conditioned = {
      format: 1,
      items: [
        fieldOf('f1'),
        fieldOf('f2', {
          visibleWhen: { field: 'f1', op: 'isFilled' },
          required: { any: [{ field: 'f1', op: 'isEmpty' }] },
        }),
      ],
    }

    expect(readDocument(conditioned, { limits: { conditions: 2 } })).toBeDefined()
    expect(() => readDocument(conditioned, { limits: { conditions: 1 } })).toThrow(
      'formdef: document: more than 1 comparisons in conditions (limit conditions).',
    )
  })

  it('refuses a field with more options than its limit', () => {
    const options = [
      { value: 'o1', label: 'One' },
      { value: 'o2', label: 'Two' },
    ]
    const choice = { format: 1, items: [fieldOf('f1', { settings: { options } })] }

    expect(() => readDocument(choice, { limits: { options: 1 } })).toThrow(
      'formdef: document.items[0].settings.options: more than 1 options (limit options).',
    )
  })

  it('refuses more options than its limit in each value of options that follow an answer', () => {
    const options = [
      { value: 'o1', label: 'One' },
      { value: 'o2', label: 'Two' },
    ]
    const varying = {
      format: 1,
      items: [
        fieldOf('f0'),
        fieldOf('f1', {
          settings: {
            options: {
              cases: [{ when: { field: 'f0', op: 'isFilled' }, value: [] }],
              otherwise: options,
            },
          },
        }),
      ],
    }

    expect(() => readDocument(varying, { limits: { options: 1 } })).toThrow(
      'formdef: document.items[1].settings.options.otherwise: more than 1 options (limit options).',
    )
  })

  it('keeps the default of a limit given as undefined', () => {
    const deep = { format: 1, items: [fieldOf('f1', { settings: { unit: nested(40) } })] }

    expect(() => readDocument(deep, { limits: { depth: undefined } })).toThrow(/limit depth/)
  })

  it.each(['__proto__', 'constructor', 'prototype'])('refuses the key %s anywhere', (key) => {
    const polluting = JSON.parse(
      `{ "format": 1, "items": [{ "type": "field", "key": "f1", "kind": "text", "label": "Name", "settings": { "${key}": { "polluted": true } } }] }`,
    )

    expect(() => readDocument(polluting)).toThrow(
      `formdef: document.items[0].settings.${key}: the key "${key}" is not allowed.`,
    )
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})
