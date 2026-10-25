// A shape is a union of object types and of the markers that word compile errors.
type ObjectsOf<TShape> = Extract<TShape, object>

type KeysOfEach<TShape> = TShape extends unknown ? keyof TShape : never

type ValueAt<TShape, TKey extends PropertyKey> = TShape extends unknown
  ? TKey extends keyof TShape
    ? TShape[TKey]
    : never
  : never

type UnknownKey<TKey extends PropertyKey> = {
  'formdef: this key is not known here': TKey
}

// The keys that mark the kind of an entry; markers make every other kind's key optional.
type KindKey = 'widget' | 'component' | 'section' | 'row' | 'render' | 'item' | 'fields'

type KindOf<TActual> = Extract<KindKey, RequiredKeysOf<TActual>>

type RequiredKeysOf<TActual> = {
  [Key in keyof TActual]-?: undefined extends TActual[Key] ? never : Key
}[keyof TActual]

// An entry is checked against the variants of its kind only, and of the widget or form component
// it names.
type VariantsFor<TActual, TShape> = [KindOf<TActual>] extends [never]
  ? ObjectsOf<TShape>
  : KindOf<TActual> extends 'widget' | 'component'
    ? Extract<
        ObjectsOf<TShape>,
        { [Key in KindOf<TActual>]: TActual[KindOf<TActual> & keyof TActual] }
      >
    : Extract<ObjectsOf<TShape>, { [Key in KindOf<TActual>]: unknown }>

type ItemOf<TShape> = ObjectsOf<TShape> extends readonly (infer TItem)[] ? TItem : never

// Keys whose values are walked; any other key is checked for being known, not walked into.
type Walk<TKey, TActual, TShape> = TKey extends 'props'
  ? FlatKnown<TActual, TShape>
  : TKey extends 'fields'
    ? FieldsKnown<TActual, TShape>
    : TKey extends 'item'
      ? EntryKnown<TActual, TShape>
      : TKey extends 'layout' | 'row'
        ? LayoutKnown<TActual, TShape>
        : TActual

type FlatKnown<TActual, TShape> = TActual extends (...args: never[]) => unknown
  ? TActual
  : TActual extends object
    ? {
        [Key in keyof TActual]: Key extends KeysOfEach<ObjectsOf<TShape>>
          ? TActual[Key]
          : UnknownKey<Key>
      }
    : TActual

type EntryKnown<TActual, TShape> = TActual extends object
  ? KnownIn<TActual, VariantsFor<TActual, TShape>>
  : TActual

type KnownIn<TActual, TVariants> = {
  [Key in keyof TActual]: Key extends KeysOfEach<TVariants>
    ? Walk<Key, TActual[Key], ValueAt<TVariants, Key>>
    : UnknownKey<Key>
}

type FieldsKnown<TActual, TShape> = {
  [Key in keyof TActual]: Key extends KeysOfEach<ObjectsOf<TShape>>
    ? EntryKnown<TActual[Key], ValueAt<ObjectsOf<TShape>, Key>>
    : UnknownKey<Key>
}

type LayoutKnown<TActual, TShape> = {
  [Index in keyof TActual]: TActual[Index] extends string
    ? TActual[Index]
    : EntryKnown<TActual[Index], ItemOf<TShape>>
}

/**
 * Checks a config as written, `TActual`, against the config type it is meant for, `TShape`: a key
 * the type does not know turns into a message naming it, at the top, in each field and layout
 * entry, in their `props`, and in nested levels, items, sections and rows.
 */
export type KnownKeys<TActual, TShape> = EntryKnown<TActual, TShape>
