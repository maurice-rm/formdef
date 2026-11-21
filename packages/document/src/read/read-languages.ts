import { failAt } from '../fail-at'
import { readEach } from './read-each'
import { readLanguageCode } from './read-language-code'

export function readLanguages(value: unknown, path: string): string[] {
  const languages = readEach(value, path, readLanguageCode)
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
