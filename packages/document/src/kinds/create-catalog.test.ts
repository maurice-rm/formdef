import { createRegistry, type FieldOf } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { describe, expect, it } from 'vitest'

import { createCatalog } from './create-catalog'
import { defineFieldKind } from './define-field-kind'
import { setting } from './setting'

type Option = { value: string; label: string }

const TextWidget = (_: FieldOf<string> & { label?: string; suffix?: string }) => null
const ChoiceWidget = (_: FieldOf<string> & { label?: string; options: Option[] }) => null

const { fieldContext, formContext } = createFormHookContexts()
const registry = createRegistry({
  fieldContext,
  formContext,
  widgets: { text: TextWidget, choice: ChoiceWidget },
})
const otherRegistry = createRegistry({ fieldContext, formContext, widgets: { text: TextWidget } })

const measure = defineFieldKind(registry, {
  name: 'measure',
  label: 'Measure with unit',
  widget: 'text',
  valueType: 'decimal',
  settings: { unit: setting.text({ label: 'Unit', required: true }) },
  props: ({ unit }) => ({ suffix: unit }),
})

const text = defineFieldKind(registry, {
  name: 'text',
  label: 'Short text',
  widget: 'text',
  valueType: 'text',
})

const choice = defineFieldKind(registry, {
  name: 'choice',
  label: 'One choice',
  widget: 'choice',
  valueType: 'choice',
  settings: { options: setting.options({ label: 'Choices' }) },
  props: ({ options }) => ({ options }),
})

describe('createCatalog', () => {
  it('finds a field kind by its name', () => {
    const catalog = createCatalog(registry, { fields: [measure, text, choice] })

    expect(catalog.registry).toBe(registry)
    expect(catalog.findFieldKind('measure')).toBe(measure)
    expect(catalog.findFieldKind('missing')).toBeUndefined()
    expect(catalog.fields.map((kind) => kind.name)).toEqual(['measure', 'text', 'choice'])
  })

  it('refuses two field kinds of the same name', () => {
    const again = defineFieldKind(registry, {
      name: 'text',
      label: 'Text again',
      widget: 'text',
      valueType: 'text',
    })

    expect(() => createCatalog(registry, { fields: [text, again] })).toThrow(
      'formdef: fields[1].name: the name "text" is used twice.',
    )
  })

  it('refuses a field kind defined with another registry', () => {
    const foreign = defineFieldKind(otherRegistry, {
      name: 'foreign',
      label: 'Foreign',
      widget: 'text',
      valueType: 'text',
    })

    // @ts-expect-error the compiler refuses it already; this checks the runtime, for untyped code
    expect(() => createCatalog(registry, { fields: [text, foreign] })).toThrow(
      'formdef: fields[1]: the field kind "foreign" was defined with another registry.',
    )
  })

  it('refuses a field kind without a known value type, as untyped code could pass', () => {
    const untyped = { ...text, valueType: 'colour' } as unknown as typeof text

    expect(() => createCatalog(registry, { fields: [untyped] })).toThrow(
      'formdef: fields[0].valueType: expected one of text, choice, choices, boolean, number, decimal, date.',
    )
  })
})
