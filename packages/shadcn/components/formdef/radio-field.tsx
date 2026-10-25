import { type FieldOf, fieldParts } from '@formdef/core'
import type { ComponentProps } from 'react'

import { FieldNotes } from '@/components/formdef/field-notes'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from '@/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { blurLeaving } from '@/lib/formdef/blur-leaving'
import type { FieldLabels } from '@/lib/formdef/field-labels'
import { type Option, optionId } from '@/lib/formdef/options'

type Attrs = Pick<
  ComponentProps<typeof RadioGroup>,
  'className' | 'disabled' | 'readOnly' | 'required'
>

type RadioFieldProps = FieldOf<string> &
  Omit<FieldLabels, 'labelAside'> &
  Attrs & {
    options: Option[]
    variant?: 'list' | 'card' | undefined
  }

const LEGEND_SUFFIX = '-legend'
const DESCRIPTION_SUFFIX = '-description'
const TITLE_SUFFIX = '-title'

export const RadioField = ({
  field,
  label,
  description,
  options,
  variant = 'list',
  ...attrs
}: RadioFieldProps) => {
  const parts = fieldParts(field, { description })
  const { name: _carriedByTheForm, onBlur, ...group } = parts.control
  const legendId = `${group.id}${LEGEND_SUFFIX}`
  const value = field.state.value ?? ''

  const item = (option: Option) => {
    const id = optionId(group.id, option.value)
    const titleId = `${id}${TITLE_SUFFIX}`
    const hasDescription = option.description !== undefined && option.description !== ''
    const radio = (
      <RadioGroupItem
        id={id}
        value={option.value}
        disabled={option.disabled}
        aria-labelledby={variant === 'card' ? titleId : undefined}
        aria-invalid={group['aria-invalid']}
        aria-describedby={hasDescription ? `${id}${DESCRIPTION_SUFFIX}` : undefined}
      />
    )
    const text = (
      <FieldContent>
        {variant === 'card' ? (
          <FieldTitle id={titleId}>{option.label}</FieldTitle>
        ) : (
          <FieldLabel htmlFor={id}>{option.label}</FieldLabel>
        )}
        {hasDescription && (
          <FieldDescription id={`${id}${DESCRIPTION_SUFFIX}`}>
            {option.description}
          </FieldDescription>
        )}
      </FieldContent>
    )
    const row = (
      <Field
        key={option.value}
        orientation="horizontal"
        data-invalid={parts.isErrorDue}
        data-disabled={attrs.disabled === true || option.disabled === true}
      >
        {variant === 'card' ? text : radio}
        {variant === 'card' ? radio : text}
      </Field>
    )

    return variant === 'card' ? (
      <FieldLabel key={option.value} htmlFor={id}>
        {row}
      </FieldLabel>
    ) : (
      row
    )
  }

  return (
    <FieldSet>
      {label !== undefined && <FieldLegend id={legendId}>{label}</FieldLegend>}
      <RadioGroup
        {...attrs}
        {...group}
        aria-labelledby={label === undefined ? undefined : legendId}
        onBlur={blurLeaving(onBlur)}
        value={value}
        onValueChange={(chosen) => field.handleChange(String(chosen ?? ''))}
      >
        {options.map(item)}
      </RadioGroup>
      <FieldNotes parts={parts} description={description} />
    </FieldSet>
  )
}
