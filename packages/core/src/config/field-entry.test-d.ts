import type { ComponentType, ReactNode } from 'react'
import { describe, expectTypeOf, it } from 'vitest'
import { z } from 'zod'

import type { FieldApiOf, FieldOf } from '../widget/field-of'
import type { FieldEntry } from './field-entry'
import type { InferData } from './infer-data'
import type { ArrayFrameProps } from './structure'

type Widgets = {
  text: ComponentType<FieldOf<string> & { label: string; required?: boolean }>
  date: ComponentType<FieldOf<Date> & { label: string }>
  file: ComponentType<FieldOf<File> & { label: string }>
  tags: ComponentType<FieldOf<string[]> & { label: string }>
}

type Values = {
  email: string
  address: { zip: string; city?: string }
  billing?: { zip: string; note?: string }
  birthday: Date
  avatar: File
  tags: string[]
  contacts: { name: string; phone?: string }[]
}

type Contact = Values['contacts'][number]

type Parts = {
  widgets: Widgets
  structure: Record<never, never>
  formComponents: Record<never, never>
  handle: unknown
}

type Entry<TValue> = FieldEntry<Parts, TValue, Values>

type FramedParts = Omit<Parts, 'structure'> & {
  structure: { arrayFrame: ComponentType<ArrayFrameProps<Contact> & { isCompact?: boolean }> }
}

type FramedEntry<TValue> = FieldEntry<FramedParts, TValue, Values>

const contactsEntry = {
  item: { fields: { name: { widget: 'text', props: { label: 'Name' } } }, layout: ['name'] },
  newItem: () => ({ name: '' }),
  addLabel: 'Add contact',
  removeLabel: (contact: Contact, index: number) =>
    `Remove ${contact.name || `contact ${index + 1}`}`,
} satisfies Entry<Contact[]>

