import { createRegistry, type FieldOf } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { describe, expect, it } from 'vitest'

import type { Condition } from '../condition'
import type { DocumentItem, FieldItem, FormDocument } from '../form-document'
import { createCatalog } from '../kinds/create-catalog'
import { defineFieldKind } from '../kinds/define-field-kind'
import { defineValueType } from '../kinds/define-value-type'
import { rule } from '../kinds/rule'
import { setting } from '../kinds/setting'
import { valueTypes } from '../kinds/value-types'
import { createValidator, type ValidationResult } from './create-validator'

type Option = { value: string; label: string }

const TextWidget = (_: FieldOf<string> & { label?: string }) => null
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
    settings: { maxLength: setting.number({ label: 'Most characters', integer: true }) },
    rules: ({ maxLength }) => [rule.maxLength(maxLength)],
  }),
  defineFieldKind(registry, {
    name: 'measure',
    label: 'Measure',
    widget: 'text',
    valueType: valueTypes.decimal,
    settings: { min: setting.number({ label: 'Minimum', varies: true }) },
    rules: ({ min }) => [rule.decimal(), rule.min(min)],
  }),
  defineFieldKind(registry, {
    name: 'postcode',
    label: 'Postcode',
    widget: 'text',
    valueType: valueTypes.text,
    rules: () => [
      rule.custom({ code: 'postcode', passes: (value: string) => /^\d{5}$/.test(value) }),
    ],
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
    name: 'consent',
    label: 'Consent',
    widget: 'check',
    valueType: valueTypes.boolean,
  }),
  defineFieldKind(registry, {
    name: 'choice',
    label: 'Choice',
    widget: 'choice',
    valueType: valueTypes.choice,
    settings: { options: setting.options({ label: 'Options' }) },
    props: ({ options }) => ({ options }),
  }),
  defineFieldKind(registry, {
    name: 'choices',
    label: 'Choices',
    widget: 'choices',
    valueType: valueTypes.choices,
    settings: { options: setting.options({ label: 'Options' }) },
    props: ({ options }) => ({ options }),
  }),
]
const catalog = createCatalog(registry, { fields: fieldKinds })

const HOUSE_TYPES = [
  { value: 'o1', label: 'Detached' },
  { value: 'o2', label: 'Apartment block' },
]

const field = (key: string, kind: string, extra: Partial<FieldItem> = {}): FieldItem => ({
  type: 'field',
  key,
  kind,
  label: key,
  ...extra,
})

const houseType = field('f1', 'choice', { settings: { options: HOUSE_TYPES } })
const isApartmentBlock: Condition = { field: 'f1', op: 'equals', value: 'o2' }

const plain = (...items: DocumentItem[]): FormDocument => ({ format: 1, items })

const validate = (document: FormDocument, values: unknown): ValidationResult =>
  createValidator(document, catalog)['~standard'].validate(values)

const codesOf = (result: ValidationResult) =>
  (result.issues ?? []).map(({ path, code }) => ({ path, code }))

