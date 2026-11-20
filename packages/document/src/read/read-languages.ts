import { failAt } from '../fail-at'
import { readLanguageCode } from './read-language-code'
import { readList } from './read-list'

export function readLanguages(value: unknown, path: string): string[] {
  const languages = readList(value, path).map((entry, index) =>
    readLanguageCode(entry, `${path}[${index}]`),
  )
  if (languages.length === 0) {
    failAt(path, 'expected at least one language.')
  }
  languages.forEach((language, index) => {
    if (languages.indexOf(language) !== index) {
      failAt(`${path}[${index}]`, `the language "${language}" is listed twice.`)
    }
  })
  return languages
}
