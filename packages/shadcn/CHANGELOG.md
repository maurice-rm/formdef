# @formdef/shadcn

## 0.2.0

### Minor Changes

- [#131](https://github.com/maurice-rm/formdef/pull/131) [`fb91dd0`](https://github.com/maurice-rm/formdef/commit/fb91dd0e7cfeb1f8306b4916e2662ed93e99ed75) Thanks [@maurice-rm](https://github.com/maurice-rm)! - `@formdef/array-frame` takes an `itemLabel`, a function of the item's index, and renders each item as a group titled by it, such as `Person 2`; a form document passes it for a repeat with an `entryLabel`.

- [#131](https://github.com/maurice-rm/formdef/pull/131) [`fb91dd0`](https://github.com/maurice-rm/formdef/commit/fb91dd0e7cfeb1f8306b4916e2662ed93e99ed75) Thanks [@maurice-rm](https://github.com/maurice-rm)! - `@formdef/catalog` adds a catalog of kinds for form documents: field kinds for short and long text, email, a number with a unit, a whole number, a checkbox, single and multiple choice, a dropdown and a date; block kinds for a notice and a heading, rendered by the new `@formdef/notice` and `@formdef/heading`; and display kinds for the stepper's rail, segments and compact variants and a section that reads as one question.

- [#131](https://github.com/maurice-rm/formdef/pull/131) [`fb91dd0`](https://github.com/maurice-rm/formdef/commit/fb91dd0e7cfeb1f8306b4916e2662ed93e99ed75) Thanks [@maurice-rm](https://github.com/maurice-rm)! - A description may be React elements, such as a formatted text with a link: `useFieldParts` and `fieldParts` take `description` as a `ReactNode`, and the shadcn widgets, options, section, array frame and stepper steps render one. Every registry item now names `@formdef/core@>=0.5.0`.

- [#131](https://github.com/maurice-rm/formdef/pull/131) [`fb91dd0`](https://github.com/maurice-rm/formdef/commit/fb91dd0e7cfeb1f8306b4916e2662ed93e99ed75) Thanks [@maurice-rm](https://github.com/maurice-rm)! - The `heading` block kind of `@formdef/catalog` takes a `level`, 2 to 6, so a form without steps can start its headings at 2 instead of skipping one; `checkDocument` reports a level outside them.

## 0.1.0

### Minor Changes

- [#127](https://github.com/maurice-rm/formdef/pull/127) [`28ffcfd`](https://github.com/maurice-rm/formdef/commit/28ffcfd12122d701829b557fe922b9582b81f029) Thanks [@maurice-rm](https://github.com/maurice-rm)! - Field hints sit between the label and the control by default; `descriptionPosition="afterControl"` puts them below it again ([#107](https://github.com/maurice-rm/formdef/issues/107)).

- [#125](https://github.com/maurice-rm/formdef/pull/125) [`4f5fdd5`](https://github.com/maurice-rm/formdef/commit/4f5fdd54cf08d9a0fd950b9b046791c4987469f2) Thanks [@maurice-rm](https://github.com/maurice-rm)! - Step labels and `legend` section titles use the heading font (`font-heading`) where the theme defines one ([#114](https://github.com/maurice-rm/formdef/issues/114)).

- [#124](https://github.com/maurice-rm/formdef/pull/124) [`722cffa`](https://github.com/maurice-rm/formdef/commit/722cffa294cbc21b08540ec7730a5ef3b22f0bb0) Thanks [@maurice-rm](https://github.com/maurice-rm)! - The stepper takes `railStepSize` (`sm`, `default`, `lg`) for evenly spaced steps in the rail ([#111](https://github.com/maurice-rm/formdef/issues/111)).

- [#122](https://github.com/maurice-rm/formdef/pull/122) [`55c953e`](https://github.com/maurice-rm/formdef/commit/55c953ea07c7264ed2a52832f4ceb1503204fd35) Thanks [@maurice-rm](https://github.com/maurice-rm)! - The stepper takes `labels`: `current` shows only the current step's label in the `steps` variant, `currentExpanded` also gives that step more of the row ([#113](https://github.com/maurice-rm/formdef/issues/113)).

- [#126](https://github.com/maurice-rm/formdef/pull/126) [`f92744a`](https://github.com/maurice-rm/formdef/commit/f92744ae1401c304009f31729a89af11fc45af58) Thanks [@maurice-rm](https://github.com/maurice-rm)! - The stepper takes `stickyNav`, which keeps the wide rail in view while a long step scrolls ([#112](https://github.com/maurice-rm/formdef/issues/112)).

### Patch Changes

- [#119](https://github.com/maurice-rm/formdef/pull/119) [`1504c48`](https://github.com/maurice-rm/formdef/commit/1504c4849a1cb54ce9a70cbc52f32ba1b8181ed2) Thanks [@maurice-rm](https://github.com/maurice-rm)! - Choice questions (radio, checkbox group) are set like the label of any field, their options a weight lighter, and `legend` section titles a weight heavier ([#109](https://github.com/maurice-rm/formdef/issues/109)).

- [#117](https://github.com/maurice-rm/formdef/pull/117) [`befccaf`](https://github.com/maurice-rm/formdef/commit/befccaf77373f4697e8abd09a5794b6431fffd05) Thanks [@maurice-rm](https://github.com/maurice-rm)! - Every registry item names `@formdef/core@>=0.4.0`, so `shadcn add` no longer installs an older core than its files import ([#106](https://github.com/maurice-rm/formdef/issues/106)).

- [#123](https://github.com/maurice-rm/formdef/pull/123) [`0ff1e26`](https://github.com/maurice-rm/formdef/commit/0ff1e267bc9287ae5b6ffff6a77ca39ca53cd71d) Thanks [@maurice-rm](https://github.com/maurice-rm)! - A line above the title separates a `legend` section from the entry before it, except side by side in a row; the section's `className` now lands on the wrapper that carries the line ([#109](https://github.com/maurice-rm/formdef/issues/109)).

- [#128](https://github.com/maurice-rm/formdef/pull/128) [`cd42405`](https://github.com/maurice-rm/formdef/commit/cd42405d7ab4f5d82f1437bedc72f1afb376d014) Thanks [@maurice-rm](https://github.com/maurice-rm)! - Hidden segment labels no longer widen a narrow page.

- [#120](https://github.com/maurice-rm/formdef/pull/120) [`d18a5e4`](https://github.com/maurice-rm/formdef/commit/d18a5e4336b90ea29647c440791abf0b04803264) Thanks [@maurice-rm](https://github.com/maurice-rm)! - The stepper wraps step labels, step descriptions and the next step of the compact variant instead of cutting them off ([#108](https://github.com/maurice-rm/formdef/issues/108)).

- [#118](https://github.com/maurice-rm/formdef/pull/118) [`cb35498`](https://github.com/maurice-rm/formdef/commit/cb3549891df2b9949588b0cd68dab3c94fc86ae2) Thanks [@maurice-rm](https://github.com/maurice-rm)! - The stepper with `showHeading={false}` reserves no space for its hidden heading, so the first field lines up with the navigation ([#110](https://github.com/maurice-rm/formdef/issues/110)).