describe('createValidator', () => {
  it('reports a required field left empty, with its code, path and an English text', () => {
    const result = validate(plain(field('f1', 'text', { required: true })), { f1: '  ' })

    expect(result.issues).toEqual([
      { code: 'required', params: {}, path: ['f1'], message: 'This field is required.' },
    ])
  })

  it('passes a form whose required fields are filled and returns its answers', () => {
    const result = validate(plain(field('f1', 'text', { required: true })), { f1: 'Anna' })

    expect(result).toEqual({ value: { f1: 'Anna' } })
  })

  it('does not validate a field, row, section or step that does not show', () => {
    const hidden = { field: 'f1', op: 'isEmpty' } as const
    const document: FormDocument = {
      format: 1,
      steps: [
        {
          key: 's1',
          label: 'Building',
          items: [
            field('f1', 'text'),
            field('f2', 'text', { required: true, visibleWhen: hidden }),
            { type: 'row', visibleWhen: hidden, items: [field('f3', 'text', { required: true })] },
            {
              type: 'section',
              label: 'Insulation',
              visibleWhen: hidden,
              items: [field('f4', 'text', { required: true })],
            },
          ],
        },
        {
          key: 's2',
          label: 'Heating',
          visibleWhen: hidden,
          items: [field('f5', 'text', { required: true })],
        },
      ],
    }

    expect(validate(document, { s1: { f1: 'shown' } })).toEqual({ value: { s1: { f1: 'shown' } } })
    expect(codesOf(validate(document, { s1: {} }))).toEqual([
      { path: ['s1', 'f2'], code: 'required' },
      { path: ['s1', 'f3'], code: 'required' },
      { path: ['s1', 'f4'], code: 'required' },
      { path: ['s2', 'f5'], code: 'required' },
    ])
  })

  it('leaves the answers of fields that do not show out of the value it returns', () => {
    const document = plain(houseType, field('f2', 'count', { visibleWhen: isApartmentBlock }))

    expect(validate(document, { f1: 'o1', f2: 12 })).toEqual({ value: { f1: 'o1' } })
  })

  it('counts the answer of a field that does not show as empty in later conditions', () => {
    const document = plain(
      houseType,
      field('f2', 'count', { visibleWhen: isApartmentBlock }),
      field('f3', 'text', { required: { field: 'f2', op: 'isFilled' } }),
    )

    expect(validate(document, { f1: 'o1', f2: 12 }).issues).toBeUndefined()
    expect(codesOf(validate(document, { f1: 'o2', f2: 12 }))).toEqual([
      { path: ['f3'], code: 'required' },
    ])
  })

  it('reads the first failing rule, with the settings that apply to the answers', () => {
    const document = plain(
      houseType,
      field('f2', 'measure', {
        settings: { min: { cases: [{ when: isApartmentBlock, value: 100 }], otherwise: 10 } },
      }),
    )

    expect(validate(document, { f1: 'o1', f2: '50,5' }).issues).toBeUndefined()
    expect(validate(document, { f1: 'o2', f2: '50,5' }).issues).toEqual([
      { code: 'min', params: { min: 100 }, path: ['f2'], message: 'Enter at least 100.' },
    ])
    expect(codesOf(validate(document, { f1: 'o2', f2: 'many' }))).toEqual([
      { path: ['f2'], code: 'decimal' },
    ])
  })

  it('reports an answer of the wrong type, and a choice that is no option', () => {
    const document = plain(
      houseType,
      field('f2', 'choices', { settings: { options: HOUSE_TYPES } }),
      field('f3', 'count'),
      field('f4', 'date'),
    )

    expect(
      codesOf(validate(document, { f1: 'o3', f2: ['o1', 'o9'], f3: '3', f4: '31.01.2026' })),
    ).toEqual([
      { path: ['f1'], code: 'option' },
      { path: ['f2'], code: 'option' },
      { path: ['f3'], code: 'type' },
      { path: ['f4'], code: 'type' },
    ])
    expect(validate(document, { f4: '2026-01-31T09:30' }).issues).toBeUndefined()
    expect(codesOf(validate(document, { f4: '2026-01-31Tlater' }))).toEqual([
      { path: ['f4'], code: 'type' },
    ])
  })

  it('reports an optional answer of the wrong type that reads as empty', () => {
    const document = plain(field('f1', 'consent'), field('f2', 'count'))

    expect(codesOf(validate(document, { f1: 'yes', f2: '  ' }))).toEqual([
      { path: ['f1'], code: 'type' },
      { path: ['f2'], code: 'type' },
    ])
    expect(validate(document, { f1: false, f2: null })).toEqual({ value: { f1: false, f2: null } })
  })

  it('reads a required boolean as one that has to be true', () => {
    const document = plain(field('f1', 'consent', { required: true }))

    expect(codesOf(validate(document, { f1: false }))).toEqual([{ path: ['f1'], code: 'required' }])
    expect(validate(document, { f1: true }).issues).toBeUndefined()
  })

  it('reads values that are not an object as a form left empty', () => {
    expect(codesOf(validate(plain(field('f1', 'text', { required: true })), null))).toEqual([
      { path: ['f1'], code: 'required' },
    ])
  })

  it("takes the project's texts, and falls back to a general one for a code without a text", () => {
    const document = plain(
      field('f1', 'text', { required: true }),
      field('f2', 'text', { settings: { maxLength: 3 } }),
      field('f3', 'postcode'),
    )
    const validator = createValidator(document, catalog, {
      messages: { required: () => 'Pflichtfeld' },
    })
    const result = validator['~standard'].validate({ f2: 'four', f3: '123' })

    expect(result.issues?.map(({ message }) => message)).toEqual([
      'Pflichtfeld',
      'Enter at most 3 characters.',
      'This value is not valid.',
    ])
  })

  it("checks an answer of a project's value type by its shape and when it counts as filled", () => {
    const postalCode = defineValueType({
      name: 'postalCode',
      emptyValue: '',
      fits: (value): value is string => typeof value === 'string',
      isFilled: (value) => value.trim() !== '',
      describe: (value) => ({ value }),
    })
    const withPostalCode = createCatalog(registry, {
      valueTypes: [postalCode],
      fields: [
        defineFieldKind(registry, {
          name: 'postal',
          label: 'Postal code',
          widget: 'text',
          valueType: postalCode,
        }),
      ],
    })
    const document = plain(
      field('f1', 'postal', { required: true }),
      field('f2', 'postal', { required: true }),
      field('f3', 'postal'),
    )
    const result = createValidator(document, withPostalCode)['~standard'].validate({
      f1: ' ',
      f2: 53111,
      f3: '53111',
    })

    expect(result.issues?.map(({ path, code, params }) => [path, code, params])).toEqual([
      [['f1'], 'required', {}],
      [['f2'], 'type', { expected: 'postalCode' }],
    ])
  })

  it("takes the field's own text before the project's, filling the issue's params and label", () => {
    const document: FormDocument = {
      format: 1,
      languages: ['de', 'en'],
      items: [
        field('f1', 'measure', {
          label: { de: 'Fläche', en: 'Area' },
          required: true,
          settings: { min: 10 },
          messages: {
            required: { de: 'Bitte {label} angeben.', en: 'Please give the {label}.' },
            min: 'At least {min} for {label}, {{sic}}.',
          },
        }),
        field('f2', 'text', { label: 'Name', required: true }),
      ],
    }
    const validate = (values: unknown, language: string) =>
      createValidator(document, catalog, {
        language,
        messages: { required: ({ label }) => `${label} is missing.` },
      })['~standard'].validate(values)

    expect(validate({}, 'en').issues?.map(({ message }) => message)).toEqual([
      'Please give the Area.',
      'Name is missing.',
    ])
    expect(validate({}, 'de').issues?.[0]?.message).toBe('Bitte Fläche angeben.')
    expect(validate({ f1: '5', f2: 'Ada' }, 'en').issues?.[0]).toMatchObject({
      message: 'At least 10 for Area, {sic}.',
      params: { min: 10 },
    })
  })

  it("takes a field's text that follows an answer", () => {
    const document = plain(
      houseType,
      field('f2', 'text', {
        required: true,
        messages: {
          required: {
            cases: [{ when: isApartmentBlock, value: 'Name the caretaker.' }],
            otherwise: 'Name the owner.',
          },
        },
      }),
    )

    expect(validate(document, { f1: 'o2' }).issues?.[0]?.message).toBe('Name the caretaker.')
    expect(validate(document, { f1: 'o1' }).issues?.[0]?.message).toBe('Name the owner.')
  })

  it('refuses a document with problems', () => {
    expect(() => createValidator(plain(field('f1', 'unknown')), catalog)).toThrow(
      'formdef: document: the document has 1 problem; checkDocument lists it.',
    )
  })
})
