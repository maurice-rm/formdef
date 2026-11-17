import { type Context, createContext } from 'react'

/** Whether the step a widget is rendered in was submitted; `false` outside steps. */
export const StepSubmitted: Context<boolean> = createContext(false)
