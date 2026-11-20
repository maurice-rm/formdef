import { createRegistry } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { describe, expectTypeOf, it } from 'vitest'

import { defineBlockKind } from './define-block-kind'
import { setting } from './setting'

const Notice = (_: { tone?: 'info' | 'warning'; children: string }) => null
const Divider = (_: { spacing?: number }) => null

const { fieldContext, formContext } = createFormHookContexts()
const registry = createRegistry({
  fieldContext,
  formContext,
  widgets: {},
  formComponents: { notice: Notice, divider: Divider },
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
