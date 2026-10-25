import { type AnyFormApi, createFormHook, createFormHookContexts } from '@tanstack/react-form'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { type ReactNode, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ArrayFrameProps } from '../config/structure'
import type { FieldOf } from '../widget/field-of'
import { Fields } from './fields'

const { fieldContext, formContext } = createFormHookContexts()

type TextFieldProps = FieldOf<string> & { label: string; hint?: string }

const TextField = ({ field, label, hint }: TextFieldProps): ReactNode => {
  const [marks, setMarks] = useState(0)

  return (
    <div>
      <label>
        {label}
        <input
          name={field.name}
          value={field.state.value}
          onChange={(event) => field.handleChange(event.target.value)}
        />
      </label>
      {hint !== undefined && <small>{hint}</small>}
      <button type="button" onClick={() => setMarks(marks + 1)}>
        {`Mark ${field.state.value} (${marks})`}
      </button>
    </div>
  )
}

type Contact = { name: string; email: string }
type Address = { book: Contact[]; tags: string[] }

type FrameProps = ArrayFrameProps<Contact, { hint: string }> & { title: string }

let frameRenders = 0

const Frame = ({
  field,
  keys,
  renderItem,
  addLabel,
  removeLabels,
  add,
  remove,
  insert,
  move,
  swap,
  replace,
  clear,
  title,
}: FrameProps): ReactNode => {
  frameRenders += 1

  return (
    <section aria-label={title}>
      {keys.map((key, index) => (
        <div key={key}>
          {renderItem(index, { hint: `Item ${index + 1}` })}
          <button type="button" onClick={() => remove(index)}>
            {removeLabels[index]}
          </button>
        </div>
      ))}
      <button type="button" onClick={add}>
        {addLabel}
      </button>
      <button type="button" onClick={() => insert(0)}>
        Insert first
      </button>
      <button type="button" onClick={() => move(0, 1)}>
        Move first down
      </button>
      <button type="button" onClick={() => swap(0, 1)}>
        Swap
      </button>
      <button type="button" onClick={() => replace(0, { name: 'Replaced', email: '' })}>
        Replace first
      </button>
      <button type="button" onClick={clear}>
        Clear
      </button>
      <output>{field.state.value.length}</output>
    </section>
  )
}

const widgets = { text: TextField }

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: widgets,
  formComponents: {},
})

const PARTS = { widgets, formComponents: {}, structure: {} }
const PARTS_WITH_FRAME = { widgets, formComponents: {}, structure: { arrayFrame: Frame } }

const DEFAULT_VALUES: Address = {
  book: [
    { name: 'Ada', email: 'ada@example.com' },
    { name: 'Grace', email: 'grace@example.com' },
  ],
  tags: ['friend'],
}

type BookFormProps = {
  fields: Record<string, object>
  parts?: typeof PARTS | typeof PARTS_WITH_FRAME
  defaultValues?: Address
}

let form: AnyFormApi | undefined

const BookForm = ({
  fields,
  parts = PARTS,
  defaultValues = DEFAULT_VALUES,
}: BookFormProps): ReactNode => {
  const instance = useAppForm({ defaultValues })
  form = instance

  return (
    <instance.AppForm>
      <Fields parts={parts} form={instance} fields={fields} />
    </instance.AppForm>
  )
}

const newContact = (): Contact => ({ name: '', email: '' })

const nameItem = { widget: 'text', props: { label: 'Name' } }

const bookEntry = (item: object, rest: object = {}): Record<string, object> => ({
  book: {
    item,
    newItem: newContact,
    addLabel: 'Add contact',
    removeLabel: (contact: Contact, index: number) => `Remove ${contact.name || index + 1}`,
    ...rest,
  },
})

const inputNames = (): (string | null)[] =>
  screen.getAllByRole('textbox').map((input) => input.getAttribute('name'))

const contactItem = { fields: { name: nameItem } }

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  form = undefined
})

