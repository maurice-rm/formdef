import {
  type ArrayFrameProps,
  type FieldOf,
  type InferData,
  type SectionProps,
  useFieldParts,
} from '@formdef/core'
import { createFormHook } from '@tanstack/react-form'
import type { ReactNode } from 'react'
import { z } from 'zod'

const { useAppForm } = createFormHook({ fieldComponents: {}, formComponents: {} })

const TextWidget = ({ field }: FieldOf<string>): ReactNode => (
  <input
    {...useFieldParts(field).control}
    value={field.value}
    onChange={(event) => field.handleChange(event.target.value)}
  />
)

const NumberWidget = ({ field }: FieldOf<number>): ReactNode => field.value

const schema = z.object({ email: z.email(), age: z.number() })
const defaultValues: InferData<typeof schema> = { email: '', age: 0 }

export const SignUp = (): ReactNode => {
  const form = useAppForm({ defaultValues, validators: [{ run: schema, triggers: ['change'] }] })

  return (
    <>
      <form.Field name="email">{(field) => <TextWidget field={field} />}</form.Field>
      <form.Field name="age">
        {/* @ts-expect-error a number field does not fit a string widget */}
        {(field) => <TextWidget field={field} />}
      </form.Field>
      <form.Field name="age">{(field) => <NumberWidget field={field} />}</form.Field>
    </>
  )
}

export const Section = ({ label, children }: SectionProps): ReactNode => (
  <fieldset>
    <legend>{label}</legend>
    {children}
  </fieldset>
)

export const ContactsFrame = ({
  keys,
  renderItem,
  add,
  remove,
  addLabel,
  removeLabels,
}: ArrayFrameProps<{ name: string }>): ReactNode => (
  <ul>
    {keys.map((key, index) => (
      <li key={key}>
        {renderItem(index)}
        <button type="button" onClick={() => remove(index)}>
          {removeLabels[index]}
        </button>
      </li>
    ))}
    <button type="button" onClick={add}>
      {addLabel}
    </button>
  </ul>
)
