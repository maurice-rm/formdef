import { readFileSync } from 'node:fs'

import { apiPageOf, readCoreExports } from './core-exports'

/** A tag that names what it describes: a type parameter or a parameter. */
export type NamedTag = { name: string; text: string }

/** The TSDoc of one export, split into its summary and its block tags. */
export type TsDoc = {
  summary: string
  typeParams: NamedTag[]
  params: NamedTag[]
  defaultValues: string[]
  returns: string | undefined
  throws: string[]
  remarks: string | undefined
  examples: string[]
}

const COMMENT_LINE_PREFIX = /^\s*\* ?/
const BLOCK_TAG = /^@(\w+)\s*([\s\S]*)$/
const NAMED_TAG = /^(\S+)\s+-\s+([\s\S]*)$/
const INLINE_LINK = /\{@link\s+(\w+)\}/g

const declarationOf = (name: string): RegExp =>
  new RegExp(
    String.raw`/\*\*((?:(?!\*/)[\s\S])*)\*/\s*export (?:declare )?(?:const|function|type|interface) ${name}\b`,
  )

const linkedText = (text: string): string =>
  text.replace(INLINE_LINK, (_, target: string) => `[\`${target}\`](/api/${apiPageOf(target)})`)

const commentLinesOf = (comment: string): string[] =>
  comment
    .split('\n')
    .map((line) => line.replace(COMMENT_LINE_PREFIX, ''))
    .join('\n')
    .trim()
    .split('\n')

// A block tag runs until the next line that starts with `@`; lines inside a code fence never do.
const splitBlocks = (lines: string[]): string[] => {
  const blocks: string[][] = [[]]
  let isInFence = false
  for (const line of lines) {
    if (line.startsWith('```')) {
      isInFence = !isInFence
    }
    if (!isInFence && line.startsWith('@')) {
      blocks.push([])
    }
    blocks.at(-1)?.push(line)
  }

  return blocks.map((block) => block.join('\n').trim())
}

const namedTagOf = (text: string): NamedTag => {
  const match = NAMED_TAG.exec(text)

  return { name: match?.[1] ?? text, text: linkedText(match?.[2] ?? '') }
}

const addTag = (doc: TsDoc, block: string): void => {
  const [, tag = '', text = ''] = BLOCK_TAG.exec(block) ?? []
  switch (tag) {
    case 'typeParam':
      doc.typeParams.push(namedTagOf(text))
      break
    case 'param':
      doc.params.push(namedTagOf(text))
      break
    case 'defaultValue':
      doc.defaultValues.push(linkedText(text))
      break
    case 'returns':
      doc.returns = linkedText(text)
      break
    case 'throws':
      doc.throws.push(linkedText(text))
      break
    case 'remarks':
      doc.remarks = linkedText(text)
      break
    case 'example':
      doc.examples.push(text)
      break
    default:
      throw new Error(`formdef: the TSDoc reader does not know the tag @${tag}.`)
  }
}

const parse = (comment: string): TsDoc => {
  const [summary = '', ...tags] = splitBlocks(commentLinesOf(comment))
  const doc: TsDoc = {
    summary: linkedText(summary),
    typeParams: [],
    params: [],
    defaultValues: [],
    returns: undefined,
    throws: [],
    remarks: undefined,
    examples: [],
  }
  for (const block of tags) {
    addTag(doc, block)
  }

  return doc
}

/**
 * Reads the TSDoc of an export of `@formdef/core` from its source.
 *
 * @throws When `@formdef/core` has no export of that name, or its declaration carries no TSDoc.
 */
export const readTsDoc = (name: string): TsDoc => {
  const file = readCoreExports().get(name)
  if (file === undefined) {
    throw new Error(`formdef: @formdef/core has no export "${name}".`)
  }

  const comment = declarationOf(name).exec(readFileSync(file, 'utf8'))?.[1]
  if (comment === undefined) {
    throw new Error(`formdef: the export "${name}" in ${file} carries no TSDoc.`)
  }

  return parse(comment)
}
