import { type ReactNode, useCallback } from 'react'

import { type BlockRenderer, BlocksView } from './blocks-view'

/**
 * The blocks of an ending. It takes the focus once it shows, so a person using a screen reader
 * hears that the form gave way to it.
 */
export function EndingView({
  registry,
  layout,
}: {
  registry: BlockRenderer
  layout: unknown[]
}): ReactNode {
  const takeFocus = useCallback((node: HTMLDivElement | null) => node?.focus(), [])

  return (
    <div ref={takeFocus} tabIndex={-1}>
      <BlocksView registry={registry} layout={layout} />
    </div>
  )
}
