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

  it('lists a comparison with the answer of a field inside the node', () => {
    const compared: FormDocument = {
      format: 1,
      items: [
        field('f1'),
        field('f2'),
        field('f3', { visibleWhen: { field: 'f2', op: 'atMost', valueFrom: 'f1' } }),
      ],
    }

    expect(dependentsOf(compared, [0])).toEqual([
      { path: 'document.items[2].visibleWhen', field: 'f1' },
    ])
  })

  it('lists the checks of another field, and the placeholders of their messages', () => {
    const checked: FormDocument = {
      format: 1,
      items: [
        field('f1'),
        field('f2', {
          checks: [{ when: { field: 'f2', op: 'atMost', valueFrom: 'f1' }, message: 'Max {f1}' }],
        }),
      ],
    }

    expect(dependentsOf(checked, [0])).toEqual([
      { path: 'document.items[1].checks[0].when', field: 'f1' },
      { path: 'document.items[1].checks[0].message', field: 'f1' },
    ])
  })

  it('lists the expressions that read a field, and what reads a computed value', () => {
    const computed: FormDocument = {
      format: 1,
      items: [
        field('f1'),
        {
          type: 'computed',
          key: 'c1',
          label: 'Twice',
          valueType: 'number',
          expression: { op: 'add', args: [{ field: 'f1' }, { field: 'f1' }] },
        },
        field('f2', { visibleWhen: { field: 'c1', op: 'atLeast', value: 2 } }),
      ],
    }

    expect(dependentsOf(computed, [0])).toEqual([
      { path: 'document.items[1].expression', field: 'f1' },
    ])
    expect(dependentsOf(computed, [1])).toEqual([
      { path: 'document.items[2].visibleWhen', field: 'c1' },
    ])
  })

  it('lists the conditions and texts of endings that name a field', () => {
    const ending: FormDocument = {
      format: 1,
      items: [field('f1')],
      endings: [
        {
          key: 'e1',
          when: { field: 'f1', op: 'isFilled' },
          items: [{ type: 'block', key: 'b1', kind: 'notice', settings: { body: 'Hi {f1}' } }],
        },
      ],
    }

    expect(dependentsOf(ending, [0])).toEqual([
      { path: 'document.endings[0].when', field: 'f1' },
      { path: 'document.endings[0].items[0].settings.body', field: 'f1' },
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

  it('lists the conditions of texts that follow an answer', () => {
    const texts: FormDocument = {
      format: 1,
      items: [
        field('f1'),
        field('f2', {
          label: { cases: [{ when: isBlock, value: 'Radiators' }], otherwise: 'Rooms' },
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
    }

    expect(dependentsOf(texts, [0])).toEqual([
      { path: 'document.items[1].label.cases[0].when', field: 'f1' },
      { path: 'document.items[1].settings.options[0].label.cases[0].when', field: 'f1' },
    ])
  })

  it("lists the conditions of a field's own error texts", () => {
    const texts: FormDocument = {
      format: 1,
      items: [
        field('f1'),
        field('f2', {
          messages: { required: { cases: [{ when: isBlock, value: 'A' }], otherwise: 'B' } },
        }),
      ],
    }

    expect(dependentsOf(texts, [0])).toEqual([
      { path: 'document.items[1].messages.required.cases[0].when', field: 'f1' },
    ])
  })

  it('lists the texts and settings whose placeholders name a field', () => {
    const texts: FormDocument = {
      format: 1,
      items: [
        field('f1'),
        field('f2', {
          label: { de: 'Danke, {f1}', en: 'Thanks' },
          settings: { placeholder: 'As {f1}' },
        }),
      ],
    }

    expect(dependentsOf(texts, [0])).toEqual([
      { path: 'document.items[1].label.de', field: 'f1' },
      { path: 'document.items[1].settings.placeholder', field: 'f1' },
    ])
  })

  it('lists the conditions on the number of entries of a repeat inside the node', () => {
    const withRepeat: FormDocument = {
      format: 1,
      items: [
        {
          type: 'section',
          label: 'Household',
          items: [
            {
              type: 'repeat',
              key: 'r1',
              label: 'Residents',
              addLabel: 'Add',
              removeLabel: 'Remove {n}',
              items: [field('f1')],
            },
          ],
        },
        field('f2', { visibleWhen: { field: 'r1', op: 'atLeast', value: 2 } }),
      ],
    }
    const dependent = { path: 'document.items[1].visibleWhen', field: 'r1' }

    expect(dependentsOf(withRepeat, [0, 0])).toEqual([dependent])
    expect(dependentsOf(withRepeat, [0])).toEqual([dependent])
  })

  it('lists the jumps of other steps to a step that is removed', () => {
    const withJump: FormDocument = {
      format: 1,
      steps: [
        {
          key: 's1',
          label: 'Contact',
          next: [{ when: { field: 'f1', op: 'isFilled' }, step: 's3' }],
          items: [field('f1')],
        },
        { key: 's2', label: 'House', items: [field('f2')] },
        { key: 's3', label: 'Heating', items: [field('f3')] },
      ],
    }

    expect(dependentsOf(withJump, [2])).toEqual([
      { path: 'document.steps[0].next[0].step', field: 's3' },
    ])
  })

  it('lists the endings only the jumps of a removed step reach', () => {
    const isFilled = (key: string) => ({ field: key, op: 'isFilled' })
    const withEndings: FormDocument = {
      format: 1,
      steps: [
        {
          key: 's1',
          label: 'House',
          next: [
            { when: isFilled('f1'), end: 'apartment' },
            { when: isFilled('f1'), end: 'shared' },
          ],
          items: [field('f1')],
        },
        {
          key: 's2',
          label: 'Heating',
          next: [{ when: isFilled('f2'), end: 'shared' }],
          items: [field('f2')],
        },
      ],
      endings: [
        { key: 'apartment', items: [] },
        { key: 'shared', items: [] },
        { key: 'thanks', items: [] },
      ],
    }

    expect(dependentsOf(withEndings, [0])).toEqual([{ path: 'document.endings[0]', field: 's1' }])
    expect(dependentsOf(withEndings, [1])).toEqual([])
  })

  it('refuses a position that holds nothing', () => {
    expect(() => dependentsOf(document, [2])).toThrow(
      'formdef: position [2]: there is nothing here.',
    )
  })
})
