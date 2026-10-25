import { type AnyFieldApi, type AnyFormApi, createFormHook } from '@tanstack/react-form'
import type { Context } from 'react'

import { createForm, type FormBinding } from '../form/create-form'

import type {
  CheckedStructure,
  Components,
  NewFormComponents,
  NewStructure,
  NewWidgets,
  Registry,
  Structure,
} from './registry'

type Contexts = {
  fieldContext: Context<AnyFieldApi>
  formContext: Context<AnyFormApi>
}

type RegistryParts<TWidgets, TFormComponents, TStructure> = Contexts & {
  widgets: TWidgets
  formComponents: TFormComponents
  structure: TStructure
}

function buildRegistry<
  TWidgets extends Components,
  TFormComponents extends Components,
  TStructure extends Structure,
>(
  parts: RegistryParts<TWidgets, TFormComponents, TStructure>,
): Registry<TWidgets, TFormComponents, TStructure> {
  const { extendForm: _replacedByExtendRegistry, ...formHook } = createFormHook({
    fieldContext: parts.fieldContext,
    formContext: parts.formContext,
    fieldComponents: parts.widgets,
    formComponents: parts.formComponents,
  })

  function extendRegistry<
    const TNewWidgets extends NewWidgets<TWidgets> = Record<never, never>,
    const TNewFormComponents extends NewFormComponents<TFormComponents> = Record<never, never>,
    const TNewStructure extends NewStructure<TStructure> = Record<never, never>,
  >(extension: {
    widgets?: TNewWidgets
    formComponents?: TNewFormComponents
    structure?: TNewStructure & CheckedStructure<TNewStructure>
  }): Registry<
    TWidgets & TNewWidgets,
    TFormComponents & TNewFormComponents,
    TStructure & TNewStructure
  > {
    const addedStructure: Structure = extension.structure ?? {}

    // The extension's maps are optional, and spreading an optional generic map drops its type.
    return buildRegistry({
      fieldContext: parts.fieldContext,
      formContext: parts.formContext,
      widgets: { ...parts.widgets, ...extension.widgets } as TWidgets & TNewWidgets,
      formComponents: { ...parts.formComponents, ...extension.formComponents } as TFormComponents &
        TNewFormComponents,
      structure: { ...parts.structure, ...addedStructure } as TStructure & TNewStructure,
    })
  }

  // TanStack's hook is generic over the form's types; the config's types are checked at the
  // registry's `createForm`, so the binding passes the merged options on untyped.
  const binding: FormBinding = {
    useAppForm: formHook.useAppForm as unknown as FormBinding['useAppForm'],
    parts: {
      widgets: parts.widgets,
      formComponents: parts.formComponents,
      structure: parts.structure,
    },
  }

  return {
    formHook,
    createForm: (config) => createForm(binding, config),
    extendRegistry,
  }
}

/**
 * Binds widgets, form components and structure slots to the app's TanStack contexts and returns a
 * registry, the value every form of the app is built with.
 *
 * Create the contexts with TanStack's `createFormHookContexts()` in a module of their own, so a
 * form component can read the form through `useFormContext()` without importing the registry.
 *
 * @typeParam TWidgets - The widgets by name; each takes its field as a prop typed `FieldOf<V>`.
 * @typeParam TFormComponents - The form components by name, placed in a layout by `{ component }`.
 * @typeParam TStructure - The structure slots: `body`, `section`, `row` and `arrayFrame`.
 * @param config - The contexts and what the registry holds.
 * @param config.fieldContext - The field context from `createFormHookContexts()`.
 * @param config.formContext - The form context from `createFormHookContexts()`.
 * @param config.widgets - The widgets by name.
 * @param config.formComponents - The form components by name.
 * @param config.structure - The components that render the structure slots.
 * @defaultValue `config.formComponents` and `config.structure`: none registered.
 * @returns The registry.
 *
 * @example
 * ```tsx
 * 'use client'
 * import { createRegistry } from '@formdef/core'
 * import { fieldContext, formContext } from './context'
 *
 * export const registry = createRegistry({
 *   fieldContext,
 *   formContext,
 *   widgets: { text: TextField, checkbox: CheckboxField },
 *   formComponents: { SubmitButton },
 *   structure: { section: Section },
 * })
 * ```
 */
export function createRegistry<
  const TWidgets extends Components,
  const TFormComponents extends Components = Record<never, never>,
  const TStructure extends Structure = Record<never, never>,
>(
  config: Contexts & {
    widgets: TWidgets
    formComponents?: TFormComponents
    structure?: TStructure & CheckedStructure<TStructure>
  },
): Registry<TWidgets, TFormComponents, TStructure> {
  // Both maps fall back to their empty defaults exactly when they are left out.
  return buildRegistry({
    fieldContext: config.fieldContext,
    formContext: config.formContext,
    widgets: config.widgets,
    formComponents: config.formComponents ?? ({} as TFormComponents),
    structure: config.structure ?? ({} as TStructure),
  })
}
