import { createRegistry, type FieldOf, type RowProps } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import type { ReactNode } from 'react'

const { fieldContext, formContext } = createFormHookContexts()

const TextField = ({ field, label }: FieldOf<string> & { label: string }): ReactNode => (
  <label>
    {label}
    <input value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} />
  </label>
)

const NumberField = ({ field }: FieldOf<number>): ReactNode => field.state.value

const SubmitButton = ({ label }: { label: string }): ReactNode => (
  <button type="submit">{label}</button>
)

const Row = ({ children }: RowProps): ReactNode => <div>{children}</div>

const registry = createRegistry({ fieldContext, formContext, widgets: { text: TextField } })
  .extendRegistry({ widgets: { number: NumberField }, formComponents: { SubmitButton } })
  .extendRegistry({ structure: { row: Row } })

// @ts-expect-error a widget named `text` is already registered
registry.extendRegistry({ widgets: { text: TextField } })

export const Profile = (): ReactNode => {
  const form = registry.formHook.useAppForm({ defaultValues: { name: '', age: 0 } })

  return (
    <form.AppForm>
      <form.AppField name="name">
        {(field) => <field.text field={field} label="Name" />}
      </form.AppField>
      <form.AppField name="age">{(field) => <field.number field={field} />}</form.AppField>
      {/* @ts-expect-error no widget named `date` is registered */}
      <form.AppField name="name">{(field) => <field.date field={field} />}</form.AppField>
      <form.SubmitButton label="Save" />
    </form.AppForm>
  )
}
