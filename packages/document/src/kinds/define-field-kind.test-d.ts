import { createRegistry, type FieldOf } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { describe, expectTypeOf, it } from 'vitest'

import { defineFieldKind } from './define-field-kind'
import { defineValueType } from './define-value-type'
import { rule } from './rule'
import { type SettingOption, setting } from './setting'
import { valueTypes } from './value-types'

type Address = { street: string; city: string }

const address = defineValueType({
  name: 'address',
  emptyValue: { street: '', city: '' },
  fits: (value): value is Address => typeof value === 'object' && value !== null,
  describe: ({ street, city }) => ({ street, city }),
})

const ranking = defineValueType({
  name: 'ranking',
  emptyValue: [],
  readsOptions: true,
  fits: (value): value is readonly string[] => Array.isArray(value),
  describe: (value) => ({ ranked: value }),
})

type Option = { value: string; label: string }

const TextWidget = (
  _: FieldOf<string> & { label?: string; inputMode?: 'decimal'; suffix?: string },
) => null
const NumberWidget = (_: FieldOf<number | undefined> & { label?: string; min?: number }) => null
const ChoiceWidget = (_: FieldOf<string> & { label?: string; options: Option[] }) => null
const ChoicesWidget = (_: FieldOf<string[]> & { label?: string; options: Option[] }) => null
const ContextWidget = (_: { label?: string }) => null
const AddressWidget = (_: FieldOf<Address> & { label?: string }) => null

const { fieldContext, formContext } = createFormHookContexts()
const registry = createRegistry({
  fieldContext,
  formContext,
  widgets: {
    text: TextWidget,
    number: NumberWidget,
    choice: ChoiceWidget,
    choices: ChoicesWidget,
    context: ContextWidget,
    address: AddressWidget,
  },
})

describe('defineFieldKind', () => {
  it('passes the settings to props and rules with their value types', () => {
    defineFieldKind(registry, {
      name: 'measure',
      label: 'Measure',
      widget: 'text',
      valueType: valueTypes.decimal,
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

  it('rejects a formatted text setting, which only block kinds take', () => {
    defineFieldKind(registry, {
      name: 'note',
      label: 'Note',
      widget: 'text',
      valueType: valueTypes.text,
      // @ts-expect-error a field kind takes no formatted text setting
      settings: { hint: setting.text({ label: 'Hint', formatted: true }) },
    })
  })

  it('passes options as a list of value and label', () => {
    defineFieldKind(registry, {
      name: 'choice',
      label: 'Choice',
      widget: 'choice',
      valueType: valueTypes.choice,
      settings: { options: setting.options({ label: 'Choices' }) },
      props: ({ options }) => {
        expectTypeOf(options).toEqualTypeOf<SettingOption[]>()
        return { options }
      },
    })
  })

  it('rejects a widget the registry does not hold', () => {
    defineFieldKind(registry, {
      name: 'date',
      label: 'Date',
      // @ts-expect-error there is no widget `date` in the registry
      widget: 'date',
      valueType: valueTypes.date,
    })
  })

  it('requires props when the widget has a prop it cannot render without', () => {
    // @ts-expect-error the choice widget needs `options`
    defineFieldKind(registry, {
      name: 'choice',
      label: 'Choice',
      widget: 'choice',
      valueType: valueTypes.choice,
      settings: { options: setting.options({ label: 'Choices' }) },
    })
  })

  it('rejects props the widget does not take the type of', () => {
    defineFieldKind(registry, {
      name: 'measure',
      label: 'Measure',
      widget: 'text',
      valueType: valueTypes.decimal,
      // @ts-expect-error `inputMode` is 'decimal' only
      props: () => ({ inputMode: 'numeric' }),
    })
  })

  it('rejects a rule for another value type than the widget serves', () => {
    defineFieldKind(registry, {
      name: 'count',
      label: 'Count',
      widget: 'number',
      valueType: valueTypes.number,
      // @ts-expect-error `decimal` checks text, the number widget serves numbers
      rules: () => [rule.decimal()],
    })
  })

  it('rejects a typed rule for a widget that reads its field from context', () => {
    defineFieldKind(registry, {
      name: 'context',
      label: 'Context',
      widget: 'context',
      valueType: valueTypes.text,
      // @ts-expect-error the widget declares no value type, so no rule can know what it checks
      rules: () => [rule.decimal()],
    })
  })

  it('takes a rule that fits the widget’s value', () => {
    defineFieldKind(registry, {
      name: 'count',
      label: 'Count',
      widget: 'number',
      valueType: valueTypes.number,
      settings: { min: setting.number({ label: 'Minimum' }) },
      rules: ({ min }) => [rule.integer(), rule.min(min)],
    })
  })

  it('rejects a value type the widget does not serve', () => {
    defineFieldKind(registry, {
      name: 'count',
      label: 'Count',
      widget: 'text',
      // @ts-expect-error the text widget serves text, not numbers
      valueType: valueTypes.number,
    })
  })

  it('takes every text-like value type for a text widget', () => {
    defineFieldKind(registry, {
      name: 'text',
      label: 'Text',
      widget: 'text',
      valueType: valueTypes.text,
    })
    defineFieldKind(registry, {
      name: 'date',
      label: 'Date',
      widget: 'text',
      valueType: valueTypes.date,
    })
    defineFieldKind(registry, {
      name: 'choices',
      label: 'Choices',
      widget: 'choices',
      valueType: valueTypes.choices,
      settings: { options: setting.options({ label: 'Choices' }) },
      props: ({ options }) => ({ options }),
    })
  })

  it('requires an options setting for a choice', () => {
    defineFieldKind(registry, {
      name: 'choice',
      label: 'Choice',
      widget: 'choice',
      // @ts-expect-error a choice needs its options in a setting named `options`
      valueType: valueTypes.choice,
      props: () => ({ options: [] }),
    })
  })

  it("takes a project's value type the widget's value fits", () => {
    defineFieldKind(registry, {
      name: 'address',
      label: 'Address',
      widget: 'address',
      valueType: address,
    })
  })

  it("rejects a project's value type the widget does not serve", () => {
    defineFieldKind(registry, {
      name: 'address',
      label: 'Address',
      widget: 'text',
      // @ts-expect-error the text widget gives text, not an address
      valueType: address,
    })
  })

  it("requires an options setting for a project's value type that reads options", () => {
    defineFieldKind(registry, {
      name: 'ranking',
      label: 'Ranking',
      widget: 'choices',
      // @ts-expect-error a value type that reads options needs a setting named `options`
      valueType: ranking,
      props: () => ({ options: [] }),
    })
    defineFieldKind(registry, {
      name: 'ranking',
      label: 'Ranking',
      widget: 'choices',
      valueType: ranking,
      settings: { options: setting.options({ label: 'Choices' }) },
      props: ({ options }) => ({ options }),
    })
  })
})
