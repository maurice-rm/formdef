import { readFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript57'

type Entry = {
  /** The specifier a consumer imports. */
  specifier: string
  /** The package the entry belongs to, whose manifest declares what it may import. */
  packageName: string
  /** The public API of the entry, name by name. */
  publicExports: readonly string[]
}

// The public API of each published entry, name by name. A name is added here in the change that
// exports it, never as a side effect of exporting it.
const ENTRIES: readonly Entry[] = [
  {
    specifier: '@formdef/core',
    packageName: '@formdef/core',
    publicExports: [
      'ArrayFrameProps',
      'BodyProps',
      'createRegistry',
      'RowProps',
      'SectionProps',
      'StepperProps',
      'StepState',
      'Validation',
      'EntryPlace',
      'errorsOf',
      'fieldId',
      'FieldApiOf',
      'FieldOf',
      'FieldParts',
      'FieldsOf',
      'FormConfig',
      'FormHandle',
      'FormProps',
      'fieldParts',
      'InferData',
      'LayoutOf',
      'Registry',
      'useFieldParts',
      'ValueOf',
    ],
  },
  {
    specifier: '@formdef/document',
    packageName: '@formdef/document',
    publicExports: [
      'AnswerDescription',
      'BlockItem',
      'BlockKind',
      'BlockKindDefinition',
      'Catalog',
      'CatalogOptions',
      'changeFieldKind',
      'Check',
      'checkDocument',
      'CheckOptions',
      'ComparesAs',
      'ComputedItem',
      'Condition',
      'createCatalog',
      'createKey',
      'createValidator',
      'defineBlockKind',
      'defineDisplayKind',
      'defineFieldKind',
      'defineValueType',
      'Dependent',
      'dependentsOf',
      'DescribedAnswer',
      'DescribedComputed',
      'DescribedEntry',
      'DescribedField',
      'DescribedItem',
      'DescribedRepeat',
      'DescribedSection',
      'DescribedStep',
      'DescribeOptions',
      'describeAnswers',
      'Display',
      'DisplayKind',
      'DisplayKindDefinition',
      'DisplayTarget',
      'dissolveSteps',
      'DocumentItem',
      'DocumentNode',
      'DocumentStep',
      'DocumentValidator',
      'DocumentValues',
      'duplicateNode',
      'Ending',
      'EndingOptions',
      'endingOf',
      'Expression',
      'FieldItem',
      'FieldKind',
      'FieldKindDefinition',
      'FORMAT_VERSION',
      'FormattedSetting',
      'FormDocument',
      'insertNode',
      'Intro',
      'Jump',
      'IssueParams',
      'JsonValue',
      'Messages',
      'moveNode',
      'Operator',
      'OperatorDefinitions',
      'Position',
      'Problem',
      'ProblemCode',
      'ProblemMessages',
      'ProblemParams',
      'ReadLimits',
      'ReadOptions',
      'readDocument',
      'removeNode',
      'renameKey',
      'RepeatItem',
      'RowItem',
      'Rule',
      'rule',
      'SectionItem',
      'Setting',
      'setting',
      'SettingOption',
      'SettingType',
      'SettingValues',
      'splitIntoSteps',
      'Text',
      'TextContext',
      'updateNode',
      'ValidationIssue',
      'ValidationResult',
      'ValidatorOptions',
      'ValueType',
      'ValueTypeDefinition',
      'valueTypes',
      'Varying',
      'VaryingText',
    ],
  },
  {
    specifier: '@formdef/document/react',
    packageName: '@formdef/document',
    publicExports: [
      'createDocumentForm',
      'DocumentForm',
      'DocumentFormOptions',
      'StartButtonProps',
      'SubmitButtonProps',
    ],
  },
]

// A declaration file of the package in this workspace imports others by relative paths.
const RELATIVE = /^\.\.?\//
const NODE_MODULES = '/node_modules/'

function resolved(checker: ts.TypeChecker, symbol: ts.Symbol): ts.Symbol {
  return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol
}

function hasSummary(declaration: ts.Declaration): boolean {
  return ts
    .getJSDocCommentsAndTags(declaration)
    .some((doc) => ts.isJSDoc(doc) && (ts.getTextOfJSDocComment(doc.comment) ?? '').trim() !== '')
}

// Every declaration on its own: the combined comment of an overloaded function reads as
// documented when only one overload is.
function isDocumented(symbol: ts.Symbol): boolean {
  const declarations = symbol.declarations ?? []

  return declarations.length > 0 && declarations.every(hasSummary)
}

function paramTagsWithTypes(symbol: ts.Symbol): string[] {
  return (symbol.declarations ?? []).flatMap((declaration) =>
    ts
      .getJSDocTags(declaration)
      .filter((tag) => ts.isJSDocParameterTag(tag) && tag.typeExpression !== undefined)
      .map((tag) => (tag as ts.JSDocParameterTag).name.getText()),
  )
}

function packageOf(specifier: string): string {
  const [scopeOrName = '', name = ''] = specifier.split('/')

  return scopeOrName.startsWith('@') ? `${scopeOrName}/${name}` : scopeOrName
}

function failOnDiagnostics(program: ts.Program): void {
  const diagnostics = ts.getPreEmitDiagnostics(program)
  if (diagnostics.length === 0) {
    return
  }
  throw new Error(
    `check-api: the declarations do not compile:\n${ts.formatDiagnostics(diagnostics, {
      getCanonicalFileName: (fileName) => fileName,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => '\n',
    })}`,
  )
}

function declaredPackagesOf(packageName: string): string[] {
  const manifest = JSON.parse(
    readFileSync(fileURLToPath(import.meta.resolve(`${packageName}/package.json`)), 'utf8'),
  ) as { dependencies?: Record<string, string>; peerDependencies?: Record<string, string> }

  return Object.keys({ ...manifest.dependencies, ...manifest.peerDependencies })
}

function importsOf(sourceFile: ts.SourceFile): string[] {
  return sourceFile.statements
    .filter(
      (statement): statement is ts.ImportDeclaration | ts.ExportDeclaration =>
        ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement),
    )
    .map((statement) => statement.moduleSpecifier)
    .filter((specifier): specifier is ts.StringLiteral => specifier !== undefined)
    .map((specifier) => specifier.text)
}

