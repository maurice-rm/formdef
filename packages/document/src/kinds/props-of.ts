import type { ComponentType } from 'react'

/** The props a component of the registry takes. */
export type PropsOf<TComponent> = TComponent extends ComponentType<infer TProps> ? TProps : never
