import { describe, expect, it } from 'vitest'

import type { FieldItem, FormDocument } from '../form-document'
import { dissolveSteps } from './dissolve-steps'

const field = (key: string): FieldItem => ({ type: 'field', key, kind: 'text', label: key })

describe('dissolveSteps', () => {
  it("keeps the document's languages", () => {
    const stepped: FormDocument = {
      format: 1,
      languages: ['de', 'en'],
      steps: [{ key: 's1', label: { de: 'Bau', en: 'Building' }, items: [field('f1')] }],
    }

    expect(dissolveSteps(stepped)).toMatchObject({ languages: ['de', 'en'] })
  })

  it('turns each step into a section with its label, description and condition', () => {
    const stepped: FormDocument = {
      format: 1,
      steps: [
        { key: 's1', label: 'Building', description: 'Size', items: [field('f1')] },
        {
          key: 's2',
          label: 'Flats',
          visibleWhen: { field: 'f1', op: 'isFilled' },
          items: [field('f2')],
        },
      ],
    }

    expect(dissolveSteps(stepped)).toEqual({
      format: 1,
      items: [
        { type: 'section', label: 'Building', description: 'Size', items: [field('f1')] },
        {
          type: 'section',
          label: 'Flats',
          visibleWhen: { field: 'f1', op: 'isFilled' },
          items: [field('f2')],
        },
      ],
    })
  })

  it('leaves out the displays of the form and of its steps, which need steps', () => {
    const stepped: FormDocument = {
      format: 1,
      display: { kind: 'rail' },
      steps: [{ key: 's1', label: 'Building', display: { kind: 'icon' }, items: [field('f1')] }],
    }

    expect(dissolveSteps(stepped)).toEqual({
      format: 1,
      items: [{ type: 'section', label: 'Building', items: [field('f1')] }],
    })
  })

  it('refuses a form without steps', () => {
    expect(() => dissolveSteps({ format: 1, items: [] })).toThrow(
      'formdef: document: the form has no steps.',
    )
  })
})
