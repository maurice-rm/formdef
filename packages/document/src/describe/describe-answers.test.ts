import { createRegistry, type FieldOf } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { describe, expect, it } from 'vitest'

import type { Condition } from '../condition'
import type { FieldItem, FormDocument } from '../form-document'
import { createCatalog } from '../kinds/create-catalog'
import { defineFieldKind } from '../kinds/define-field-kind'
import { setting } from '../kinds/setting'
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
  defineFieldKind(registry, { name: 'text', label: 'Text', widget: 'text', valueType: 'text' }),
  defineFieldKind(registry, {
    name: 'measure',
    label: 'Measure',
    widget: 'text',
    valueType: 'decimal',
    settings: { unit: setting.text({ label: 'Unit', required: true, varies: true }) },
    props: ({ unit }) => ({ suffix: unit }),
  }),
  defineFieldKind(registry, {
    name: 'count',
    label: 'Count',
    widget: 'number',
    valueType: 'number',
  }),
  defineFieldKind(registry, {
    name: 'consent',
    label: 'Consent',
    widget: 'check',
    valueType: 'boolean',
  }),
  defineFieldKind(registry, {
    name: 'choice',
    label: 'Choice',
    widget: 'choice',
    valueType: 'choice',
    settings: { options: setting.options({ label: 'Options' }) },
    props: ({ options }) => ({ options }),
  }),
  defineFieldKind(registry, {
    name: 'choices',
    label: 'Choices',
    widget: 'choices',
    valueType: 'choices',
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
        house: 'o2',
        rooms: ['r2', 'r1'],
        flats: 6,
        area: '120,5',
        consent: false,
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
      building: { house: 'o1', flats: 6, caretaker: 'Ada', name: '  ' },
      block: { floors: 4 },
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

    expect(describeAnswers(document, catalog, { house: 'o9', flats: 'six' })).toEqual({
      items: [
        expect.objectContaining({ key: 'house', answer: undefined }),
        expect.objectContaining({ key: 'flats', answer: undefined }),
      ],
    })
  })

  it('refuses a document with problems', () => {
    expect(() =>
      describeAnswers({ format: 1, items: [field('f1', 'signature')] }, catalog, {}),
    ).toThrow('formdef: document: the document has 1 problem; checkDocument lists it.')
  })
})
