/** A value a form document can hold in a setting or a condition: what JSON can express. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }
