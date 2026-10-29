import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { promisify } from 'node:util'

const run = promisify(execFile)

const ROOT = join(import.meta.dirname, '../../..')
const SHADCN_PACKAGE = join(ROOT, 'packages/shadcn')
const REGISTRY_FILES = join(ROOT, 'apps/docs/public')
const CORE_PACKAGE = join(ROOT, 'packages/core')

const PROJECT = 'app'
const TEMPLATE = 'vite'
const BASE = 'base'
const PRESET = 'nova'
const SOURCE_ALIAS = '@/'
const SOURCE_FOLDER = 'src/'
const OWN_DATE_FILE = 'src/lib/date.ts'
const OWN_DATE_SOURCE = 'export const today = (): string => new Date().toISOString().slice(0, 10)\n'
const PROBE_FORM_FILE = 'src/probe-form.tsx'
const REGISTRY_FILE = 'src/lib/formdef/index.tsx'
const CORE_TARBALL_PATH = '/core.tgz'
const OUTPUT_LIMIT = 64 * 1024 * 1024
const NPM_SETTING = 'npm_'

type RegistryFile = { path: string; target: string }
type RegistryItem = { name: string; files: RegistryFile[] }
type Aliases = Record<string, string>

const REGISTRY_SOURCE = `'use client'

import { createRegistry } from '@formdef/core'

import { ArrayFrame } from '@/components/formdef/array-frame'
import { CheckboxField } from '@/components/formdef/checkbox-field'
import { CheckboxGroupField } from '@/components/formdef/checkbox-group-field'
import { ComboboxField } from '@/components/formdef/combobox-field'
import { DateField } from '@/components/formdef/date-field'
import { DateRangeField } from '@/components/formdef/date-range-field'
import { DateTimeField } from '@/components/formdef/date-time-field'
import { NumberField } from '@/components/formdef/number-field'
import { PasswordField } from '@/components/formdef/password-field'
import { RadioField } from '@/components/formdef/radio-field'
import { Row } from '@/components/formdef/row'
import { Section } from '@/components/formdef/section'
import { SelectField } from '@/components/formdef/select-field'
import { SubmitButton } from '@/components/formdef/submit-button'
import { SwitchField } from '@/components/formdef/switch-field'
import { TagsField } from '@/components/formdef/tags-field'
import { TextField } from '@/components/formdef/text-field'
import { TextareaField } from '@/components/formdef/textarea-field'
import { FieldGroup } from '@/components/ui/field'
import { fieldContext, formContext } from './context'

export const registry = createRegistry({
  fieldContext,
  formContext,
  widgets: {
    text: TextField,
    textarea: TextareaField,
    password: PasswordField,
    number: NumberField,
    checkbox: CheckboxField,
    switch: SwitchField,
    radio: RadioField,
    select: SelectField,
    checkboxes: CheckboxGroupField,
    combobox: ComboboxField,
    date: DateField,
    dateRange: DateRangeField,
    dateTime: DateTimeField,
    tags: TagsField,
  },
  formComponents: { SubmitButton },
  structure: { body: FieldGroup, section: Section, row: Row, arrayFrame: ArrayFrame },
})

export const { createForm, Fields, formHook } = registry
`

const PROBE_FORM_SOURCE = `import { z } from 'zod'

import { today } from '@/lib/date'
import { createForm } from '@/lib/formdef'

export const ProbeForm = createForm({
  schema: z.object({ email: z.email(), born: z.iso.date(), team: z.array(z.string()) }),
  defaultValues: { email: '', born: today(), team: [] },
  fields: {
    email: { widget: 'text', props: { label: 'Email', type: 'email' } },
    born: { widget: 'date', props: { label: 'Born', max: today() } },
    team: {
      newItem: () => '',
      addLabel: 'Add member',
      removeLabel: 'Remove member',
      props: { label: 'Team' },
      item: { widget: 'text', props: { label: 'Name' } },
    },
  },
  layout: [
    { section: 'You', layout: [{ row: ['email', 'born'] }] },
    'team',
    { component: 'SubmitButton', props: { label: 'Save' } },
  ],
})
`

