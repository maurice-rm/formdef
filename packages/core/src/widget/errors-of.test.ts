import type { AnyFieldApi } from '@tanstack/react-form'
import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { errorsOf } from './errors-of'
import { mountField } from './mount-field.test-support'

const EMAIL_MESSAGE = 'Enter an email address'
const SHORT_MESSAGE = 'Use at least 8 characters'

const mountEmail = ({
  formValidators,
  fieldValidators,
}: {
  formValidators?: readonly unknown[]
  fieldValidators?: readonly unknown[]
}): ReturnType<typeof mountField> =>
  mountField({
    formOptions: { defaultValues: { email: '' }, validators: formValidators },
    fieldValidators,
  })

function fieldWithErrors(errors: unknown): AnyFieldApi {
  const { field } = mountEmail({ fieldValidators: [{ run: () => errors, triggers: ['change'] }] })
  act(() => field().handleChange('changed'))

  return field()
}

afterEach(cleanup)

describe('errorsOf', () => {
  it('returns no texts for a field without errors', () => {
    expect(errorsOf(fieldWithErrors(undefined))).toEqual([])
  })

  it('keeps an error that is a string', () => {
    expect(errorsOf(fieldWithErrors(EMAIL_MESSAGE))).toEqual([EMAIL_MESSAGE])
  })

  it('takes the message of an error that carries one', () => {
    expect(errorsOf(fieldWithErrors({ message: EMAIL_MESSAGE }))).toEqual([EMAIL_MESSAGE])
  })

  it('leaves out errors without text', () => {
    const field = fieldWithErrors([
      '',
      null,
      undefined,
      42,
      {},
      { message: '' },
      { message: 7 },
      EMAIL_MESSAGE,
    ])

    expect(errorsOf(field)).toEqual([EMAIL_MESSAGE])
  })

  it('keeps the order of the errors', () => {
    const field = fieldWithErrors([EMAIL_MESSAGE, { message: SHORT_MESSAGE }])

    expect(errorsOf(field)).toEqual([EMAIL_MESSAGE, SHORT_MESSAGE])
  })

  it('names a text once when several validators report it', () => {
    const { field } = mountEmail({
      fieldValidators: [
        { run: () => EMAIL_MESSAGE, triggers: ['change'] },
        { run: () => ({ message: EMAIL_MESSAGE }), triggers: ['blur'] },
      ],
    })

    act(() => field().handleChange('changed'))
    act(() => field().handleBlur())

    expect(errorsOf(field())).toEqual([EMAIL_MESSAGE])
  })

  it('turns the issues of a form schema into texts', async () => {
    const { form, field } = mountEmail({
      formValidators: [{ run: z.object({ email: z.email(EMAIL_MESSAGE) }), triggers: ['change'] }],
    })

    act(() => field().handleChange('not an email'))
    await act(async () => {
      await form.validate('change')
    })

    expect(errorsOf(field())).toEqual([EMAIL_MESSAGE])
  })
})