describe('FieldEntry', () => {
  describe('object', () => {
    it('describes the keys of its object in fields', () => {
      const entry: Entry<Values> = {
        fields: {
          email: { widget: 'text', props: { label: 'Email' } },
          address: {
            fields: {
              zip: { widget: 'text', props: { label: 'Postal code' } },
              city: { widget: 'text', props: { label: 'City' } },
            },
          },
        },
      }
      expectTypeOf(entry).not.toBeAny()
    })

    it('arranges its fields with a layout', () => {
      const entry: Entry<Values> = {
        fields: {
          email: { widget: 'text', props: { label: 'Email' } },
          address: { fields: { zip: { widget: 'text', props: { label: 'Postal code' } } } },
        },
        layout: [{ section: 'Contact', layout: ['email', 'address'] }],
      }
      expectTypeOf(entry).not.toBeAny()
    })

    it('names only keys of its own object in the layout', () => {
      const entry: Entry<Values> = {
        fields: { address: { fields: {}, layout: ['zip', 'city'] } },
        // @ts-expect-error `zip` belongs to the address, one level down
        layout: ['email', 'zip'],
      }
      expectTypeOf(entry).not.toBeAny()
    })

    it('takes no layout on a leaf or a custom entry', () => {
      // @ts-expect-error a layout arranges the fields of an object entry
      const leaf: Entry<string> = { widget: 'text', props: { label: 'Email' }, layout: [] }
      // @ts-expect-error a layout arranges the fields of an object entry
      const custom: Entry<string> = { render: () => null, layout: [] }
      expectTypeOf(leaf).not.toBeAny()
      expectTypeOf(custom).not.toBeAny()
    })

    it('leaves a key out of the form when fields does not list it', () => {
      expectTypeOf({ fields: {} }).toExtend<Entry<Values>>()
    })

    it('rejects a key its object does not have', () => {
      const entry: Entry<Values> = {
        fields: {
          // @ts-expect-error the form has no `phone`
          phone: { widget: 'text', props: { label: 'Phone' } },
        },
      }
      expectTypeOf(entry).not.toBeAny()
    })

    it('rejects a key its object does not have one level down', () => {
      const entry: Entry<Values> = {
        fields: {
          address: {
            fields: {
              // @ts-expect-error the address has no `street`
              street: { widget: 'text', props: { label: 'Street' } },
            },
          },
        },
      }
      expectTypeOf(entry).not.toBeAny()
    })

    it('lets a required key of an optional object claim to be required', () => {
      const entry: Entry<Values> = {
        fields: {
          billing: {
            fields: {
              zip: {
                widget: 'text',
                props: { label: 'Postal code', required: true },
                validators: {
                  onBlur: ({ value }) => {
                    expectTypeOf(value).toEqualTypeOf<string | undefined>()

                    return undefined
                  },
                },
              },
            },
          },
        },
      }
      expectTypeOf(entry).not.toBeAny()
    })

    it('keeps an optional key of an optional object from claiming to be required', () => {
      const entry: Entry<Values> = {
        fields: {
          billing: {
            fields: {
              // @ts-expect-error the schema does not require a note
              note: { widget: 'text', props: { label: 'Note', required: true } },
            },
          },
        },
      }
      expectTypeOf(entry).not.toBeAny()
    })

    it('is not offered for a platform value', () => {
      // @ts-expect-error a date is a single value
      const date: Entry<Date> = { fields: {} }
      // @ts-expect-error a file is a single value
      const file: Entry<File> = { fields: {} }
      expectTypeOf(date).not.toBeAny()
      expectTypeOf(file).not.toBeAny()
    })

    it('is not offered for a read-only map or set', () => {
      // @ts-expect-error a read-only map is a single value
      const map: Entry<ReadonlyMap<string, number>> = { fields: {} }
      // @ts-expect-error a read-only set is a single value
      const set: Entry<ReadonlySet<string>> = { fields: {} }
      expectTypeOf(map).not.toBeAny()
      expectTypeOf(set).not.toBeAny()
    })

    it('is not offered for a value of unknown type or a branded primitive', () => {
      // @ts-expect-error nothing is known about the value
      const coerced: Entry<unknown> = { fields: {} }
      // @ts-expect-error a branded string is still a string
      const branded: Entry<string & { brand: 'CustomerId' }> = { fields: {} }
      expectTypeOf(coerced).not.toBeAny()
      expectTypeOf(branded).not.toBeAny()
    })

    it('is not offered for a value that may be a single value or an object', () => {
      // @ts-expect-error a date in the union is a single value
      const entry: Entry<Date | { day: number }> = { fields: {} }
      expectTypeOf(entry).not.toBeAny()
    })

    it('is not offered for an array', () => {
      // @ts-expect-error an array is a leaf or, later, an array entry
      const entry: Entry<string[]> = { fields: {} }
      expectTypeOf(entry).not.toBeAny()
    })
  })

  describe('array', () => {
    it('describes one item, how to make a new one and the labels of its controls', () => {
      const entry: Entry<Contact[]> = {
        item: {
          fields: { name: { widget: 'text', props: { label: 'Name' } } },
          layout: ['name'],
        },
        newItem: () => ({ name: '' }),
        addLabel: 'Add contact',
        removeLabel: (contact, index) => {
          expectTypeOf(contact).toEqualTypeOf<Contact>()
          expectTypeOf(index).toEqualTypeOf<number>()

          return `Remove ${contact.name || `contact ${index + 1}`}`
        },
        itemKey: (contact) => contact.name,
      }
      expectTypeOf(entry).not.toBeAny()
    })

    it('takes a fixed remove label', () => {
      expectTypeOf({ ...contactsEntry, removeLabel: 'Remove' }).toExtend<Entry<Contact[]>>()
    })

    it('needs a new item that is a whole item', () => {
      // @ts-expect-error a contact needs its name
      const entry: Entry<Contact[]> = { ...contactsEntry, newItem: () => ({ phone: '' }) }
      expectTypeOf(entry).not.toBeAny()
    })

    it('needs its labels', () => {
      const { addLabel: _unused, ...withoutAddLabel } = contactsEntry
      // @ts-expect-error the add control needs an accessible name
      const entry: Entry<Contact[]> = withoutAddLabel
      expectTypeOf(entry).not.toBeAny()
    })

    it('renders a list of single values with a leaf as its item', () => {
      const entry: Entry<string[]> = {
        item: { widget: 'text', props: { label: 'Tag' } },
        newItem: () => '',
        addLabel: 'Add tag',
        removeLabel: (tag) => `Remove ${tag}`,
      }
      expectTypeOf(entry).not.toBeAny()
    })

    it('takes no props without a registered array frame', () => {
      // @ts-expect-error without a frame the bare default renders the items
      const entry: Entry<Contact[]> = { ...contactsEntry, props: { isCompact: true } }
      expectTypeOf(entry).not.toBeAny()
    })

    it('takes the props of the registered array frame', () => {
      const entry: FramedEntry<Contact[]> = { ...contactsEntry, props: { isCompact: true } }
      const unknownProp: FramedEntry<Contact[]> = {
        ...contactsEntry,
        // @ts-expect-error the frame declares `isCompact` only
        props: { isWide: true },
      }
      expectTypeOf(entry).not.toBeAny()
      expectTypeOf(unknownProp).not.toBeAny()
    })

    it('leaves the mode to the renderer', () => {
      // @ts-expect-error the renderer sets the array mode
      const entry: Entry<Contact[]> = { ...contactsEntry, mode: 'array' }
      expectTypeOf(entry).not.toBeAny()
    })

    it('is not offered for a value that is not an array', () => {
      const entry: Entry<string> = {
        // @ts-expect-error an item describes the items of an array
        item: { widget: 'text', props: { label: 'Name' } },
        newItem: () => '',
        addLabel: 'Add',
        removeLabel: 'Remove',
      }
      expectTypeOf(entry).not.toBeAny()
    })

    it('is not offered for a tuple, whose length is fixed', () => {
      const entry: Entry<[string, string]> = {
        // @ts-expect-error an item describes the items of an array
        item: { widget: 'text', props: { label: 'Part' } },
        newItem: () => '',
        addLabel: 'Add',
        removeLabel: 'Remove',
      }
      expectTypeOf(entry).not.toBeAny()
    })

    it('is exclusive with a leaf', () => {
      const entry: Entry<string[]> = {
        widget: 'tags',
        props: { label: 'Tags' },
        // @ts-expect-error an entry has one shape
        item: { widget: 'text', props: { label: 'Tag' } },
        newItem: () => '',
        addLabel: 'Add tag',
        removeLabel: 'Remove',
      }
      expectTypeOf(entry).not.toBeAny()
    })
  })

  describe('leaf', () => {
    it('renders a platform value and an array with a widget', () => {
      expectTypeOf({ widget: 'date', props: { label: 'Birthday' } } as const).toExtend<
        Entry<Date>
      >()
      expectTypeOf({ widget: 'tags', props: { label: 'Tags' } } as const).toExtend<
        Entry<string[]>
      >()
    })
  })

  describe('custom', () => {
    it('hands render the field of the value type', () => {
      const entry: Entry<string> = {
        render: (field) => {
          expectTypeOf(field).toEqualTypeOf<FieldApiOf<string>>()

          return field.state.value
        },
      }
      expectTypeOf(entry).not.toBeAny()
    })

    it('is offered for an object', () => {
      expectTypeOf<{
        render: (field: FieldApiOf<Values['address']>) => ReactNode
      }>().toExtend<Entry<Values['address']>>()
    })
  })

  describe('one shape', () => {
    it('rejects a widget next to render', () => {
      // @ts-expect-error an entry has one shape
      const entry: Entry<string> = {
        widget: 'text',
        props: { label: 'Email' },
        render: () => null,
      }
      expectTypeOf(entry).not.toBeAny()
    })

    it('rejects fields next to a widget', () => {
      // @ts-expect-error an entry has one shape
      const entry: Entry<Values['address']> = { widget: 'text', fields: {} }
      expectTypeOf(entry).not.toBeAny()
    })

    it('rejects fields next to render', () => {
      // @ts-expect-error an entry has one shape
      const entry: Entry<Values['address']> = { fields: {}, render: () => null }
      expectTypeOf(entry).not.toBeAny()
    })

    it('rejects an entry without a shape', () => {
      // @ts-expect-error an entry names its shape
      const entry: Entry<string> = { visibleWhen: () => true }
      expectTypeOf(entry).not.toBeAny()
    })
  })

  describe('shared options', () => {
    it('are taken by every shape', () => {
      const entry: Entry<Values> = {
        visibleWhen: (values) => values.email !== '',
        fields: {
          email: {
            widget: 'text',
            props: { label: 'Email' },
            validators: { onBlur: z.email() },
          },
          birthday: { render: () => null, dependsOn: ['email'] },
        },
      }
      expectTypeOf(entry).not.toBeAny()
    })
  })

  it('reads the data type of a real schema', () => {
    const schema = z.object({
      email: z.email(),
      address: z.object({ zip: z.string() }).optional(),
      birthday: z.date(),
      tags: z.array(z.string()),
    })
    type Data = InferData<typeof schema>

    const entry: FieldEntry<Parts, Data, Data> = {
      fields: {
        email: { widget: 'text', props: { label: 'Email', required: true } },
        address: { fields: { zip: { widget: 'text', props: { label: 'Postal code' } } } },
        birthday: { widget: 'date', props: { label: 'Birthday' } },
        tags: { widget: 'tags', props: { label: 'Tags' } },
      },
    }
    expectTypeOf(entry).not.toBeAny()
  })
})
