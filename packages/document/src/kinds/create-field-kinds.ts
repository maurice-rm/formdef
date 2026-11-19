import type { FieldKind } from './field-kind'

/**
 * The field kinds a project offers, for one registry: what a builder lists, and what renders and
 * validates a form document.
 *
 * @typeParam TRegistry - The registry the field kinds' widgets belong to.
 */
export type FieldKinds<TRegistry> = {
  /** The registry that renders the documents. */
  readonly registry: TRegistry
  /** Every field kind, in the order given. */
  readonly all: readonly FieldKind<TRegistry>[]
  /** The field kind of this name, or `undefined` when there is none. */
  byName(name: string): FieldKind<TRegistry> | undefined
}

const ROOT = 'fieldKinds'

/**
 * Collects the field kinds a project offers for one registry.
 *
 * @typeParam TRegistry - The registry the field kinds' widgets belong to.
 * @param registry - The registry that renders the documents.
 * @param kinds - The field kinds, each built with `defineFieldKind` and this registry.
 * @returns The field kinds, by name.
 * @throws Error when two field kinds share a name, or one was defined with another registry.
 *
 * @example
 * ```ts
 * export const fieldKinds = createFieldKinds(registry, [text, choice, measure])
 * ```
 */
export const createFieldKinds = <TRegistry>(
  registry: TRegistry,
  kinds: readonly FieldKind<TRegistry>[],
): FieldKinds<TRegistry> => {
  const byName = new Map<string, FieldKind<TRegistry>>()

  kinds.forEach((kind, index) => {
    if (kind.registry !== registry) {
      throw new Error(
        `formdef: ${ROOT}[${index}]: the field kind ${kind.name} was defined with another registry.`,
      )
    }
    if (byName.has(kind.name)) {
      throw new Error(`formdef: ${ROOT}[${index}].name: the name ${kind.name} is used twice.`)
    }
    byName.set(kind.name, kind)
  })

  return { registry, all: [...kinds], byName: (name) => byName.get(name) }
}
