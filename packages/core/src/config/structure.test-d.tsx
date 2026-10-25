import type { ReactNode } from 'react'
import { describe, expectTypeOf, it } from 'vitest'

import type { FieldApiOf } from '../widget/field-of'
import type { ArrayFrameProps, BodyProps, RowProps, SectionProps } from './structure'

type Contact = { name: string }

describe('SectionProps', () => {
  it('carries the title as label and the entries as children', () => {
    expectTypeOf<SectionProps>().toEqualTypeOf<{ label: string; children: ReactNode }>()
  })
})

describe('RowProps and BodyProps', () => {
  it('carry the entries as children', () => {
    expectTypeOf<RowProps>().toEqualTypeOf<{ children: ReactNode }>()
    expectTypeOf<BodyProps>().toEqualTypeOf<{ children: ReactNode }>()
  })
})

describe('ArrayFrameProps', () => {
  it('hands the frame the array field itself', () => {
    expectTypeOf<ArrayFrameProps<Contact>['field']>().toEqualTypeOf<FieldApiOf<Contact[]>>()
  })

  it('takes extra props for an item only in the shape the frame declares', () => {
    const frame = {} as ArrayFrameProps<Contact, { isCompact: boolean }>
    frame.renderItem(0)
    frame.renderItem(0, { isCompact: true })
    // @ts-expect-error the frame declared `isCompact` only
    frame.renderItem(0, { isWide: true })
  })

  it('takes no extra props when the frame declares none', () => {
    const frame = {} as ArrayFrameProps<Contact>
    frame.renderItem(0)
    // @ts-expect-error the frame declared no extra props
    frame.renderItem(0, { isCompact: true })
  })

  it('inserts a new item without one and replaces with a typed one', () => {
    const frame = {} as ArrayFrameProps<Contact>
    frame.insert(1)
    frame.insert(1, { name: 'Ada' })
    frame.replace(0, { name: 'Ada' })
    // @ts-expect-error replacing needs the new item
    frame.replace(0)
    // @ts-expect-error an item of the array is a contact
    frame.insert(1, { email: 'ada@example.com' })
  })

  it('names one remove label and one key per item', () => {
    expectTypeOf<ArrayFrameProps<Contact>['removeLabels']>().toEqualTypeOf<readonly string[]>()
    expectTypeOf<ArrayFrameProps<Contact>['keys']>().items.toEqualTypeOf<string | number>()
  })

  it('types a frame component written against it', () => {
    const ContactsFrame = ({
      keys,
      renderItem,
      add,
      remove,
      addLabel,
      removeLabels,
    }: ArrayFrameProps<Contact>): ReactNode => (
      <ul>
        {keys.map((key, index) => (
          <li key={key}>
            {renderItem(index)}
            <button type="button" onClick={() => remove(index)}>
              {removeLabels[index]}
            </button>
          </li>
        ))}
        <button type="button" onClick={add}>
          {addLabel}
        </button>
      </ul>
    )
    expectTypeOf(ContactsFrame).toBeFunction()
  })
})
