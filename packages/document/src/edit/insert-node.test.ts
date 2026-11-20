import { describe, expect, it } from 'vitest'

import type { DocumentStep, FieldItem, FormDocument, RowItem, SectionItem } from '../form-document'
import { insertNode } from './insert-node'

const field = (key: string): FieldItem => ({ type: 'field', key, kind: 'text', label: key })
const row = (...items: FieldItem[]): RowItem => ({ type: 'row', items })
const section = (label: string, ...items: SectionItem['items']): SectionItem => ({
  type: 'section',
  label,
  items,
})
const step = (key: string, ...items: DocumentStep['items']): DocumentStep => ({
  key,
  label: key,
  items,
})

const plain: FormDocument = {
  format: 1,
  items: [field('f1'), row(field('f2'), field('f3')), section('Roof', field('f4'))],
}
const stepped: FormDocument = {
  format: 1,
  steps: [step('s1', field('f1')), step('s2', field('f2'))],
}

describe('insertNode', () => {
  it('inserts an item at a position among its siblings, leaving the document as it was', () => {
    const result = insertNode(plain, [1, 1], field('f9'))

    expect(result.items?.[1]).toEqual(row(field('f2'), field('f9'), field('f3')))
    expect(plain.items?.[1]).toEqual(row(field('f2'), field('f3')))
  })

  it('appends at the position after the last sibling, and inserts steps at the root', () => {
    expect(insertNode(plain, [2, 1], field('f9')).items?.[2]).toEqual(
      section('Roof', field('f4'), field('f9')),
    )
    expect(insertNode(stepped, [1], step('s9')).steps?.map(({ key }) => key)).toEqual([
      's1',
      's9',
      's2',
    ])
    expect(insertNode(stepped, [0, 0], field('f9')).steps?.[0]?.items).toEqual([
      field('f9'),
      field('f1'),
    ])
  })

  it('refuses a node its place cannot hold, and a position that does not exist', () => {
    expect(() => insertNode(plain, [1, 0], section('Wall'))).toThrow(
      'formdef: position [1, 0]: a row holds fields only.',
    )
    expect(() => insertNode(stepped, [1], field('f9'))).toThrow(
      'formdef: position [1]: a form with steps holds steps only.',
    )
    expect(() => insertNode(plain, [0], step('s9'))).toThrow(
      'formdef: position [0]: a step goes only into the steps of a form.',
    )
    expect(() => insertNode(plain, [5], field('f9'))).toThrow(
      'formdef: position [5]: there is no such place.',
    )
    expect(() => insertNode(plain, [0, 0], field('f9'))).toThrow(
      'formdef: position [0, 0]: a field holds no items.',
    )
  })
})
