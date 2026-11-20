import { createRegistry, type FieldOf } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { describe, expect, it } from 'vitest'

import type { FieldItem, FormDocument } from '../form-document'
import { defineFieldKind } from '../kinds/define-field-kind'
import { setting } from '../kinds/setting'
import { valueTypes } from '../kinds/value-types'
import { changeKind } from './change-kind'

const TextWidget = (_: FieldOf<string> & { label?: string }) => null
const { fieldContext, formContext } = createFormHookContexts()
const registry = createRegistry({ fieldContext, formContext, widgets: { text: TextWidget } })

const measure = defineFieldKind(registry, {
  name: 'measure',
  label: 'Measure',
  widget: 'text',
  valueType: valueTypes.decimal,
  settings: {
    unit: setting.text({ label: 'Unit', required: true }),
    min: setting.number({ label: 'Minimum' }),
  },
})

const field = (key: string, extra: Partial<FieldItem> = {}): FieldItem => ({
  type: 'field',
  key,
  kind: 'text',
  label: key,
  ...extra,
})

describe('changeKind', () => {
  it('gives a field another kind and keeps the settings that kind has', () => {
    const plain: FormDocument = {
      format: 1,
      items: [field('f1', { settings: { unit: 'm²', maxLength: 10 } })],
    }

    expect(changeKind(plain, [0], measure).items).toEqual([
      field('f1', { kind: 'measure', settings: { unit: 'm²' } }),
    ])
  })

  it('refuses a node that is no field', () => {
    const plain: FormDocument = {
      format: 1,
      items: [{ type: 'section', label: 'Flats', items: [field('f1')] }],
    }

    expect(() => changeKind(plain, [0], measure)).toThrow(
      'formdef: position [0]: expected a field.',
    )
  })
})
