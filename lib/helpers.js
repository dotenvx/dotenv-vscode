const vscode = require('vscode')
const envFiles = require('./env-files')
const settings = require('./settings')
const completionReveal = require('./completion-reveal')
const hoverReveal = require('./hover-reveal')

function envValues (document) {
  const values = new Map()
  for (const source of envFiles.read(document)) {
    for (const [key, value] of Object.entries(source.parsed)) {
      if (!values.has(key)) values.set(key, [])
      values.get(key).push({ value, source: source.label })
    }
  }
  return values
}

function envParsed (document) {
  return Object.fromEntries([...envValues(document)].map(([key, values]) => [key, values[0].value]))
}

function envEntries (document) {
  return Object.entries(envParsed(document))
}

function displayValue (value, revealed = settings.secretpeekingEnabled()) {
  return (revealed ? value : _mask(value)) || '(empty)'
}

function valueDocumentation (values, batch, key, hoverRevealed) {
  const doc = new vscode.MarkdownString()
  for (const { source, value } of values) {
    doc.appendText(source)
    doc.appendMarkdown('\n\n')
    const revealed = batch?.request && batch.request.key === key && batch.request.source === source && batch.request.revealed
    doc.appendText(batch ? ((revealed ? value : _mask(value)) || '(empty)') : displayValue(value, hoverRevealed))
    if (batch && value) completionReveal.append(doc, batch, key, source, revealed)
    doc.appendMarkdown('\n\n---\n\n')
  }
  return doc
}

function valueHover (key, document, range) {
  const values = module.exports.envValues(document).get(key)
  if (!values) return new vscode.Hover(settings.missingText(), range)
  const revealed = hoverReveal.begin(document, key, range, settings.secretpeekingEnabled())
  const contents = [valueDocumentation(values, undefined, undefined, revealed)]
  const control = values.some(entry => entry.value) && hoverReveal.control(document, key, range, revealed)
  if (control) contents.push(control)
  return new vscode.Hover(contents, range)
}

function hover (language, document, position) {
  const regexDict = {
    javascript: /(?:process|import\.meta)\.env\.([A-Z]{1}[A-Z_0123456789]+)/,
    ruby: /ENV\[['"]([A-Z]{1}[A-Z_0123456789]+)['"]\]/,
    python: /os\.(?:(?:environ(?:(?:\.get\(["']([A-Z]{1}[A-Z_0123456789]+)["']\))|(?:\[["']([A-Z]{1}[A-Z_0123456789]+)["']\])))|(?:getenv\(["']([A-Z]{1}[A-Z_0123456789]+)["']\)))/,
    php: /(?:(?:\$_(?:SERVER|ENV)\[["']([A-Z]{1}[A-Z_0123456789]+)["']\])|(?:getenv\(["']([A-Z]{1}[A-Z_0123456789]+)["']\)))/,
    go: /os.Getenv\(["']([A-Z]{1}[A-Z_0123456789]+)["']\)/,
    java: /dotenv.get\(["']([A-Z]{1}[A-Z_0123456789]+)["']\)/,
    rust: /std::env::(?:var|var_os)\(["']([A-Z]{1}[A-Z_0123456789]+)["']\)/,
    dart: /String.fromEnvironment\(["']([A-Z]{1}[A-Z_0123456789]+)["']\)/,
    kotlin: /System.getenv\(["']([A-Z]{1}[A-Z_0123456789]+)["']\)/,
    elixir: /System.get_env\(["']([A-Z]{1}[A-Z_0123456789]+)["']\)/
  }
  const reg = regexDict[language]
  const line = document.lineAt(position).text
  const matches = line.match(reg)

  if (!matches) {
    return undefined
  } else {
    const key = matches.filter(item => item !== undefined)[1]

    const start = line.indexOf(key)
    const end = start + key.length
    if (position.character >= start && position.character <= end) {
      return valueHover(key, document, new vscode.Range(position.line, start, position.line, end))
    } else {
      return new vscode.Hover(settings.missingText())
    }
  }
}

function _mask (str) {
  return settings.cloakIcon().repeat(str.length)
}

function autocomplete (triggerCharacter, document, position) {
  const entries = [...envValues(document)]
  const batch = completionReveal.begin(document, position)
  const quote = triggerCharacter === '.' ? '' : '"' // for javascript, doesn't use quotation in env reference so make sure not to add to insert/filter text
  const items = entries.map(function (env) {
    const key = env[0]
    const values = env[1]
    const completionItemLabel = {
      label: key,
      detail: values.every(entry => entry.value === values[0].value) ? ` ${_mask(values[0].value) || '(empty)'}` : ` (${values.length} files)`,
      description: values.map(entry => entry.source).join(', ')
    }
    const item = new vscode.CompletionItem(completionItemLabel, vscode.CompletionItemKind.Variable)
    item.insertText = `${triggerCharacter}${quote}${key}${quote}`
    item.filterText = `${triggerCharacter}${quote}${key}${quote}`
    item.range = new vscode.Range(new vscode.Position(position.line, position.character - 1), position) // Picks up trigger character as prefix to fix the scoring it does when sorting
    item.sortText = '0' // Make this the sortText so that any ENV variables will go to the top of the list above anything else

    item.documentation = valueDocumentation(values, batch, key)

    return item
  })
  const valuesByKey = new Map(entries)
  return completionReveal.track(batch, items, (key, refreshed) => valueDocumentation(valuesByKey.get(key), refreshed, key))
}

module.exports.envEntries = envEntries
module.exports.envParsed = envParsed
module.exports.hover = hover
module.exports.autocomplete = autocomplete

module.exports.envValues = envValues
module.exports.valueHover = valueHover
