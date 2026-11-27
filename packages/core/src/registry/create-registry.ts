import {
  createFormHook,
  type ReactComponentTree,
  type ReactFormComponents,
} from '@tanstack/react-form'
import { createElement, type ReactNode } from 'react'

import { createForm, type FormBinding } from '../form/create-form'
import { Fields, type FieldsProps } from '../render/fields'

import type {
  CheckedStructure,
  CheckedWidgets,
  Components,
  FormHook,
  NewFormComponents,
  NewStructure,
  NewWidgets,
  Registry,
  Structure,
} from './registry'

type RegistryParts<TWidgets, TFormComponents, TStructure> = {
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
  // TanStack takes function components only; formdef's maps admit any component type.
  const formHook = createFormHook<ReactFormComponents, ReactComponentTree>({
    fieldComponents: parts.widgets as ReactComponentTree,
    formComponents: parts.formComponents as ReactFormComponents,
  }) as unknown as FormHook<TWidgets, TFormComponents>

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
    const addedWidgets: Components = extension.widgets ?? {}
    const addedStructure: Structure = extension.structure ?? {}

    // The extension's maps are optional, and spreading an optional generic map drops its type.
    return buildRegistry({
      widgets: { ...parts.widgets, ...addedWidgets } as TWidgets & TNewWidgets,
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

  // biome-ignore lint/correctness/noComponentHookFactories: created once per registry, like TanStack's createFormHook.
  const BoundFields = (props: Omit<FieldsProps, 'parts'>): ReactNode =>
    createElement(Fields, { ...props, parts: binding.parts })

  return {
    formHook,
    createForm: (config) => createForm(binding, config),
    // The member's signature types the level by the form it is given; the renderer reads it untyped.
    Fields: BoundFields as unknown as Registry<TWidgets, TFormComponents, TStructure>['Fields'],
    // The member's signature checks the widgets' empty values; the implementation merges any map.
    extendRegistry: extendRegistry as Registry<
      TWidgets,
      TFormComponents,
      TStructure
    >['extendRegistry'],
  }
}

/**
 * Binds widgets, form components and structure slots to TanStack's form hook and returns a
 * registry, the value every form of the app is built with.
 *
 * A form component reads its form through TanStack's `formComponent.create`, or through
 * `formContext.create(...).useFormContext()`, both from `getFormHookHelpers()`.
 *
 * @typeParam TWidgets - The widgets by name; each takes its field as a prop typed `FieldOf<V>`.
 * @typeParam TFormComponents - The form components by name, placed in a layout by `{ component }`.
 * @typeParam TStructure - The structure slots: `body`, `section`, `row`, `arrayFrame` and `stepper`.
 * @param config - What the registry holds.
 * @param config.widgets - The widgets by name. A widget's static `emptyValue`, the value it holds
 *   while nothing is entered, must be of the value type it serves.
 * @param config.formComponents - The form components by name.
 * @param config.structure - The components that render the structure slots.
 * @defaultValue `config.formComponents` and `config.structure`: none registered.
 * @returns The registry.
 *
 * @example
 * ```tsx
 * 'use client'
 * import { createRegistry } from '@formdef/core'
 *
 * export const registry = createRegistry({
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
>(config: {
  widgets: TWidgets & CheckedWidgets<TWidgets>
  formComponents?: TFormComponents
  structure?: TStructure & CheckedStructure<TStructure>
}): Registry<TWidgets, TFormComponents, TStructure> {
  // Both maps fall back to their empty defaults exactly when they are left out.
  return buildRegistry<TWidgets, TFormComponents, TStructure>({
    widgets: config.widgets,
    formComponents: config.formComponents ?? ({} as TFormComponents),
    structure: config.structure ?? ({} as TStructure),
  })
}
