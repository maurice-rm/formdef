import type { ComponentType, ReactNode } from 'react'

/** What of a registry renders blocks outside the form, such as those of an intro or an ending. */
export type BlockRenderer = {
  Fields: ComponentType<{ form: unknown; fields: object; layout: unknown[] }>
  formHook: { useAppForm: (options: { defaultValues: object }) => unknown }
}

const NO_VALUES = {}

/**
 * Blocks rendered through the registry's form components, without a form element around them.
 * Each form component receives the form as it does inside the form.
 */
export function BlocksView({
  registry,
  layout,
}: {
  registry: BlockRenderer
  layout: unknown[]
}): ReactNode {
  const form = registry.formHook.useAppForm({ defaultValues: NO_VALUES })
  const { Fields } = registry

  return <Fields form={form} fields={NO_VALUES} layout={layout} />
}
