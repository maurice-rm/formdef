import { compiler, type MarkdownToJSX, RuleType } from 'markdown-to-jsx/react'
import { type CSSProperties, Fragment, type ReactNode } from 'react'

type Render = MarkdownToJSX.ASTRender
type State = MarkdownToJSX.State
type Node = MarkdownToJSX.ASTNode

const LINK_PROTOCOLS = ['https:', 'mailto:']
const CELL_SEPARATOR = ' '
const FORMATTING_TAGS: ReadonlySet<string> = new Set(['strong', 'em'])

// A description renders inside a `<p>`, which holds no paragraphs; a block span keeps them apart.
const PARAGRAPH: CSSProperties = { display: 'block' }

const isAllowedLink = (target: string | null): target is string =>
  target !== null && LINK_PROTOCOLS.some((protocol) => target.startsWith(protocol))

const plainOf = (node: Node, { render, state }: { render: Render; state: State }): ReactNode => {
  if ('children' in node && Array.isArray(node.children)) {
    return <Fragment key={state.key}>{render(node.children, state)}</Fragment>
  }
  if (node.type === RuleType.image) {
    return node.alt ?? null
  }
  if ('items' in node) {
    return blocksOf(node.items.map((item) => render(item, state)))
  }
  if (node.type === RuleType.table) {
    return blocksOf([node.header, ...node.cells].map((row) => cellsOf(row, { render, state })))
  }
  return 'text' in node ? node.text : null
}

const blocksOf = (rows: readonly ReactNode[]): ReactNode =>
  rows.map((row, index) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: the rows of a list or table have no key but their order.
    <span key={index} style={PARAGRAPH}>
      {row}
    </span>
  ))

const cellsOf = (
  cells: readonly Node[][],
  { render, state }: { render: Render; state: State },
): ReactNode =>
  cells.map((cell, index) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: the cells of a row have no key but their order.
    <Fragment key={index}>
      {index > 0 && CELL_SEPARATOR}
      {render(cell, state)}
    </Fragment>
  ))

const renderRuleWith =
  (hasLinks: boolean) =>
  // biome-ignore lint/complexity/useMaxParams: markdown-to-jsx calls renderRule with four arguments.
  (next: () => ReactNode, node: Node, render: Render, state: State): ReactNode => {
    switch (node.type) {
      case RuleType.text:
      case RuleType.breakLine:
        return next()
      case RuleType.paragraph:
        return (
          <span key={state.key} style={PARAGRAPH}>
            {render(node.children, state)}
          </span>
        )
      case RuleType.textFormatted:
        return FORMATTING_TAGS.has(node.tag) ? next() : plainOf(node, { render, state })
      case RuleType.link:
        return hasLinks && isAllowedLink(node.target) ? (
          <a key={state.key} href={node.target} rel="noreferrer">
            {render(node.children, state)}
          </a>
        ) : (
          plainOf(node, { render, state })
        )
      default:
        return plainOf(node, { render, state })
    }
  }

// markdown-to-jsx adds a footer for footnotes without calling `renderRule`; it holds blocks and ids.
const NO_FOOTER = (): null => null

const optionsWith = (hasLinks: boolean): MarkdownToJSX.Options => ({
  disableParsingRawHTML: true,
  disableAutoLink: true,
  wrapper: null,
  overrides: { footer: NO_FOOTER },
  renderRule: renderRuleWith(hasLinks),
})

const WITH_LINKS = optionsWith(true)
const WITHOUT_LINKS = optionsWith(false)

/**
 * Renders a formatted text of a document, written in limited Markdown: bold, italics, links to
 * `https:` and `mailto:` addresses, and paragraphs, which fit inside a paragraph. HTML stays text,
 * and other Markdown renders as its text.
 */
export function formatText(markdown: string): ReactNode {
  return compiler(markdown, WITH_LINKS)
}

/** Renders a formatted text like {@link formatText}, but each link as its text, for a place that holds no links. */
export function formatTextWithoutLinks(markdown: string): ReactNode {
  return compiler(markdown, WITHOUT_LINKS)
}
