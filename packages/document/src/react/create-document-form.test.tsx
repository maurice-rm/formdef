// @vitest-environment jsdom
// The other tests run without a DOM, as the root entry runs on a server.
import {
  type ArrayFrameProps,
  createRegistry,
  type FieldOf,
  type RowProps,
  type SectionProps,
  type StepperProps,
  useFieldParts,
} from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { DocumentItem, FieldItem, FormDocument, RepeatItem } from '../form-document'
import { createCatalog } from '../kinds/create-catalog'
import { defineBlockKind } from '../kinds/define-block-kind'
import { defineDisplayKind } from '../kinds/define-display-kind'
import { defineFieldKind } from '../kinds/define-field-kind'
import { setting } from '../kinds/setting'
import { valueTypes } from '../kinds/value-types'
import { createDocumentForm } from './create-document-form'

type Option = { value: string; label: string; description?: ReactNode }

type LabelProps = { label: string; description?: ReactNode; required?: boolean }

const TextField = ({
  field,
  label,
  description,
  required,
  suffix,
}: FieldOf<string> & LabelProps & { suffix?: string }): ReactNode => {
  const { control, isErrorDue, errors } = useFieldParts(field)
  return (
    <div>
      <label htmlFor={control.id}>{required ? `${label} *` : label}</label>
      {description !== undefined && <p>{description}</p>}
      <input
        {...control}
        value={field.state.value}
        onChange={(event) => field.handleChange(event.target.value)}
      />
      {suffix !== undefined && <span>{`in ${suffix}`}</span>}
      {isErrorDue && <p role="alert">{errors.join(' ')}</p>}
    </div>
  )
}
TextField.emptyValue = ''

const ChoiceField = ({
  field,
  label,
  options,
}: FieldOf<string> & LabelProps & { options: Option[] }): ReactNode => {
  const { control } = useFieldParts(field)
  return (
    <div>
      <label htmlFor={control.id}>{label}</label>
      <select
        {...control}
        value={field.state.value}
        onChange={(event) => field.handleChange(event.target.value)}
      >
        <option value="">None</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {options.map(
        (option) =>
          option.description !== undefined && <p key={option.value}>{option.description}</p>,
      )}
    </div>
  )
}
ChoiceField.emptyValue = ''

const Stepper = ({
  steps,
  next,
  isLast,
  children,
}: StepperProps<{ description?: ReactNode }>): ReactNode => (
  <section aria-label="Stepper">
    <ol>
      {steps.map((step) => (
        <li key={step.label} aria-current={step.isCurrent ? 'step' : undefined}>
          {step.label}
          {step.description !== undefined && <>: {step.description}</>}
        </li>
      ))}
    </ol>
    {children}
    <button type="button" onClick={next}>
      {isLast ? 'Submit' : 'Next'}
    </button>
  </section>
)

const Notice = ({ children }: { children: ReactNode }): ReactNode => (
  <aside aria-label="Notice">{children}</aside>
)

const { fieldContext, formContext } = createFormHookContexts()
const registry = createRegistry({
  fieldContext,
  formContext,
  widgets: { text: TextField, choice: ChoiceField },
  formComponents: { notice: Notice },
  structure: { stepper: Stepper },
})

const notice = defineBlockKind(registry, {
  name: 'notice',
  label: 'Notice',
  component: 'notice',
  settings: { body: setting.text({ label: 'Text', required: true }) },
  props: ({ body }) => ({ children: body }),
})

const callout = defineBlockKind(registry, {
  name: 'callout',
  label: 'Callout',
  component: 'notice',
  settings: { body: setting.text({ label: 'Text', required: true, formatted: true }) },
  props: ({ body }) => ({ children: body }),
})

const fieldKinds = [
  defineFieldKind(registry, {
    name: 'text',
    label: 'Text',
    widget: 'text',
    valueType: valueTypes.text,
  }),
  defineFieldKind(registry, {
    name: 'measure',
    label: 'Measure',
    widget: 'text',
    valueType: valueTypes.decimal,
    settings: { unit: setting.text({ label: 'Unit', required: true, varies: true }) },
    props: ({ unit }) => ({ suffix: unit }),
  }),
  defineFieldKind(registry, {
    name: 'choice',
    label: 'Choice',
    widget: 'choice',
    valueType: valueTypes.choice,
    settings: { options: setting.options({ label: 'Options' }) },
    props: ({ options }) => ({ options }),
  }),
]
const catalog = createCatalog(registry, { fields: fieldKinds, blocks: [notice, callout] })

