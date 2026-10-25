import type { StandardSchemaV1 } from '@tanstack/react-form'

import type { LevelFields } from '../config/field-entry'
import type { FormHandle } from '../config/form-handle'
import type { FormOptionsOf } from '../config/form-options'
import type { InferData } from '../config/infer-data'
import type { LayoutEntry } from '../config/layout-entry'
import type { Validation } from '../config/validation'
import type { AnyRegistry, PartsOf } from './registry'

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
 * Check a config with `satisfies` rather than a type annotation: an annotation hides which
 * optional keys the config sets, such as `defaultValues`.
 *
 * @typeParam TRegistry - The registry the form is built with, as `typeof registry`.
 * @typeParam TSchema - The Standard Schema of the form; its input type is the form's data type.
 * @typeParam TSubmitMeta - What `handleSubmit` takes besides the values, as in TanStack's
 *   `onSubmitMeta`. Defaults to none.
 *
 * @example
 * ```ts
 * const signInConfig = {
 *   schema,
 *   defaultValues: { email: '', password: '' },
 *   fields: {
 *     email: { widget: 'text', props: { label: 'Email' } },
 *     password: { widget: 'password', props: { label: 'Password' } },
 *   },
 *   layout: ['email', 'password', { component: 'SubmitButton', props: { label: 'Sign in' } }],
 *   onSubmit: ({ value }) => signIn(value),
 * } satisfies FormConfig<typeof registry, typeof schema>
 * ```
 */
export type FormConfig<
  TRegistry extends AnyRegistry,
  TSchema extends StandardSchemaV1,
  TSubmitMeta = never,
> = FormOptionsOf<InferData<TSchema>, TSubmitMeta> & {
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
}