describe('an array entry without a frame', () => {
  it('renders each item, a remove button per item and one add button, in that order', () => {
    const { container } = render(<BookForm fields={bookEntry(contactItem)} />)

    expect(inputNames()).toEqual(['book[0].name', 'book[1].name'])
    const buttons = [...container.querySelectorAll('[data-formdef-remove], [data-formdef-add]')]
    expect(buttons.map((button) => button.textContent)).toEqual([
      'Remove Ada',
      'Remove Grace',
      'Add contact',
    ])
    expect(buttons.every((button) => button.getAttribute('type') === 'button')).toBe(true)
  })

  it('names every remove button alike when the label is a string', () => {
    render(<BookForm fields={bookEntry(contactItem, { removeLabel: 'Remove contact' })} />)

    expect(screen.getAllByRole('button', { name: 'Remove contact' })).toHaveLength(2)
  })

  it('appends a new item and removes the item of its button', () => {
    render(<BookForm fields={bookEntry(contactItem)} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add contact' }))
    expect(form?.state.values.book).toEqual([...DEFAULT_VALUES.book, newContact()])

    fireEvent.click(screen.getByRole('button', { name: 'Remove Ada' }))
    expect(form?.state.values.book).toEqual([DEFAULT_VALUES.book[1], newContact()])
  })

  it('renders an item of every shape at its path', () => {
    render(
      <BookForm
        fields={{
          ...bookEntry({
            fields: { name: nameItem, email: { widget: 'text', props: { label: 'Email' } } },
          }),
          tags: {
            item: {
              render: (field: FieldOf<string>['field']) => <output>{field.name}</output>,
            },
            newItem: () => '',
            addLabel: 'Add tag',
            removeLabel: 'Remove tag',
          },
        }}
      />,
    )

    expect(inputNames()).toEqual(['book[0].name', 'book[0].email', 'book[1].name', 'book[1].email'])
    expect(screen.getByRole('status').textContent).toBe('tags[0]')
  })

  it('renders a leaf item at its path', () => {
    render(
      <BookForm
        defaultValues={{ ...DEFAULT_VALUES, tags: [] }}
        fields={{
          tags: {
            item: nameItem,
            newItem: () => '',
            addLabel: 'Add tag',
            removeLabel: 'Remove tag',
          },
        }}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Add tag' }))

    expect(inputNames()).toEqual(['tags[0]'])
  })

  it('hides while its condition fails', () => {
    render(<BookForm fields={bookEntry(contactItem, { visibleWhen: () => false })} />)

    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
  })
})

describe('an array entry with a registered frame', () => {
  const renderFramed = (rest: object = {}): void => {
    render(
      <BookForm
        parts={PARTS_WITH_FRAME}
        fields={bookEntry(contactItem, { props: { title: 'Contacts' }, ...rest })}
      />,
    )
  }

  const click = (name: string): void => {
    fireEvent.click(screen.getByRole('button', { name }))
  }

  const names = (): string[] => {
    const book: Contact[] = form?.state.values.book ?? []

    return book.map(({ name }) => name)
  }

  it('hands the frame the array field, its labels and the props of the entry', () => {
    renderFramed()

    const frame = screen.getByRole('region', { name: 'Contacts' })
    expect(within(frame).getByRole('status').textContent).toBe('2')
    expect(within(frame).getByRole('button', { name: 'Remove Grace' })).toBeDefined()
    expect(within(frame).getByRole('button', { name: 'Add contact' })).toBeDefined()
  })

  it('derives the props of the frame from the values', () => {
    renderFramed({ props: (values: Address) => ({ title: `${values.book.length} contacts` }) })

    click('Add contact')

    expect(screen.getByRole('region', { name: '3 contacts' })).toBeDefined()
  })

  it("runs each of TanStack's array operations", () => {
    renderFramed()

    click('Insert first')
    expect(names()).toEqual(['', 'Ada', 'Grace'])
    click('Move first down')
    expect(names()).toEqual(['Ada', '', 'Grace'])
    click('Swap')
    expect(names()).toEqual(['', 'Ada', 'Grace'])
    click('Replace first')
    expect(names()).toEqual(['Replaced', 'Ada', 'Grace'])
    click('Remove Ada')
    expect(names()).toEqual(['Replaced', 'Grace'])
    click('Add contact')
    expect(names()).toEqual(['Replaced', 'Grace', ''])
    click('Clear')
    expect(names()).toEqual([])
  })

  it('carries widget state along a reorder when the entry keys its items', () => {
    renderFramed({ itemKey: (contact: Contact) => contact.name })

    click('Mark Ada (0)')
    click('Move first down')

    expect(screen.getByRole('button', { name: 'Mark Ada (1)' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Mark Grace (0)' })).toBeDefined()
  })

  it('renders the frame again when the list changes, not when an item does', () => {
    renderFramed({ removeLabel: 'Remove contact' })
    frameRenders = 0

    const [firstName] = screen.getAllByLabelText('Name')
    fireEvent.change(firstName as HTMLElement, { target: { value: 'Ada Lovelace' } })
    expect(frameRenders).toBe(0)

    click('Add contact')
    expect(frameRenders).toBe(1)
  })

  it('keeps a remove label that names the item current while the item changes', () => {
    renderFramed()

    const [firstName] = screen.getAllByLabelText('Name')
    fireEvent.change(firstName as HTMLElement, { target: { value: 'Ada Lovelace' } })

    expect(screen.getByRole('button', { name: 'Remove Ada Lovelace' })).toBeDefined()
  })

  it('keeps widget state at its position when the entry does not key its items', () => {
    renderFramed()

    click('Mark Ada (0)')
    click('Move first down')

    expect(screen.getByRole('button', { name: 'Mark Grace (1)' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Mark Ada (0)' })).toBeDefined()
  })
})

describe('the extra props of a frame', () => {
  const renderExtra = (item: object): void => {
    render(
      <BookForm
        parts={PARTS_WITH_FRAME}
        fields={bookEntry(item, { props: { title: 'Contacts' } })}
      />,
    )
  }

  it('reach the widget of a leaf item', () => {
    renderExtra(nameItem)

    expect(screen.getByText('Item 2')).toBeDefined()
  })

  it('reach the one field of an object item without a layout', () => {
    renderExtra(contactItem)

    expect(screen.getByText('Item 2')).toBeDefined()
  })

  it('are dropped with one warning per entry when the item has no single widget', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    renderExtra({
      fields: { name: nameItem, email: { widget: 'text', props: { label: 'Email' } } },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Add contact' }))

    expect(screen.queryByText('Item 1')).toBeNull()
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(
      'formdef: the array frame of "book" passes extra props to an item that has no single widget to receive them; they are dropped.',
    )
  })

  it('are dropped without a warning in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    renderExtra({ ...contactItem, layout: ['name'] })

    expect(screen.queryByText('Item 1')).toBeNull()
    expect(warn).not.toHaveBeenCalled()
  })
})
