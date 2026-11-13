# @formdef/core

## 0.3.0

### Minor Changes

- [#92](https://github.com/maurice-rm/formdef/pull/92) [`415bd57`](https://github.com/maurice-rm/formdef/commit/415bd57ae11ad7b8dbc35d5b2a158752da72c68f) Thanks [@maurice-rm](https://github.com/maurice-rm)! - `useFieldParts` wires a widget's control like `fieldParts` and subscribes to the submit, so a field that was left before without an edit shows its error after a submit. `fieldParts` reads the submit without subscribing to it and is deprecated.

## 0.2.0

### Minor Changes

- [#85](https://github.com/maurice-rm/formdef/pull/85) [`a64f738`](https://github.com/maurice-rm/formdef/commit/a64f738ddf4d4ed23f84e1433b139ac88ac28b43) Thanks [@maurice-rm](https://github.com/maurice-rm)! - `createForm` finds the fields the schema requires by validating it once with each widget's empty value, and passes `required` to every widget that declares a static `emptyValue`. A `required` in `props` wins.

## 0.1.2

### Patch Changes

- [#82](https://github.com/maurice-rm/formdef/pull/82) [`d420c66`](https://github.com/maurice-rm/formdef/commit/d420c665a41e9b5e99a026833d793a2035b34fe4) Thanks [@maurice-rm](https://github.com/maurice-rm)! - `createForm` and `Fields` take a `layout` annotated with `LayoutOf` beside `fields` annotated with `FieldsOf`, which stopped with "Type instantiation is excessively deep".

## 0.1.1

### Patch Changes

- [#72](https://github.com/maurice-rm/formdef/pull/72) [`76ed8da`](https://github.com/maurice-rm/formdef/commit/76ed8da579c819ff2c4492f1dceaea9d516cc0b6) Thanks [@maurice-rm](https://github.com/maurice-rm)! - Link the package to its documentation at formdef.mauricereim.de.

## 0.1.0

### Minor Changes

- [#63](https://github.com/maurice-rm/formdef/pull/63) [`b19edcf`](https://github.com/maurice-rm/formdef/commit/b19edcfb3bf0eca6978c3953d47ac8a738e08805) Thanks [@maurice-rm](https://github.com/maurice-rm)! - First release: describe a form once as a typed object and render it as a React component on top of TanStack Form, with the compiler checking that every widget fits its value.
