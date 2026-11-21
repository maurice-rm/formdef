import type { FieldItem } from '../form-document'
import { ISSUE_PARAM_NAMES, type IssueParams, LABEL_PARAM } from '../issue-params'
import type { Text } from '../text'
import { checkTranslations } from './check-translations'
import { checkVaryingText } from './check-varying-text'
import type { CheckWalk } from './check-walk'
import { placeholdersOutside } from './placeholders-outside'
import { report } from './report'

type At = { walk: CheckWalk; path: string }

const isKnownCode = (code: string): code is keyof IssueParams =>
  Object.hasOwn(ISSUE_PARAM_NAMES, code)

// The params of a project's own code are its rule's, which the document cannot know.
const checkParams = (text: Text, { at, code }: { at: At; code: string }): void => {
  if (!isKnownCode(code)) {
    return
  }
  const allowed = [LABEL_PARAM, ...ISSUE_PARAM_NAMES[code]]
  for (const { placeholder, path } of placeholdersOutside(text, { path: at.path, allowed })) {
    report(at.walk, { code: 'unknownParam', path, params: { param: placeholder, code } })
  }
}

/**
 * Checks a field's own error texts: each against the document's languages, the conditions of a
 * text that follows an answer, and its placeholders against the params its code names.
 */
export function checkMessages(field: FieldItem, { walk, path }: At): void {
  for (const [code, text] of Object.entries(field.messages ?? {})) {
    checkVaryingText(text, { walk, path: `${path}.messages.${code}` }, (plain, at) => {
      checkTranslations(plain, at)
      checkParams(plain, { at, code })
    })
  }
}
