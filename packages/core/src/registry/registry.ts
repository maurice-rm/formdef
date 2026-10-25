import type { createFormHook } from '@tanstack/react-form'
import type { ComponentProps, ComponentType } from 'react'

import type { ArrayFrameProps, BodyProps, RowProps, SectionProps } from '../config/structure'

// biome-ignore lint/suspicious/noExplicitAny: createFormHook constrains its maps to ComponentType<any>.
type AnyProps = any

/** A map of components by name, as widgets or form components are registered. */
export type Components = Record<string, ComponentType<AnyProps>>

/** The structure slots a registry can fill, each with what the renderer passes it. */
type SlotSupplied = {
  body: BodyProps
  section: SectionProps
  row: RowProps
  arrayFrame: ArrayFrameProps<AnyProps, AnyProps>
}

/** The structure slots a registry fills. */
export type Structure = { [Slot in keyof SlotSupplied]?: ComponentType<AnyProps> }

type UnknownSlot = 'formdef: the structure slots are body, section, row and arrayFrame'
type WrongSlotProps = 'formdef: this slot does not take the props the renderer passes it'
type DuplicateWidget = 'formdef: a widget with this name is already registered'
type DuplicateFormComponent = 'formdef: a form component with this name is already registered'
type DuplicateSlot = 'formdef: this structure slot is already filled'

// A slot may declare props of its own on top; those the renderer passes must accept its values.
type AcceptsSupplied<TComponent extends ComponentType<AnyProps>, TSupplied> =
  TSupplied extends Pick<
    ComponentProps<TComponent>,
    keyof TSupplied & keyof ComponentProps<TComponent>
  >
    ? TComponent
    : WrongSlotProps

/** Checks each slot of `TStructure` against what the renderer passes it. */
export type CheckedStructure<TStructure> = {
  [Slot in keyof TStructure]: Slot extends keyof SlotSupplied
    ? TStructure[Slot] extends ComponentType<AnyProps>
      ? AcceptsSupplied<TStructure[Slot], SlotSupplied[Slot]>
      : TStructure[Slot]
    : UnknownSlot
}

type Fresh<TExisting, TMessage extends string> = { [Name in keyof TExisting]?: TMessage }

/** Widgets an extension adds: none may take a name the registry already uses. */
export type NewWidgets<TWidgets> = Components & Fresh<TWidgets, DuplicateWidget>
/** Form components an extension adds: none may take a name the registry already uses. */
export type NewFormComponents<TFormComponents> = Components &
  Fresh<TFormComponents, DuplicateFormComponent>
/** Structure slots an extension fills: none the registry already fills. */
export type NewStructure<TStructure> = Structure & Fresh<TStructure, DuplicateSlot>

type FormHook<TWidgets extends Components, TFormComponents extends Components> = Omit<
  ReturnType<typeof createFormHook<TWidgets, TFormComponents>>,
  'extendForm'
>

/**
 * What {@link createRegistry} returns: TanStack's form hook for the registered widgets and form
 * components, and a way to extend the registry. Projects refer to it as `typeof registry`.
 *
 * @typeParam TWidgets - The registered widgets by name.
 * @typeParam TFormComponents - The registered form components by name.
 * @typeParam TStructure - The filled structure slots.
 *
 * @example
 * ```ts
 * export const registry = createRegistry({ fieldContext, formContext, widgets: { text: TextField } })
 *
 * type AppRegistry = typeof registry
 * ```
 */
export interface Registry<
  TWidgets extends Components,
  TFormComponents extends Components,
  TStructure extends Structure,
> {
  /**
   * TanStack's `createFormHook` result for this registry's widgets and form components, without
   * `extendForm`: `useAppForm`, `withForm`, `withFieldGroup` and `useTypedAppFormContext`.
   */
  formHook: FormHook<TWidgets, TFormComponents>
  /**
   * Returns a new registry with the widgets, form components and structure slots of this one and
   * of `extension`. A name this registry already uses is a compile error; this registry stays as it
   * is.
   *
   * @typeParam TNewWidgets - The widgets the extension adds.
   * @typeParam TNewFormComponents - The form components the extension adds.
   * @typeParam TNewStructure - The structure slots the extension fills.
   * @param extension - What the new registry holds on top of this one.
   * @param extension.widgets - The widgets to add by name.
   * @param extension.formComponents - The form components to add by name.
   * @param extension.structure - The structure slots to fill.
   * @defaultValue `extension.widgets`, `extension.formComponents` and `extension.structure`: none
   *   added.
   */
  extendRegistry: <
    const TNewWidgets extends NewWidgets<TWidgets> = Record<never, never>,
    const TNewFormComponents extends NewFormComponents<TFormComponents> = Record<never, never>,
    const TNewStructure extends NewStructure<TStructure> = Record<never, never>,
  >(extension: {
    widgets?: TNewWidgets
    formComponents?: TNewFormComponents
    structure?: TNewStructure & CheckedStructure<TNewStructure>
  }) => Registry<
    TWidgets & TNewWidgets,
    TFormComponents & TNewFormComponents,
    TStructure & TNewStructure
  >
}
