import { createRegistry, type FieldOf } from '@formdef/core'
import { describe, expect, it } from 'vitest'

import type { Ending, FieldItem, FormDocument } from '../form-document'
import { createCatalog } from '../kinds/create-catalog'
import { defineBlockKind } from '../kinds/define-block-kind'
import { defineFieldKind } from '../kinds/define-field-kind'
import { setting } from '../kinds/setting'
import { valueTypes } from '../kinds/value-types'
import { endingOf } from './ending-of'

const CheckWidget = (_: FieldOf<boolean> & { label?: string }) => null
const Notice = (_: { children: string }) => null

const registry = createRegistry({
  widgets: { check: CheckWidget },
  formComponents: { notice: Notice },
})
const catalog = createCatalog(registry, {
  fields: [
    defineFieldKind(registry, {
      name: 'yesNo',
      label: 'Yes or no',
      widget: 'check',
      valueType: valueTypes.boolean,
    }),
  ],
  blocks: [
    defineBlockKind(registry, {
      name: 'notice',
      label: 'Notice',
      component: 'notice',
      settings: { body: setting.text({ label: 'Text', required: true }) },
      props: ({ body }) => ({ children: body }),
    }),
  ],
})

const yesNo = (key: string): FieldItem => ({ type: 'field', key, kind: 'yesNo', label: key })
const ending = (key: string, extra: Partial<Ending> = {}): Ending => ({
  key,
  items: [{ type: 'block', key: `b-${key}`, kind: 'notice', settings: { body: key } }],
  ...extra,
})

const document: FormDocument = {
  format: 1,
  steps: [
    {
      key: 's1',
      label: 'House',
      items: [yesNo('owned')],
      next: [{ when: { field: 'owned', op: 'isFalse' }, end: 'notOwned' }],
    },
    { key: 's2', label: 'Funding', items: [yesNo('funded')] },
  ],
  endings: [
    ending('notOwned'),
    ending('funded', { when: { field: 'funded', op: 'isTrue' } }),
    ending('thanks'),
  ],
}

describe('endingOf', () => {
  it('takes the ending a jump ends the form with', () => {
    expect(endingOf(document, catalog, { values: { s1: { owned: false } } })?.key).toBe('notOwned')
  })

  it('takes the first ending whose condition holds, otherwise the one without', () => {
    expect(
      endingOf(document, catalog, { values: { s1: { owned: true }, s2: { funded: true } } })?.key,
    ).toBe('funded')
    expect(endingOf(document, catalog, { values: { s1: { owned: true } } })?.key).toBe('thanks')
  })

  it('takes none for a document without endings', () => {
    const plain: FormDocument = { format: 1, items: [yesNo('owned')] }

    expect(endingOf(plain, catalog, { values: {} })).toBeUndefined()
  })
})
