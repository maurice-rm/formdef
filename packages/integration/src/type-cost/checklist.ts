import { checklistSchema } from './checklist-schema.js'
import { createForm } from './registry.js'

const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

const KINDS = [
  { value: 'gas', label: 'Gas' },
  { value: 'oil', label: 'Oil' },
  { value: 'power', label: 'Power' },
]

const TOPIC_DEFAULTS = {
  name: '',
  note: '',
  count: undefined,
  area: undefined,
  choice: undefined,
  answer: undefined,
  isActive: false,
  kind: '',
  tags: [],
  remarks: '',
}

export const Checklist = createForm({
  schema: checklistSchema,
  defaultValues: {
    contact: TOPIC_DEFAULTS,
    building: TOPIC_DEFAULTS,
    envelope: TOPIC_DEFAULTS,
    heating: TOPIC_DEFAULTS,
    solar: TOPIC_DEFAULTS,
    power: TOPIC_DEFAULTS,
    distribution: TOPIC_DEFAULTS,
    hotWater: TOPIC_DEFAULTS,
    wishes: TOPIC_DEFAULTS,
    site: TOPIC_DEFAULTS,
  },
  fields: {
    contact: {
      fields: {
        name: { widget: 'text', props: { label: 'Name' } },
        note: { widget: 'text', props: { label: 'Note' } },
        count: {
          widget: 'number',
          props: { label: 'Count', min: 0 },
          visibleWhen: (values) => values.contact.isActive,
        },
        area: { widget: 'number', props: { label: 'Area' } },
        choice: { widget: 'radio', props: { label: 'Choice', options: YES_NO } },
        answer: { widget: 'radio', props: { label: 'Answer', options: YES_NO } },
        isActive: { widget: 'checkbox', props: { label: 'Active' } },
        kind: { widget: 'select', props: { label: 'Kind', options: KINDS } },
        tags: {
          widget: 'checkboxes',
          props: { label: 'Tags', options: KINDS },
          visibleWhen: (values) => values.contact.choice === 'yes',
        },
        remarks: { widget: 'textarea', props: { label: 'Remarks', rows: 3 } },
      },
      layout: [
        {
          section: 'Contact',
          layout: [
            { row: ['name', 'note'] },
            'count',
            'area',
            'choice',
            'answer',
            'isActive',
            'kind',
            'tags',
            'remarks',
          ],
        },
      ],
    },
    building: {
      fields: {
        name: { widget: 'text', props: { label: 'Name' } },
        note: { widget: 'text', props: { label: 'Note' } },
        count: {
          widget: 'number',
          props: { label: 'Count', min: 0 },
          visibleWhen: (values) => values.building.isActive,
        },
        area: { widget: 'number', props: { label: 'Area' } },
        choice: { widget: 'radio', props: { label: 'Choice', options: YES_NO } },
        answer: { widget: 'radio', props: { label: 'Answer', options: YES_NO } },
        isActive: { widget: 'checkbox', props: { label: 'Active' } },
        kind: { widget: 'select', props: { label: 'Kind', options: KINDS } },
        tags: {
          widget: 'checkboxes',
          props: { label: 'Tags', options: KINDS },
          visibleWhen: (values) => values.building.choice === 'yes',
        },
        remarks: { widget: 'textarea', props: { label: 'Remarks', rows: 3 } },
      },
      layout: [
        {
          section: 'Building',
          layout: [
            { row: ['name', 'note'] },
            'count',
            'area',
            'choice',
            'answer',
            'isActive',
            'kind',
            'tags',
            'remarks',
          ],
        },
      ],
    },
    envelope: {
      fields: {
        name: { widget: 'text', props: { label: 'Name' } },
        note: { widget: 'text', props: { label: 'Note' } },
        count: {
          widget: 'number',
          props: { label: 'Count', min: 0 },
          visibleWhen: (values) => values.envelope.isActive,
        },
        area: { widget: 'number', props: { label: 'Area' } },
        choice: { widget: 'radio', props: { label: 'Choice', options: YES_NO } },
        answer: { widget: 'radio', props: { label: 'Answer', options: YES_NO } },
        isActive: { widget: 'checkbox', props: { label: 'Active' } },
        kind: { widget: 'select', props: { label: 'Kind', options: KINDS } },
        tags: {
          widget: 'checkboxes',
          props: { label: 'Tags', options: KINDS },
          visibleWhen: (values) => values.envelope.choice === 'yes',
        },
        remarks: { widget: 'textarea', props: { label: 'Remarks', rows: 3 } },
      },
      layout: [
        {
          section: 'Envelope',
          layout: [
            { row: ['name', 'note'] },
            'count',
            'area',
            'choice',
            'answer',
            'isActive',
            'kind',
            'tags',
            'remarks',
          ],
        },
      ],
    },
    heating: {
      fields: {
        name: { widget: 'text', props: { label: 'Name' } },
        note: { widget: 'text', props: { label: 'Note' } },
        count: {
          widget: 'number',
          props: { label: 'Count', min: 0 },
          visibleWhen: (values) => values.heating.isActive,
        },
        area: { widget: 'number', props: { label: 'Area' } },
        choice: { widget: 'radio', props: { label: 'Choice', options: YES_NO } },
        answer: { widget: 'radio', props: { label: 'Answer', options: YES_NO } },
        isActive: { widget: 'checkbox', props: { label: 'Active' } },
        kind: { widget: 'select', props: { label: 'Kind', options: KINDS } },
        tags: {
          widget: 'checkboxes',
          props: { label: 'Tags', options: KINDS },
          visibleWhen: (values) => values.heating.choice === 'yes',
        },
        remarks: { widget: 'textarea', props: { label: 'Remarks', rows: 3 } },
      },
      layout: [
        {
          section: 'Heating',
          layout: [
            { row: ['name', 'note'] },
            'count',
            'area',
            'choice',
            'answer',
            'isActive',
            'kind',
            'tags',
            'remarks',
          ],
        },
      ],
    },
    solar: {
      fields: {
        name: { widget: 'text', props: { label: 'Name' } },
        note: { widget: 'text', props: { label: 'Note' } },
        count: {
          widget: 'number',
          props: { label: 'Count', min: 0 },
          visibleWhen: (values) => values.solar.isActive,
        },
        area: { widget: 'number', props: { label: 'Area' } },
        choice: { widget: 'radio', props: { label: 'Choice', options: YES_NO } },
        answer: { widget: 'radio', props: { label: 'Answer', options: YES_NO } },
        isActive: { widget: 'checkbox', props: { label: 'Active' } },
        kind: { widget: 'select', props: { label: 'Kind', options: KINDS } },
        tags: {
          widget: 'checkboxes',
          props: { label: 'Tags', options: KINDS },
          visibleWhen: (values) => values.solar.choice === 'yes',
        },
        remarks: { widget: 'textarea', props: { label: 'Remarks', rows: 3 } },
      },
      layout: [
        {
          section: 'Solar',
          layout: [
            { row: ['name', 'note'] },
            'count',
            'area',
            'choice',
            'answer',
            'isActive',
            'kind',
            'tags',
            'remarks',
          ],
        },
      ],
    },
    power: {
      fields: {
        name: { widget: 'text', props: { label: 'Name' } },
        note: { widget: 'text', props: { label: 'Note' } },
        count: {
          widget: 'number',
          props: { label: 'Count', min: 0 },
          visibleWhen: (values) => values.power.isActive,
        },
        area: { widget: 'number', props: { label: 'Area' } },
        choice: { widget: 'radio', props: { label: 'Choice', options: YES_NO } },
        answer: { widget: 'radio', props: { label: 'Answer', options: YES_NO } },
        isActive: { widget: 'checkbox', props: { label: 'Active' } },
        kind: { widget: 'select', props: { label: 'Kind', options: KINDS } },
        tags: {
          widget: 'checkboxes',
          props: { label: 'Tags', options: KINDS },
          visibleWhen: (values) => values.power.choice === 'yes',
        },
        remarks: { widget: 'textarea', props: { label: 'Remarks', rows: 3 } },
      },
      layout: [
        {
          section: 'Power',
          layout: [
            { row: ['name', 'note'] },
            'count',
            'area',
            'choice',
            'answer',
            'isActive',
            'kind',
            'tags',
            'remarks',
          ],
        },
      ],
    },
    distribution: {
      fields: {
        name: { widget: 'text', props: { label: 'Name' } },
        note: { widget: 'text', props: { label: 'Note' } },
        count: {
          widget: 'number',
          props: { label: 'Count', min: 0 },
          visibleWhen: (values) => values.distribution.isActive,
        },
        area: { widget: 'number', props: { label: 'Area' } },
        choice: { widget: 'radio', props: { label: 'Choice', options: YES_NO } },
        answer: { widget: 'radio', props: { label: 'Answer', options: YES_NO } },
        isActive: { widget: 'checkbox', props: { label: 'Active' } },
        kind: { widget: 'select', props: { label: 'Kind', options: KINDS } },
        tags: {
          widget: 'checkboxes',
          props: { label: 'Tags', options: KINDS },
          visibleWhen: (values) => values.distribution.choice === 'yes',
        },
        remarks: { widget: 'textarea', props: { label: 'Remarks', rows: 3 } },
      },
      layout: [
        {
          section: 'Distribution',
          layout: [
            { row: ['name', 'note'] },
            'count',
            'area',
            'choice',
            'answer',
            'isActive',
            'kind',
            'tags',
            'remarks',
          ],
        },
      ],
    },
    hotWater: {
      fields: {
        name: { widget: 'text', props: { label: 'Name' } },
        note: { widget: 'text', props: { label: 'Note' } },
        count: {
          widget: 'number',
          props: { label: 'Count', min: 0 },
          visibleWhen: (values) => values.hotWater.isActive,
        },
        area: { widget: 'number', props: { label: 'Area' } },
        choice: { widget: 'radio', props: { label: 'Choice', options: YES_NO } },
        answer: { widget: 'radio', props: { label: 'Answer', options: YES_NO } },
        isActive: { widget: 'checkbox', props: { label: 'Active' } },
        kind: { widget: 'select', props: { label: 'Kind', options: KINDS } },
        tags: {
          widget: 'checkboxes',
          props: { label: 'Tags', options: KINDS },
          visibleWhen: (values) => values.hotWater.choice === 'yes',
        },
        remarks: { widget: 'textarea', props: { label: 'Remarks', rows: 3 } },
      },
      layout: [
        {
          section: 'Hot water',
          layout: [
            { row: ['name', 'note'] },
            'count',
            'area',
            'choice',
            'answer',
            'isActive',
            'kind',
            'tags',
            'remarks',
          ],
        },
      ],
    },
    wishes: {
      fields: {
        name: { widget: 'text', props: { label: 'Name' } },
        note: { widget: 'text', props: { label: 'Note' } },
        count: {
          widget: 'number',
          props: { label: 'Count', min: 0 },
          visibleWhen: (values) => values.wishes.isActive,
        },
        area: { widget: 'number', props: { label: 'Area' } },
        choice: { widget: 'radio', props: { label: 'Choice', options: YES_NO } },
        answer: { widget: 'radio', props: { label: 'Answer', options: YES_NO } },
        isActive: { widget: 'checkbox', props: { label: 'Active' } },
        kind: { widget: 'select', props: { label: 'Kind', options: KINDS } },
        tags: {
          widget: 'checkboxes',
          props: { label: 'Tags', options: KINDS },
          visibleWhen: (values) => values.wishes.choice === 'yes',
        },
        remarks: { widget: 'textarea', props: { label: 'Remarks', rows: 3 } },
      },
      layout: [
        {
          section: 'Wishes',
          layout: [
            { row: ['name', 'note'] },
            'count',
            'area',
            'choice',
            'answer',
            'isActive',
            'kind',
            'tags',
            'remarks',
          ],
        },
      ],
    },
    site: {
      fields: {
        name: { widget: 'text', props: { label: 'Name' } },
        note: { widget: 'text', props: { label: 'Note' } },
        count: {
          widget: 'number',
          props: { label: 'Count', min: 0 },
          visibleWhen: (values) => values.site.isActive,
        },
        area: { widget: 'number', props: { label: 'Area' } },
        choice: { widget: 'radio', props: { label: 'Choice', options: YES_NO } },
        answer: { widget: 'radio', props: { label: 'Answer', options: YES_NO } },
        isActive: { widget: 'checkbox', props: { label: 'Active' } },
        kind: { widget: 'select', props: { label: 'Kind', options: KINDS } },
        tags: {
          widget: 'checkboxes',
          props: { label: 'Tags', options: KINDS },
          visibleWhen: (values) => values.site.choice === 'yes',
        },
        remarks: { widget: 'textarea', props: { label: 'Remarks', rows: 3 } },
      },
      layout: [
        {
          section: 'Site',
          layout: [
            { row: ['name', 'note'] },
            'count',
            'area',
            'choice',
            'answer',
            'isActive',
            'kind',
            'tags',
            'remarks',
          ],
        },
      ],
    },
  },
  layout: [
    { step: 'contact', label: 'Contact' },
    { step: 'building', label: 'Building' },
    { step: 'envelope', label: 'Envelope' },
    { step: 'heating', label: 'Heating', visibleWhen: (values) => values.building.isActive },
    { step: 'solar', label: 'Solar' },
    { step: 'power', label: 'Power' },
    { step: 'distribution', label: 'Distribution' },
    { step: 'hotWater', label: 'Hot water' },
    { step: 'wishes', label: 'Wishes' },
    { step: 'site', label: 'Site' },
  ],
})
