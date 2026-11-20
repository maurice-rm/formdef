import { createRegistry, type FieldOf } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { describe, expect, it } from 'vitest'

import { createCatalog } from './create-catalog'
import { defineBlockKind } from './define-block-kind'
import { defineFieldKind } from './define-field-kind'
import { defineValueType } from './define-value-type'
import { setting } from './setting'
import { valueTypes } from './value-types'

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
const Notice = (_: { children: string }) => null
const withNotice = createRegistry({
  fieldContext,
  formContext,
  widgets: {},
  formComponents: { notice: Notice },
})

const postalCode = defineValueType({
  name: 'postalCode',
  emptyValue: '',
  fits: (value): value is string => typeof value === 'string',
  describe: (value) => ({ value }),
})

const measure = defineFieldKind(registry, {
  name: 'measure',
  label: 'Measure with unit',
  widget: 'text',
  valueType: valueTypes.decimal,
  settings: { unit: setting.text({ label: 'Unit', required: true }) },
  props: ({ unit }) => ({ suffix: unit }),
})

const text = defineFieldKind(registry, {
  name: 'text',
  label: 'Short text',
  widget: 'text',
  valueType: valueTypes.text,
})

const choice = defineFieldKind(registry, {
  name: 'choice',
  label: 'One choice',
  widget: 'choice',
  valueType: valueTypes.choice,
  settings: { options: setting.options({ label: 'Choices' }) },
  props: ({ options }) => ({ options }),
})

const postal = defineFieldKind(registry, {
  name: 'postal',
  label: 'Postal code',
  widget: 'text',
  valueType: postalCode,
})

describe('createCatalog', () => {
  it('finds a field kind by its name', () => {
    const catalog = createCatalog(registry, { fields: [measure, text, choice] })

    expect(catalog.registry).toBe(registry)
    expect(catalog.findFieldKind('measure')).toBe(measure)
    expect(catalog.findFieldKind('missing')).toBeUndefined()
    expect(catalog.fields.map((kind) => kind.name)).toEqual(['measure', 'text', 'choice'])
  })

  it("holds the built-in value types, then the project's", () => {
    const catalog = createCatalog(registry, { valueTypes: [postalCode], fields: [postal] })

    expect(catalog.valueTypes).toEqual([...Object.values(valueTypes), postalCode])
  })

  it('holds the built-in value types without any of its own', () => {
    const catalog = createCatalog(registry, { fields: [text] })

    expect(catalog.valueTypes).toEqual(Object.values(valueTypes))
  })

  it('refuses a value type of a built-in name', () => {
    const again = { ...postalCode, name: 'text' }

    expect(() => createCatalog(registry, { valueTypes: [again], fields: [] })).toThrow(
      'formdef: valueTypes[0].name: the name "text" is used twice.',
    )
  })

  it('refuses two value types of the same name', () => {
    expect(() =>
      createCatalog(registry, { valueTypes: [postalCode, { ...postalCode }], fields: [] }),
    ).toThrow('formdef: valueTypes[1].name: the name "postalCode" is used twice.')
  })

  it('refuses a field kind whose value type is not in the catalog', () => {
    expect(() => createCatalog(registry, { fields: [text, postal] })).toThrow(
      'formdef: fields[1].valueType: expected a value type of the catalog.',
    )
  })

  it('refuses two field kinds of the same name', () => {
    const again = defineFieldKind(registry, {
      name: 'text',
      label: 'Text again',
      widget: 'text',
      valueType: valueTypes.text,
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
      valueType: valueTypes.text,
    })

    // @ts-expect-error the compiler refuses it already; this checks the runtime, for untyped code
    expect(() => createCatalog(registry, { fields: [text, foreign] })).toThrow(
      'formdef: fields[1]: the field kind "foreign" was defined with another registry.',
    )
  })

  it('finds a block kind by its name, apart from the field kinds', () => {
    const notice = defineBlockKind(withNotice, {
      name: 'text',
      label: 'Notice',
      component: 'notice',
      props: () => ({ children: 'Note' }),
    })
    const catalog = createCatalog(withNotice, { fields: [], blocks: [notice] })

    expect(catalog.blocks).toEqual([notice])
    expect(catalog.findBlockKind('text')).toBe(notice)
    expect(catalog.findFieldKind('text')).toBeUndefined()
  })

  it('refuses two block kinds of the same name, and one of another registry', () => {
    const notice = defineBlockKind(withNotice, {
      name: 'notice',
      label: 'Notice',
      component: 'notice',
      props: () => ({ children: 'Note' }),
    })
    const foreign = { ...notice, registry: otherRegistry }

    expect(() => createCatalog(withNotice, { fields: [], blocks: [notice, notice] })).toThrow(
      'formdef: blocks[1].name: the name "notice" is used twice.',
    )
    expect(() =>
      createCatalog(withNotice, { fields: [], blocks: [foreign as unknown as typeof notice] }),
    ).toThrow('formdef: blocks[0]: the block kind "notice" was defined with another registry.')
  })

  it('refuses a field kind without a value type, as untyped code could pass', () => {
    const untyped = { ...text, valueType: 'colour' } as unknown as typeof text

    expect(() => createCatalog(registry, { fields: [untyped] })).toThrow(
      'formdef: fields[0].valueType: expected a value type of the catalog.',
    )
  })
})
