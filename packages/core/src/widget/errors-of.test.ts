import { FieldApi, FormApi } from '@tanstack/react-form'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { errorsOf } from './errors-of'

const EMAIL_MESSAGE = 'Enter an email address'
const SHORT_MESSAGE = 'Use at least 8 characters'

// `useAppForm` types the submit meta of a form without `onSubmitMeta` as `unknown`; `new FormApi`
// would default it to `never`, which no widget's field type accepts.
const SUBMIT_META: unknown = undefined

function fieldWithErrors(errors: unknown, options: { disableErrorFlat?: boolean } = {}) {
  const form = new FormApi({ defaultValues: { email: '' }, onSubmitMeta: SUBMIT_META })
  form.mount()
  const field = new FieldApi({
    form,
    name: 'email',
    validators: { onChange: () => errors },
    ...options,
  })
  field.mount()
  field.handleChange('changed')

  return field
}

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
    const form = new FormApi({ defaultValues: { email: '' }, onSubmitMeta: SUBMIT_META })
    form.mount()
    const field = new FieldApi({
      form,
      name: 'email',
      validators: { onChange: () => EMAIL_MESSAGE, onBlur: () => ({ message: EMAIL_MESSAGE }) },
    })
    field.mount()

    field.handleChange('changed')
    field.handleBlur()

    expect(errorsOf(field)).toEqual([EMAIL_MESSAGE])
  })

  it('reads the errors of a field that keeps them unflattened', () => {
    const field = fieldWithErrors([{ message: EMAIL_MESSAGE }, { message: SHORT_MESSAGE }], {
      disableErrorFlat: true,
    })

    expect(errorsOf(field)).toEqual([EMAIL_MESSAGE, SHORT_MESSAGE])
  })

  it('turns the issues of a form schema into texts', async () => {
    const form = new FormApi({
      defaultValues: { email: '' },
      onSubmitMeta: SUBMIT_META,
      validators: { onChange: z.object({ email: z.email(EMAIL_MESSAGE) }) },
    })
    form.mount()
    const field = new FieldApi({ form, name: 'email' })
    field.mount()

    field.handleChange('not an email')
    await form.validate('change')

    expect(errorsOf(field)).toEqual([EMAIL_MESSAGE])
  })
})
