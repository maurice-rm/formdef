import {
  type ArrayFrameProps,
  createRegistry,
  type FieldOf,
  type RowProps,
  type SectionProps,
} from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import type { ComponentProps, ReactNode } from 'react'

type Labels = { label?: string; description?: string; labelAside?: ReactNode }

type InputAttrs = Pick<
  ComponentProps<'input'>,
  | 'className'
  | 'placeholder'
  | 'autoComplete'
  | 'autoFocus'
  | 'disabled'
  | 'readOnly'
  | 'required'
  | 'maxLength'
  | 'inputMode'
  | 'spellCheck'
>

type Option = { value: string; label: string; disabled?: boolean; description?: string }

const widgetOf =
  <TValue, TProps>() =>
  (_: FieldOf<TValue> & Labels & InputAttrs & TProps): ReactNode =>
    null

const { fieldContext, formContext } = createFormHookContexts()

export const { createForm } = createRegistry({
  fieldContext,
  formContext,
  widgets: {
    text: widgetOf<string, { type?: 'text' | 'email' }>(),
    textarea: widgetOf<string, { rows?: number }>(),
    password: widgetOf<string, { reveal?: { show?: string; hide?: string } }>(),
    number: widgetOf<number | undefined, { min?: number; max?: number }>(),
    checkbox: widgetOf<boolean, Record<never, never>>(),
    switch: widgetOf<boolean, { variant?: 'split' | 'list' | 'card' }>(),
    radio: widgetOf<string, { options: Option[]; variant?: 'list' | 'card' }>(),
    select: widgetOf<string, { options: Option[] }>(),
    checkboxes: widgetOf<string[], { options: Option[] }>(),
    combobox: widgetOf<string, { options: Option[]; empty?: string }>(),
    date: widgetOf<string, { min?: string; max?: string; format?: (iso: string) => string }>(),
    dateRange: widgetOf<{ from?: string; to?: string }, { numberOfMonths?: number }>(),
    dateTime: widgetOf<string, { defaultTime?: string }>(),
    tags: widgetOf<string[], { suggestions?: string[] }>(),
  },
  formComponents: {
    SubmitButton: (_: { label: string }): ReactNode => null,
  },
  structure: {
    section: (_: SectionProps & { description?: string }): ReactNode => null,
    row: (_: RowProps & { className?: string }): ReactNode => null,
    arrayFrame: <TItem,>(_: ArrayFrameProps<TItem> & { label?: string }): ReactNode => null,
  },
})
