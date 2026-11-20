import { failAt } from '../fail-at'
import type { FieldKind } from './field-kind'
import { VALUE_TYPES } from './value-type'

/**
 * Every kind a project offers for form documents, for one registry: what a builder lists, and
 * what renders, checks, validates and describes a form document.
 *
 * @typeParam TRegistry - The registry the kinds belong to.
 */
export type Catalog<TRegistry> = {
  /** The registry that renders the documents. */
  readonly registry: TRegistry
  /** Every field kind, in the order given. */
  readonly fields: readonly FieldKind<TRegistry>[]
  /** The field kind of this name, or `undefined` when there is none. */
  findFieldKind: (name: string) => FieldKind<TRegistry> | undefined
}

/**
 * What {@link createCatalog} takes besides the registry.
 *
 * @typeParam TRegistry - The registry the kinds belong to.
 */
export type CatalogOptions<TRegistry> = {
  /** The field kinds, each built with {@link defineFieldKind} and the catalog's registry. */
  fields: readonly FieldKind<TRegistry>[]
}

const FIELDS = 'fields'

/**
 * Collects every kind a project offers for form documents, for one registry.
 *
 * @typeParam TRegistry - The registry the kinds belong to.
 * @param registry - The registry that renders the documents.
 * @param options - The kinds the catalog holds.
 * @param options.fields - The field kinds, each built with {@link defineFieldKind} and this
 *   registry.
 * @returns The catalog, which finds each kind by its name.
 * @throws When two field kinds share a name, one was defined with another registry, or one names
 *   no known value type.
 *
 * @example
 * ```ts
 * export const catalog = createCatalog(registry, { fields: [text, choice, measure] })
 * ```
 */
export function createCatalog<TRegistry>(
  registry: TRegistry,
  { fields }: CatalogOptions<TRegistry>,
): Catalog<TRegistry> {
  const byName = new Map<string, FieldKind<TRegistry>>()

  fields.forEach((kind, index) => {
    const path = `${FIELDS}[${index}]`
    if (kind.registry !== registry) {
      failAt(path, `the field kind "${kind.name}" was defined with another registry.`)
    }
    if (!VALUE_TYPES.includes(kind.valueType)) {
      failAt(`${path}.valueType`, `expected one of ${VALUE_TYPES.join(', ')}.`)
    }
    if (byName.has(kind.name)) {
      failAt(`${path}.name`, `the name "${kind.name}" is used twice.`)
    }
    byName.set(kind.name, kind)
  })

  return { registry, fields: [...fields], findFieldKind: (name) => byName.get(name) }
}
