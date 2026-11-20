import { OWNED_FILES } from './owned-files'
import type { RegistryFile } from './registry-item'

const ANY = /(?:[:<,|&=(]|\bas|\bextends)\s*any\b|\bany\[\]/
const DIRECTIVE = /(?:\/\/|\/\*+)\s*(?:@ts-|biome-ignore|eslint-)|\/\/\/\s*<reference/
const COMMENT = /(?:^|[^:])\/\/|\/\*/

/**
 * What a shipped file breaks of the rules for code that lands in someone else's project: `any`,
 * a lint or compiler directive, or a comment outside the files a project owns.
 */
export function conventionProblems(file: RegistryFile, source: string): string[] {
  const hasDirective = DIRECTIVE.test(source)
  const hasComment = !(hasDirective || OWNED_FILES.has(file.path)) && COMMENT.test(source)

  return [
    ...(ANY.test(source) ? [`${file.path} uses any`] : []),
    ...(hasDirective ? [`${file.path} carries a directive`] : []),
    ...(hasComment ? [`${file.path} carries a comment`] : []),
  ]
}
