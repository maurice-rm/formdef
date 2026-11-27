import { type AnyFieldApi, type AnyFormApi, useForm } from '@tanstack/react-form'
import { render } from '@testing-library/react'
import type { ComponentType, ReactNode } from 'react'

type MountOptions = {
  /** The options of the form; `defaultValues` defaults to an empty `email`. */
  formOptions?: Readonly<Record<string, unknown>>
  /** The path of the field. */
  name?: string
  /** The validators of the field. */
  fieldValidators?: readonly unknown[] | undefined
}

type Mounted = { form: AnyFormApi; field: () => AnyFieldApi }

type ProbeProps = Required<Pick<MountOptions, 'formOptions' | 'name'>> &
  Pick<MountOptions, 'fieldValidators'> & {
    onMount: (form: AnyFormApi, field: AnyFieldApi) => void
  }

// The probe's field takes any path and any validators; TanStack types both by the form's values.
type UntypedField = ComponentType<{
  name: string
  validators: readonly unknown[] | undefined
  children: (field: AnyFieldApi) => ReactNode
}>

const DEFAULT_FORM_OPTIONS = { defaultValues: { email: '' } }

const Probe = ({ formOptions, name, fieldValidators, onMount }: ProbeProps): ReactNode => {
  const form = useForm(formOptions as never)
  const Field = form.Field as unknown as UntypedField

  return (
    <Field name={name} validators={fieldValidators}>
      {(field) => {
        onMount(form, field)
        return null
      }}
    </Field>
  )
}

/**
 * Renders a TanStack form with one field and hands both out; TanStack Form v2 creates its form and
 * fields through React only. The field is read anew on each call, as its view changes with the field.
 */
export function mountField({
  formOptions = DEFAULT_FORM_OPTIONS,
  name = 'email',
  fieldValidators,
}: MountOptions = {}): Mounted {
  const mounted: { form?: AnyFormApi; field?: AnyFieldApi } = {}
  render(
    <Probe
      formOptions={formOptions}
      name={name}
      fieldValidators={fieldValidators}
      onMount={(form, field) => {
        mounted.form = form
        mounted.field = field
      }}
    />,
  )

  return { form: mounted.form as AnyFormApi, field: () => mounted.field as AnyFieldApi }
}
