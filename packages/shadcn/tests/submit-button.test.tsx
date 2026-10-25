import { createRegistry } from '@formdef/core'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { SubmitButton } from '@/components/formdef/submit-button'
import { TextField } from '@/components/formdef/text-field'
import { fieldContext, formContext } from '@/lib/formdef/context'

const { createForm } = createRegistry({
  fieldContext,
  formContext,
  widgets: { text: TextField },
  formComponents: { SubmitButton },
})

const NOTICEABLE_MS = 300
const SERVER_MS = 1000

const formWith = (onSubmit: () => Promise<void>) =>
  createForm({
    schema: z.object({ email: z.email('Enter an email') }),
    defaultValues: { email: '' },
    fields: { email: { widget: 'text', props: { label: 'Email' } } },
    layout: [
      'email',
      { component: 'SubmitButton', props: { label: 'Sign in', className: 'w-full' } },
    ],
    onSubmit,
  })

const button = (): HTMLButtonElement => screen.getByRole('button', { name: 'Sign in' })
const spinner = (): Element | null => button().querySelector('[data-slot="spinner"]')

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('SubmitButton', () => {
  it('submits the form and is never disabled because the form is invalid', async () => {
    const onSubmit = vi.fn(async () => undefined)
    const Form = formWith(onSubmit)
    render(<Form />)

    expect(button().type).toBe('submit')
    expect(button().disabled).toBe(false)
    expect(button().classList).toContain('w-full')

    await act(async () => {
      fireEvent.click(button())
    })

    expect(onSubmit).not.toHaveBeenCalled()
    expect(button().disabled).toBe(false)
    expect(button().getAttribute('aria-disabled')).not.toBe('true')
  })

  it('marks itself busy while submitting and shows a spinner only once the wait is noticeable', async () => {
    const onSubmit = vi.fn(() => new Promise<void>((resolve) => setTimeout(resolve, SERVER_MS)))
    const Form = formWith(onSubmit)
    render(<Form />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.com' } })

    await act(async () => {
      fireEvent.submit(button().closest('form') as HTMLFormElement)
    })
    expect(button().getAttribute('aria-disabled')).toBe('true')
    expect(button().getAttribute('aria-busy')).toBe('true')
    expect(spinner()).toBeNull()

    act(() => vi.advanceTimersByTime(NOTICEABLE_MS))
    expect(spinner()).not.toBeNull()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(SERVER_MS)
    })
    expect(button().getAttribute('aria-disabled')).not.toBe('true')
    expect(spinner()).toBeNull()
  })

  it('ignores a second click while submitting', async () => {
    const onSubmit = vi.fn(() => new Promise<void>((resolve) => setTimeout(resolve, SERVER_MS)))
    const Form = formWith(onSubmit)
    render(<Form />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.com' } })

    await act(async () => {
      fireEvent.click(button())
    })
    await act(async () => {
      fireEvent.click(button())
    })

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('keeps the focus where it is when pressed', () => {
    const Form = formWith(async () => undefined)
    render(<Form />)

    const isDefaultKept = fireEvent.mouseDown(button())

    expect(isDefaultKept).toBe(false)
  })
})
