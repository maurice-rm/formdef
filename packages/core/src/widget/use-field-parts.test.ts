import type { AnyFieldApi } from '@tanstack/react-form'
import { act, cleanup, renderHook } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { mountField } from './mount-field.test-support'
import { StepSubmitted } from './step-submitted'
import { useFieldParts } from './use-field-parts'

const EMAIL_MESSAGE = 'Enter an email address'
const DESCRIPTION = 'We never share it'

const emailField = (): AnyFieldApi =>
  mountField({
    fieldValidators: [{ run: () => EMAIL_MESSAGE, triggers: ['change', 'blur'] }],
  }).field()

afterEach(cleanup)

describe('useFieldParts', () => {
  it('renders the error of a field that was left before without an edit once the form is submitted', async () => {
    const field = emailField()
    const { result } = renderHook(() => useFieldParts(field))
    act(() => field.handleBlur())

    expect(result.current.isErrorDue).toBe(false)

    await act(async () => {
      await field.form.handleSubmit()
    })

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
    const field = emailField()
    const { result } = renderHook(() => useFieldParts(field, { description: DESCRIPTION }))

    expect(result.current.control['aria-describedby']).toBe(result.current.descriptionId)
  })
})
