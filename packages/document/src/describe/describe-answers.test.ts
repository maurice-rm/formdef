import { createRegistry, type FieldOf } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { describe, expect, it } from 'vitest'

import type { Condition } from '../condition'
import type { FieldItem, FormDocument } from '../form-document'
import { createCatalog } from '../kinds/create-catalog'
import { defineFieldKind } from '../kinds/define-field-kind'
import { defineValueType } from '../kinds/define-value-type'
import { setting } from '../kinds/setting'
import { valueTypes } from '../kinds/value-types'
import { describeAnswers } from './describe-answers'

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
  }),
  defineFieldKind(registry, {
    name: 'measure',
    label: 'Measure',
    widget: 'text',
    valueType: valueTypes.decimal,
    settings: { unit: setting.text({ label: 'Unit', required: true, varies: true }) },
    props: ({ unit }) => ({ suffix: unit }),
  }),
  defineFieldKind(registry, {
    name: 'count',
    label: 'Count',
    widget: 'number',
    valueType: valueTypes.number,
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
const ROOMS = [
  { value: 'r1', label: 'Bath' },
  { value: 'r2', label: 'Kitchen' },
]
const isBlock: Condition = { field: 'house', op: 'equals', value: 'o2' }

const field = (key: string, kind: string, extra: Partial<FieldItem> = {}): FieldItem => ({
  type: 'field',
  key,
  kind,
  label: key,
  ...extra,
})

const house = field('house', 'choice', { label: 'House type', settings: { options: HOUSE_TYPES } })

describe('describeAnswers', () => {
  it('describes each answer with its question, by value type, in document order', () => {
    const document: FormDocument = {
      format: 1,
      items: [
        house,
        field('rooms', 'choices', { label: 'Rooms', settings: { options: ROOMS } }),
        {
          type: 'row',
          items: [
            field('flats', 'count', { label: 'Flats' }),
            field('area', 'measure', {
              label: 'Area',
              settings: { unit: { cases: [{ when: isBlock, value: 'm²' }], otherwise: 'ft²' } },
            }),
          ],
        },
        field('consent', 'consent', { label: 'Consent' }),
      ],
    }

    expect(
      describeAnswers(document, catalog, {
        values: { house: 'o2', rooms: ['r2', 'r1'], flats: 6, area: '120,5', consent: false },
      }),
    ).toEqual({
      items: [
        {
          type: 'field',
          key: 'house',
          label: 'House type',
          kind: 'choice',
          settings: { options: HOUSE_TYPES },
          answer: { valueType: 'choice', value: 'o2', label: 'Apartment block' },
        },
        {
          type: 'field',
          key: 'rooms',
          label: 'Rooms',
          kind: 'choices',
          settings: { options: ROOMS },
          answer: {
            valueType: 'choices',
            values: [
              { value: 'r2', label: 'Kitchen' },
              { value: 'r1', label: 'Bath' },
            ],
          },
        },
        {
          type: 'field',
          key: 'flats',
          label: 'Flats',
          kind: 'count',
          settings: {},
          answer: { valueType: 'number', value: 6 },
        },
        {
          type: 'field',
          key: 'area',
          label: 'Area',
          kind: 'measure',
          settings: { unit: 'm²' },
          answer: { valueType: 'decimal', value: '120,5' },
        },
        {
          type: 'field',
          key: 'consent',
          label: 'Consent',
          kind: 'consent',
          settings: {},
          answer: undefined,
        },
      ],
    })
  })

  it('leaves out what does not show, and keeps steps and sections around their answers', () => {
    const document: FormDocument = {
      format: 1,
      steps: [
        {
          key: 'building',
          label: 'Building',
          items: [
            house,
            field('flats', 'count', { label: 'Flats', visibleWhen: isBlock }),
            {
              type: 'section',
              label: 'Block',
              visibleWhen: isBlock,
              items: [field('caretaker', 'text', { label: 'Caretaker' })],
            },
            {
              type: 'section',
              label: 'Contact',
              items: [field('name', 'text', { label: 'Name' })],
            },
          ],
        },
        {
          key: 'block',
          label: 'Apartment block',
          visibleWhen: isBlock,
          items: [field('floors', 'count', { label: 'Floors' })],
        },
      ],
    }

    const described = describeAnswers(document, catalog, {
      values: {
        building: { house: 'o1', flats: 6, caretaker: 'Ada', name: '  ' },
        block: { floors: 4 },
      },
    })

    expect(described).toEqual({
      steps: [
        {
          key: 'building',
          label: 'Building',
          items: [
            expect.objectContaining({
              key: 'house',
              answer: expect.objectContaining({ label: 'Detached' }),
            }),
            {
              type: 'section',
              label: 'Contact',
              items: [expect.objectContaining({ key: 'name', answer: undefined })],
            },
          ],
        },
      ],
    })
  })

  it('describes an answer of the wrong type or no option of the field as none', () => {
    const document: FormDocument = { format: 1, items: [house, field('flats', 'count')] }

    expect(describeAnswers(document, catalog, { values: { house: 'o9', flats: 'six' } })).toEqual({
      items: [
        expect.objectContaining({ key: 'house', answer: undefined }),
        expect.objectContaining({ key: 'flats', answer: undefined }),
      ],
    })
  })

  it("describes an answer of a project's value type in the shape it defines", () => {
    const postalCode = defineValueType({
      name: 'postalCode',
      emptyValue: '',
      fits: (value): value is string => typeof value === 'string',
      isFilled: (value) => value.length === 5,
      describe: (value) => ({ code: value, region: value.slice(0, 1) }),
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
    const document: FormDocument = {
      format: 1,
      items: [field('home', 'postal'), field('work', 'postal')],
    }

    expect(
      describeAnswers(document, withPostalCode, { values: { home: '53111', work: '531' } }),
    ).toEqual({
      items: [
        expect.objectContaining({
          key: 'home',
          answer: { valueType: 'postalCode', code: '53111', region: '5' },
        }),
        expect.objectContaining({ key: 'work', answer: undefined }),
      ],
    })
  })

  it("keeps the value type's name when its description holds a key of that name", () => {
    const tagged = defineValueType({
      name: 'tagged',
      emptyValue: '',
      fits: (value): value is string => typeof value === 'string',
      describe: (value) => ({ valueType: 'text', value }),
    })
    const withTagged = createCatalog(registry, {
      valueTypes: [tagged],
      fields: [
        defineFieldKind(registry, {
          name: 'tagged',
          label: 'Tagged',
          widget: 'text',
          valueType: tagged,
        }),
      ],
    })
    const document: FormDocument = { format: 1, items: [field('f1', 'tagged')] }

    expect(describeAnswers(document, withTagged, { values: { f1: 'x' } })).toEqual({
      items: [expect.objectContaining({ answer: { valueType: 'tagged', value: 'x' } })],
    })
  })

  it('refuses a document with problems', () => {
    expect(() =>
      describeAnswers({ format: 1, items: [field('f1', 'signature')] }, catalog, { values: {} }),
    ).toThrow('formdef: document: the document has 1 problem; checkDocument lists it.')
  })

  it('describes a question and an option by the texts that follow the answers', () => {
    const document: FormDocument = {
      format: 1,
      items: [
        house,
        field('heating', 'choice', {
          label: {
            cases: [{ when: isBlock, value: 'Heating of the block' }],
            otherwise: 'Heating',
          },
          settings: {
            options: [
              {
                value: 'h1',
                label: { cases: [{ when: isBlock, value: 'Central' }], otherwise: 'Own' },
              },
            ],
          },
        }),
      ],
    }

    expect(
      describeAnswers(document, catalog, { values: { house: 'o2', heating: 'h1' } }),
    ).toMatchObject({
      items: [
        {},
        {
          label: 'Heating of the block',
          answer: { valueType: 'choice', value: 'h1', label: 'Central' },
        },
      ],
    })
  })

  it('describes a question with its placeholders filled', () => {
    const document: FormDocument = {
      format: 1,
      items: [house, field('flats', 'count', { label: 'Flats in the {house}' })],
    }

    expect(describeAnswers(document, catalog, { values: { house: 'o2', flats: 6 } })).toMatchObject(
      { items: [{}, { label: 'Flats in the Apartment block' }] },
    )
  })

  it('describes the questions, sections and options in the language chosen', () => {
    const translated: FormDocument = {
      format: 1,
      languages: ['de', 'en'],
      steps: [
        {
          key: 's1',
          label: { de: 'Gebäude', en: 'Building' },
          items: [
            {
              type: 'section',
              label: { de: 'Haus', en: 'House' },
              items: [
                field('house', 'choice', {
                  label: { de: 'Haustyp', en: 'House type' },
                  settings: {
                    options: [
                      { value: 'o1', label: { de: 'Einfamilienhaus', en: 'Detached' } },
                      { value: 'o2', label: 'Bungalow' },
                    ],
                  },
                }),
                field('area', 'measure', {
                  label: 'Area',
                  settings: { unit: { de: 'Quadratmeter', en: 'square metres' } },
                }),
              ],
            },
          ],
        },
      ],
    }
    const values = { s1: { house: 'o1', area: '120' } }

    expect(describeAnswers(translated, catalog, { values, language: 'en' })).toEqual({
      steps: [
        {
          key: 's1',
          label: 'Building',
          items: [
            {
              type: 'section',
              label: 'House',
              items: [
                expect.objectContaining({
                  label: 'House type',
                  answer: { valueType: 'choice', value: 'o1', label: 'Detached' },
                }),
                expect.objectContaining({ label: 'Area', settings: { unit: 'square metres' } }),
              ],
            },
          ],
        },
      ],
    })
    expect(describeAnswers(translated, catalog, { values, language: 'fr' })).toMatchObject({
      steps: [{ label: 'Gebäude' }],
    })
  })
})
