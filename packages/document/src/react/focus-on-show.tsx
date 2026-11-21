import { type ReactNode, useCallback } from 'react'

/**
 * Holds what takes the place of something else, and takes the focus once it shows, so a person
 * using a screen reader goes on with it.
 */
export function FocusOnShow({ children }: { children: ReactNode }): ReactNode {
  const takeFocus = useCallback((node: HTMLDivElement | null) => node?.focus(), [])

  return (
    <div ref={takeFocus} tabIndex={-1}>
      {children}
    </div>
  )
}
