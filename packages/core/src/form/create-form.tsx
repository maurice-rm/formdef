import { type ComponentType, type ReactNode, type SubmitEvent, useRef } from 'react'

import type { FormElementProps } from '../config/form-props'
import type { BodyProps, StepperProps } from '../config/structure'
import { Fields, type FieldsProps } from '../render/fields'
import { warnOnce } from '../render/warn-once'
import { findRequiredPaths } from './find-required-paths'
import { formOptionsFor } from './form-options-for'
import { rootStepsOf } from './root-steps'
import { type StepForm, SteppedForm } from './stepped-form'

type Options = Readonly<Record<string, unknown>>

/** The form `useAppForm` returns, as far as the shell uses it. */
type ShellForm = StepForm & {
  AppForm: ComponentType<{ children?: ReactNode }>
}

/** What a registry binds a form to: its form hook and the maps the renderer looks names up in. */
export type FormBinding = {
  useAppForm: (options: Options) => ShellForm
  parts: FieldsProps['parts'] & {
    structure: { body?: ComponentType<BodyProps>; stepper?: ComponentType<StepperProps> }
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
  stepper?: unknown
}

type ConfiguredFormProps = FormComponentProps & {
  binding: FormBinding
  config: ConfigInput
  requiredPaths: ReadonlySet<string>
}

const stepperPropsOf = ({ stepper }: ConfigInput): Options | undefined => {
  const props =
    typeof stepper === 'object' && stepper !== null && 'props' in stepper
      ? stepper.props
      : undefined
  return typeof props === 'object' && props !== null ? (props as Options) : undefined
}

const MISSING_DEFAULT_VALUES =
  'formdef: the form has no default values; set defaultValues in its config or in its options.'

const ConfiguredForm = ({
  binding,
  config,
  requiredPaths,
  options,
  ...formProps
}: ConfiguredFormProps): ReactNode => {
  const formOptions = formOptionsFor({ config, options })
  if (formOptions.defaultValues === undefined) {
    throw new Error(MISSING_DEFAULT_VALUES)
  }

  const form = binding.useAppForm(formOptions)
  const submitStep = useRef<(() => void) | undefined>(undefined)
  const fields = (config.fields ?? {}) as FieldsProps['fields']
  const steps = rootStepsOf(config.layout, fields)
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>): void => {
    event.preventDefault()
    event.stopPropagation()
    if (submitStep.current === undefined) {
      void form.handleSubmit()
      return
    }
    submitStep.current()
  }

  return (
    <form.AppForm>
      <form noValidate {...formProps} onSubmit={handleSubmit}>
        {steps === undefined ? (
          <PlainContent
            parts={binding.parts}
            form={form}
            fields={fields}
            layout={config.layout as FieldsProps['layout']}
            requiredPaths={requiredPaths}
          />
        ) : (
          <SteppedForm
            parts={binding.parts}
            form={form}
            fields={fields}
            steps={steps}
            requiredPaths={requiredPaths}
            submitStep={submitStep}
            stepperProps={stepperPropsOf(config)}
          />
        )}
      </form>
    </form.AppForm>
  )
}

const PlainContent = ({
  parts,
  ...level
}: FieldsProps & { parts: FormBinding['parts'] }): ReactNode => {
  const Body = parts.structure.body
  const content = <Fields parts={parts} {...level} />

  return Body === undefined ? content : <Body>{content}</Body>
}

const isAsyncValidation = (validation: unknown): boolean =>
  typeof validation === 'object' && validation !== null && 'async' in validation
    ? validation.async === true
    : false

const requiredPathsOf = (binding: FormBinding, config: ConfigInput): ReadonlySet<string> => {
  const result = findRequiredPaths({
    schema: config.schema,
    validatesAsync: isAsyncValidation(config.validation),
    fields: (config.fields ?? {}) as Readonly<Record<string, object>>,
    widgets: binding.parts.widgets,
  })
  if ('problem' in result) {
    warnOnce(config, result.problem)

    return new Set()
  }

  return result.paths
}

/**
 * Turns a form config into a form component bound to `binding`: TanStack's form with the merged
 * options, a `<form>` element that submits through it, the registered body and the config's fields.
 * When it first renders, it finds the config's required fields once.
 */
export function createForm(
  binding: FormBinding,
  config: ConfigInput,
): (props: FormComponentProps) => ReactNode {
  let requiredPaths: ReadonlySet<string> | undefined

  return (props: FormComponentProps): ReactNode => {
    requiredPaths ??= requiredPathsOf(binding, config)

    return (
      <ConfiguredForm {...props} binding={binding} config={config} requiredPaths={requiredPaths} />
    )
  }
}
