import { createRegistry } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { RadioField } from '@/components/formdef/radio-field'

const { fieldContext, formContext } = createFormHookContexts()
const { createForm } = createRegistry({ fieldContext, formContext, widgets: { radio: RadioField } })

const OPTIONS = [
  { value: 'description', label: 'Basic', description: 'For one person' },
  { value: 'a b', label: 'Team', description: 'For up to ten' },
]

const formWith = (variant: 'list' | 'card') =>
  createForm({
    schema: z.object({ plan: z.string().min(1, 'Choose a plan') }),
    defaultValues: { plan: '' },
    formId: 'signup',
    validation: { mode: 'onSubmit' },
    fields: {
      plan: {
        widget: 'radio',
        props: {
          label: 'Plan',
          description: 'You can change it later',
          className: 'gap-4',
          options: OPTIONS,
          variant,
        },
      },
    },
  })

const Form = formWith('list')

const group = (): HTMLElement => screen.getByRole('radiogroup', { name: 'Plan' })

afterEach(cleanup)

describe('RadioField', () => {
  it('names the group by its legend and ties the description to it', () => {
    render(<Form />)

    expect(group().getAttribute('aria-describedby')).toBe('signup-plan-description')
    expect(screen.getByText('You can change it later').id).toBe('signup-plan-description')
  })

  it('names and describes every option, with ids that cannot collide', () => {
    render(<Form />)
    const team = screen.getByRole('radio', { name: 'Team' })

    expect(document.getElementById('signup-plan-option-a%20b')).not.toBeNull()
    expect(team.getAttribute('aria-describedby')).toBe('signup-plan-option-a%20b-description')
    expect(screen.getByText('For up to ten').id).toBe('signup-plan-option-a%20b-description')
    expect(document.getElementById('signup-plan-option-description')).not.toBeNull()
    expect(screen.getByText('You can change it later').id).toBe('signup-plan-description')
  })

  it('marks nothing before a submit, and announces the error after it', async () => {
    render(<Form />)
    expect(screen.queryByRole('alert')).toBeNull()
    expect(group().getAttribute('aria-invalid')).toBeNull()

    fireEvent.submit(group().closest('form') as HTMLFormElement)

    expect((await screen.findByRole('alert')).textContent).toBe('Choose a plan')
    expect(group().getAttribute('aria-invalid')).toBe('true')
    expect(group().getAttribute('aria-errormessage')).toBe('signup-plan-error')
  })

  it('writes the chosen option to the form', () => {
    render(<Form />)

    fireEvent.click(screen.getByRole('radio', { name: 'Team' }))

    expect(screen.getByRole('radio', { name: 'Team' }).getAttribute('aria-checked')).toBe('true')
  })

  it('reports a blur only when the focus leaves the group', async () => {
    const Strict = createForm({
      schema: z.object({
        plan: z.string().refine((plan) => plan !== 'description', 'Not this one'),
      }),
      defaultValues: { plan: '' },
      validation: { mode: 'onBlur' },
      fields: { plan: { widget: 'radio', props: { label: 'Plan', options: OPTIONS } } },
    })
    render(<Strict />)
    const basic = screen.getByRole('radio', { name: 'Basic' })
    const team = screen.getByRole('radio', { name: 'Team' })

    fireEvent.click(basic)
    fireEvent.blur(basic, { relatedTarget: team })
    expect(screen.queryByRole('alert')).toBeNull()

    fireEvent.blur(basic, { relatedTarget: document.body })
    expect((await screen.findByRole('alert')).textContent).toBe('Not this one')
  })

  it('puts the class name on the group', () => {
    render(<Form />)

    expect(group().classList).toContain('gap-4')
  })

  it('wraps each option in its own label as a card', () => {
    const Cards = formWith('card')
    const { container } = render(<Cards />)

    const team = screen.getByRole('radio', { name: 'Team' })

    expect(container.querySelectorAll('label')).toHaveLength(2)
    expect(team.getAttribute('aria-describedby')).toBe('signup-plan-option-a%20b-description')
  })
})
