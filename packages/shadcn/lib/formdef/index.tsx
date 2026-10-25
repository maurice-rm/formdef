'use client'

import { createRegistry } from '@formdef/core'

import { FieldGroup } from '@/components/ui/field'
import { fieldContext, formContext } from './context'

// This file is yours. Add each widget you fetch under `widgets`: the key is the name a field entry
// writes as `widget`, the value is the component. `formComponents` holds what a layout places by
// name, such as `{ component: 'SubmitButton' }`. `structure.body` wraps the fields inside every
// <form>; shadcn's FieldGroup brings the spacing and the container query its form blocks use.
export const registry = createRegistry({
  fieldContext,
  formContext,
  widgets: {},
  formComponents: {},
  structure: { body: FieldGroup },
})

export const { createForm, Fields, formHook } = registry
