/**
 * The keys formdef reads from a field entry. Every other key is one of TanStack's field options and
 * goes to the field unchanged, so an option TanStack adds works without a formdef release.
 */
export const OWN_ENTRY_KEYS = [
  'widget',
  'props',
  'fields',
  'layout',
  'item',
  'newItem',
  'addLabel',
  'removeLabel',
  'itemKey',
  'render',
  'visibleWhen',
  'dependsOn',
] as const

/** A key formdef reads from a field entry. */
export type OwnEntryKey = (typeof OWN_ENTRY_KEYS)[number]

const OWN_ENTRY_KEY_SET: ReadonlySet<string> = new Set(OWN_ENTRY_KEYS)

/** Splits a field entry into the keys formdef reads and TanStack's field options. */
export function splitEntry(entry: object): {
  own: Partial<Record<OwnEntryKey, unknown>>
  fieldOptions: Record<string, unknown>
} {
  const entries = Object.entries(entry)

  // `fromEntries` defines each key as data, so a key named `__proto__` cannot set a prototype.
  return {
    own: Object.fromEntries(entries.filter(([key]) => OWN_ENTRY_KEY_SET.has(key))),
    fieldOptions: Object.fromEntries(entries.filter(([key]) => !OWN_ENTRY_KEY_SET.has(key))),
  }
}
