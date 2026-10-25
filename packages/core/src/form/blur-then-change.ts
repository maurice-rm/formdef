import {
  defaultValidationLogic,
  type ValidationLogicFn,
  type ValidationLogicProps,
} from '@tanstack/react-form'

type ScheduledValidators = Parameters<ValidationLogicProps['runValidation']>[0]['validators']

// Gated on the form, not the changed field: the schema validates the whole form, and TanStack names
// the changed field only on the field-level call, where the schema does not sit.
const isSchemaDue = ({ event, form }: ValidationLogicProps): boolean => {
  if (event.type === 'blur' || event.type === 'submit') {
    return true
  }

  return event.type === 'change' && !form.state.isValid
}

/**
 * The validation logic of the `blurThenChange` mode: TanStack's default logic, plus the schema in
 * `onDynamic` when a field is left, on submit, and on every change while the form is invalid.
 */
export const blurThenChange: ValidationLogicFn = (props) => {
  let defaults: ScheduledValidators = []
  defaultValidationLogic({
    ...props,
    runValidation: ({ validators }) => {
      defaults = validators
    },
  })

  const schema = props.event.async ? props.validators?.onDynamicAsync : props.validators?.onDynamic
  if (schema === undefined || !isSchemaDue(props)) {
    return props.runValidation({ validators: defaults, form: props.form })
  }

  return props.runValidation({
    validators: [...defaults, { fn: schema, cause: 'dynamic' }],
    form: props.form,
  })
}
