import { type FieldOf, fieldParts, type InferData } from '@formdef/core'
import { createFormHook, createFormHookContexts } from '@tanstack/react-form'
import type { ReactNode } from 'react'
import { z } from 'zod'

const { fieldContext, formContext } = createFormHookContexts()
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {},
  formComponents: {},
})

const TextWidget = ({ field }: FieldOf<string>): ReactNode => (
  <input
    {...fieldParts(field).control}
    value={field.state.value}
    onChange={(event) => field.handleChange(event.target.value)}
  />
)

const NumberWidget = ({ field }: FieldOf<number>): ReactNode => field.state.value

const schema = z.object({ email: z.email(), age: z.number() })
const defaultValues: InferData<typeof schema> = { email: '', age: 0 }

export const SignUp = (): ReactNode => {
  const form = useAppForm({ defaultValues, validators: { onChange: schema } })

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
