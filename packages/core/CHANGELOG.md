# @formdef/core

## 0.4.1

### Patch Changes

- [#115](https://github.com/maurice-rm/formdef/pull/115) [`73a1356`](https://github.com/maurice-rm/formdef/commit/73a1356bdf59674b08371228f5d6faf7d3f7c6b8) Thanks [@maurice-rm](https://github.com/maurice-rm)! - The warning about a step held back by fields it does not render now says that what a condition hides must accept every value it can hold. Being optional in the schema is not enough: a value typed before the condition hid the field is still validated.

- [#116](https://github.com/maurice-rm/formdef/pull/116) [`80c348e`](https://github.com/maurice-rm/formdef/commit/80c348ee21082a54547d6c18687b960b70ccdb95) Thanks [@maurice-rm](https://github.com/maurice-rm)! - `props.required` takes `true` on a key the schema makes optional, so a field required only under a condition can be marked, also one whose widget's empty value is `undefined`. It was a type error before.

## 0.4.0

### Minor Changes

- [#100](https://github.com/maurice-rm/formdef/pull/100) [`3571a86`](https://github.com/maurice-rm/formdef/commit/3571a864c23936afc66f2b16fa9c49a5c80bb622) Thanks [@maurice-rm](https://github.com/maurice-rm)! - A root `layout` of steps, `{ step: 'key', label: 'Title' }`, renders a form one step at a time through a new `structure.stepper` slot (`StepperProps`, `StepState`). Each step is a TanStack form group: next checks the step against the schema and moves on when it is valid, the last step submits the form, and a failed submit shows the first step holding an error. `StepState` tells the stepper whether a step is complete: checked by its next or a submit of the form, with no field holding an error now. A stepper declares what it reads per step as `StepperProps<{ description?: string }>`, and each step entry passes it under `props`, typed after the registered stepper and flat on each step's state. `useFieldParts` treats an error as due once the step it is shown in was submitted.

- [#103](https://github.com/maurice-rm/formdef/pull/103) [`2388be2`](https://github.com/maurice-rm/formdef/commit/2388be24f94ed149c3d0c659841661bad2d83312) Thanks [@maurice-rm](https://github.com/maurice-rm)! - formdef now needs TypeScript 5.7 or later. TypeScript 5.4 to 5.6 leave `values` of a field's `visibleWhen` and derived `props` inside `createForm` implicitly `any`, so the earlier floor of 5.4 did not hold.

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
