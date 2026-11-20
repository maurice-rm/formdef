import { escapeMarkdown } from '../escape-markdown'
import { fillPlaceholders } from '../fill-placeholders'
import type { VaryingText } from '../varying-text'
import type { Answers } from './answers'
import { chooseText } from './choose-text'

/**
 * A formatted text, written in Markdown, resolved like {@link resolveVaryingText}, but with each
 * answer escaped, so that what a person typed renders as text and never as formatting or a link.
 */
export function resolveFormattedText(
  text: VaryingText,
  context: { answers: Answers; language: string | undefined },
): string {
  return fillPlaceholders(chooseText(text, context), (key) =>
    escapeMarkdown(context.answers.get(key)?.text ?? ''),
  )
}
