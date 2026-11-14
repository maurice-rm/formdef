import { useState } from 'react'

import { type Project, ProjectForm } from '@/project-form'

const JSON_INDENT = 2

export const App = () => {
  const [created, setCreated] = useState<Project | undefined>()

  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col gap-8 px-4 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">New project</h1>
        <p className="text-muted-foreground text-sm">
          A form built from one typed formdef config, with widgets from formdef's shadcn registry.
          Leave a field empty and submit to see the errors; open <code>src/project-form.tsx</code>{' '}
          to change the config.
        </p>
      </header>
      <ProjectForm options={{ onSubmit: ({ value }) => setCreated(value) }} />
      {created !== undefined && (
        <section className="flex flex-col gap-2">
          <h2 className="font-medium">Submitted values</h2>
          <pre className="bg-muted overflow-x-auto rounded-md p-4 text-xs">
            {JSON.stringify(created, null, JSON_INDENT)}
          </pre>
        </section>
      )}
    </main>
  )
}

export default App
