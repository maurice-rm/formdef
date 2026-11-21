import type { Condition } from './condition'
import type { Expression } from './expression'
import type { ComputedItem, DocumentNode, FieldItem, Varying } from './form-document'
import { isField } from './is-field'
import { isLeaf } from './is-leaf'
import { isPlainObject } from './is-plain-object'
import { isStep } from './is-step'
import type { JsonValue } from './json-value'
import { looksVarying } from './looks-varying'
import { mapOptionLists } from './map-option-lists'
import { pathTo } from './path-to'

/** Maps one condition, given where it sits, as {@link checkDocument} names paths. */
export type MapCondition = (condition: Condition, path: string) => Condition

type Texts = { label?: unknown; description?: unknown }

type Settings = { settings?: Record<string, JsonValue | Varying> }

const mapCases = <TValue>(value: TValue, path: string, map: MapCondition): TValue => {
  if (!looksVarying(value) || !Array.isArray(value.cases)) {
    return value
  }
  const cases = (value.cases as { when: Condition }[]).map((entry, index) => ({
    ...entry,
    when: map(entry.when, pathTo.caseWhen(path, index)),
  }))
  return { ...value, cases } as TValue
}

const mapTexts = <TTexts extends Texts>(
  texts: TTexts,
  path: string,
  map: MapCondition,
): TTexts => ({
  ...texts,
  ...(texts.label === undefined ? {} : { label: mapCases(texts.label, `${path}.label`, map) }),
  ...(texts.description === undefined
    ? {}
    : { description: mapCases(texts.description, `${path}.description`, map) }),
})

const mapOptions = (list: readonly JsonValue[], path: string, map: MapCondition): JsonValue[] =>
  list.map((option, index) =>
    isPlainObject(option) ? mapTexts(option, `${path}[${index}]`, map) : option,
  )

const mapSettings = <TOwner extends Settings>(owner: TOwner, path: string, map: MapCondition) => {
  if (owner.settings === undefined) {
    return owner
  }
  const settings = Object.entries(owner.settings).map(([name, value]) => {
    const settingPath = pathTo.setting(path, name)
    const ownCases = mapCases(value, settingPath, map)
    return [
      name,
      mapOptionLists(ownCases, settingPath, (list, listPath) => mapOptions(list, listPath, map)),
    ]
  })
  return { ...owner, settings: Object.fromEntries(settings) }
}

const mapExpression = (expression: Expression, path: string, map: MapCondition): Expression => {
  if ('cases' in expression) {
    return {
      cases: expression.cases.map((entry, index) => ({
        when: map(entry.when, pathTo.caseWhen(path, index)),
        value: mapExpression(entry.value, pathTo.caseValue(path, index), map),
      })),
      otherwise: mapExpression(expression.otherwise, pathTo.otherwise(path), map),
    }
  }
  if ('args' in expression) {
    const args = expression.args.map((arg, index) =>
      mapExpression(arg, `${path}.args[${index}]`, map),
    )
    return { ...expression, args }
  }
  return 'when' in expression && expression.when !== undefined
    ? { ...expression, when: map(expression.when, `${path}.when`) }
    : expression
}

const mapComputed = (computed: ComputedItem, path: string, map: MapCondition): ComputedItem => {
  const label = mapCases(computed.label, `${path}.label`, map)
  return {
    ...computed,
    label,
    expression: mapExpression(computed.expression, `${path}.expression`, map),
  }
}

const mapField = (field: FieldItem, path: string, map: MapCondition): FieldItem => {
  const required =
    typeof field.required === 'object'
      ? { required: map(field.required, pathTo.required(path)) }
      : {}
  const withSettings = mapSettings(mapTexts({ ...field, ...required }, path, map), path, map)
  const messages =
    field.messages === undefined
      ? {}
      : {
          messages: Object.fromEntries(
            Object.entries(field.messages).map(([code, text]) => [
              code,
              mapCases(text, `${path}.messages.${code}`, map),
            ]),
          ),
        }
  const checks =
    field.checks === undefined
      ? {}
      : {
          checks: field.checks.map((check, index) => {
            const checkPath = `${path}.checks[${index}]`
            const when = map(check.when, `${checkPath}.when`)
            return check.message === undefined
              ? { ...check, when }
              : { ...check, when, message: mapCases(check.message, `${checkPath}.message`, map) }
          }),
        }
  return { ...withSettings, ...messages, ...checks }
}

const mapContainer = <TNode extends DocumentNode>(node: TNode, path: string, map: MapCondition) => {
  const description =
    'description' in node && node.description !== undefined
      ? { description: mapCases(node.description, `${path}.description`, map) }
      : {}
  const jumps =
    isStep(node) && node.next !== undefined
      ? {
          next: node.next.map((jump, index) => ({
            ...jump,
            when: map(jump.when, `${path}.next[${index}].when`),
          })),
        }
      : {}
  return { ...node, ...description, ...jumps }
}

/**
 * A step or item with every condition it holds itself mapped, in document order, the conditions
 * of the items inside it left as they are: its visibility, the cases of its texts and settings,
 * a field's `required`, error texts and checks, a computed value's expression and a step's jumps.
 * A reader collects them through `map`; an edit changes them.
 */
export function mapOwnConditions<TNode extends DocumentNode>(
  node: TNode,
  path: string,
  map: MapCondition,
): TNode {
  const visible =
    node.visibleWhen === undefined
      ? node
      : { ...node, visibleWhen: map(node.visibleWhen, pathTo.visibleWhen(path)) }
  if (!isLeaf(visible)) {
    return mapContainer(visible, path, map) as TNode
  }
  if (visible.type === 'computed') {
    return mapComputed(visible, path, map) as TNode
  }
  return (
    isField(visible) ? mapField(visible, path, map) : mapSettings(visible, path, map)
  ) as TNode
}
