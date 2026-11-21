/**
 * The keys of a step or item that hold texts, and so placeholders: its own, not its items'. A
 * field's own error texts are left out, since their placeholders name params, not fields.
 */
export const OWN_TEXT_KEYS: readonly ['label', 'description', 'settings', 'checks'] = [
  'label',
  'description',
  'settings',
  'checks',
]
