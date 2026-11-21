import type { ComponentType, ReactNode } from 'react'

type BlockForm = { AppForm: ComponentType<{ children?: ReactNode }> }

/** What of a registry renders blocks outside the form, such as those of an intro or an ending. */
export type BlockRenderer = {
  Fields: ComponentType<{ form: unknown; fields: object; layout: unknown[] }>
  formHook: { useAppForm: (options: { defaultValues: object }) => BlockForm }
}

const NO_VALUES = {}

/** Blocks rendered through the registry's form components, without a form element around them. */
export function BlocksView({
  registry,
  layout,
}: {
  registry: BlockRenderer
  layout: unknown[]
}): ReactNode {
  const form = registry.formHook.useAppForm({ defaultValues: NO_VALUES })
  const { Fields } = registry

  // Form components read the form from the context, as they do inside the form.
  return (
    <form.AppForm>
      <Fields form={form} fields={NO_VALUES} layout={layout} />
    </form.AppForm>
  )
}
