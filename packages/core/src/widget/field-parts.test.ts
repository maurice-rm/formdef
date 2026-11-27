import type { AnyFieldApi } from '@tanstack/react-form'
import { act, cleanup } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { fieldId } from './field-id'
import { fieldParts } from './field-parts'
import { mountField } from './mount-field.test-support'

const FORM_ID = 'signup'
const EMAIL_MESSAGE = 'Enter an email address'
const DESCRIPTION = 'We never share it'

type FieldOptions = {
  formId?: string
  defaultValues?: object
  name?: string
  validate?: () => unknown
}

// A field read later sees the field's current state, since TanStack hands out views onto one
// field object.
function fieldWith({
  formId,
  defaultValues = { email: '' },
  name = 'email',
  validate,
}: FieldOptions = {}): AnyFieldApi {
  return mountField({
    formOptions: { ...(formId === undefined ? {} : { formId }), defaultValues },
    name,
    fieldValidators:
      validate === undefined ? undefined : [{ run: validate, triggers: ['change', 'blur'] }],
  }).field()
}

function emailField(validate: () => unknown = () => EMAIL_MESSAGE): AnyFieldApi {
  return fieldWith({ formId: FORM_ID, validate })
}

function editAndLeave(field: AnyFieldApi): AnyFieldApi {
  act(() => field.handleChange('changed'))
  act(() => field.handleBlur())

  return field
}

afterEach(cleanup)

describe('fieldParts', () => {
  describe('ids', () => {
    it('gives the control the id of its path in its form', () => {
      const { control, descriptionId, errorId } = fieldParts(emailField())

      expect(control.id).toBe(fieldId(FORM_ID, 'email'))
      expect(descriptionId).toBe(`${control.id}-description`)
      expect(errorId).toBe(`${control.id}-error`)
    })

    it('builds the id of a nested path', () => {
      const field = fieldWith({
        formId: FORM_ID,
        defaultValues: { address: { zip: '' } },
        name: 'address.zip',
      })

      expect(fieldParts(field).control).toMatchObject({
        id: fieldId(FORM_ID, 'address.zip'),
        name: 'address.zip',
      })
    })

    it('keeps the ids of two forms apart', () => {
      const first = fieldWith()
      const second = fieldWith()

      expect(fieldParts(first).control.id).not.toBe(fieldParts(second).control.id)
    })
  })

  describe('isErrorDue', () => {
    it('is false while an invalid field was only edited', () => {
      const field = emailField()
      act(() => field.handleChange('changed'))

      expect(field.meta.isValid).toBe(false)
      expect(fieldParts(field).isErrorDue).toBe(false)
    })

    it('is false while an invalid field was only left', () => {
      const field = emailField()
      act(() => field.handleBlur())

      expect(field.meta.isValid).toBe(false)
      expect(fieldParts(field).isErrorDue).toBe(false)
    })

    it('is true once an invalid field was edited and left', () => {
      expect(fieldParts(editAndLeave(emailField())).isErrorDue).toBe(true)
    })

    it('is true for an untouched invalid field once the form was submitted', async () => {
      const field = emailField()
      await act(async () => {
        await field.form.handleSubmit()
      })

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

    it('points at a description of React elements, and not at nothing to render', () => {
      const field = emailField()
      const formatted = createElement('strong', null, 'Required by law')

      expect(fieldParts(field, { description: formatted }).control['aria-describedby']).toBe(
        `${fieldId(FORM_ID, 'email')}-description`,
      )
      expect(fieldParts(field, { description: null }).control['aria-describedby']).toBe(undefined)
      expect(fieldParts(field, { description: false }).control['aria-describedby']).toBe(undefined)
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
      act(() => fieldParts(field).control.onBlur())

      expect(field.meta.isBlurred).toBe(true)
    })
  })
})
