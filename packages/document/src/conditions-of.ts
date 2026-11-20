import type { Condition } from './condition'
import type { DocumentNode, FormDocument, Varying } from './form-document'
import { isField } from './is-field'
import { isLeaf } from './is-leaf'
import { isPlainObject } from './is-plain-object'
import { isVarying } from './is-varying'
import type { JsonValue } from './json-value'
import { looksVarying } from './looks-varying'
import { nodesOf } from './nodes-of'
import { optionListsOf } from './option-lists-of'
import { pathTo } from './path-to'
import type { Position } from './position'

/** One condition of a document, with the node it belongs to and where it sits. */
export type PlacedCondition = {
  condition: Condition
  /** The position of the step or item the condition belongs to. */
  position: Position
  /** Where the condition sits, as {@link checkDocument} names paths. */
  path: string
}

type Placed = Omit<PlacedCondition, 'position'>

const casesOf = (value: unknown, path: string): Placed[] =>
  looksVarying(value) && Array.isArray(value.cases)
    ? (value.cases as { when: Condition }[]).map((entry, index) => ({
        condition: entry.when,
        path: pathTo.caseWhen(path, index),
      }))
    : []

const textCases = (texts: { label?: unknown; description?: unknown }, path: string): Placed[] => [
  ...casesOf(texts.label, `${path}.label`),
  ...casesOf(texts.description, `${path}.description`),
]

const optionCases = (value: JsonValue | Varying, path: string): Placed[] =>
  optionListsOf(value, path).flatMap(({ list, path: listPath }) =>
    list.flatMap((option, index) =>
      isPlainObject(option) ? textCases(option, `${listPath}[${index}]`) : [],
    ),
  )

const settingCases = (
  { settings }: { settings?: Record<string, JsonValue | Varying> },
  path: string,
): Placed[] =>
  Object.entries(settings ?? {}).flatMap(([name, value]) => {
    const settingPath = pathTo.setting(path, name)
    const own = isVarying(value) ? casesOf(value, settingPath) : []
    return [...own, ...optionCases(value, settingPath)]
  })

const ownConditions = (node: DocumentNode, path: string): Placed[] => {
  const own =
    node.visibleWhen === undefined
      ? []
      : [{ condition: node.visibleWhen, path: pathTo.visibleWhen(path) }]
  if (!isLeaf(node)) {
    const description = 'description' in node ? node.description : undefined
    return [...own, ...casesOf(description, `${path}.description`)]
  }
  if (!isField(node)) {
    return [...own, ...settingCases(node, path)]
  }

  const required =
    typeof node.required === 'object'
      ? [{ condition: node.required, path: pathTo.required(path) }]
      : []
  const messages = Object.entries(node.messages ?? {}).flatMap(([code, text]) =>
    casesOf(text, `${path}.messages.${code}`),
  )
  return [...own, ...required, ...textCases(node, path), ...settingCases(node, path), ...messages]
}

/**
 * Every condition of a document, in document order: visibility, required, texts and error texts that follow an
 * answer, and settings that follow an answer with the texts of their options.
 */
export function conditionsOf(document: FormDocument): PlacedCondition[] {
  return nodesOf(document).flatMap(({ node, position, path }) =>
    ownConditions(node, path).map((entry) => ({ ...entry, position })),
  )
}
