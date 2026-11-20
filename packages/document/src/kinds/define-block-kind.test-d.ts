import { createRegistry } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import type { ReactNode } from 'react'
import { describe, expectTypeOf, it } from 'vitest'

import { defineBlockKind } from './define-block-kind'
import { setting } from './setting'

const Notice = (_: { tone?: 'info' | 'warning'; children: string }) => null
const Divider = (_: { spacing?: number }) => null
const Callout = (_: { children: ReactNode }) => null

const { fieldContext, formContext } = createFormHookContexts()
const registry = createRegistry({
  fieldContext,
  formContext,
  widgets: {},
  formComponents: { notice: Notice, divider: Divider, callout: Callout },
})

describe('defineBlockKind', () => {
  it("passes the settings to props, which the component's props check", () => {
    defineBlockKind(registry, {
      name: 'notice',
      label: 'Notice',
      component: 'notice',
      settings: { body: setting.text({ label: 'Text', required: true }) },
      props: (settings) => {
        expectTypeOf(settings).toEqualTypeOf<{ body: string }>()
        return { children: settings.body }
      },
    })
  })

  it('passes a formatted text setting to props as a node', () => {
    defineBlockKind(registry, {
      name: 'callout',
      label: 'Callout',
      component: 'callout',
      settings: { body: setting.text({ label: 'Text', required: true, formatted: true }) },
      props: (settings) => {
        expectTypeOf(settings).toEqualTypeOf<{ body: ReactNode }>()
        return { children: settings.body }
      },
    })
  })

  it('rejects a formatted text setting for a component that takes a string', () => {
    defineBlockKind(registry, {
      name: 'notice',
      label: 'Notice',
      component: 'notice',
      settings: { body: setting.text({ label: 'Text', required: true, formatted: true }) },
      // @ts-expect-error the notice takes a string, the setting gives a node
      props: ({ body }) => ({ children: body }),
    })
  })

  it('rejects a component the registry does not hold', () => {
    defineBlockKind(registry, {
      name: 'image',
      label: 'Image',
      // @ts-expect-error there is no form component `image`
      component: 'image',
    })
  })

  it('requires props when the component needs one', () => {
    // @ts-expect-error the notice needs `children`
    defineBlockKind(registry, { name: 'notice', label: 'Notice', component: 'notice' })
  })

  it('takes no props for a component that needs none', () => {
    defineBlockKind(registry, { name: 'divider', label: 'Divider', component: 'divider' })
  })

  it('rejects props the component does not take', () => {
    defineBlockKind(registry, {
      name: 'notice',
      label: 'Notice',
      component: 'notice',
      // @ts-expect-error `tone` is 'info' or 'warning'
      props: () => ({ children: 'x', tone: 'loud' }),
    })
  })
})