const field = (key: string, kind: string, extra: Partial<FieldItem> = {}): FieldItem => ({
  type: 'field',
  key,
  kind,
  label: key,
  ...extra,
})

const houseType = field('house', 'choice', {
  label: 'House type',
  settings: {
    options: [
      { value: 'o1', label: 'Detached' },
      { value: 'o2', label: 'Apartment block' },
    ],
  },
})
const isApartmentBlock = { field: 'house', op: 'equals', value: 'o2' } as const

const plain = (...items: DocumentItem[]): FormDocument => ({ format: 1, items })

const choose = async (label: string, value: string): Promise<void> => {
  await act(async () => {
    fireEvent.change(screen.getByLabelText(label), { target: { value } })
  })
}

const type = async (label: string, value: string): Promise<void> => {
  await act(async () => {
    const input = screen.getByLabelText(label)
    fireEvent.change(input, { target: { value } })
    fireEvent.blur(input)
  })
}

const click = async (name: string): Promise<void> => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name }))
  })
}

afterEach(() => {
  cleanup()
})

describe('createDocumentForm without steps', () => {
  it('renders each field with its label, description and whether it is required', () => {
    const Form = createDocumentForm(
      plain(
        field('name', 'text', { label: 'Name', description: 'As on the bell', required: true }),
      ),
      catalog,
    )
    render(<Form />)

    expect(screen.getByLabelText('Name *')).toBeDefined()
    expect(screen.getByText('As on the bell')).toBeDefined()
  })

  it('renders labels, descriptions, options and text settings in the language chosen', () => {
    const translated: FormDocument = {
      format: 1,
      languages: ['de', 'en'],
      items: [
        field('house', 'choice', {
          label: { de: 'Haustyp', en: 'House type' },
          settings: {
            options: [
              { value: 'o1', label: { de: 'Einfamilienhaus', en: 'Detached' } },
              { value: 'o2', label: 'Bungalow' },
            ],
          },
        }),
        field('area', 'measure', {
          label: { de: 'Fläche', en: 'Area' },
          description: { de: 'Beheizt', en: 'Heated' },
          settings: { unit: { de: 'Quadratmeter', en: 'square metres' } },
        }),
      ],
    }
    const Form = createDocumentForm(translated, catalog, { language: 'en' })
    render(<Form />)

    expect(screen.getByLabelText('House type')).toBeDefined()
    expect(screen.getByRole('option', { name: 'Detached' })).toBeDefined()
    expect(screen.getByRole('option', { name: 'Bungalow' })).toBeDefined()
    expect(screen.getByLabelText('Area')).toBeDefined()
    expect(screen.getByText('Heated')).toBeDefined()
    expect(screen.getByText('in square metres')).toBeDefined()
  })

  it('updates labels, descriptions and options that follow an answer', async () => {
    const follows = (yes: string, no: string) => ({
      cases: [{ when: isApartmentBlock, value: yes }],
      otherwise: no,
    })
    const Form = createDocumentForm(
      plain(
        houseType,
        field('flats', 'text', {
          label: follows('Number of flats', 'Number of rooms'),
          description: follows('All flats', 'All rooms'),
        }),
        field('heating', 'choice', {
          label: 'Heating',
          settings: { options: [{ value: 'h1', label: follows('Central', 'Own') }] },
        }),
      ),
      catalog,
    )
    render(<Form />)

    expect(screen.getByLabelText('Number of rooms')).toBeDefined()
    expect(screen.getByText('All rooms')).toBeDefined()
    expect(screen.getByRole('option', { name: 'Own' })).toBeDefined()

    await choose('House type', 'o2')

    expect(screen.getByLabelText('Number of flats')).toBeDefined()
    expect(screen.getByText('All flats')).toBeDefined()
    expect(screen.getByRole('option', { name: 'Central' })).toBeDefined()
  })

  it('fills placeholders with earlier answers as they change', async () => {
    const Form = createDocumentForm(
      plain(
        houseType,
        field('name', 'text', { label: 'Name' }),
        field('area', 'measure', {
          label: 'Area of the {house}',
          description: 'Owned by {name}.',
          settings: { unit: 'm² ({{approx}})' },
        }),
      ),
      catalog,
    )
    render(<Form />)

    expect(screen.getByLabelText('Area of the')).toBeDefined()

    await choose('House type', 'o2')
    await type('Name', 'Ada')

    expect(screen.getByLabelText('Area of the Apartment block')).toBeDefined()
    expect(screen.getByText('Owned by Ada.')).toBeDefined()
    expect(screen.getByText('in m² ({approx})')).toBeDefined()
  })

  it('renders the formatting of descriptions, of fields and of options', () => {
    const Form = createDocumentForm(
      plain(
        field('name', 'text', {
          label: 'Name',
          description: 'As on the **bell**, see [why](https://example.com/why).',
        }),
        field('house', 'choice', {
          label: 'House',
          settings: {
            options: [{ value: 'o1', label: 'Detached', description: 'With a *garden*' }],
          },
        }),
      ),
      catalog,
    )
    render(<Form />)

    expect(screen.getByText('bell').tagName).toBe('STRONG')
    expect(screen.getByText('garden').tagName).toBe('EM')
    expect(screen.getByRole('link', { name: 'why' }).getAttribute('href')).toBe(
      'https://example.com/why',
    )
  })

  it('fills placeholders in formatted texts with answers as typed, never as formatting', async () => {
    const Form = createDocumentForm(
      plain(
        field('name', 'text', { label: 'Name' }),
        field('note', 'text', { label: 'Note', description: 'From {name}, **checked**.' }),
        field('house', 'choice', {
          label: 'House',
          settings: { options: [{ value: 'o1', label: 'Detached', description: 'Of {name}' }] },
        }),
      ),
      catalog,
    )
    render(<Form />)

    await type('Name', '[Ada](https://example.com) *x*')

    expect(screen.queryByRole('link')).toBeNull()
    expect(
      screen.getByText('From [Ada](https://example.com) *x*, ', { exact: false }),
    ).toBeDefined()
    expect(screen.getByText('Of [Ada](https://example.com) *x*')).toBeDefined()
    expect(screen.getByText('checked').tagName).toBe('STRONG')
  })

  it('fills an indented answer into a formatted text as text, not as code', async () => {
    const Form = createDocumentForm(
      plain(
        field('name', 'text', { label: 'Name' }),
        field('note', 'text', { label: 'Note', description: '{name}' }),
      ),
      catalog,
    )
    render(<Form />)

    await type('Name', '    a.b')

    expect(screen.getByText('a.b')).toBeDefined()
  })

  it('renders no control for a computed value, and fills its placeholder as it changes', async () => {
    const Form = createDocumentForm(
      plain(
        field('rooms', 'text', { label: 'Rooms' }),
        {
          type: 'row',
          items: [
            {
              type: 'computed',
              key: 'total',
              label: 'Total',
              valueType: 'text',
              expression: { op: 'otherwise', args: [{ field: 'rooms' }, { value: 'none' }] },
            },
          ],
        },
        field('note', 'text', { label: 'Note', description: 'For {total} rooms.' }),
      ),
      catalog,
    )
    render(<Form />)

    expect(screen.getAllByRole('textbox')).toHaveLength(2)
    expect(screen.getByText('For none rooms.')).toBeDefined()

    await type('Rooms', '4')

    expect(screen.getByText('For 4 rooms.')).toBeDefined()
  })

  it('renders in the first language without one chosen', () => {
    const translated: FormDocument = {
      format: 1,
      languages: ['de', 'en'],
      items: [field('name', 'text', { label: { de: 'Name', en: 'Full name' } })],
    }
    const Form = createDocumentForm(translated, catalog)
    render(<Form />)

    expect(screen.getByLabelText('Name')).toBeDefined()
  })

  it('shows fields, rows and sections as the answers meet their conditions', async () => {
    const Form = createDocumentForm(
      plain(
        houseType,
        field('flats', 'text', { label: 'Flats', visibleWhen: isApartmentBlock }),
        {
          type: 'row',
          visibleWhen: isApartmentBlock,
          items: [field('floors', 'text', { label: 'Floors' })],
        },
        {
          type: 'section',
          label: 'Insulation',
          visibleWhen: isApartmentBlock,
          items: [field('roof', 'text', { label: 'Roof' })],
        },
      ),
      catalog,
    )
    render(<Form />)

    expect(screen.queryByLabelText('Flats')).toBeNull()
    expect(screen.queryByLabelText('Floors')).toBeNull()
    expect(screen.queryByText('Insulation')).toBeNull()

    await choose('House type', 'o2')

    expect(screen.getByLabelText('Flats')).toBeDefined()
    expect(screen.getByLabelText('Floors')).toBeDefined()
    expect(screen.getByText('Insulation')).toBeDefined()
    expect(screen.getByLabelText('Roof')).toBeDefined()
  })

  it('updates a required condition and a setting that follows an answer', async () => {
    const Form = createDocumentForm(
      plain(
        houseType,
        field('area', 'measure', {
          label: 'Area',
          required: isApartmentBlock,
          settings: {
            unit: { cases: [{ when: isApartmentBlock, value: 'm²' }], otherwise: 'ft²' },
          },
        }),
      ),
      catalog,
    )
    render(<Form />)

    expect(screen.getByLabelText('Area')).toBeDefined()
    expect(screen.getByText('in ft²')).toBeDefined()

    await choose('House type', 'o2')

    expect(screen.getByLabelText('Area *')).toBeDefined()
    expect(screen.getByText('in m²')).toBeDefined()
  })

  it("validates with the document's validator and submits the answers of shown fields", async () => {
    const onSubmit = vi.fn()
    const Form = createDocumentForm(
      plain(
        houseType,
        field('name', 'text', { label: 'Name', required: true }),
        field('flats', 'text', { label: 'Flats', visibleWhen: isApartmentBlock }),
      ),
      catalog,
      { messages: { required: () => 'Pflichtfeld' } },
    )
    render(<Form aria-label="Order" options={{ onSubmit: ({ value }) => onSubmit(value) }} />)
    const submit = async (): Promise<void> => {
      await act(async () => {
        fireEvent.submit(screen.getByRole('form', { name: 'Order' }))
      })
    }

    await submit()
    expect(screen.getByRole('alert').textContent).toBe('Pflichtfeld')
    expect(onSubmit).not.toHaveBeenCalled()

    await choose('House type', 'o1')
    await type('Name *', 'Ada')
    await submit()
    expect(onSubmit).toHaveBeenCalledWith({ house: 'o1', name: 'Ada', flats: '' })
  })

  it('validates when the validation option says, here on every change', async () => {
    const document = plain(field('name', 'text', { label: 'Name', required: true }))
    const OnChange = createDocumentForm(document, catalog, { validation: { mode: 'onChange' } })
    const OnSubmit = createDocumentForm(document, catalog)

    render(<OnChange />)
    await type('Name *', 'Ada')
    await type('Name *', '')
    expect(screen.getByRole('alert').textContent).toBe('This field is required.')

    cleanup()
    render(<OnSubmit />)
    await type('Name *', 'Ada')
    await type('Name *', '')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('refuses a document with problems', () => {
    expect(() => createDocumentForm(plain(field('name', 'signature')), catalog)).toThrow(
      'formdef: document: the document has 1 problem; checkDocument lists it.',
    )
  })
})

describe('createDocumentForm with endings', () => {
  const withEndings: FormDocument = {
    format: 1,
    items: [houseType, field('name', 'text', { label: 'Name' })],
    endings: [
      {
        key: 'block',
        when: isApartmentBlock,
        items: [
          {
            type: 'block',
            key: 'b1',
            kind: 'callout',
            settings: { body: 'Thanks, **{name}**. We will call the caretaker.' },
          },
        ],
      },
      {
        key: 'thanks',
        items: [
          { type: 'block', key: 'b2', kind: 'notice', settings: { body: 'Thanks, {name}.' } },
        ],
      },
    ],
  }
  const submit = async (): Promise<void> => {
    await act(async () => {
      fireEvent.submit(screen.getByRole('form', { name: 'Order' }))
    })
  }

  it('shows the ending that applies in place of the form once it is submitted', async () => {
    const onSubmit = vi.fn()
    const Form = createDocumentForm(withEndings, catalog)
    render(<Form aria-label="Order" options={{ onSubmit: ({ value }) => onSubmit(value) }} />)

    await choose('House type', 'o2')
    await type('Name', 'Ada')
    await submit()

    expect(onSubmit).toHaveBeenCalledOnce()
    expect(screen.queryByRole('form', { name: 'Order' })).toBeNull()
    const notice = screen.getByRole('complementary', { name: 'Notice' })
    expect(notice.textContent).toBe('Thanks, Ada. We will call the caretaker.')
    expect(screen.getByText('Ada').tagName).toBe('STRONG')
    expect(notice.closest('[tabindex="-1"]')).toBe(document.activeElement)
  })

  it('keeps the form when the ending that applies shows none of its blocks', async () => {
    const hidden: FormDocument = {
      ...withEndings,
      endings: [
        {
          key: 'thanks',
          items: [
            {
              type: 'block',
              key: 'b1',
              kind: 'notice',
              settings: { body: 'Thanks.' },
              visibleWhen: isApartmentBlock,
            },
          ],
        },
      ],
    }
    const Form = createDocumentForm(hidden, catalog)
    render(<Form aria-label="Order" />)

    await submit()

    expect(screen.getByRole('form', { name: 'Order' })).toBeDefined()
  })

  it('keeps the form until onSubmit is done, and when the project shows the ending itself', async () => {
    let finish = (): void => undefined
    const Slow = createDocumentForm(withEndings, catalog)
    const { unmount } = render(
      <Slow
        aria-label="Order"
        options={{
          onSubmit: () =>
            new Promise<void>((resolve) => {
              finish = resolve
            }),
        }}
      />,
    )
    await submit()
    expect(screen.getByRole('form', { name: 'Order' })).toBeDefined()
    await act(async () => {
      finish()
    })
    expect(screen.queryByRole('form', { name: 'Order' })).toBeNull()
    unmount()

    const Own = createDocumentForm(withEndings, catalog, { showsEnding: false })
    render(<Own aria-label="Order" />)
    await submit()
    expect(screen.getByRole('form', { name: 'Order' })).toBeDefined()
  })
})

const StartButton = ({ label, onStart }: { label: string; onStart: () => void }): ReactNode => (
  <button type="button" onClick={onStart}>
    {`${label} now`}
  </button>
)

describe('createDocumentForm with an intro', () => {
  const withIntro: FormDocument = {
    format: 1,
    intro: {
      items: [
        { type: 'block', key: 'b1', kind: 'callout', settings: { body: 'Takes **5** minutes.' } },
      ],
      start: 'Begin',
    },
    items: [field('name', 'text', { label: 'Name' })],
  }

  it('shows the intro and its start button, then the form, which takes the focus', async () => {
    const Form = createDocumentForm(withIntro, catalog)
    render(<Form aria-label="Order" />)

    expect(screen.getByRole('complementary', { name: 'Notice' }).textContent).toBe(
      'Takes 5 minutes.',
    )
    expect(screen.queryByRole('form', { name: 'Order' })).toBeNull()

    await click('Begin')

    const form = screen.getByRole('form', { name: 'Order' })
    expect(screen.queryByRole('complementary', { name: 'Notice' })).toBeNull()
    expect(form.parentElement).toBe(document.activeElement)
  })

  it("renders the project's start button", async () => {
    const Form = createDocumentForm(withIntro, catalog, { startButton: StartButton })
    render(<Form aria-label="Order" />)

    await click('Begin now')

    expect(screen.getByRole('form', { name: 'Order' })).toBeDefined()
  })
})

describe('createDocumentForm with blocks', () => {
  it('renders a block through its form component, as its condition and placeholders say', async () => {
    const Form = createDocumentForm(
      plain(houseType, {
        type: 'row',
        items: [
          field('name', 'text', { label: 'Name' }),
          {
            type: 'block',
            key: 'b1',
            kind: 'notice',
            settings: { body: 'Hello {name}, in the {house}.' },
            visibleWhen: isApartmentBlock,
          },
        ],
      }),
      catalog,
    )
    render(<Form />)

    expect(screen.queryByRole('complementary', { name: 'Notice' })).toBeNull()

    await choose('House type', 'o2')
    await type('Name', 'Ada')

    expect(screen.getByRole('complementary', { name: 'Notice' }).textContent).toBe(
      'Hello Ada, in the Apartment block.',
    )
  })

  it('renders the formatting of a formatted text setting, with answers as typed', async () => {
    const Form = createDocumentForm(
      plain(field('name', 'text', { label: 'Name' }), {
        type: 'block',
        key: 'b1',
        kind: 'callout',
        settings: { body: 'Hello {name}, see [why](https://example.com/why).' },
      }),
      catalog,
    )
    render(<Form />)

    await type('Name', '**Ada**')

    expect(screen.getByRole('link', { name: 'why' }).getAttribute('href')).toBe(
      'https://example.com/why',
    )
    expect(screen.getByRole('complementary', { name: 'Notice' }).textContent).toBe(
      'Hello **Ada**, see why.',
    )
  })
})

describe('createDocumentForm with steps', () => {
  const document: FormDocument = {
    format: 1,
    steps: [
      {
        key: 'building',
        label: 'Building',
        description: 'Size and age',
        items: [
          houseType,
          field('flats', 'text', { label: 'Flats', required: true, visibleWhen: isApartmentBlock }),
        ],
      },
      {
        key: 'block',
        label: 'Apartment block',
        visibleWhen: isApartmentBlock,
        items: [field('caretaker', 'text', { label: 'Caretaker' })],
      },
      {
        key: 'contact',
        label: 'Contact',
        items: [field('name', 'text', { label: 'Name', required: true })],
      },
    ],
  }

  it('renders the first step in the stepper, with the steps that show and their descriptions', () => {
    const Form = createDocumentForm(document, catalog)
    render(<Form />)

    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Building: Size and age',
      'Contact',
    ])
    expect(screen.getByLabelText('House type')).toBeDefined()
    expect(screen.queryByLabelText('Name *')).toBeNull()
  })

  it('leaves the steps a jump passes over out of the stepper once its condition holds', async () => {
    const jumping: FormDocument = {
      format: 1,
      steps: [
        {
          key: 'building',
          label: 'Building',
          items: [houseType],
          next: [{ when: isApartmentBlock, step: 'contact' }],
        },
        { key: 'owner', label: 'Owner', items: [field('owner', 'text', { label: 'Owner' })] },
        { key: 'contact', label: 'Contact', items: [field('name', 'text', { label: 'Name' })] },
      ],
    }
    const Form = createDocumentForm(jumping, catalog)
    render(<Form />)

    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Building',
      'Owner',
      'Contact',
    ])

    await choose('House type', 'o2')

    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Building',
      'Contact',
    ])
  })

  it('submits from a step whose jump ends the form, and leaves the steps after it out', async () => {
    const ending: FormDocument = {
      format: 1,
      steps: [
        {
          key: 'building',
          label: 'Building',
          items: [houseType],
          next: [{ when: isApartmentBlock, end: 'later' }],
        },
        { key: 'contact', label: 'Contact', items: [field('name', 'text', { label: 'Name' })] },
      ],
      endings: [{ key: 'later', items: [] }],
    }
    const Form = createDocumentForm(ending, catalog)
    render(<Form />)

    expect(screen.getByRole('button', { name: 'Next' })).toBeDefined()

    await choose('House type', 'o2')

    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Building'])
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDefined()
  })

  it('renders the formatting of a step description, without links', () => {
    const formatted: FormDocument = {
      format: 1,
      steps: [
        {
          key: 'building',
          label: 'Building',
          description: '**Size** and [age](https://example.com)',
          items: [houseType],
        },
      ],
    }
    const Form = createDocumentForm(formatted, catalog)
    render(<Form />)

    expect(screen.getByText('Size').tagName).toBe('STRONG')
    expect(screen.queryByRole('link', { name: 'age' })).toBeNull()
  })

  it('writes {{ and }} as braces in the label of a step', () => {
    const braced: FormDocument = {
      format: 1,
      steps: [{ key: 'building', label: 'Building {{A}}', items: [houseType] }],
    }
    const Form = createDocumentForm(braced, catalog)
    render(<Form />)

    expect(screen.getByText('Building {A}')).toBeDefined()
  })

  it('updates a step description that follows an answer', async () => {
    const following: FormDocument = {
      format: 1,
      steps: [
        { key: 'building', label: 'Building', items: [houseType] },
        {
          key: 'contact',
          label: 'Contact',
          description: {
            cases: [{ when: isApartmentBlock, value: 'Caretaker' }],
            otherwise: 'Owner',
          },
          items: [field('name', 'text', { label: 'Name' })],
        },
      ],
    }
    const Form = createDocumentForm(following, catalog)
    render(<Form />)

    expect(screen.getByText('Contact: Owner')).toBeDefined()

    await choose('House type', 'o2')

    expect(screen.getByText('Contact: Caretaker')).toBeDefined()
  })

  it('moves on past a required field that does not show, and adds a step once it shows', async () => {
    const Form = createDocumentForm(document, catalog)
    render(<Form />)

    await choose('House type', 'o1')
    await click('Next')
    expect(screen.getByLabelText('Name *')).toBeDefined()

    cleanup()
    render(<Form />)
    await choose('House type', 'o2')
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    await click('Next')
    expect(screen.getByRole('alert')).toBeDefined()
    expect(screen.getByLabelText('Flats *')).toBeDefined()
  })
})

