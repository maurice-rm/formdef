import { createRegistry, type FieldOf } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { describe, expect, it } from 'vitest'

import type { FieldItem, FormDocument } from '../form-document'
import { createCatalog } from '../kinds/create-catalog'
import { defineFieldKind } from '../kinds/define-field-kind'
import { defineValueType } from '../kinds/define-value-type'
import { setting } from '../kinds/setting'
import { valueTypes } from '../kinds/value-types'
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

const fieldKinds = [
  defineFieldKind(registry, {
    name: 'text',
    label: 'Text',
    widget: 'text',
    valueType: valueTypes.text,
    settings: { placeholder: setting.text({ label: 'Placeholder', maxLength: 10 }) },
  }),
  defineFieldKind(registry, {
    name: 'measure',
    label: 'Measure',
    widget: 'text',
    valueType: valueTypes.decimal,
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
    valueType: valueTypes.number,
  }),
  defineFieldKind(registry, {
    name: 'date',
    label: 'Date',
    widget: 'text',
    valueType: valueTypes.date,
  }),
  defineFieldKind(registry, {
    name: 'yesNo',
    label: 'Yes or no',
    widget: 'check',
    valueType: valueTypes.boolean,
  }),
  defineFieldKind(registry, {
    name: 'choice',
    label: 'One choice',
    widget: 'choice',
    valueType: valueTypes.choice,
    settings: { options: setting.options({ label: 'Choices', minCount: 2 }) },
    props: ({ options }) => ({ options }),
  }),
  defineFieldKind(registry, {
    name: 'choices',
    label: 'Several choices',
    widget: 'choices',
    valueType: valueTypes.choices,
    settings: { options: setting.options({ label: 'Choices' }) },
    props: ({ options }) => ({ options }),
  }),
]
const catalog = createCatalog(registry, { fields: fieldKinds })

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
  checkDocument(document, catalog).map(({ code, path }) => `${code} ${path}`)

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

    expect(checkDocument(document, catalog)).toEqual([])
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

    expect(checkDocument(document, catalog)).toEqual([
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

    expect(checkDocument(document, catalog)).toEqual([
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

    expect(checkDocument(document, catalog)).toEqual([
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

  it('reports an operator no value type has, and one the compared field has not', () => {
    const document = plain(
      choiceField,
      {
        type: 'field',
        key: 'f2',
        kind: 'text',
        label: 'B',
        visibleWhen: { field: 'f1', op: 'resembles', value: 'o1' },
      },
      {
        type: 'field',
        key: 'f3',
        kind: 'text',
        label: 'C',
        visibleWhen: { field: 'f1', op: 'includes', value: 'o1' },
      },
      {
        type: 'field',
        key: 'f4',
        kind: 'text',
        label: 'D',
        visibleWhen: { field: 'f1', op: 'constructor' },
      },
    )

    expect(checkDocument(document, catalog)).toEqual([
      {
        code: 'operatorMismatch',
        path: 'document.items[1].visibleWhen.op',
        params: { op: 'resembles', valueType: 'choice' },
      },
      {
        code: 'operatorMismatch',
        path: 'document.items[2].visibleWhen.op',
        params: { op: 'includes', valueType: 'choice' },
      },
      {
        code: 'operatorMismatch',
        path: 'document.items[3].visibleWhen.op',
        params: { op: 'constructor', valueType: 'choice' },
      },
    ])
  })

  it('reports a compared value left out, given for an operator that compares nothing, or no list', () => {
    const document = plain(
      choiceField,
      { type: 'field', key: 'f2', kind: 'count', label: 'B' },
      {
        type: 'field',
        key: 'f3',
        kind: 'text',
        label: 'C',
        visibleWhen: {
          all: [
            { field: 'f2', op: 'atLeast' },
            { field: 'f1', op: 'isFilled', value: 'o1' },
            { field: 'f1', op: 'in', value: 'o1' },
            { field: 'f1', op: 'equals', value: 1 },
          ],
        },
      },
    )

    expect(checkDocument(document, catalog)).toEqual([
      {
        code: 'valueMismatch',
        path: 'document.items[2].visibleWhen.all[0].value',
        params: { expected: 'number' },
      },
      {
        code: 'valueMismatch',
        path: 'document.items[2].visibleWhen.all[1].value',
        params: { expected: 'nothing' },
      },
      {
        code: 'valueMismatch',
        path: 'document.items[2].visibleWhen.all[2].value',
        params: { expected: 'optionList' },
      },
      {
        code: 'valueMismatch',
        path: 'document.items[2].visibleWhen.all[3].value',
        params: { expected: 'option' },
      },
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

  it("checks a condition against the operators of a project's value type", () => {
    const postalCode = defineValueType({
      name: 'postalCode',
      emptyValue: '',
      fits: (value): value is string => typeof value === 'string',
      describe: (value) => ({ value }),
      operators: {
        startsWith: {
          compares: setting.text({ label: 'Start', required: true }),
          holds: (answer, start) => answer?.startsWith(start) === true,
        },
      },
    })
    const withPostalCode = createCatalog(registry, {
      valueTypes: [postalCode],
      fields: [
        ...fieldKinds,
        defineFieldKind(registry, {
          name: 'postal',
          label: 'Postal code',
          widget: 'text',
          valueType: postalCode,
        }),
      ],
    })
    const document = plain(
      { type: 'field', key: 'f1', kind: 'postal', label: 'Postal code' },
      {
        type: 'field',
        key: 'f2',
        kind: 'text',
        label: 'A',
        visibleWhen: { field: 'f1', op: 'isFilled' },
      },
      {
        type: 'field',
        key: 'f3',
        kind: 'text',
        label: 'B',
        visibleWhen: { field: 'f1', op: 'equals', value: '53111' },
      },
      {
        type: 'field',
        key: 'f4',
        kind: 'text',
        label: 'C',
        visibleWhen: {
          any: [
            { field: 'f1', op: 'startsWith', value: '53' },
            { field: 'f1', op: 'startsWith', value: 53 },
          ],
        },
      },
    )

    expect(checkDocument(document, withPostalCode)).toEqual([
      {
        code: 'operatorMismatch',
        path: 'document.items[2].visibleWhen.op',
        params: { op: 'equals', valueType: 'postalCode' },
      },
      {
        code: 'valueMismatch',
        path: 'document.items[3].visibleWhen.any[1].value',
        params: { expected: 'text' },
      },
    ])
  })

  it("checks a setting of one option or several against the field's own options", () => {
    const preselect = defineFieldKind(registry, {
      name: 'preselect',
      label: 'Choice with a preselection',
      widget: 'choice',
      valueType: valueTypes.choice,
      settings: {
        options: setting.options({ label: 'Options' }),
        preselected: setting.option({ label: 'Preselected' }),
        highlighted: setting.optionList({ label: 'Highlighted' }),
      },
      props: ({ options }) => ({ options }),
    })
    const withPreselect = createCatalog(registry, { fields: [...fieldKinds, preselect] })
    const document = plain({
      type: 'field',
      key: 'f1',
      kind: 'preselect',
      label: 'Pick',
      settings: { options: OPTIONS, preselected: 'o9', highlighted: ['o1', 'o8'] },
    })

    expect(checkDocument(document, withPreselect)).toEqual([
      {
        code: 'unknownOption',
        path: 'document.items[0].settings.preselected',
        params: { field: 'f1', value: 'o9' },
      },
      {
        code: 'unknownOption',
        path: 'document.items[0].settings.highlighted[1]',
        params: { field: 'f1', value: 'o8' },
      },
    ])
  })
})

describe('checkDocument with languages', () => {
  it('takes texts translated into every language, and strings for all of them', () => {
    const document: FormDocument = {
      format: 1,
      languages: ['de', 'en'],
      items: [
        {
          type: 'section',
          label: { de: 'Bau', en: 'Building' },
          description: 'kWh',
          items: [
            {
              type: 'field',
              key: 'f1',
              kind: 'choice',
              label: { de: 'Haustyp', en: 'House type' },
              settings: {
                options: [
                  { value: 'o1', label: { de: 'Einfamilienhaus', en: 'Detached' } },
                  { value: 'o2', label: 'Bungalow', description: { de: 'Flach', en: 'Flat' } },
                ],
              },
            },
            {
              type: 'field',
              key: 'f2',
              kind: 'measure',
              label: 'Fläche',
              settings: { unit: { de: 'Quadratmeter', en: 'm²' } },
            },
          ],
        },
      ],
    }

    expect(checkDocument(document, catalog)).toEqual([])
  })

  it('reports a translation left out, in every text position', () => {
    const document: FormDocument = {
      format: 1,
      languages: ['de', 'en'],
      steps: [
        {
          key: 's1',
          label: { de: 'Gebäude' },
          description: { de: 'Größe' },
          items: [
            {
              type: 'section',
              label: { en: 'Building' },
              items: [
                {
                  type: 'field',
                  key: 'f1',
                  kind: 'choice',
                  label: { de: 'Haustyp', en: 'House type' },
                  description: { en: 'Pick one' },
                  settings: {
                    options: [
                      { value: 'o1', label: { de: 'Eins' } },
                      { value: 'o2', label: 'Two', description: { en: 'Second' } },
                    ],
                  },
                },
                {
                  type: 'field',
                  key: 'f2',
                  kind: 'measure',
                  label: 'Area',
                  settings: {
                    unit: {
                      cases: [{ when: { field: 'f1', op: 'isFilled' }, value: { de: 'm²' } }],
                      otherwise: 'm²',
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    }

    expect(codesOf(document)).toEqual([
      'missingTranslation document.steps[0].label',
      'missingTranslation document.steps[0].description',
      'missingTranslation document.steps[0].items[0].label',
      'missingTranslation document.steps[0].items[0].items[0].description',
      'missingTranslation document.steps[0].items[0].items[0].settings.options[0].label',
      'missingTranslation document.steps[0].items[0].items[0].settings.options[1].description',
      'missingTranslation document.steps[0].items[0].items[1].settings.unit.cases[0].value',
    ])
    expect(checkDocument(document, catalog)[0]?.params).toEqual({ language: 'en' })
  })

  it('reports a language the document does not name, and translations without languages', () => {
    const named: FormDocument = {
      format: 1,
      languages: ['de'],
      items: [{ type: 'field', key: 'f1', kind: 'text', label: { de: 'Name', fr: 'Nom' } }],
    }
    const unnamed: FormDocument = {
      format: 1,
      items: [{ type: 'field', key: 'f1', kind: 'text', label: { de: 'Name' } }],
    }

    expect(checkDocument(named, catalog)).toEqual([
      { code: 'unknownLanguage', path: 'document.items[0].label.fr', params: { language: 'fr' } },
    ])
    expect(codesOf(unnamed)).toEqual(['unknownLanguage document.items[0].label.de'])
  })

  it('refuses an option whose label is empty in a language', () => {
    const document: FormDocument = {
      format: 1,
      languages: ['de', 'en'],
      items: [
        {
          ...choiceField,
          settings: {
            options: [
              { value: 'o1', label: { de: '', en: 'One' } },
              { value: 'o2', label: 'Two' },
            ],
          },
        },
      ],
    }

    expect(codesOf(document)).toEqual(['settingMismatch document.items[0].settings.options'])
  })

  it('keeps each translation of a text setting within its most characters', () => {
    const document: FormDocument = {
      format: 1,
      languages: ['de', 'en'],
      items: [
        {
          type: 'field',
          key: 'f1',
          kind: 'text',
          label: 'Name',
          settings: { placeholder: { de: 'Vor- und Nachname', en: 'Name' } },
        },
      ],
    }

    expect(codesOf(document)).toEqual(['settingLimit document.items[0].settings.placeholder.de'])
  })
})
