import type { StandardSchemaV1 } from '@tanstack/react-form'
import type { ComponentPropsWithRef } from 'react'

import type { FormOptionsOf } from './form-options'
import type { InferData } from './infer-data'

/** What the `<form>` element of a form component takes from its props. */
export type FormElementProps = Omit<
  ComponentPropsWithRef<'form'>,
  'onSubmit' | 'action' | 'children' | 'dangerouslySetInnerHTML'
>

/**
 * The props of a form component built from a config: the form's TanStack options again, for values
 * only known while rendering, and what a `<form>` element takes besides submitting and content.
 * `ref` reaches the `<form>` element.
 *
 * @typeParam TSchema - The Standard Schema of the form; its input type is the form's data type.
 *
 * @example
 * ```tsx
 * const EditProfile = ({ profile }: { profile: Profile }) => {
 *   const save = useSaveProfile()
 *
 *   return (
 *     <ProfileForm
 *       className="max-w-prose"
 *       options={{ defaultValues: profile, onSubmit: ({ value }) => save.mutateAsync(value) }}
 *     />
 *   )
 * }
 * ```
 */
export type FormProps<TSchema extends StandardSchemaV1> = FormElementProps & {
  /**
   * The form's TanStack options for this instance, such as default values from a hook or a submit
   * handler that calls a mutation. They take precedence over the config's, except `validators` and
   * `listeners`, of which both run, the config's first; a key set to `undefined`, such as data still
   * loading, keeps the config's value.
   *
   * @defaultValue none; the config's options apply
   */
  options?: FormOptionsOf<InferData<TSchema>> & {
    /** The values the form starts with; they take precedence over the config's. */
    defaultValues?: InferData<TSchema>
  }
}

type WithDefaultValues<TSchema extends StandardSchemaV1> = FormProps<TSchema> & {
  options: NonNullable<FormProps<TSchema>['options']> & {
    defaultValues: InferData<TSchema>
  }
}

/**
 * The props of the form built from `TConfig`: when the config leaves out `defaultValues`, the
 * instance has to pass them in `options`.
 */
export type FormPropsFor<TSchema extends StandardSchemaV1, TConfig> = TConfig extends {
  defaultValues: infer TDefaultValues
}
  ? undefined extends TDefaultValues
    ? WithDefaultValues<TSchema>
    : FormProps<TSchema>
  : WithDefaultValues<TSchema>