const ShowingStepper = ({
  steps,
  variant = 'circles',
  children,
}: StepperProps<{ description?: ReactNode; icon?: string }> & {
  variant?: 'circles' | 'rail'
}): ReactNode => (
  <section aria-label="Stepper" data-variant={variant}>
    <ol>
      {steps.map((step) => (
        <li key={step.label} data-icon={step.icon}>
          {step.label}
          {step.description !== undefined && <>: {step.description}</>}
        </li>
      ))}
    </ol>
    {children}
  </section>
)

const FramedSection = ({
  label,
  description,
  tone = 'plain',
  children,
}: SectionProps & { description?: ReactNode; tone?: string }): ReactNode => (
  <fieldset data-tone={tone}>
    <legend>{label}</legend>
    {description !== undefined && <p>{description}</p>}
    {children}
  </fieldset>
)

const SpacedRow = ({ children, gap = 'small' }: RowProps & { gap?: string }): ReactNode => (
  <fieldset aria-label="Row" data-gap={gap}>
    {children}
  </fieldset>
)

describe('createDocumentForm with displays', () => {
  const displayed = createRegistry({
    fieldContext,
    formContext,
    widgets: { text: TextField },
    structure: { stepper: ShowingStepper, section: FramedSection, row: SpacedRow },
  })
  const text = defineFieldKind(displayed, {
    name: 'text',
    label: 'Text',
    widget: 'text',
    valueType: valueTypes.text,
  })
  const displays = [
    defineDisplayKind(displayed, {
      name: 'rail',
      label: 'Rail',
      appliesTo: 'form',
      props: () => ({ variant: 'rail' }),
    }),
    defineDisplayKind(displayed, {
      name: 'icon',
      label: 'Icon',
      appliesTo: 'step',
      settings: { icon: setting.text({ label: 'Icon', required: true }) },
      props: ({ icon }) => ({ icon }),
    }),
    defineDisplayKind(displayed, {
      name: 'card',
      label: 'Card',
      appliesTo: 'section',
      settings: { tone: setting.text({ label: 'Tone', required: true }) },
      props: ({ tone }) => ({ tone }),
    }),
    defineDisplayKind(displayed, {
      name: 'wide',
      label: 'Wide',
      appliesTo: 'row',
      props: () => ({ gap: 'large' }),
    }),
  ]
  const withDisplays = createCatalog(displayed, { fields: [text], displays })

  it('gives the stepper, a step, a section and a row the props of their displays', () => {
    const document: FormDocument = {
      format: 1,
      languages: ['de', 'en'],
      display: { kind: 'rail' },
      steps: [
        {
          key: 'contact',
          label: 'Contact',
          description: 'How we reach you',
          display: { kind: 'icon', settings: { icon: 'house' } },
          items: [
            {
              type: 'section',
              label: 'You',
              description: 'As on the bell',
              display: { kind: 'card', settings: { tone: { de: 'ruhig', en: 'quiet' } } },
              items: [
                {
                  type: 'row',
                  display: { kind: 'wide' },
                  items: [field('first', 'text', { label: 'First name' })],
                },
              ],
            },
          ],
        },
      ],
    }
    const Form = createDocumentForm(document, withDisplays, { language: 'en' })
    render(<Form />)

    expect(screen.getByRole('region', { name: 'Stepper' }).dataset.variant).toBe('rail')
    expect(screen.getByRole('listitem').dataset.icon).toBe('house')
    expect(screen.getByRole('listitem').textContent).toBe('Contact: How we reach you')
    expect(screen.getByRole('group', { name: 'You' }).dataset.tone).toBe('quiet')
    expect(screen.getByText('As on the bell')).toBeDefined()
    expect(screen.getByRole('group', { name: 'Row' }).dataset.gap).toBe('large')
  })

  it('renders each slot as it does without a display', () => {
    const document: FormDocument = {
      format: 1,
      steps: [{ key: 'contact', label: 'Contact', items: [field('first', 'text')] }],
    }
    const Form = createDocumentForm(document, withDisplays)
    render(<Form />)

    expect(screen.getByRole('region', { name: 'Stepper' }).dataset.variant).toBe('circles')
  })
})

