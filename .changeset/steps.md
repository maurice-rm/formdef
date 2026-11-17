---
'@formdef/core': minor
---

A root `layout` of steps, `{ step: 'key', label: 'Title' }`, renders a form one step at a time through a new `structure.stepper` slot (`StepperProps`, `StepState`). Each step is a TanStack form group: next checks the step against the schema and moves on when it is valid, the last step submits the form, and a failed submit shows the first step holding an error. `useFieldParts` treats an error as due once the step it is shown in was submitted.