const shadcnVersion = async (): Promise<string> =>
  JSON.parse(await readFile(join(SHADCN_PACKAGE, 'package.json'), 'utf8')).devDependencies.shadcn

const readItems = async (): Promise<RegistryItem[]> =>
  JSON.parse(await readFile(join(SHADCN_PACKAGE, 'registry.json'), 'utf8')).items

const step = (message: string): void => {
  console.info(`probe-install: ${message}`)
}

// A script started through pnpm passes its `npm_*` settings on; without them, the shadcn CLI picks
// the package manager a user would have, instead of the one that runs this probe.
const cleanEnvironment = (): NodeJS.ProcessEnv =>
  Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.startsWith(NPM_SETTING)))

const runIn = async (cwd: string, command: string, args: string[]): Promise<string> => {
  const pending = run(command, args, {
    cwd,
    env: cleanEnvironment(),
    maxBuffer: OUTPUT_LIMIT,
  })
  // A prompt `--yes` does not answer, such as overwriting a file, would wait forever on an open stdin.
  pending.child.stdin?.end()
  const { stdout } = await pending

  return stdout
}

const listen = (server: Server): Promise<string> =>
  new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo
      resolve(`http://127.0.0.1:${port}`)
    })
  })

const registryServer = (): Server =>
  createServer(async (request, response) => {
    const file = join(
      REGISTRY_FILES,
      decodeURIComponent(new URL(request.url ?? '/', 'http://x').pathname),
    )
    if (!(file.startsWith(REGISTRY_FILES) && existsSync(file))) {
      response.writeHead(404).end()
      return
    }
    response.writeHead(200, { 'content-type': 'application/json' }).end(await readFile(file))
  })

const packumentOf = (
  manifest: { name: string; version: string },
  tarball: Buffer,
  origin: string,
) => ({
  name: manifest.name,
  'dist-tags': { latest: manifest.version },
  versions: {
    [manifest.version]: {
      ...manifest,
      dist: {
        tarball: `${origin}${CORE_TARBALL_PATH}`,
        shasum: createHash('sha1').update(tarball).digest('hex'),
        integrity: `sha512-${createHash('sha512').update(tarball).digest('base64')}`,
      },
    },
  },
})

// The probe installs the local build of @formdef/core, not the published one; a scoped registry serves it.
const coreServer = (tarball: Buffer, manifest: { name: string; version: string }): Server => {
  const server: Server = createServer((request, response) => {
    if (request.url === CORE_TARBALL_PATH) {
      response.writeHead(200, { 'content-type': 'application/octet-stream' }).end(tarball)
      return
    }
    const { port } = server.address() as AddressInfo
    const packument = packumentOf(manifest, tarball, `http://127.0.0.1:${port}`)
    response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(packument))
  })

  return server
}

const packCore = async (
  into: string,
): Promise<{ tarball: Buffer; manifest: { name: string; version: string } }> => {
  await runIn(CORE_PACKAGE, 'pnpm', ['pack', '--pack-destination', into])
  const file = (await readdir(into)).find((name) => name.endsWith('.tgz'))
  if (file === undefined) {
    throw new Error('probe-install: pnpm pack wrote no tarball for @formdef/core.')
  }
  const path = join(into, file)
  const manifest = JSON.parse(await runIn(into, 'tar', ['-xzOf', path, 'package/package.json']))

  return { tarball: await readFile(path), manifest }
}

const landedPathOf = (target: string, aliases: Aliases): string => {
  const [, kind = '', rest = ''] = /^@(\w+)\/(.*)$/.exec(target) ?? []
  const alias = aliases[kind]
  if (alias === undefined) {
    throw new Error(`probe-install: the target ${target} names no alias of components.json.`)
  }

  return join(alias.replace(SOURCE_ALIAS, SOURCE_FOLDER), rest)
}

