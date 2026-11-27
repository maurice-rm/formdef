import { createRegistry, type FieldOf } from '@formdef/core'
import { describe, expectTypeOf, it } from 'vitest'

import type { FormDocument } from '../form-document'
import { createCatalog } from '../kinds/create-catalog'
import { defineFieldKind } from '../kinds/define-field-kind'
import { defineValueType } from '../kinds/define-value-type'
import { valueTypes } from '../kinds/value-types'
import { type DescribedAnswer, describeAnswers } from './describe-answers'

const TextWidget = (_: FieldOf<string> & { label?: string }) => null

const registry = createRegistry({ widgets: { text: TextWidget } })

const postalCode = defineValueType({
  name: 'postalCode',
  emptyValue: '',
  fits: (value): value is string => typeof value === 'string',
  describe: (value) => ({ code: value }),
})

const text = defineFieldKind(registry, {
  name: 'text',
  label: 'Text',
  widget: 'text',
  valueType: valueTypes.text,
})

declare const document: FormDocument

describe('describeAnswers', () => {
  it('narrows a built-in answer by its value type', () => {
    const catalog = createCatalog(registry, { fields: [text] })
    const description = describeAnswers(document, catalog, { values: {} })
    const answer = 'items' in description ? description.items[0] : undefined

    if (answer?.type === 'field' && answer.answer?.valueType === 'number') {
      expectTypeOf(answer.answer.value).toEqualTypeOf<number>()
    }
    if (answer?.type === 'field' && answer.answer?.valueType === 'choices') {
      expectTypeOf(answer.answer.values).toEqualTypeOf<
        { value: string; label: string; description?: string; score?: number }[]
      >()
    }
    if (answer?.type === 'field') {
      expectTypeOf(answer.answer).toEqualTypeOf<DescribedAnswer | undefined>()
    }
  })

  it("narrows an answer of a project's value type to the shape it describes", () => {
    const catalog = createCatalog(registry, { valueTypes: [postalCode], fields: [text] })
    const description = describeAnswers(document, catalog, { values: {} })
    const answer = 'items' in description ? description.items[0] : undefined

    if (answer?.type === 'field' && answer.answer?.valueType === 'postalCode') {
      expectTypeOf(answer.answer.code).toEqualTypeOf<string>()
    }
    if (answer?.type === 'field' && answer.answer?.valueType === 'number') {
      expectTypeOf(answer.answer.value).toEqualTypeOf<number>()
    }
  })

  it('knows no answer of a value type the catalog does not hold', () => {
    const catalog = createCatalog(registry, { fields: [text] })
    const description = describeAnswers(document, catalog, { values: {} })
    const answer = 'items' in description ? description.items[0] : undefined

    if (answer?.type === 'field') {
      // @ts-expect-error the catalog holds no value type `postalCode`
      expectTypeOf(answer.answer?.valueType === 'postalCode').toBeBoolean()
    }
  })
})
