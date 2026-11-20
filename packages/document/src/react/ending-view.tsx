import { type ComponentType, type ReactNode, useCallback } from 'react'

type BlockForm = { AppForm: ComponentType<{ children?: ReactNode }> }

/** What of a registry renders the blocks of an ending, without a form around them. */
export type BlockRenderer = {
  Fields: ComponentType<{ form: unknown; fields: object; layout: unknown[] }>
  formHook: { useAppForm: (options: { defaultValues: object }) => BlockForm }
}

const NO_VALUES = {}

/**
 * The blocks of an ending, rendered through the registry's form components. It takes the focus once
 * it shows, so a person using a screen reader hears that the form gave way to it.
 */
export function EndingView({
  registry,
  layout,
}: {
  registry: BlockRenderer
  layout: unknown[]
}): ReactNode {
  const form = registry.formHook.useAppForm({ defaultValues: NO_VALUES })
  const takeFocus = useCallback((node: HTMLDivElement | null) => node?.focus(), [])
  const { Fields } = registry

  // Form components read the form from the context, as they do inside the form.
  return (
    <form.AppForm>
      <div ref={takeFocus} tabIndex={-1}>
        <Fields form={form} fields={NO_VALUES} layout={layout} />
      </div>
    </form.AppForm>
  )
}
