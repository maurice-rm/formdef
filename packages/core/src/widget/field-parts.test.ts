import { FieldApi, FormApi } from '@tanstack/react-form'
import { describe, expect, it } from 'vitest'

import { fieldId } from './field-id'
import { fieldParts } from './field-parts'

const FORM_ID = 'signup'
const EMAIL_MESSAGE = 'Enter an email address'
const DESCRIPTION = 'We never share it'

// `useAppForm` types the submit meta of a form without `onSubmitMeta` as `unknown`; `new FormApi`
// would default it to `never`, which no widget's field type accepts.
const SUBMIT_META: unknown = undefined

function emailField(validate: () => unknown = () => EMAIL_MESSAGE) {
  const form = new FormApi({
    formId: FORM_ID,
    defaultValues: { email: '' },
    onSubmitMeta: SUBMIT_META,
  })
  form.mount()
  const field = new FieldApi({
    form,
    name: 'email',
    validators: { onChange: validate, onBlur: validate },
  })
  field.mount()

  return field
}

function editAndLeave(field: ReturnType<typeof emailField>) {
  field.handleChange('changed')
  field.handleBlur()

  return field
}

describe('fieldParts', () => {
  describe('ids', () => {
    it('gives the control the id of its path in its form', () => {
      const { control, descriptionId, errorId } = fieldParts(emailField())

      expect(control.id).toBe(fieldId(FORM_ID, 'email'))
      expect(descriptionId).toBe(`${control.id}-description`)
      expect(errorId).toBe(`${control.id}-error`)
    })

    it('builds the id of a nested path', () => {
      const form = new FormApi({
        formId: FORM_ID,
        defaultValues: { address: { zip: '' } },
        onSubmitMeta: SUBMIT_META,
      })
      const field = new FieldApi({ form, name: 'address.zip' })

      expect(fieldParts(field).control).toMatchObject({
        id: fieldId(FORM_ID, 'address.zip'),
        name: 'address.zip',
      })
    })

    it('keeps the ids of two forms apart', () => {
      const first = new FormApi({ defaultValues: { email: '' }, onSubmitMeta: SUBMIT_META })
      const second = new FormApi({ defaultValues: { email: '' }, onSubmitMeta: SUBMIT_META })

      expect(fieldParts(new FieldApi({ form: first, name: 'email' })).control.id).not.toBe(
        fieldParts(new FieldApi({ form: second, name: 'email' })).control.id,
      )
    })
  })

  describe('isErrorDue', () => {
    it('is false while an invalid field was only edited', () => {
      const field = emailField()
      field.handleChange('changed')

      expect(field.state.meta.isValid).toBe(false)
      expect(fieldParts(field).isErrorDue).toBe(false)
    })

    it('is false while an invalid field was only left', () => {
      const field = emailField()
      field.handleBlur()

      expect(field.state.meta.isValid).toBe(false)
      expect(fieldParts(field).isErrorDue).toBe(false)
    })

    it('is true once an invalid field was edited and left', () => {
      expect(fieldParts(editAndLeave(emailField())).isErrorDue).toBe(true)
    })

    it('is true for an untouched invalid field once the form was submitted', async () => {
      const field = emailField()
      await field.form.handleSubmit()

      expect(fieldParts(field).isErrorDue).toBe(true)
    })

    it('is false for a valid field', () => {
      expect(fieldParts(editAndLeave(emailField(() => undefined))).isErrorDue).toBe(false)
    })
  })

  describe('control', () => {
    it('marks a field whose error is due as invalid', () => {
      const { control, errors } = fieldParts(editAndLeave(emailField()))

      expect(control['aria-invalid']).toBe(true)
      expect(control['aria-describedby']).toBe(`${control.id}-error`)
      expect(control['aria-errormessage']).toBe(`${control.id}-error`)
      expect(errors).toEqual([EMAIL_MESSAGE])
    })

    it('leaves the error attributes out while no error is due', () => {
      const { control } = fieldParts(emailField())

      expect(control['aria-invalid']).toBeUndefined()
      expect(control['aria-describedby']).toBeUndefined()
      expect(control['aria-errormessage']).toBeUndefined()
    })

    it('points at the description only when the widget renders one', () => {
      const field = emailField()

      expect(fieldParts(field, { description: DESCRIPTION }).control['aria-describedby']).toBe(
        `${fieldId(FORM_ID, 'email')}-description`,
      )
      expect(fieldParts(field, { description: undefined }).control['aria-describedby']).toBe(
        undefined,
      )
      expect(fieldParts(field, { description: '' }).control['aria-describedby']).toBe(undefined)
    })

    it('points at the description and the error together', () => {
      const { control } = fieldParts(editAndLeave(emailField()), { description: DESCRIPTION })

      expect(control['aria-describedby']).toBe(`${control.id}-description ${control.id}-error`)
    })

    it('does not point at an error without text', () => {
      const { control, isErrorDue } = fieldParts(editAndLeave(emailField(() => true)))

      expect(isErrorDue).toBe(true)
      expect(control['aria-invalid']).toBe(true)
      expect(control['aria-describedby']).toBeUndefined()
      expect(control['aria-errormessage']).toBeUndefined()
    })

    it('reports leaving the control to the field', () => {
      const field = emailField()
      fieldParts(field).control.onBlur()

      expect(field.state.meta.isBlurred).toBe(true)
    })
  })
})
