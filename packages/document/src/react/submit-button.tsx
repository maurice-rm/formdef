import type { ReactNode } from 'react'

/** What the button that submits a form without steps receives. */
export type SubmitButtonProps = {
  /** The label the document gives the button. */
  label: string
}

/** The button that submits a form without steps, when the project passes none of its own. */
export function SubmitButton({ label }: SubmitButtonProps): ReactNode {
  return <button type="submit">{label}</button>
}
