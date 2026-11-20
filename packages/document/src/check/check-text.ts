import type { Text } from '../text'
import type { CheckWalk } from './check-walk'
import { report } from './report'

const NO_LANGUAGES: readonly string[] = []

/**
 * Checks a text against the document's languages: translations into a language it does not
 * name, and languages a translated text leaves out. A string holds for every language.
 */
export function checkText(text: Text, { walk, path }: { walk: CheckWalk; path: string }): void {
  if (typeof text === 'string') {
    return
  }
  const languages = walk.languages ?? NO_LANGUAGES
  for (const language of Object.keys(text)) {
    if (!languages.includes(language)) {
      report(walk, { code: 'unknownLanguage', path: `${path}.${language}`, params: { language } })
    }
  }
  for (const language of languages) {
    if (!Object.hasOwn(text, language)) {
      report(walk, { code: 'missingTranslation', path, params: { language } })
    }
  }
}
