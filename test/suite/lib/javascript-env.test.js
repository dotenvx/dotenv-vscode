const { describe, it } = require('mocha')
const assert = require('assert')
const vscode = require('vscode')
const providers = require('../../../lib/providers')
const settings = require('../../../lib/settings')

function documentFor (source) {
  const lines = source.split('\n')
  return {
    uri: vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, 'imported-env.js'),
    version: 1,
    getText: () => source,
    lineAt: position => ({ text: lines[position.line] })
  }
}

describe('named process env imports', () => {
  for (const [declaration, name] of [
    ["import { env } from 'node:process';", 'env'],
    ['import { env } from "process"', 'env'],
    ["import { env as environment } from 'node:process'", 'environment'],
    ["import process, {\n  cwd,\n  env as $env,\n} from 'node:process'", '$env'],
    ["import { /* environment */ env } from 'node:process'", 'env']
  ]) {
    it(`completes and peeks with ${declaration}`, () => {
      const source = `${declaration}\n${name}.\nconsole.log(${name}.HELLO, ${name}.MISSING)`
      const document = documentFor(source)
      const line = declaration.split('\n').length
      const items = providers.javascriptCompletion.provideCompletionItems(document, new vscode.Position(line, name.length + 1))
      const item = items.find(item => item.label.label === 'HELLO')
      assert.strictEqual(item.insertText, '.HELLO')
      assert.strictEqual(item.label.detail, ' █████')
      assert(!item.documentation.value.includes('World'))
      const reference = source.split('\n')[line + 1]
      const start = reference.indexOf('HELLO')
      const hover = providers.javascriptHover.provideHover(document, new vscode.Position(line + 1, start + 2))
      assert(hover.contents[0].value.includes('World'))
      assert.strictEqual(hover.range.start.character, start)
      assert.strictEqual(hover.range.end.character, start + 5)
      const missing = providers.javascriptHover.provideHover(document, new vscode.Position(line + 1, reference.indexOf('MISSING') + 2))
      assert.strictEqual(missing.contents[0], settings.missingText())
    })
  }

  for (const declaration of [
    '',
    "import { env } from './config'",
    "import { env as other } from 'node:process'",
    "import type { env } from 'node:process'",
    "import { type env } from 'node:process'",
    "// import { env } from 'node:process'",
    "/* import { env } from 'node:process' */",
    '`import { env } from "node:process"`'
  ]) {
    it(`ignores unrelated env references after ${declaration || 'no import'}`, () => {
      const document = documentFor(`${declaration}\nenv.\nenv.HELLO`)
      assert.strictEqual(providers.javascriptCompletion.provideCompletionItems(document, new vscode.Position(1, 4)), undefined)
      assert.strictEqual(providers.javascriptHover.provideHover(document, new vscode.Position(2, 6)), undefined)
    })
  }

  for (const name of ['myenv', '$env', 'object.env']) {
    it(`does not match ${name} as env`, () => {
      const document = documentFor(`import { env } from 'node:process'\n${name}.\n${name}.HELLO`)
      assert.strictEqual(providers.javascriptCompletion.provideCompletionItems(document, new vscode.Position(1, name.length + 1)), undefined)
      assert.strictEqual(providers.javascriptHover.provideHover(document, new vscode.Position(2, name.length + 3)), undefined)
    })
  }

  it('respects disabled secret peeking', () => {
    const original = settings.secretpeekingEnabled
    try {
      settings.secretpeekingEnabled = () => false
      const document = documentFor("import { env } from 'node:process'\nenv.HELLO")
      const hover = providers.javascriptHover.provideHover(document, new vscode.Position(1, 6))
      assert.strictEqual(hover, undefined)
    } finally {
      settings.secretpeekingEnabled = original
    }
  })
})
