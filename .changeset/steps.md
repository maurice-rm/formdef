---
'@formdef/core': minor
---

A root `layout` of steps, `{ step: 'key', label: 'Title' }`, renders a form one step at a time through a new `structure.stepper` slot (`StepperProps`, `StepState`). Each step is a TanStack form group: next checks the step against the schema and moves on when it is valid, the last step submits the form, and a failed submit shows the first step holding an error. `StepState` tells the stepper whether a step is complete: checked by its next or a submit of the form, with no field holding an error now. A stepper declares what it reads per step as `StepperProps<{ description?: string }>`, and each step entry passes it under `props`, typed after the registered stepper and flat on each step's state. `useFieldParts` treats an error as due once the step it is shown in was submitted.
