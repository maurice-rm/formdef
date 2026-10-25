import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import ts from 'typescript54'

// The public API of `@formdef/core`, name by name. A name is added here in the change that
// exports it, never as a side effect of exporting it.
const PUBLIC_EXPORTS = [
  'errorsOf',
  'fieldId',
  'FieldApiOf',
  'FieldOf',
  'FieldParts',
  'fieldParts',
  'InferData',
]

// TypeScript 5.4 reads the declarations because TypeScript 7 offers no stable compiler API, and
// because 5.4 is the oldest compiler the declarations have to work on.
const declarationFile = fileURLToPath(import.meta.resolve('@formdef/core')).replace(
  /\.js$/,
  '.d.ts',
)

const program = ts.createProgram([declarationFile], {
  module: ts.ModuleKind.NodeNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  noEmit: true,
})
const checker = program.getTypeChecker()
const sourceFile = program.getSourceFile(declarationFile)

if (!sourceFile) {
  throw new Error(`check-api: cannot read ${declarationFile}; build @formdef/core first.`)
}

const diagnostics = ts.getPreEmitDiagnostics(program)

if (diagnostics.length > 0) {
  throw new Error(
    `check-api: the declarations do not compile:\n${ts.formatDiagnostics(diagnostics, {
      getCanonicalFileName: (fileName) => fileName,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => '\n',
    })}`,
  )
}

const moduleSymbol = checker.getSymbolAtLocation(sourceFile)

if (!moduleSymbol) {
  throw new Error(`check-api: ${declarationFile} declares no module.`)
}

function resolved(symbol: ts.Symbol): ts.Symbol {
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

function isDeclaredHere(declaration: ts.Declaration): boolean {
  return declaration.getSourceFile() === sourceFile
}

function undocumentedMembers(symbol: ts.Symbol): string[] {
  if (!(symbol.flags & (ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias))) {
    return []
  }

  // Members a type takes over from TanStack or React are documented there, not here.
  return checker
    .getPropertiesOfType(checker.getDeclaredTypeOfSymbol(symbol))
    .filter((member) => member.declarations?.some(isDeclaredHere))
    .filter((member) => !isDocumented(member))
    .map((member) => member.getName())
}

function problemsOf(exported: ts.Symbol): string[] {
  const name = exported.getName()
  const symbol = resolved(exported)

  return [
    ...(isDocumented(symbol) ? [] : [`${name} has no TSDoc summary`]),
    ...paramTagsWithTypes(symbol).map(
      (param) => `${name}: @param ${param} names a type; the signature already does`,
    ),
    ...undocumentedMembers(symbol).map((member) => `${name}.${member} has no TSDoc comment`),
  ]
}

// An import the package does not declare resolves in this workspace but not in a consumer's.
const manifest = JSON.parse(
  readFileSync(fileURLToPath(import.meta.resolve('@formdef/core/package.json')), 'utf8'),
) as { dependencies?: Record<string, string>; peerDependencies?: Record<string, string> }
const declaredPackages = Object.keys({ ...manifest.dependencies, ...manifest.peerDependencies })

function packageOf(specifier: string): string {
  const [scopeOrName = '', name = ''] = specifier.split('/')

  return scopeOrName.startsWith('@') ? `${scopeOrName}/${name}` : scopeOrName
}

const importedPackages = sourceFile.statements
  .filter(ts.isImportDeclaration)
  .map((statement) => packageOf((statement.moduleSpecifier as ts.StringLiteral).text))

const exported = checker.getExportsOfModule(moduleSymbol)
const exportedNames = exported.map((symbol) => symbol.getName())

const problems = [
  ...exportedNames
    .filter((name) => !PUBLIC_EXPORTS.includes(name))
    .map((name) => `${name} is exported but not part of the public API`),
  ...PUBLIC_EXPORTS.filter((name) => !exportedNames.includes(name)).map(
    (name) => `${name} is part of the public API but not exported`,
  ),
  ...exported.flatMap(problemsOf),
  ...importedPackages
    .filter((name) => !declaredPackages.includes(name))
    .map((name) => `the declarations import ${name}, which @formdef/core does not declare`),
]

if (problems.length > 0) {
  for (const problem of problems) {
    console.error(`check-api: ${problem}`)
  }
  process.exit(1)
}

console.log(`check-api: ${exportedNames.length} exports, all public and documented`)
