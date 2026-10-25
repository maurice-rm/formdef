import type {
  FormAsyncValidateOrFn,
  FormOptions,
  FormValidateOrFn,
  StandardSchemaV1,
} from '@tanstack/react-form'

import type { LevelFields } from '../config/field-entry'
import type { FormHandle } from '../config/form-handle'
import type { InferData } from '../config/infer-data'
import type { LayoutEntry } from '../config/layout-entry'
import type { Validation } from '../config/validation'
import type { AnyRegistry, PartsOf } from './registry'

// biome-ignore lint/suspicious/noExplicitAny: the validator axes, which only the validators type.
type OpenValidator = any

type SyncValidator<TData> = FormValidateOrFn<TData> | undefined
type AsyncValidator<TData> = FormAsyncValidateOrFn<TData> | undefined

// TanStack reads its validator axes without distributing over a union, so axes typed for any
// validator turn the errors in every callback into `never`. They type the validators alone; every
// other option leaves them open, which types the errors loosely.
type TypedValidators<TData> = FormOptions<
  TData,
  SyncValidator<TData>,
  SyncValidator<TData>,
  AsyncValidator<TData>,
  SyncValidator<TData>,
  AsyncValidator<TData>,
  SyncValidator<TData>,
  AsyncValidator<TData>,
  SyncValidator<TData>,
  AsyncValidator<TData>,
  AsyncValidator<TData>,
  never
>['validators']

type TanStackFormOptions<TData, TSubmitMeta> = FormOptions<
  TData,
  OpenValidator,
  OpenValidator,
  OpenValidator,
  OpenValidator,
  OpenValidator,
  OpenValidator,
  OpenValidator,
  OpenValidator,
  OpenValidator,
  OpenValidator,
  TSubmitMeta
>

type FormParts<TRegistry extends AnyRegistry, TData, TSubmitMeta> = PartsOf<
  TRegistry,
  FormHandle<TData, TSubmitMeta>
>

/**
 * The config of a form: the schema, the default values, the `fields` and `layout` of the
 * root level, when the schema runs, and TanStack's form options, all typed by the schema's data
 * type and checked against the widgets, structure slots and form components of `TRegistry`.
 *
 * Every key that is not formdef's own is one of TanStack's form options and keeps TanStack's
 * meaning. The validation errors its callbacks see are typed loosely.
 *
 * @typeParam TRegistry - The registry the form is built with, as `typeof registry`.
 * @typeParam TSchema - The Standard Schema of the form; its input type is the form's data type.
 * @typeParam TSubmitMeta - What `handleSubmit` takes besides the values, as in TanStack's
 *   `onSubmitMeta`. Defaults to none.
 *
 * @example
 * ```ts
 * const signInConfig: FormConfig<typeof registry, typeof schema> = {
 *   schema,
 *   defaultValues: { email: '', password: '' },
 *   fields: {
 *     email: { widget: 'text', props: { label: 'Email' } },
 *     password: { widget: 'password', props: { label: 'Password' } },
 *   },
 *   layout: ['email', 'password', { component: 'SubmitButton', props: { label: 'Sign in' } }],
 *   onSubmit: ({ value }) => signIn(value),
 * }
 * ```
 */
export type FormConfig<
  TRegistry extends AnyRegistry,
  TSchema extends StandardSchemaV1,
  TSubmitMeta = never,
> = Omit<
  TanStackFormOptions<InferData<TSchema>, TSubmitMeta>,
  'defaultValues' | 'defaultState' | 'validators'
> & {
  /** The schema that validates the form; its input type is the form's data type. */
  schema: TSchema
  /**
   * The values the form starts with.
   *
   * @defaultValue none; the form's `options.defaultValues` supply them
   */
  defaultValues?: InferData<TSchema>
  /** The field entries of the root level. */
  fields: LevelFields<
    FormParts<TRegistry, InferData<TSchema>, TSubmitMeta>,
    InferData<TSchema>,
    InferData<TSchema>
  >
  /**
   * The order and grouping of the root level.
   *
   * @defaultValue the fields in the order `fields` declares them
   */
  layout?: LayoutEntry<
    FormParts<TRegistry, InferData<TSchema>, TSubmitMeta>,
    keyof InferData<TSchema> & string,
    InferData<TSchema>
  >[]
  /**
   * When the schema runs.
   *
   * @defaultValue `{ mode: 'revalidate' }`
   */
  validation?: Validation
  /**
   * TanStack's initial form state, without `values`: the start values come from `defaultValues`.
   *
   * @defaultValue none; TanStack's initial state
   */
  defaultState?: Omit<
    NonNullable<TanStackFormOptions<InferData<TSchema>, TSubmitMeta>['defaultState']>,
    'values'
  >
  /**
   * TanStack's form validators, typed by the data type, next to the schema.
   *
   * @defaultValue none; the schema validates alone
   */
  validators?: TypedValidators<InferData<TSchema>>
}
