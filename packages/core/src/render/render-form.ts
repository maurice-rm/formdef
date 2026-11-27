import type { AnyFieldApi } from '@tanstack/react-form'
import type { ComponentType, ReactNode } from 'react'

/** The props the renderer passes `Field`: the path, TanStack's field options and the content. */
export type FieldProps = Record<string, unknown> & {
  name: string
  children: (field: AnyFieldApi) => ReactNode
}

type SubscribeProps = {
  selector: (state: { values: unknown }) => unknown
  children: (selected: unknown) => ReactNode
}

/**
 * The parts of a TanStack form the renderer uses: `Field`, `ArrayField` and `Subscribe` of
 * `useAppForm`, and the form components it binds to the form.
 */
export type RenderForm = {
  Field: ComponentType<FieldProps>
  ArrayField: ComponentType<FieldProps>
  Subscribe: ComponentType<SubscribeProps>
}
