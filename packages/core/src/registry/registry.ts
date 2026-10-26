import type { createFormHook, StandardSchemaV1 } from '@tanstack/react-form'
import type { ComponentProps, ComponentType, Key, ReactNode } from 'react'

import type { ConfigParts } from '../config/config-parts'
import type { DescribedLayout } from '../config/described-layout'
import type { FormConfigOf } from '../config/form-config-of'
import type { FormPropsFor } from '../config/form-props'
import type { InferData } from '../config/infer-data'
import type { KnownKeys } from '../config/known-keys'
import type { LevelConfig } from '../config/level-config'
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

// A misspelled field name fails this constraint, so TypeScript reports it with a suggestion.
type NamedFields<TValues> = { fields: { [Key in keyof TValues]?: object } }

type LevelFieldsShape = { fields: object }

type OwnParts<TWidgets, TFormComponents, TStructure> = {
  widgets: TWidgets
  formComponents: TFormComponents
  structure: TStructure
}

/** What `Fields` renders into: a form from `useAppForm` or a field group from `withFieldGroup`. */
type FieldsForm = {
  AppField: unknown
  Subscribe: unknown
  state: { values: unknown }
}

type ValuesOf<TForm extends FieldsForm> = TForm['state']['values']

// An inline entry under `Fields` receives the form `Fields` was given.
type FieldsParts<TWidgets, TFormComponents, TStructure, TForm> = OwnParts<
  TWidgets,
  TFormComponents,
  TStructure
> & { handle: TForm }

/**
 * What {@link createRegistry} returns: TanStack's form hook for the registered widgets and form
 * components, a way to turn a form config into a form component, a way to render a config's
 * fields into a form or field group of one's own, and a way to extend the registry. Projects refer to it as `typeof registry`.
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
   * Turns a form config into a form component: TanStack's form with the config's options, a
   * `<form>` element that submits through it, and the config's fields rendered with this registry.
   * The config is typed by its schema; its root `layout` may name only keys `fields` describes. The
   * component takes `FormProps`, with `options.defaultValues` required when the config has none.
   *
   * @typeParam TSchema - The Standard Schema of the form, inferred from `schema`.
   * @typeParam TConfig - The config as written, inferred.
   * @typeParam TSubmitMeta - What `handleSubmit` takes besides the values, inferred from
   *   `onSubmitMeta`; none without it.
   * @param config - The form config.
   * @returns The form component.
   * @throws When rendered with default values in neither the config nor `options`, or with a
   *   widget, layout name or form component the registry does not know.
   *
   * @example
   * ```tsx
   * export const SignInForm = registry.createForm({
   *   schema,
   *   defaultValues: { email: '', password: '' },
   *   fields: {
   *     email: { widget: 'text', props: { label: 'Email' } },
   *     password: { widget: 'password', props: { label: 'Password' } },
   *   },
   *   layout: ['email', 'password', { component: 'SubmitButton', props: { label: 'Sign in' } }],
   *   onSubmit: ({ value }) => signIn(value),
   * })
   * ```
   */
  createForm: <
    TSchema extends StandardSchemaV1,
    // Constrained by the field names only, with the config type in the parameter: while TypeScript
    // infers it, the full config type as constraint makes `KnownKeys` walk every widget's props for
    // each `props` of the config.
    const TConfig extends NamedFields<InferData<TSchema>>,
    TSubmitMeta = never,
  >(
    config: TConfig &
      FormConfigOf<OwnParts<TWidgets, TFormComponents, TStructure>, TSchema, TSubmitMeta> & {
        schema: TSchema
        onSubmitMeta?: TSubmitMeta
      } & DescribedLayout<TConfig> &
      NoInfer<
        KnownKeys<
          TConfig,
          FormConfigOf<OwnParts<TWidgets, TFormComponents, TStructure>, TSchema, TSubmitMeta>
        >
      >,
  ) => (props: FormPropsFor<TSchema, TSubmitMeta, TConfig>) => ReactNode
  /**
   * Renders `fields` and `layout` into a form the caller built with `formHook.useAppForm`, or into a
   * field group from `formHook.withFieldGroup`, with this registry's widgets. The entries are typed
   * by the values of `form`; the `layout` may name only keys `fields` describes, and an inline
   * entry receives `form` itself. `fields` and `layout` are those of a form config.
   *
   * @typeParam TForm - The form or field group, inferred from `form`.
   * @typeParam TLevel - The `fields` and `layout` as written, inferred.
   * @param props - The form to render into, and the `fields` and `layout` to render.
   * @returns The rendered entries.
   * @throws When rendered with a widget, layout name or form component the registry does not know.
   *
   * @example
   * ```tsx
   * const Checkout = () => {
   *   const form = registry.formHook.useAppForm({ defaultValues, onSubmit: ({ value }) => pay(value) })
   *
   *   return (
   *     <form.AppForm>
   *       <form onSubmit={(event) => { event.preventDefault(); void form.handleSubmit() }}>
   *         <registry.Fields form={form} fields={contactFields} />
   *         <PaymentStep form={form} />
   *       </form>
   *     </form.AppForm>
   *   )
   * }
   * ```
   */
  Fields: <
    TForm extends FieldsForm,
    // Constrained only to hold `fields`, with the level type in the parameter, for the cost
    // `TConfig` of `createForm` avoids. Constrained by its field names as `TConfig` is, TypeScript
    // 5.4 loses the parameter type of a callback such as `visibleWhen`, since the names come from
    // `form` in the same props.
    const TLevel extends LevelFieldsShape,
  >(
    props: TLevel &
      LevelConfig<FieldsParts<TWidgets, TFormComponents, TStructure, TForm>, ValuesOf<TForm>> & {
        /** The form from `formHook.useAppForm`, or the field group from `formHook.withFieldGroup`. */
        form: TForm
      } & DescribedLayout<TLevel> &
      NoInfer<
        KnownKeys<
          TLevel,
          LevelConfig<
            FieldsParts<TWidgets, TFormComponents, TStructure, TForm>,
            ValuesOf<TForm>
          > & {
            form: TForm
            key?: Key | null | undefined
          }
        >
      >,
  ) => ReactNode
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

/** Any registry, whatever it holds. */
export type AnyRegistry = Registry<AnyProps, AnyProps, AnyProps>

/**
 * Takes `TRegistry` apart into the parts the config types read; `THandle` is what an inline entry
 * receives.
 */
export type PartsOf<TRegistry extends AnyRegistry, THandle> =
  TRegistry extends Registry<infer TWidgets, infer TFormComponents, infer TStructure>
    ? ConfigParts & {
        widgets: TWidgets
        formComponents: TFormComponents
        structure: TStructure
        handle: THandle
      }
    : never
