type TwoslashNode = { type: string; text?: string }

const HOVER = 'hover'

// Hovers that tell a reader nothing or tell them wrong. Twoslash still checks every block; only
// these popups are dropped.
const UNHELPFUL_HOVERS: RegExp[] = [
  // fumadocs-twoslash's own TypeScript reports `any` for JSX tags such as <div> and for globals
  // such as Promise.
  /\bIntrinsicElements\./,
  /: any$/,
  // React's DOM attributes, such as `InputHTMLAttributes.value`.
  /\b(\w*HTMLAttributes|DOMAttributes|AriaAttributes)(<[^>]*>)?\./,
  // TanStack Form's generic slots, `FieldApi<any, any, …>`.
  /\bany, any\b/,
  // formdef's type helpers, which the inferred config and the createForm signature spell out.
  /\b(NamedFields|KnownKeys|KnownIn|DescribedLayout|LevelFields|FieldsKnown)</,
  // An empty array in `defaultValues`, which createForm's const inference turns into `readonly [] & string[]`.
  /\breadonly \[[^\]]*\] & /,
]

/** Whether Twoslash keeps a node: every node but the hovers in `UNHELPFUL_HOVERS`. */
export const isHelpfulTwoslashNode = (node: TwoslashNode): boolean =>
  node.type !== HOVER ||
  node.text === undefined ||
  !UNHELPFUL_HOVERS.some((pattern) => pattern.test(node.text ?? ''))
