import { createRegistry, type FieldOf } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { describe, expect, it } from 'vitest'

import type { FieldItem, FormDocument } from '../form-document'
import { createFieldKinds } from '../kinds/create-field-kinds'
import { defineFieldKind } from '../kinds/define-field-kind'
import { setting } from '../kinds/setting'
import { checkDocument } from './check-document'

type Option = { value: string; label: string }

const TextWidget = (_: FieldOf<string> & { label?: string; suffix?: string }) => null
const NumberWidget = (_: FieldOf<number | undefined> & { label?: string }) => null
const ChoiceWidget = (_: FieldOf<string> & { label?: string; options: Option[] }) => null
const ChoicesWidget = (_: FieldOf<string[]> & { label?: string; options: Option[] }) => null
const CheckWidget = (_: FieldOf<boolean> & { label?: string }) => null

const { fieldContext, formContext } = createFormHookContexts()
const registry = createRegistry({
  fieldContext,
  formContext,
  widgets: {
    text: TextWidget,
    number: NumberWidget,
    choice: ChoiceWidget,
    choices: ChoicesWidget,
    check: CheckWidget,
  },
})

const kinds = createFieldKinds(registry, [
  defineFieldKind(registry, {
    name: 'text',
    label: 'Text',
    widget: 'text',
    valueType: 'text',
    settings: { placeholder: setting.text({ label: 'Placeholder', maxLength: 10 }) },
  }),
  defineFieldKind(registry, {
    name: 'measure',
    label: 'Measure',
    widget: 'text',
    valueType: 'decimal',
    settings: {
      unit: setting.text({ label: 'Unit', required: true, varies: true }),
      min: setting.number({ label: 'Minimum', integer: true }),
    },
    props: ({ unit }) => ({ suffix: unit }),
  }),
  defineFieldKind(registry, {
    name: 'count',
    label: 'Count',
    widget: 'number',
    valueType: 'number',
  }),
  defineFieldKind(registry, { name: 'date', label: 'Date', widget: 'text', valueType: 'date' }),
  defineFieldKind(registry, {
    name: 'yesNo',
    label: 'Yes or no',
    widget: 'check',
    valueType: 'boolean',
  }),
  defineFieldKind(registry, {
    name: 'choice',
    label: 'One choice',
    widget: 'choice',
    valueType: 'choice',
    settings: { options: setting.options({ label: 'Choices', minCount: 2 }) },
    props: ({ options }) => ({ options }),
  }),
  defineFieldKind(registry, {
    name: 'choices',
    label: 'Several choices',
    widget: 'choices',
    valueType: 'choices',
    settings: { options: setting.options({ label: 'Choices' }) },
    props: ({ options }) => ({ options }),
  }),
])

const OPTIONS = [
  { value: 'o1', label: 'One' },
  { value: 'o2', label: 'Two' },
]

const choiceField: FieldItem = {
  type: 'field',
  key: 'f1',
  kind: 'choice',
  label: 'Pick',
  settings: { options: OPTIONS },
}

const plain = (...items: FieldItem[]): FormDocument => ({
  format: 1,
  items,
})

const codesOf = (document: FormDocument) =>
  checkDocument(document, kinds).map(({ code, path }) => `${code} ${path}`)

