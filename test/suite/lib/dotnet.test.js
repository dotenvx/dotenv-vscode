const { describe, it } = require('mocha')
const assert = require('assert')
const vscode = require('vscode')
const dotnet = require('../../../lib/dotnet')
const helpers = require('../../../lib/helpers')
const settings = require('../../../lib/settings')

function document (text, languageId = 'csharp') {
  return { languageId, lineAt: () => ({ text }) }
}

function complete (marked, languageId) {
  const offset = marked.indexOf('|')
  const text = marked.replace('|', '')
  const items = dotnet.completion.provideCompletionItems(document(text, languageId), new vscode.Position(0, offset))
  const item = items.find(item => item.label.label === 'HELLO')
  return text.slice(0, item.range.start.character) + item.insertText + text.slice(item.range.end.character)
}

describe('.NET completion', () => {
  for (const [input, expected] of [
    ['Environment.GetEnvironmentVariable(|)', 'Environment.GetEnvironmentVariable("HELLO")'],
    ['Environment.GetEnvironmentVariable("|")', 'Environment.GetEnvironmentVariable("HELLO")'],
    ['Environment.GetEnvironmentVariable("HE|LLO")', 'Environment.GetEnvironmentVariable("HELLO")'],
    ['System.Environment.GetEnvironmentVariable (  "HE|")', 'System.Environment.GetEnvironmentVariable (  "HELLO")'],
    ['global::System.Environment.GetEnvironmentVariable(@"HE|")', 'global::System.Environment.GetEnvironmentVariable(@"HELLO")'],
    ['Environment.GetEnvironmentVariable("|", EnvironmentVariableTarget.Process)', 'Environment.GetEnvironmentVariable("HELLO", EnvironmentVariableTarget.Process)']
  ]) {
    it(`inserts without duplicate quotes: ${input}`, () => {
      assert.strictEqual(complete(input), expected)
    })
  }

  it('supports case-insensitive Visual Basic API names', () => {
    assert.strictEqual(complete('system.environment.getenvironmentvariable("|")', 'vb'), 'system.environment.getenvironmentvariable("HELLO")')
  })

  for (const text of ['OtherEnvironment.GetEnvironmentVariable(', 'EnvironmentXGetEnvironmentVariable(', 'Environment.GetEnvironmentVariables(', 'Environment.GetEnvironmentVariable("HELLO", ', 'Environment.GetEnvironmentVariable($"']) {
    it(`ignores unrelated or nonliteral contexts: ${text}`, () => {
      assert.strictEqual(dotnet.completion.provideCompletionItems(document(text), new vscode.Position(0, text.length)), undefined)
    })
  }
})

describe('.NET hover', () => {
  for (const text of [
    'Environment.GetEnvironmentVariable("HELLO")',
    'System.Environment.GetEnvironmentVariable ( "HELLO" )',
    'global::System.Environment.GetEnvironmentVariable(@"HELLO")',
    'Environment.GetEnvironmentVariable("HELLO", EnvironmentVariableTarget.Process)'
  ]) {
    it(`shows the .env value: ${text}`, () => {
      const result = dotnet.hover.provideHover(document(text), new vscode.Position(0, text.indexOf('HELLO') + 1))
      assert.strictEqual(result.contents[0], 'World')
      assert.strictEqual(result.range.start.character, text.indexOf('HELLO'))
    })
  }

  it('selects the hovered call when several calls or repeated names share a line', () => {
    const text = 'var HELLO = Environment.GetEnvironmentVariable("UNKNOWN") + Environment.GetEnvironmentVariable("HELLO");'
    const result = dotnet.hover.provideHover(document(text), new vscode.Position(0, text.lastIndexOf('HELLO') + 1))
    assert.strictEqual(result.contents[0], 'World')
    assert.strictEqual(dotnet.hover.provideHover(document(text), new vscode.Position(0, 5)), undefined)
  })

  it('reports missing names without throwing', () => {
    const text = 'Environment.GetEnvironmentVariable("UNKNOWN")'
    assert.strictEqual(dotnet.hover.provideHover(document(text), new vscode.Position(0, text.indexOf('UNKNOWN'))).contents[0], settings.missingText())
  })

  it('handles lowercase keys, empty values, and short masked values', () => {
    const originalParse = helpers.envParsed
    const originalPeeking = settings.secretpeekingEnabled
    try {
      helpers.envParsed = () => ({ lower_key: 'x', EMPTY: '' })
      settings.secretpeekingEnabled = () => false
      for (const [key, expected] of [['lower_key', 'x'], ['EMPTY', '(empty)']]) {
        const text = `Environment.GetEnvironmentVariable("${key}")`
        assert.strictEqual(dotnet.hover.provideHover(document(text), new vscode.Position(0, text.indexOf(key))).contents[0], expected)
      }
      const text = 'Environment.GetEnvironmentVariable("HELLO")'
      helpers.envParsed = () => ({ HELLO: 'World' })
      assert.strictEqual(dotnet.hover.provideHover(document(text), new vscode.Position(0, text.indexOf('HELLO'))).contents[0], '███ld')
      helpers.envParsed = () => undefined
      assert.strictEqual(dotnet.hover.provideHover(document(text), new vscode.Position(0, text.indexOf('HELLO'))).contents[0], settings.missingText())
    } finally {
      helpers.envParsed = originalParse
      settings.secretpeekingEnabled = originalPeeking
    }
  })
})

describe('.NET registered providers', () => {
  for (const [language, extension, api] of [['csharp', 'cs', 'Environment'], ['fsharp', 'fs', 'System.Environment'], ['vb', 'vb', 'system.environment']]) {
    it(`provides completion and hover through VS Code for ${language}`, async () => {
      await vscode.extensions.getExtension('dotenv.dotenv-vscode').activate()
      const root = vscode.workspace.workspaceFolders[0].uri
      const uri = vscode.Uri.joinPath(root, `dotnet-test.${extension}`)
      const text = `${api}.GetEnvironmentVariable("HELLO")\n${api}.GetEnvironmentVariable("HE")`
      await vscode.workspace.fs.writeFile(uri, Buffer.from(text))
      const doc = await vscode.workspace.openTextDocument(uri)
      await vscode.languages.setTextDocumentLanguage(doc, language)
      const hover = await vscode.commands.executeCommand('vscode.executeHoverProvider', uri, new vscode.Position(0, text.indexOf('HELLO') + 1))
      assert(hover.some(item => item.contents.some(content => (content.value || content) === 'World')))
      const offset = text.split('\n')[1].indexOf('HE') + 2
      const completions = await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', uri, new vscode.Position(1, offset))
      assert(completions.items.some(item => (item.label.label || item.label) === 'HELLO'))
    })
  }
})
