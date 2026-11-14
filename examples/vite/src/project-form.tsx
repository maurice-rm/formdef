import { z } from 'zod'

import { createForm } from '@/lib/formdef'

const schema = z.object({
  name: z.string().min(3, 'Give the project a name of at least three characters.'),
  visibility: z.string().min(1, 'Choose who can see the project.'),
  memberIds: z.array(z.string()).min(1, 'Add at least one member.'),
  dueDate: z.iso.date('Pick a due date.'),
  notify: z.boolean(),
})

export type Project = z.infer<typeof schema>

const MEMBERS = [
  { value: 'u_1', label: 'Ada Lovelace' },
  { value: 'u_2', label: 'Grace Hopper', description: 'No SSH key yet' },
  { value: 'u_3', label: 'Alan Turing' },
  { value: 'u_4', label: 'Margaret Hamilton' },
  { value: 'u_5', label: 'Linus Torvalds', disabled: true },
]

// Try it: point `notify` at the `text` widget, or `memberIds` at `select`. The config stops
// compiling, because each widget is checked against the value of its field.
export const ProjectForm = createForm({
  schema,
  defaultValues: { name: '', visibility: '', memberIds: [], dueDate: '', notify: true },
  validation: { mode: 'blurThenChange' },
  fields: {
    name: {
      widget: 'text',
      props: { label: 'Name', description: 'Shown in the sidebar.', autoComplete: 'off' },
    },
    visibility: {
      widget: 'select',
      props: {
        label: 'Visibility',
        placeholder: 'Choose',
        options: [
          { value: 'private', label: 'Only me' },
          { value: 'team', label: 'My team' },
          { value: 'public', label: 'Everyone' },
        ],
      },
    },
    memberIds: {
      widget: 'multiCombobox',
      props: { label: 'Members', placeholder: 'Search people', options: MEMBERS },
    },
    dueDate: { widget: 'date', props: { label: 'Due date' } },
    notify: { widget: 'checkbox', props: { label: 'Tell the members by email' } },
  },
  layout: [
    'name',
    'visibility',
    { section: 'People and dates', layout: ['memberIds', 'dueDate', 'notify'] },
    { component: 'SubmitButton', props: { label: 'Create project' } },
  ],
})
