import type { FieldOf } from '@formdef/core'
import { createFormHook, createFormHookContexts } from '@tanstack/react-form'
import type { ReactNode } from 'react'

const { fieldContext, formContext } = createFormHookContexts()
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {},
  formComponents: {},
})

const TextWidget = ({ field }: FieldOf<string>): ReactNode => (
  <input value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} />
)

const NumberWidget = ({ field }: FieldOf<number>): ReactNode => field.state.value

export const SignUp = (): ReactNode => {
  const form = useAppForm({ defaultValues: { email: '', age: 0 } })

  return (
    <>
      <form.AppField name="email">{(field) => <TextWidget field={field} />}</form.AppField>
      <form.AppField name="age">
        {/* @ts-expect-error a number field does not fit a string widget */}
        {(field) => <TextWidget field={field} />}
      </form.AppField>
      <form.AppField name="age">{(field) => <NumberWidget field={field} />}</form.AppField>
    </>
  )
}
