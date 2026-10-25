import { type FieldOf, fieldParts } from '@formdef/core'
import type { ComponentProps } from 'react'

import { FieldNotes } from '@/components/formdef/field-notes'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import { blurLeaving } from '@/lib/formdef/blur-leaving'
import type { FieldLabels } from '@/lib/formdef/field-labels'
import { type Option, optionId } from '@/lib/formdef/options'

type Attrs = Pick<ComponentProps<typeof Checkbox>, 'className' | 'disabled' | 'readOnly'>

type CheckboxGroupFieldProps = FieldOf<string[]> &
  Omit<FieldLabels, 'labelAside'> &
  Attrs & {
    options: Option[]
  }

const LEGEND_SUFFIX = '-legend'
const DESCRIPTION_SUFFIX = '-description'

export const CheckboxGroupField = ({
  field,
  label,
  description,
  options,
  ...attrs
}: CheckboxGroupFieldProps) => {
  const parts = fieldParts(field, { description })
  const {
    name: _carriedByTheForm,
    onBlur,
    'aria-invalid': ariaInvalid,
    'aria-errormessage': ariaErrorMessage,
    ...group
  } = parts.control
  const legendId = `${group.id}${LEGEND_SUFFIX}`
  const values = field.state.value ?? []
  const toggle = (value: string, isChecked: boolean) =>
    field.handleChange(
      isChecked ? [...values, value] : values.filter((existing) => existing !== value),
    )

  return (
    <FieldSet
      {...group}
      aria-labelledby={label === undefined ? undefined : legendId}
      onBlur={blurLeaving(onBlur)}
    >
      {label !== undefined && <FieldLegend id={legendId}>{label}</FieldLegend>}
      <FieldGroup data-slot="checkbox-group">
        {options.map((option) => {
          const id = optionId(group.id, option.value)
          const descriptionId = `${id}${DESCRIPTION_SUFFIX}`
          const hasDescription = option.description !== undefined && option.description !== ''

          return (
            <Field
              key={option.value}
              orientation="horizontal"
              data-invalid={parts.isErrorDue}
              data-disabled={attrs.disabled === true || option.disabled === true}
            >
              <Checkbox
                {...attrs}
                id={id}
                disabled={attrs.disabled === true || option.disabled === true}
                aria-invalid={ariaInvalid}
                aria-errormessage={ariaErrorMessage}
                aria-describedby={hasDescription ? descriptionId : undefined}
                checked={values.includes(option.value)}
                onCheckedChange={(isChecked) => toggle(option.value, isChecked)}
              />
              <FieldContent>
                <FieldLabel htmlFor={id}>{option.label}</FieldLabel>
                {hasDescription && (
                  <FieldDescription id={descriptionId}>{option.description}</FieldDescription>
                )}
              </FieldContent>
            </Field>
          )
        })}
      </FieldGroup>
      <FieldNotes parts={parts} description={description} />
    </FieldSet>
  )
}
