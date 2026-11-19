import { createRegistry, type FieldOf } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { describe, expectTypeOf, it } from 'vitest'

import { defineFieldKind } from './define-field-kind'
import { rule } from './rule'
import { type SettingOption, setting } from './setting'

type Option = { value: string; label: string }

const TextWidget = (
  _: FieldOf<string> & { label?: string; inputMode?: 'decimal'; suffix?: string },
) => null
const NumberWidget = (_: FieldOf<number | undefined> & { label?: string; min?: number }) => null
const ChoiceWidget = (_: FieldOf<string> & { label?: string; options: Option[] }) => null
const ContextWidget = (_: { label?: string }) => null

const { fieldContext, formContext } = createFormHookContexts()
const registry = createRegistry({
  fieldContext,
  formContext,
  widgets: { text: TextWidget, number: NumberWidget, choice: ChoiceWidget, context: ContextWidget },
})

describe('defineFieldKind', () => {
  it('passes the settings to props and rules with their value types', () => {
    defineFieldKind(registry, {
      name: 'measure',
      label: 'Measure',
      widget: 'text',
      settings: {
        unit: setting.text({ label: 'Unit', required: true }),
        hint: setting.text({ label: 'Hint' }),
        min: setting.number({ label: 'Minimum' }),
      },
      props: (settings) => {
        expectTypeOf(settings).toEqualTypeOf<{
          unit: string
          hint: string | undefined
          min: number | undefined
        }>()
        return { suffix: settings.unit }
      },
    })
  })

  it('passes options as a list of value and label', () => {
    defineFieldKind(registry, {
      name: 'choice',
      label: 'Choice',
      widget: 'choice',
      settings: { options: setting.options({ label: 'Choices' }) },
      props: ({ options }) => {
        expectTypeOf(options).toEqualTypeOf<SettingOption[]>()
        return { options }
      },
    })
  })

  it('rejects a widget the registry does not hold', () => {
    // @ts-expect-error there is no widget `date` in the registry
    defineFieldKind(registry, { name: 'date', label: 'Date', widget: 'date' })
  })

  it('requires props when the widget has a prop it cannot render without', () => {
    // @ts-expect-error the choice widget needs `options`
    defineFieldKind(registry, { name: 'choice', label: 'Choice', widget: 'choice' })
  })

  it('rejects props the widget does not take the type of', () => {
    defineFieldKind(registry, {
      name: 'measure',
      label: 'Measure',
      widget: 'text',
      // @ts-expect-error `inputMode` is 'decimal' only
      props: () => ({ inputMode: 'numeric' }),
    })
  })

  it('rejects a rule for another value type than the widget serves', () => {
    defineFieldKind(registry, {
      name: 'count',
      label: 'Count',
      widget: 'number',
      // @ts-expect-error `decimal` checks text, the number widget serves numbers
      rules: () => [rule.decimal()],
    })
  })

  it('rejects a typed rule for a widget that reads its field from context', () => {
    defineFieldKind(registry, {
      name: 'context',
      label: 'Context',
      widget: 'context',
      // @ts-expect-error the widget declares no value type, so no rule can know what it checks
      rules: () => [rule.decimal()],
    })
  })

  it('takes a rule that fits the widget’s value', () => {
    defineFieldKind(registry, {
      name: 'count',
      label: 'Count',
      widget: 'number',
      settings: { min: setting.number({ label: 'Minimum' }) },
      rules: ({ min }) => [rule.integer(), rule.min(min)],
    })
  })
})
