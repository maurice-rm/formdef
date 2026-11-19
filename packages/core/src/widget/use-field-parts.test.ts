import { FieldApi, FormApi } from '@tanstack/react-form'
import { act, renderHook } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'

import { StepSubmitted } from './step-submitted'
import { useFieldParts } from './use-field-parts'

const EMAIL_MESSAGE = 'Enter an email address'
const DESCRIPTION = 'We never share it'

// `useAppForm` types the submit meta of a form without `onSubmitMeta` as `unknown`; `new FormApi`
// would default it to `never`, which no widget's field type accepts.
const SUBMIT_META: unknown = undefined

function emailField() {
  const form = new FormApi({ defaultValues: { email: '' }, onSubmitMeta: SUBMIT_META })
  form.mount()
  const field = new FieldApi({
    form,
    name: 'email',
    validators: { onChange: () => EMAIL_MESSAGE, onBlur: () => EMAIL_MESSAGE },
  })
  field.mount()

  return field
}

describe('useFieldParts', () => {
  it('renders the error of a field that was left before without an edit once the form is submitted', async () => {
    const field = emailField()
    const { result } = renderHook(() => useFieldParts(field))
    act(() => field.handleBlur())

    expect(result.current.isErrorDue).toBe(false)

    await act(() => field.form.handleSubmit())

    expect(result.current.isErrorDue).toBe(true)
    expect(result.current.control['aria-invalid']).toBe(true)
    expect(result.current.errors).toEqual([EMAIL_MESSAGE])
  })

  it('renders the error of a field once the step it is shown in was submitted', () => {
    const field = emailField()
    act(() => field.handleChange('ada'))
    const outsideStep = renderHook(() => useFieldParts(field))
    const insideSubmittedStep = renderHook(() => useFieldParts(field), {
      wrapper: ({ children }) => createElement(StepSubmitted, { value: true }, children),
    })

    expect(outsideStep.result.current.isErrorDue).toBe(false)
    expect(insideSubmittedStep.result.current.isErrorDue).toBe(true)
  })

  it('ties the control to the description it is given', () => {
    const { result } = renderHook(() => useFieldParts(emailField(), { description: DESCRIPTION }))

    expect(result.current.control['aria-describedby']).toBe(result.current.descriptionId)
  })
})
