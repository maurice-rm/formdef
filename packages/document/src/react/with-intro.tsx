import { type ComponentType, useState } from 'react'

import { type BlockRenderer, BlocksView } from './blocks-view'
import type { DocumentForm } from './document-form'
import { FocusOnShow } from './focus-on-show'
import type { StartButtonProps } from './start-button'

/** What a form needs to open with its intro. */
export type IntroSource = {
  registry: BlockRenderer
  layout: unknown[]
  label: string
  StartButton: ComponentType<StartButtonProps>
}

/**
 * A form that opens with its intro: the intro's blocks and the start button, then the form, which
 * takes the focus so a person using a screen reader goes on with it.
 */
export function withIntro(Form: DocumentForm, intro: IntroSource): DocumentForm {
  const { StartButton } = intro
  return function DocumentFormWithIntro(props) {
    const [hasStarted, setHasStarted] = useState(false)
    if (hasStarted) {
      return (
        <FocusOnShow>
          <Form {...props} />
        </FocusOnShow>
      )
    }
    return (
      <>
        <BlocksView registry={intro.registry} layout={intro.layout} />
        <StartButton label={intro.label} onStart={() => setHasStarted(true)} />
      </>
    )
  }
}
