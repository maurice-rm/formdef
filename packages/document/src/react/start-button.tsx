import type { ReactNode } from 'react'

/** What the button that starts a form after its intro receives. */
export type StartButtonProps = {
  /** The label the document gives the button. */
  label: string
  /** Starts the form. */
  onStart: () => void
}

/** The button that starts a form after its intro, when the project passes none of its own. */
export function StartButton({ label, onStart }: StartButtonProps): ReactNode {
  return (
    <button type="button" onClick={onStart}>
      {label}
    </button>
  )
}