const LabelledFrame = ({
  label,
  min,
  max,
  tone,
  renderItem,
  keys,
}: ArrayFrameProps<unknown> & {
  label?: string
  min?: number
  max?: number
  tone?: string
}): ReactNode => (
  <fieldset aria-label={label} data-min={min} data-max={max} data-tone={tone}>
    {keys.map((key, index) => (
      <div key={key}>{renderItem(index)}</div>
    ))}
  </fieldset>
)

describe('createDocumentForm with repeats', () => {
  const works = field('works', 'choice', {
    label: 'Works',
    settings: {
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
    },
  })
  const since = field('since', 'text', {
    label: 'Since when does {name} work',
    visibleWhen: { field: 'works', op: 'equals', value: 'yes' },
  })
  const residents = (extra: Partial<RepeatItem> = {}): RepeatItem => ({
    type: 'repeat',
    key: 'residents',
    label: 'Residents',
    addLabel: 'Add person',
    removeLabel: 'Remove person {n}',
    items: [field('name', 'text', { label: 'Name' }), works, since],
    ...extra,
  })

  it('starts with as many empty entries as its min, and adds and removes entries', async () => {
    const Form = createDocumentForm(plain(residents({ min: 1 })), catalog)
    render(<Form />)

    expect(screen.getAllByLabelText('Name')).toHaveLength(1)

    await click('Add person')
    expect(screen.getAllByLabelText('Name')).toHaveLength(2)

    await click('Remove person 2')
    expect(screen.getAllByLabelText('Name')).toHaveLength(1)
  })

  it('shows a field of an entry and fills its placeholders by the answers of that entry', async () => {
    const Form = createDocumentForm(plain(residents({ min: 2 })), catalog)
    render(<Form />)
    const [firstName] = screen.getAllByLabelText('Name')
    const [firstWorks] = screen.getAllByLabelText('Works')

    await act(async () => {
      fireEvent.change(firstName as HTMLElement, { target: { value: 'Ada' } })
      fireEvent.change(firstWorks as HTMLElement, { target: { value: 'yes' } })
    })

    expect(screen.getAllByLabelText(/^Since when/)).toHaveLength(1)
    expect(screen.getByLabelText('Since when does Ada work')).toBeDefined()
  })

  it('reads a field before the repeat in the conditions of each entry', async () => {
    const flats = field('flats', 'text', { label: 'Flats', visibleWhen: isApartmentBlock })
    const Form = createDocumentForm(
      plain(houseType, residents({ min: 2, items: [flats] })),
      catalog,
    )
    render(<Form />)

    expect(screen.queryAllByLabelText('Flats')).toHaveLength(0)
    await choose('House type', 'o2')
    expect(screen.getAllByLabelText('Flats')).toHaveLength(2)
  })

  it('submits the answers of each entry as a list', async () => {
    const onSubmit = vi.fn()
    const Form = createDocumentForm(
      plain(residents({ min: 1, items: [field('name', 'text', { label: 'Name' })] })),
      catalog,
    )
    render(<Form aria-label="Household" options={{ onSubmit: ({ value }) => onSubmit(value) }} />)

    await type('Name', 'Ada')
    await act(async () => {
      fireEvent.submit(screen.getByRole('form', { name: 'Household' }))
    })

    expect(onSubmit).toHaveBeenCalledWith({ residents: [{ name: 'Ada' }] })
  })

  it("gives a registered array frame the repeat's label, bounds and display", () => {
    const framed = createRegistry({
      fieldContext,
      formContext,
      widgets: { text: TextField },
      structure: { arrayFrame: LabelledFrame },
    })
    const text = defineFieldKind(framed, {
      name: 'text',
      label: 'Text',
      widget: 'text',
      valueType: valueTypes.text,
    })
    const cards = defineDisplayKind(framed, {
      name: 'cards',
      label: 'Cards',
      appliesTo: 'repeat',
      props: () => ({ tone: 'muted' }),
    })
    const repeat = residents({
      min: 1,
      max: 4,
      display: { kind: 'cards' },
      items: [field('name', 'text', { label: 'Name' })],
    })
    const Form = createDocumentForm(
      plain(repeat),
      createCatalog(framed, { fields: [text], displays: [cards] }),
    )
    render(<Form />)

    const frame = screen.getByRole('group', { name: 'Residents' })
    expect(frame.dataset).toMatchObject({ min: '1', max: '4', tone: 'muted' })
  })
})
