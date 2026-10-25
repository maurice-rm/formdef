import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ComponentType } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

type Wiring = {
  /** A form rendering the widget alone, with a description and a rule it can break. */
  Form: ComponentType
  /** The element the label, the description and the error all reach. */
  control: () => HTMLElement
  /** The id `fieldParts` gives the control: the form id and the field's path. */
  id: string
  description: string
  /** Makes the field's error due: an invalid edit and a blur, or a submit for a widget without text. */
  invalidate: (control: HTMLElement) => void
  error: string
}

const fieldOf = (container: HTMLElement): Element | null =>
  container.querySelector('[data-slot="field"]')

/** The five tests every widget with one labelled control passes. */
export const describeWiring = ({
  Form,
  control,
  id,
  description,
  invalidate,
  error,
}: Wiring): void => {
  describe('wiring', () => {
    afterEach(cleanup)

    it('points its label at the control', () => {
      const { container } = render(<Form />)
      const label = container.querySelector(`label[for="${id}"]`)
      const labelledBy = control().getAttribute('aria-labelledby')?.split(' ') ?? []

      expect(label).not.toBeNull()
      expect(control().id === id || labelledBy.includes(label?.id ?? '')).toBe(true)
    })

    it('renders its description and ties it to the control', () => {
      render(<Form />)

      expect(control().getAttribute('aria-describedby')).toBe(`${id}-description`)
      expect(screen.getByText(description).id).toBe(`${id}-description`)
    })

    it('marks nothing before the field was touched', () => {
      const { container } = render(<Form />)

      expect(screen.queryByRole('alert')).toBeNull()
      expect(control().getAttribute('aria-invalid')).toBeNull()
      expect(fieldOf(container)?.getAttribute('data-invalid')).not.toBe('true')
    })

    it('reports nothing when the field is left without an edit', () => {
      render(<Form />)

      fireEvent.blur(control())

      expect(screen.queryByRole('alert')).toBeNull()
      expect(control().getAttribute('aria-invalid')).toBeNull()
    })

    it('announces the error once the field was edited and left invalid', async () => {
      const { container } = render(<Form />)

      invalidate(control())

      expect((await screen.findByRole('alert')).textContent).toBe(error)
      expect(control().getAttribute('aria-invalid')).toBe('true')
      expect(control().getAttribute('aria-describedby')).toBe(`${id}-description ${id}-error`)
      expect(control().getAttribute('aria-errormessage')).toBe(`${id}-error`)
      expect(fieldOf(container)?.getAttribute('data-invalid')).toBe('true')
    })
  })
}