describe('checkDocument', () => {
  it('finds nothing in a sound document', () => {
    const document: FormDocument = {
      format: 1,
      steps: [
        {
          key: 's1',
          label: 'One',
          items: [
            choiceField,
            {
              type: 'section',
              label: 'More',
              visibleWhen: { field: 'f1', op: 'equals', value: 'o2' },
              items: [
                {
                  type: 'row',
                  items: [
                    { type: 'field', key: 'f2', kind: 'count', label: 'Count', required: true },
                    {
                      type: 'field',
                      key: 'f3',
                      kind: 'measure',
                      label: 'Area',
                      required: { field: 'f2', op: 'atLeast', value: 2 },
                      settings: {
                        unit: {
                          cases: [{ when: { field: 'f1', op: 'in', value: ['o1'] }, value: 'l' }],
                          otherwise: 'kWh',
                        },
                        min: 0,
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          key: 's2',
          label: 'Two',
          visibleWhen: {
            all: [
              { field: 'f2', op: 'isFilled' },
              { field: 'f1', op: 'notEquals', value: 'o1' },
            ],
          },
          items: [
            {
              type: 'field',
              key: 'f4',
              kind: 'date',
              label: 'When',
              visibleWhen: { field: 'f3', op: 'greaterThan', value: 1.5 },
            },
          ],
        },
      ],
    }

    expect(checkDocument(document, kinds)).toEqual([])
  })

  it('reports a field key used twice, and a step key used twice', () => {
    const document: FormDocument = {
      format: 1,
      steps: [
        {
          key: 's1',
          label: 'One',
          items: [{ type: 'field', key: 'f1', kind: 'text', label: 'A' }],
        },
        {
          key: 's1',
          label: 'Two',
          items: [{ type: 'field', key: 'f1', kind: 'text', label: 'B' }],
        },
      ],
    }

    expect(checkDocument(document, kinds)).toEqual([
      { code: 'duplicateKey', path: 'document.steps[1].key', params: { key: 's1' } },
      { code: 'duplicateKey', path: 'document.steps[1].items[0].key', params: { key: 'f1' } },
    ])
  })

  it('reports a key that is no plain name, and a step key that starts another', () => {
    const document: FormDocument = {
      format: 1,
      steps: [
        {
          key: 's1',
          label: 'One',
          items: [{ type: 'field', key: 'f.1', kind: 'text', label: 'A' }],
        },
        {
          key: 's10',
          label: 'Two',
          items: [{ type: 'field', key: 'f[2]', kind: 'text', label: 'B' }],
        },
        {
          key: '',
          label: 'Three',
          items: [{ type: 'field', key: 'f3', kind: 'text', label: 'C' }],
        },
      ],
    }

    expect(checkDocument(document, kinds)).toEqual([
      { code: 'invalidKey', path: 'document.steps[0].items[0].key', params: { key: 'f.1' } },
      {
        code: 'overlappingKey',
        path: 'document.steps[1].key',
        params: { key: 's10', start: 's1' },
      },
      { code: 'invalidKey', path: 'document.steps[1].items[0].key', params: { key: 'f[2]' } },
      { code: 'invalidKey', path: 'document.steps[2].key', params: { key: '' } },
    ])
  })

  it('reports an unknown field kind', () => {
    expect(codesOf(plain({ type: 'field', key: 'f1', kind: 'signature', label: 'Sign' }))).toEqual([
      'unknownKind document.items[0].kind',
    ])
  })

  it('reports a condition on a field that does not exist, or comes later or is the field itself', () => {
    const document = plain(
      {
        type: 'field',
        key: 'f1',
        kind: 'text',
        label: 'A',
        visibleWhen: { field: 'f2', op: 'isFilled' },
      },
      {
        type: 'field',
        key: 'f2',
        kind: 'text',
        label: 'B',
        required: { field: 'f2', op: 'isFilled' },
      },
      {
        type: 'field',
        key: 'f3',
        kind: 'text',
        label: 'C',
        visibleWhen: { field: 'f9', op: 'isFilled' },
      },
    )

    expect(codesOf(document)).toEqual([
      'laterField document.items[0].visibleWhen.field',
      'laterField document.items[1].required.field',
      'unknownField document.items[2].visibleWhen.field',
    ])
  })

  it('reports an operator that does not fit the field compared', () => {
    const document = plain(
      choiceField,
      {
        type: 'field',
        key: 'f2',
        kind: 'text',
        label: 'B',
        visibleWhen: { field: 'f1', op: 'lessThan', value: 3 },
      },
      {
        type: 'field',
        key: 'f3',
        kind: 'text',
        label: 'C',
        visibleWhen: { field: 'f2', op: 'equals', value: 'x' },
      },
    )

    expect(checkDocument(document, kinds)).toEqual([
      {
        code: 'operatorMismatch',
        path: 'document.items[1].visibleWhen.op',
        params: { op: 'lessThan', valueType: 'choice' },
      },
      {
        code: 'operatorMismatch',
        path: 'document.items[2].visibleWhen.op',
        params: { op: 'equals', valueType: 'text' },
      },
    ])
  })

  it('reports a compared value the field cannot hold', () => {
    const document = plain(
      choiceField,
      {
        type: 'field',
        key: 'f2',
        kind: 'count',
        label: 'B',
        visibleWhen: { field: 'f1', op: 'in', value: ['o1', 'o9'] },
      },
      {
        type: 'field',
        key: 'f3',
        kind: 'date',
        label: 'C',
        visibleWhen: { field: 'f2', op: 'atLeast', value: 'two' },
      },
      {
        type: 'field',
        key: 'f4',
        kind: 'text',
        label: 'D',
        visibleWhen: { field: 'f3', op: 'before', value: '1.1.2026' },
      },
    )

    expect(codesOf(document)).toEqual([
      'unknownOption document.items[1].visibleWhen.value[1]',
      'valueMismatch document.items[2].visibleWhen.value',
      'valueMismatch document.items[3].visibleWhen.value',
    ])
  })

  it('reports a date that does not exist', () => {
    const document = plain(
      { type: 'field', key: 'f1', kind: 'date', label: 'A' },
      {
        type: 'field',
        key: 'f2',
        kind: 'text',
        label: 'B',
        visibleWhen: { field: 'f1', op: 'after', value: '2026-02-31' },
      },
    )

    expect(codesOf(document)).toEqual(['valueMismatch document.items[1].visibleWhen.value'])
  })

  it('takes a date of a year below 100 and a leap day', () => {
    const document = plain(
      { type: 'field', key: 'f1', kind: 'date', label: 'A' },
      {
        type: 'field',
        key: 'f2',
        kind: 'text',
        label: 'B',
        visibleWhen: {
          any: [
            { field: 'f1', op: 'after', value: '0050-06-15' },
            { field: 'f1', op: 'before', value: '2024-02-29' },
          ],
        },
      },
    )

    expect(codesOf(document)).toEqual([])
  })

  it('takes a presence check on every value type, a boolean included', () => {
    const document = plain(
      { type: 'field', key: 'f1', kind: 'yesNo', label: 'A' },
      {
        type: 'field',
        key: 'f2',
        kind: 'text',
        label: 'B',
        visibleWhen: {
          all: [
            { field: 'f1', op: 'isFilled' },
            { field: 'f1', op: 'isTrue' },
          ],
        },
      },
    )

    expect(codesOf(document)).toEqual([])
  })

  it('reports an empty step, section or row, and a third level of sections', () => {
    const document: FormDocument = {
      format: 1,
      steps: [
        { key: 's1', label: 'One', items: [] },
        {
          key: 's2',
          label: 'Two',
          items: [
            { type: 'row', items: [] },
            {
              type: 'section',
              label: 'A',
              items: [
                {
                  type: 'section',
                  label: 'B',
                  items: [{ type: 'section', label: 'C', items: [choiceField] }],
                },
              ],
            },
          ],
        },
      ],
    }

    expect(codesOf(document)).toEqual([
      'empty document.steps[0].items',
      'empty document.steps[1].items[0].items',
      'tooDeep document.steps[1].items[1].items[0].items[0]',
    ])
  })

  it('reports settings that are unknown, missing, of the wrong type or outside their constraints', () => {
    const document = plain(
      {
        type: 'field',
        key: 'f1',
        kind: 'measure',
        label: 'A',
        settings: { min: 1.5, colour: 'red' },
      },
      {
        type: 'field',
        key: 'f2',
        kind: 'text',
        label: 'B',
        settings: { placeholder: 'far too long a text' },
      },
      {
        type: 'field',
        key: 'f3',
        kind: 'choice',
        label: 'C',
        settings: { options: [{ value: 'o1', label: 'One' }] },
      },
      { type: 'field', key: 'f4', kind: 'choice', label: 'D', settings: { options: 'one, two' } },
    )

    expect(codesOf(document)).toEqual([
      'missingSetting document.items[0].settings.unit',
      'settingLimit document.items[0].settings.min',
      'unknownSetting document.items[0].settings.colour',
      'settingLimit document.items[1].settings.placeholder',
      'settingLimit document.items[2].settings.options',
      'settingMismatch document.items[3].settings.options',
    ])
  })

  it('reports an option value used twice', () => {
    const document = plain({
      type: 'field',
      key: 'f1',
      kind: 'choice',
      label: 'A',
      settings: {
        options: [
          { value: 'o1', label: 'One' },
          { value: 'o1', label: 'Again' },
        ],
      },
    })

    expect(codesOf(document)).toEqual([
      'duplicateOption document.items[0].settings.options[1].value',
    ])
  })

  it('reports a setting that follows an answer although its field kind does not allow it', () => {
    const document = plain(
      choiceField,
      {
        type: 'field',
        key: 'f2',
        kind: 'text',
        label: 'B',
        settings: {
          placeholder: {
            cases: [{ when: { field: 'f1', op: 'isFilled' }, value: 'x' }],
            otherwise: 'y',
          },
        },
      },
      {
        type: 'field',
        key: 'f3',
        kind: 'measure',
        label: 'C',
        settings: {
          unit: { cases: [{ when: { field: 'f9', op: 'isFilled' }, value: 3 }], otherwise: 'kWh' },
        },
      },
    )

    expect(codesOf(document)).toEqual([
      'notVarying document.items[1].settings.placeholder',
      'unknownField document.items[2].settings.unit.cases[0].when.field',
      'settingMismatch document.items[2].settings.unit.cases[0].value',
    ])
  })
})
