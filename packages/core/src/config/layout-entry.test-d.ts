import type { ComponentType, ReactNode } from 'react'
import { describe, expectTypeOf, it } from 'vitest'

import type { LayoutEntry } from './layout-entry'

type Values = { email: string; password: string; address: { zip: string } }
type Names = 'email' | 'password'

type Structure = {
  section: ComponentType<{ label: string; children: ReactNode; description?: string }>
  row: ComponentType<{ children: ReactNode; gap: 'small' | 'large' }>
}

type Layout = LayoutEntry<{ structure: Structure }, Names, Values>
type BareLayout = LayoutEntry<{ structure: Record<never, never> }, Names, Values>

describe('LayoutEntry', () => {
  describe('name', () => {
    it('names a field this level describes', () => {
      expectTypeOf<'email'>().toExtend<Layout>()
    })

    it('rejects a key this level does not describe', () => {
      // @ts-expect-error `address` is not described in fields
      const entry: Layout = 'address'
      expectTypeOf(entry).not.toBeAny()
    })

    it('rejects a dotted path', () => {
      // @ts-expect-error a layout names keys of its own level, never paths
      const entry: Layout = 'address.zip'
      expectTypeOf(entry).not.toBeAny()
    })
  })

  describe('section', () => {
    it('groups entries under a title', () => {
      const entry: Layout = { section: 'Account', layout: ['email', 'password'] }
      expectTypeOf(entry).not.toBeAny()
    })

    it('takes the props of the registered section slot', () => {
      const entry: Layout = {
        section: 'Account',
        layout: ['email'],
        props: { description: 'Used to sign in' },
      }
      expectTypeOf(entry).not.toBeAny()
    })

    it('leaves the label and the children to the renderer', () => {
      const entry: Layout = {
        section: 'Account',
        layout: ['email'],
        // @ts-expect-error the renderer passes the section title as its label
        props: { label: 'Account' },
      }
      expectTypeOf(entry).not.toBeAny()
    })

    it('takes only a class name without a registered slot', () => {
      const bare: BareLayout = {
        section: 'Account',
        layout: ['email'],
        props: { className: 'grid' },
      }
      const unknownProp: BareLayout = {
        section: 'Account',
        layout: ['email'],
        // @ts-expect-error the bare fieldset takes a class name only
        props: { description: 'Used to sign in' },
      }
      expectTypeOf(bare).not.toBeAny()
      expectTypeOf(unknownProp).not.toBeAny()
    })

    it('takes the props of a slot registered under an optional key', () => {
      type OptionalStructure = { section?: Structure['section'] }

      const entry: LayoutEntry<{ structure: OptionalStructure }, Names, Values> = {
        section: 'Account',
        layout: ['email'],
        props: { description: 'Used to sign in' },
      }
      expectTypeOf(entry).not.toBeAny()
    })

    it('takes props as a function of the values', () => {
      const entry: Layout = {
        section: 'Account',
        layout: ['email'],
        props: (values) => {
          expectTypeOf(values).toEqualTypeOf<Values>()

          return { description: values.email }
        },
      }
      expectTypeOf(entry).not.toBeAny()
    })

    it('is visible by a condition on the values of the whole form', () => {
      const entry: Layout = {
        section: 'Delivery',
        layout: ['email'],
        visibleWhen: (values) => values.address.zip !== '',
        dependsOn: ['address.zip'],
      }
      expectTypeOf(entry).not.toBeAny()
    })

    it('rejects a name its level does not describe inside its layout', () => {
      // @ts-expect-error `address` is not described in fields
      const entry: Layout = { section: 'Account', layout: ['address'] }
      expectTypeOf(entry).not.toBeAny()
    })
  })

  describe('row', () => {
    it('places entries side by side with the props of the registered row slot', () => {
      const entry: Layout = { row: ['email', 'password'], props: { gap: 'small' } }
      expectTypeOf(entry).not.toBeAny()
    })

    it('requires props when the registered row slot does', () => {
      // @ts-expect-error the row slot needs its gap
      const entry: Layout = { row: ['email', 'password'] }
      expectTypeOf(entry).not.toBeAny()
    })

    it('nests sections and rows', () => {
      const entry: Layout = {
        section: 'Account',
        layout: [
          { row: ['email', { section: 'Secret', layout: ['password'] }], props: { gap: 'large' } },
        ],
      }
      expectTypeOf(entry).not.toBeAny()
    })
  })

  describe('one kind', () => {
    it('rejects a section that is also a row', () => {
      // @ts-expect-error a layout entry has one kind
      const entry: Layout = { section: 'Account', layout: ['email'], row: ['password'] }
      expectTypeOf(entry).not.toBeAny()
    })
  })
})
