import type { StandardSchemaV1 } from '@tanstack/react-form'

import type { FormConfigOf } from '../config/form-config-of'
import type { AnyRegistry, PartsOf } from './registry'

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
> = FormConfigOf<Omit<PartsOf<TRegistry, never>, 'handle'>, TSchema, TSubmitMeta>
