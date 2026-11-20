import { describe, expect, it } from 'vitest'

import type { FieldItem, FormDocument } from '../form-document'
import { splitIntoSteps } from './split-into-steps'

const field = (key: string): FieldItem => ({ type: 'field', key, kind: 'text', label: key })

describe('splitIntoSteps', () => {
  it('puts the items of a plain form into one step', () => {
    const plain: FormDocument = { format: 1, items: [field('f1'), field('f2')] }

    expect(splitIntoSteps(plain, { key: 's1', label: 'Contact' })).toEqual({
      format: 1,
      steps: [{ key: 's1', label: 'Contact', items: [field('f1'), field('f2')] }],
    })
  })

  it("keeps the document's languages", () => {
    const plain: FormDocument = { format: 1, languages: ['de'], items: [field('f1')] }

    expect(splitIntoSteps(plain, { key: 's1', label: { de: 'Kontakt' } })).toMatchObject({
      languages: ['de'],
    })
  })

  it('refuses a form that has steps already', () => {
    const stepped: FormDocument = { format: 1, steps: [] }

    expect(() => splitIntoSteps(stepped, { key: 's1', label: 'Contact' })).toThrow(
      'formdef: document: the form has steps already.',
    )
  })
})
