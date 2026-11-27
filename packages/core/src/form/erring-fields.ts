type ErringMeta = {
  errors: readonly unknown[]
  isValid: boolean
  isBlurred: boolean
  isDirty: boolean
}

type Source<TValue> = {
  get: () => TValue
  subscribe: (listener: (value: TValue) => void) => { unsubscribe: () => void }
}

type FieldNode = {
  name: string
  meta: ErringMeta
  /** The field's state, which changes with its value and its meta. */
  atom: Source<unknown>
  // biome-ignore lint/style/useNamingConvention: TanStack's internal name.
  _children: readonly FieldNode[]
}

// TanStack Form v2 keeps the fields of a form in an internal tree, mounted or not, and the root
// fields whose subtree holds an error in an internal atom; its public API has no view of field
// meta by path.
type InternalForm = {
  // biome-ignore lint/style/useNamingConvention: TanStack's internal name.
  _atoms: { meta: { errorFields: Source<ReadonlySet<FieldNode>> } }
}

/** A field of a form that holds an error: its path and its meta. */
export type ErringField = { path: string; meta: ErringMeta }

// Changes when a root field's subtree turns valid or invalid.
const erringRootsOf = (form: object): Source<ReadonlySet<FieldNode>> =>
  (form as InternalForm)._atoms.meta.errorFields

const nodesUnder = (node: FieldNode): FieldNode[] => [node, ...node._children.flatMap(nodesUnder)]

/** The fields of `form` that hold an error, whether they are rendered or not. */
export function erringFieldsOf(form: object): ErringField[] {
  return [...erringRootsOf(form).get()]
    .flatMap(nodesUnder)
    .filter((node) => node.meta.errors.length > 0)
    .map((node) => ({ path: node.name, meta: node.meta }))
}

/**
 * Calls `listener` whenever what {@link erringFieldsOf} returns may have changed: a field turning
 * valid or invalid, or the meta of a field under an invalid root, such as a blur.
 *
 * @returns A function that ends the subscription.
 */
export function subscribeToErringFields(form: object, listener: () => void): () => void {
  const roots = erringRootsOf(form)
  let fieldSubscriptions: { unsubscribe: () => void }[] = []
  const unsubscribeFields = (): void => {
    for (const subscription of fieldSubscriptions) {
      subscription.unsubscribe()
    }
  }
  const subscribeToFields = (): void => {
    unsubscribeFields()
    fieldSubscriptions = [...roots.get()]
      .flatMap(nodesUnder)
      .map((node) => node.atom.subscribe(listener))
  }
  subscribeToFields()
  const rootSubscription = roots.subscribe(() => {
    subscribeToFields()
    listener()
  })

  return () => {
    rootSubscription.unsubscribe()
    unsubscribeFields()
  }
}