const missingFilesOf = (items: RegistryItem[], project: string, aliases: Aliases): string[] => {
  const paths = items.flatMap((item) =>
    item.files.map((file) => landedPathOf(file.target, aliases)),
  )

  return [...new Set(paths)].filter((path) => !existsSync(join(project, path)))
}

const scaffold = async (folder: string, version: string): Promise<string> => {
  step(`creating a ${TEMPLATE} project with shadcn ${version}, ${BASE}-${PRESET}`)
  await runIn(folder, 'npx', [
    '--yes',
    `shadcn@${version}`,
    'init',
    '--template',
    TEMPLATE,
    '--base',
    BASE,
    '--preset',
    PRESET,
    '--name',
    PROJECT,
    '--no-monorepo',
    '--yes',
  ])

  return join(folder, PROJECT)
}

const configure = async (
  project: string,
  registryOrigin: string,
  coreOrigin: string,
): Promise<Aliases> => {
  await mkdir(dirname(join(project, OWN_DATE_FILE)), { recursive: true })
  await writeFile(join(project, OWN_DATE_FILE), OWN_DATE_SOURCE)
  await writeFile(join(project, '.npmrc'), `@formdef:registry=${coreOrigin}/\n`)
  const componentsJson = JSON.parse(await readFile(join(project, 'components.json'), 'utf8'))
  componentsJson.registries = { '@formdef': `${registryOrigin}/r/{style}/{name}.json` }
  await writeFile(join(project, 'components.json'), JSON.stringify(componentsJson, null, 2))

  return componentsJson.aliases
}

const check = async (
  project: string,
  items: RegistryItem[],
  aliases: Aliases,
): Promise<string[]> => {
  const missing = missingFilesOf(items, project, aliases).map((path) => `missing ${path}`)
  const ownDate = await readFile(join(project, OWN_DATE_FILE), 'utf8')
  const changedOwnFile = ownDate === OWN_DATE_SOURCE ? [] : [`the CLI changed ${OWN_DATE_FILE}`]

  return [...missing, ...changedOwnFile]
}

const compile = async (project: string): Promise<void> => {
  step('registering every widget and compiling a form that uses the project’s own date helper')
  await writeFile(join(project, REGISTRY_FILE), REGISTRY_SOURCE)
  await writeFile(join(project, PROBE_FORM_FILE), PROBE_FORM_SOURCE)
  await runIn(project, 'npm', ['install', '--no-audit', '--no-fund', 'zod'])
  await runIn(project, 'npx', ['tsc', '-p', 'tsconfig.app.json', '--noEmit'])
  await runIn(project, 'npx', ['vite', 'build'])
}

const probe = async (folder: string): Promise<void> => {
  step('building @formdef/core and the shadcn registry')
  await runIn(ROOT, 'pnpm', [
    'turbo',
    'run',
    'build',
    '--filter=@formdef/core',
    '--filter=@formdef/shadcn',
  ])
  const items = await readItems()
  const version = await shadcnVersion()
  const { tarball, manifest } = await packCore(folder)
  const registry = registryServer()
  const core = coreServer(tarball, manifest)
  try {
    const project = await scaffold(folder, version)
    const aliases = await configure(project, await listen(registry), await listen(core))
    step(`adding ${items.length} items`)
    await runIn(project, 'npx', [
      'shadcn',
      'add',
      ...items.map((item) => `@formdef/${item.name}`),
      '--yes',
    ])
    const problems = await check(project, items, aliases)
    if (problems.length > 0) {
      throw new Error(`probe-install: the installed project is wrong:\n${problems.join('\n')}`)
    }
    await compile(project)
    step('every item installed, the project compiles and builds')
  } finally {
    registry.close()
    core.close()
  }
}

const folder = await mkdtemp(join(tmpdir(), 'formdef-probe-'))
try {
  await probe(folder)
} finally {
  await rm(folder, { recursive: true, force: true })
}
