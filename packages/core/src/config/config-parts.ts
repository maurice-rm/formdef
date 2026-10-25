/**
 * The parts of a registry a config reads: its widgets, structure slots, form components and the
 * form handle an inline entry receives. Stands in for the registry's own type until it exists.
 */
export type ConfigParts = {
  widgets: object
  structure: object
  formComponents: object
  handle: unknown
}
