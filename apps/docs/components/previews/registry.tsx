'use client'

import { createRegistry } from '@formdef/core'

import { DateField } from '@formdef/shadcn/components/formdef/date-field'
import { TextField } from '@formdef/shadcn/components/formdef/text-field'
import { FieldGroup } from '@formdef/shadcn/components/ui/field'
import { fieldContext, formContext } from '@formdef/shadcn/lib/formdef/context'

export const { createForm } = createRegistry({
  fieldContext,
  formContext,
  widgets: { text: TextField, date: DateField },
  structure: { body: FieldGroup },
})
