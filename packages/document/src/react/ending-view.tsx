import type { ReactNode } from 'react'

import { type BlockRenderer, BlocksView } from './blocks-view'
import { FocusOnShow } from './focus-on-show'

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
  return (
    <FocusOnShow>
      <BlocksView registry={registry} layout={layout} />
    </FocusOnShow>
  )
}
