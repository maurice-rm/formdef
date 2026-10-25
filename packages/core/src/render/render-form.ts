import type { AnyFieldApi } from '@tanstack/react-form'
import type { ComponentType, ReactNode } from 'react'

/** The props the renderer passes `AppField`: the path, TanStack's field options and the content. */
export type AppFieldProps = Record<string, unknown> & {
  name: string
  children: (field: AnyFieldApi) => ReactNode
}

type SubscribeProps = {
  selector: (state: { values: unknown }) => unknown
  children: (selected: unknown) => ReactNode
}

/** The parts of a TanStack form the renderer uses: `AppField` and `Subscribe` of `useAppForm`. */
export type RenderForm = {
  AppField: ComponentType<AppFieldProps>
  Subscribe: ComponentType<SubscribeProps>
}