// TypeScript 5.7 reads the declarations because TypeScript 7 offers no stable compiler API, and
// because 5.7 is the oldest compiler the declarations have to work on.
function problemsOfEntry({ specifier, packageName, publicExports }: Entry): string[] {
  const declarationFile = fileURLToPath(import.meta.resolve(specifier)).replace(/\.js$/, '.d.ts')
  const packageFolder = dirname(fileURLToPath(import.meta.resolve(`${packageName}/package.json`)))
  const program = ts.createProgram([declarationFile], {
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    noEmit: true,
  })
  const checker = program.getTypeChecker()
  const sourceFile = program.getSourceFile(declarationFile)
  if (!sourceFile) {
    throw new Error(`check-api: cannot read ${declarationFile}; build ${packageName} first.`)
  }
  failOnDiagnostics(program)

  const moduleSymbol = checker.getSymbolAtLocation(sourceFile)
  if (!moduleSymbol) {
    throw new Error(`check-api: ${declarationFile} declares no module.`)
  }

  // The package's own declarations, which may be split over shared chunks anywhere in it.
  const ownFiles = program
    .getSourceFiles()
    .filter(
      (file) =>
        file.fileName.startsWith(`${packageFolder}/`) && !file.fileName.includes(NODE_MODULES),
    )
  const isDeclaredHere = (declaration: ts.Declaration): boolean =>
    ownFiles.includes(declaration.getSourceFile())

  const undocumentedMembers = (symbol: ts.Symbol): string[] => {
    if (!(symbol.flags & (ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias))) {
      return []
    }
    // A union lists only the members all its variants share, so each variant is read on its own.
    const declared = checker.getDeclaredTypeOfSymbol(symbol)
    const variants = declared.isUnion() ? declared.types : [declared]
    const members = [
      ...new Set(variants.flatMap((variant) => checker.getPropertiesOfType(variant))),
    ]

    // Members a type takes over from TanStack, React or another package are documented there.
    return members
      .filter((member) => member.declarations?.some(isDeclaredHere))
      .filter((member) => !isDocumented(member))
      .map((member) => member.getName())
  }

  const problemsOf = (exported: ts.Symbol): string[] => {
    const name = exported.getName()
    const symbol = resolved(checker, exported)

    return [
      ...(isDocumented(symbol) ? [] : [`${name} has no TSDoc summary`]),
      ...paramTagsWithTypes(symbol).map(
        (param) => `${name}: @param ${param} names a type; the signature already does`,
      ),
      ...undocumentedMembers(symbol).map((member) => `${name}.${member} has no TSDoc comment`),
    ]
  }

  // An import the package does not declare resolves in this workspace but not in a consumer's.
  const declaredPackages = declaredPackagesOf(packageName)
  const importedPackages = ownFiles
    .flatMap(importsOf)
    .filter((imported) => !RELATIVE.test(imported))
    .map(packageOf)

  const exported = checker.getExportsOfModule(moduleSymbol)
  const exportedNames = exported.map((symbol) => symbol.getName())

  return [
    ...exportedNames
      .filter((name) => !publicExports.includes(name))
      .map((name) => `${name} is exported but not part of the public API`),
    ...publicExports
      .filter((name) => !exportedNames.includes(name))
      .map((name) => `${name} is part of the public API but not exported`),
    ...exported.flatMap(problemsOf),
    ...[...new Set(importedPackages)]
      .filter((name) => !declaredPackages.includes(name))
      .map((name) => `the declarations import ${name}, which ${packageName} does not declare`),
  ].map((problem) => `${specifier}: ${problem}`)
}

const problems = ENTRIES.flatMap(problemsOfEntry)

if (problems.length > 0) {
  for (const problem of problems) {
    console.error(`check-api: ${problem}`)
  }
  process.exit(1)
}

const count = ENTRIES.reduce((total, entry) => total + entry.publicExports.length, 0)
console.log(`check-api: ${count} exports in ${ENTRIES.length} entries, all public and documented`)
