import {
  createCatalog,
  defineBlockKind,
  defineDisplayKind,
  defineFieldKind,
  rule,
  setting,
  valueTypes,
} from '@formdef/document'

import { registry } from '@/lib/formdef'

// This file is yours. Its catalog holds the field kinds a form builder offers and form documents
// are made of. Each one renders with a widget registered in index.tsx under the name it writes as `widget`:
// remove a kind whose widget you do not fetch, change the labels, and add kinds of your own with
// defineFieldKind. The block kinds render with the form components Notice and Heading, registered
// under formComponents; the display kinds give props to the Stepper and Section under structure.
// It stays without 'use client', so a server validates answers with it too.

const options = setting.options({ label: 'Options', minCount: 1 })
const placeholder = setting.text({ label: 'Placeholder' })
const maxLength = setting.number({ label: 'Most characters', integer: true })

const text = defineFieldKind(registry, {
  name: 'text',
  label: 'Short text',
  widget: 'text',
  valueType: valueTypes.text,
  settings: { placeholder, maxLength },
  props: (settings) => ({ placeholder: settings.placeholder, maxLength: settings.maxLength }),
  rules: (settings) => [rule.maxLength(settings.maxLength)],
})

const email = defineFieldKind(registry, {
  name: 'email',
  label: 'Email address',
  widget: 'text',
  valueType: valueTypes.text,
  settings: { placeholder },
  props: (settings) => ({
    type: 'email',
    autoComplete: 'email',
    placeholder: settings.placeholder,
  }),
  rules: () => [rule.email()],
})

const longText = defineFieldKind(registry, {
  name: 'longText',
  label: 'Long text',
  widget: 'textarea',
  valueType: valueTypes.text,
  settings: { placeholder, maxLength },
  props: (settings) => ({ placeholder: settings.placeholder, maxLength: settings.maxLength }),
  rules: (settings) => [rule.maxLength(settings.maxLength)],
})

const decimal = defineFieldKind(registry, {
  name: 'decimal',
  label: 'Number with unit',
  widget: 'text',
  valueType: valueTypes.decimal,
  settings: {
    unit: setting.text({ label: 'Unit', varies: true }),
    min: setting.number({ label: 'Smallest value' }),
    max: setting.number({ label: 'Largest value' }),
  },
  props: ({ unit }) => ({
    inputMode: 'decimal',
    addons: unit === undefined ? [] : [{ id: 'unit', content: unit, align: 'inline-end' }],
  }),
  rules: ({ min, max }) => [rule.decimal(), rule.min(min), rule.max(max)],
})

const number = defineFieldKind(registry, {
  name: 'number',
  label: 'Whole number',
  widget: 'number',
  valueType: valueTypes.number,
  settings: {
    min: setting.number({ label: 'Smallest value', integer: true }),
    max: setting.number({ label: 'Largest value', integer: true }),
  },
  props: ({ min, max }) => ({ min, max }),
  rules: ({ min, max }) => [rule.integer(), rule.min(min), rule.max(max)],
})

const checkbox = defineFieldKind(registry, {
  name: 'checkbox',
  label: 'Checkbox',
  widget: 'checkbox',
  valueType: valueTypes.boolean,
})

const radio = defineFieldKind(registry, {
  name: 'radio',
  label: 'Single choice',
  widget: 'radio',
  valueType: valueTypes.choice,
  settings: { options },
  props: (settings) => ({ options: settings.options }),
})

const select = defineFieldKind(registry, {
  name: 'select',
  label: 'Dropdown',
  widget: 'select',
  valueType: valueTypes.choice,
  settings: { options, placeholder },
  props: (settings) => ({ options: settings.options, placeholder: settings.placeholder }),
})

const checkboxes = defineFieldKind(registry, {
  name: 'checkboxes',
  label: 'Multiple choice',
  widget: 'checkboxes',
  valueType: valueTypes.choices,
  settings: {
    options,
    minCount: setting.number({ label: 'Fewest choices', integer: true }),
    maxCount: setting.number({ label: 'Most choices', integer: true }),
  },
  props: (settings) => ({ options: settings.options }),
  rules: (settings) => [rule.minCount(settings.minCount), rule.maxCount(settings.maxCount)],
})

const date = defineFieldKind(registry, {
  name: 'date',
  label: 'Date',
  widget: 'date',
  valueType: valueTypes.date,
  settings: {
    earliest: setting.date({ label: 'Earliest date' }),
    latest: setting.date({ label: 'Latest date' }),
  },
  props: ({ earliest, latest }) => ({ min: earliest, max: latest }),
  rules: ({ earliest, latest }) => [rule.earliest(earliest), rule.latest(latest)],
})

const notice = defineBlockKind(registry, {
  name: 'notice',
  label: 'Notice',
  component: 'Notice',
  settings: {
    title: setting.text({ label: 'Title', varies: true }),
    body: setting.text({ label: 'Text', required: true, varies: true, formatted: true }),
  },
  props: ({ title, body }) => ({ title, children: body }),
})

const heading = defineBlockKind(registry, {
  name: 'heading',
  label: 'Heading',
  component: 'Heading',
  settings: { text: setting.text({ label: 'Text', required: true, varies: true }) },
  props: ({ text }) => ({ children: text }),
})

const rail = defineDisplayKind(registry, {
  name: 'rail',
  label: 'Steps as a rail',
  appliesTo: 'form',
  props: () => ({ variant: 'rail' }),
})

const segments = defineDisplayKind(registry, {
  name: 'segments',
  label: 'Steps as segments',
  appliesTo: 'form',
  props: () => ({ variant: 'segments' }),
})

const compact = defineDisplayKind(registry, {
  name: 'compact',
  label: 'Steps as a compact bar',
  appliesTo: 'form',
  props: () => ({ variant: 'compact' }),
})

const group = defineDisplayKind(registry, {
  name: 'group',
  label: 'Group that reads as one question',
  appliesTo: 'section',
  props: () => ({ variant: 'label' }),
})

export const catalog = createCatalog(registry, {
  fields: [text, email, longText, decimal, number, checkbox, radio, select, checkboxes, date],
  blocks: [notice, heading],
  displays: [rail, segments, compact, group],
})
