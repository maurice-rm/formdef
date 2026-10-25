import type { ComponentType, FormEvent, ReactNode } from 'react'

import type { FormElementProps } from '../config/form-props'
import type { BodyProps } from '../config/structure'
import { Fields, type FieldsProps } from '../render/fields'
import type { RenderForm } from '../render/render-form'
import { formOptionsFor } from './form-options-for'

type Options = Readonly<Record<string, unknown>>

/** The form `useAppForm` returns, as far as the shell uses it. */
type ShellForm = RenderForm & {
  AppForm: ComponentType<{ children?: ReactNode }>
  handleSubmit: () => Promise<void>
}

/** What a registry binds a form to: its form hook and the maps the renderer looks names up in. */
export type FormBinding = {
  useAppForm: (options: Options) => ShellForm
  parts: FieldsProps['parts'] & {
    structure: { body?: ComponentType<BodyProps> }
  }
}

/** The props of a form component: the instance's options and what a `<form>` element takes. */
type FormComponentProps = FormElementProps & {
  options?: Options
}

/** A form config: TanStack's form options plus formdef's own keys. */
type ConfigInput = Options & {
  fields?: unknown
  layout?: unknown
}

type ConfiguredFormProps = FormComponentProps & {
  binding: FormBinding
  config: ConfigInput
}

const MISSING_DEFAULT_VALUES =
  'formdef: the form has no default values; set defaultValues in its config or in its options.'

const ConfiguredForm = ({
  binding,
  config,
  options,
  ...formProps
}: ConfiguredFormProps): ReactNode => {
  const formOptions = formOptionsFor({ config, options })
  if (formOptions.defaultValues === undefined) {
    throw new Error(MISSING_DEFAULT_VALUES)
  }

  const form = binding.useAppForm(formOptions)
  const Body = binding.parts.structure.body
  const content = (
    <Fields
      parts={binding.parts}
      form={form}
      fields={config.fields as FieldsProps['fields']}
      layout={config.layout as FieldsProps['layout']}
    />
  )
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    event.stopPropagation()
    void form.handleSubmit()
  }

  return (
    <form.AppForm>
      <form noValidate {...formProps} onSubmit={handleSubmit}>
        {Body === undefined ? content : <Body>{content}</Body>}
      </form>
    </form.AppForm>
  )
}

/**
 * Turns a form config into a form component bound to `binding`: TanStack's form with the merged
 * options, a `<form>` element that submits through it, the registered body and the config's fields.
 */
export function createForm(
  binding: FormBinding,
  config: ConfigInput,
): (props: FormComponentProps) => ReactNode {
  // biome-ignore lint/correctness/noComponentHookFactories: runs once per form at module level, like TanStack's createFormHook.
  const Form = (props: FormComponentProps): ReactNode => (
    <ConfiguredForm {...props} binding={binding} config={config} />
  )

  return Form
}
