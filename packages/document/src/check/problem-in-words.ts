import type { DocumentNode, FormDocument } from '../form-document'
import { isFollowing } from '../is-following'
import { isLeaf } from '../is-leaf'
import { isStep } from '../is-step'
import type { Position } from '../position'
import { positionOfPath } from '../position-of-path'
import { resolveFixedText } from '../resolve-fixed-text'
import type { VaryingText } from '../varying-text'
import type { FoundProblem, Problem, ProblemCode, ProblemParams } from './problem'
import { DEFAULT_PROBLEM_MESSAGES, type ProblemMessages } from './problem-messages'

type Wording = {
  document: FormDocument
  messages: ProblemMessages
  language: string | undefined
}

type Message = (params: ProblemParams[ProblemCode] & { label: string }) => string

const nodeAt = (document: FormDocument, position: Position): DocumentNode | undefined => {
  const [first, ...rest] = position
  let node: DocumentNode | undefined =
    first === undefined ? undefined : (document.steps ?? document.items)[first]
  for (const index of rest) {
    node = node === undefined || isLeaf(node) ? undefined : node.items[index]
  }
  return node
}

// A label that follows an answer names its fallback, as no answer is given while a form is built.
const labelText = (label: VaryingText, language: string | undefined): string =>
  resolveFixedText(isFollowing(label) ? label.otherwise : label, language)

const labelOf = (node: DocumentNode | undefined, language: string | undefined): string => {
  if (node === undefined || (!isStep(node) && (node.type === 'row' || node.type === 'block'))) {
    return ''
  }
  return labelText(node.label, language)
}

/**
 * A problem as {@link checkDocument} reports it: placed at the step or item it sits on, and put
 * into the project's text for its code, or the package's English one, with that item's label.
 */
export function problemInWords(found: FoundProblem, wording: Wording): Problem {
  const position = positionOfPath(found.path)
  const node = position === undefined ? undefined : nodeAt(wording.document, position)
  const label = labelOf(node, wording.language)
  // Each code's text takes that code's params; the union of codes cannot follow one of them.
  const message = (wording.messages[found.code] ?? DEFAULT_PROBLEM_MESSAGES[found.code]) as Message
  return {
    ...found,
    ...(position === undefined ? {} : { position }),
    message: message({ ...found.params, label }),
  }
}
