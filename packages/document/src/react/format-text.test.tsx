// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { formatText, formatTextWithoutLinks } from './format-text'

afterEach(cleanup)

const htmlOf = (markdown: string, format = formatText): string => {
  const { container } = render(<p>{format(markdown)}</p>)
  return container.innerHTML
}

describe('formatText', () => {
  it('renders nothing for a text that is empty or blank, such as a placeholder not answered yet', () => {
    for (const format of [formatText, formatTextWithoutLinks]) {
      expect(format('')).toBeNull()
      expect(format('  \n')).toBeNull()
    }
  })

  it('renders bold and italics', () => {
    expect(htmlOf('A **bold** and an *italic* word')).toBe(
      '<p>A <strong>bold</strong> and an <em>italic</em> word</p>',
    )
  })

  it('renders a link to an https or mailto address, and none to anything else', () => {
    expect(htmlOf('[Privacy](https://example.com/privacy)')).toBe(
      '<p><a href="https://example.com/privacy" rel="noreferrer">Privacy</a></p>',
    )
    expect(htmlOf('[Write](mailto:office@example.com)')).toBe(
      '<p><a href="mailto:office@example.com" rel="noreferrer">Write</a></p>',
    )
    expect(htmlOf('[Run](javascript:alert(1))')).toBe('<p>Run</p>')
    expect(htmlOf('[Old](http://example.com)')).toBe('<p>Old</p>')
  })

  it('renders paragraphs as blocks that fit inside a paragraph', () => {
    const html = htmlOf('First part.\n\nSecond part.')

    expect(html).not.toContain('<p><p')
    expect(html).toBe(
      '<p><span style="display: block;">First part.</span><span style="display: block;">Second part.</span></p>',
    )
  })

  it('keeps HTML as text, and renders other Markdown as its text', () => {
    const html = htmlOf('<b>bold</b> <script>alert(1)</script>')
    expect(html).not.toContain('<b>')
    expect(html).not.toContain('<script')
    expect(htmlOf('# Heading')).toBe('<p>Heading</p>')
    expect(htmlOf('![Logo](https://example.com/logo.png)')).toBe('<p>Logo</p>')
    expect(htmlOf('Use `code` here')).toBe('<p>Use code here</p>')
  })

  it('renders a footnote without a footer of its own', () => {
    const html = htmlOf('x[^1]\n\n[^1]: note')

    expect(html).not.toContain('<footer')
    expect(html).not.toContain('<div')
    expect(html).not.toContain(' id=')
  })

  it('renders a table as its text, row by row', () => {
    expect(htmlOf('| a | b |\n|---|---|\n| 1 | 2 |')).toBe(
      '<p><span style="display: block;">a b</span><span style="display: block;">1 2</span></p>',
    )
  })
})

describe('formatTextWithoutLinks', () => {
  it('renders a link as its text', () => {
    expect(htmlOf('See [privacy](https://example.com) **now**', formatTextWithoutLinks)).toBe(
      '<p>See privacy <strong>now</strong></p>',
    )
  })
})
