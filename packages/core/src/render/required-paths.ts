import { type Context, createContext } from 'react'

const NONE: ReadonlySet<string> = new Set()

/** The path patterns of the required fields of the form being rendered; none outside `createForm`. */
export const RequiredPaths: Context<ReadonlySet<string>> = createContext(NONE)
