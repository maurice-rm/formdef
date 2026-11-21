import { createRegistry } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { describe, expect, it } from 'vitest'

import { defineDisplayKind } from './define-display-kind'
import { setting } from './setting'

const { fieldContext, formContext } = createFormHookContexts()
const registry = createRegistry({ fieldContext, formContext, widgets: {} })

describe('defineDisplayKind', () => {
  it('refuses a setting that follows an answer, since a display is fixed for the form', () => {
    expect(() =>
      defineDisplayKind(registry, {
        name: 'card',
        label: 'Card',
        appliesTo: 'section',
        settings: { title: setting.text({ label: 'Title', varies: true }) },
      }),
    ).toThrow("formdef: settings.title: a display kind's setting does not follow an answer.")
  })

  it('refuses options, which belong to the fields of a form', () => {
    expect(() =>
      defineDisplayKind(registry, {
        name: 'tabs',
        label: 'Tabs',
        appliesTo: 'section',
        settings: { tabs: setting.options({ label: 'Tabs' }) },
      }),
    ).toThrow("formdef: settings.tabs: a display kind's setting is no options setting.")
  })
})
