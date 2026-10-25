/**
 * The parts of a registry a config reads: its widgets, structure slots, form components and the
 * form handle an inline entry receives. The registry module takes a registry apart into these, so
 * the config types need not know the registry.
 */
export type ConfigParts = {
  widgets: object
  structure: object
  formComponents: object
  handle: unknown
}
