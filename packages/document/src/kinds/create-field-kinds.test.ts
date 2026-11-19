import { createRegistry, type FieldOf } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { describe, expect, it } from 'vitest'

import { createFieldKinds } from './create-field-kinds'
import { defineFieldKind } from './define-field-kind'
import { rule } from './rule'
import { setting } from './setting'

type Option = { value: string; label: string }

const TextWidget = (
  _: FieldOf<string> & { label?: string; inputMode?: 'decimal'; suffix?: string },
) => null
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
  settings: {
    unit: setting.text({ label: 'Unit', required: true, varies: true }),
    min: setting.number({ label: 'Minimum' }),
  },
  props: ({ unit }) => ({ inputMode: 'decimal', suffix: unit }),
  rules: ({ min }) => [rule.decimal(), rule.min(min)],
})

const text = defineFieldKind(registry, { name: 'text', label: 'Short text', widget: 'text' })

const choice = defineFieldKind(registry, {
  name: 'choice',
  label: 'One choice',
  widget: 'choice',
  settings: { options: setting.options({ label: 'Choices', minCount: 2 }) },
  props: ({ options }) => ({ options }),
})

describe('defineFieldKind', () => {
  it('builds the widget props from the settings', () => {
    expect(measure.props({ unit: 'm²', min: undefined })).toEqual({
      inputMode: 'decimal',
      suffix: 'm²',
    })
  })

  it('builds the rules from the settings, leaving out what is not set', () => {
    const rules = measure
      .rules({ unit: 'm²', min: undefined })
      .filter((entry) => entry !== undefined)

    expect(rules.map((entry) => entry.code)).toEqual(['decimal'])
  })

  it('gives a field kind without props or rules none', () => {
    expect(text.props({})).toEqual({})
    expect(text.rules({})).toEqual([])
    expect(text.settings).toEqual({})
  })
})

describe('createFieldKinds', () => {
  it('finds a field kind by its name', () => {
    const kinds = createFieldKinds(registry, [measure, text, choice])

    expect(kinds.byName('measure')).toBe(measure)
    expect(kinds.byName('missing')).toBeUndefined()
    expect(kinds.all.map((kind) => kind.name)).toEqual(['measure', 'text', 'choice'])
  })

  it('refuses two field kinds of the same name', () => {
    const again = defineFieldKind(registry, { name: 'text', label: 'Text again', widget: 'text' })

    expect(() => createFieldKinds(registry, [text, again])).toThrow(
      'formdef: fieldKinds[1].name: the name text is used twice.',
    )
  })

  it('refuses a field kind defined with another registry', () => {
    const foreign = defineFieldKind(otherRegistry, {
      name: 'foreign',
      label: 'Foreign',
      widget: 'text',
    })

    // @ts-expect-error the compiler refuses it already; this checks the runtime, for untyped code
    expect(() => createFieldKinds(registry, [text, foreign])).toThrow(
      'formdef: fieldKinds[1]: the field kind foreign was defined with another registry.',
    )
  })
})
