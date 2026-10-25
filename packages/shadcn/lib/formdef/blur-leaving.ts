import type { FocusEvent } from 'react'

export const blurLeaving =
  (report: () => void) =>
  (event: FocusEvent<HTMLElement>): void => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      report()
    }
  }
