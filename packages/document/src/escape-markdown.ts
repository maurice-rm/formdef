// Markdown may escape any ASCII punctuation with a backslash: !"#$%&'()*+,-./ :;<=>?@ [\]^_` {|}~
const ASCII_PUNCTUATION = /[!-/:-@[-`{-~]/g

// An indented line starts a code block, where escapes stay as written; a paragraph drops it anyway.
const LINE_INDENT = /^[ \t]+/gm

/** A text written so that Markdown renders it as it is, with no formatting, link or HTML. */
export function escapeMarkdown(text: string): string {
  return text.replace(LINE_INDENT, '').replace(ASCII_PUNCTUATION, '\\$&')
}
