const { describe, it } = require('mocha')
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const vscode = require('vscode')

function fixture (defaultRevealed = false) {
  const document = { uri: vscode.Uri.file('/test/hover.js'), version: 1 }
  const range = new vscode.Range(0, 12, 0, 17)
  const editor = { document, selection: new vscode.Selection(3, 0, 3, 0) }
  let handler
  let result
  let triggers = 0
  const fakeVscode = {
    ...vscode,
    window: { activeTextEditor: editor },
    commands: {
      registerCommand: (name, callback) => { handler = callback; return { dispose () {} } },
      executeCommand: async name => {
        if (name === 'editor.action.showHover') {
          triggers++
          result = helpers.valueHover('HELLO', document, range)
        }
      }
    }
  }
  const load = (name, dependencies) => {
    const module = { exports: {} }
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../../lib', name), 'utf8'), {
      module, require: name => dependencies[name] || require(name), setTimeout
    })
    return module.exports
  }
  const reveal = load('hover-reveal.js', { vscode: fakeVscode })
  const settings = { cloakIcon: () => '█', secretpeekingEnabled: () => defaultRevealed, missingText: () => 'MISSING' }
  const helpers = load('helpers.js', {
    vscode: fakeVscode,
    './hover-reveal': reveal,
    './completion-reveal': {},
    './settings': settings,
    './env-files': { read: () => [{ label: '.env', parsed: { HELLO: 'SECRET', EMPTY: '' } }] }
  })
  reveal.run({ subscriptions: [] })
  return {
    document,
    editor,
    helpers,
    range,
    settings,
    hover: () => helpers.valueHover('HELLO', document, range),
    token: hover => JSON.parse(decodeURIComponent(hover.contents[1].value.match(/\?([^)]*)/)[1]))[0],
    click: async token => { result = undefined; await handler(token); return result },
    get triggers () { return triggers }
  }
}

describe('hover popup reveal', () => {
  it('shows and hides a masked value without changing settings or fresh hovers', async () => {
    const f = fixture()
    const masked = f.hover()
    assert.strictEqual(masked.contents[0], '██████')
    assert(masked.contents[1].value.includes('Show value'))
    assert(!masked.contents[1].value.includes('SECRET'))
    const shown = await f.click(f.token(masked))
    assert.strictEqual(shown.contents[0], 'SECRET')
    assert(shown.contents[1].value.includes('Hide value'))
    assert(f.editor.selection.active.isEqual(f.range.start))
    const hidden = await f.click(f.token(shown))
    assert.strictEqual(hidden.contents[0], '██████')
    assert.strictEqual(f.settings.secretpeekingEnabled(), false)
    assert.strictEqual(f.hover().contents[0], '██████')
    assert.strictEqual(hidden.contents[1].isTrusted.enabledCommands[0], 'dotenv.toggleHoverValue')
    assert.strictEqual(hidden.contents[1].isTrusted.enabledCommands.length, 1)
  })

  it('can hide values when peeking is enabled', async () => {
    const f = fixture(true)
    const hidden = await f.click(f.token(f.hover()))
    assert.strictEqual(hidden.contents[0], '██████')
    assert.strictEqual(f.hover().contents[0], 'SECRET')
    assert.strictEqual(f.settings.secretpeekingEnabled(), true)
  })

  it('ignores unknown, reused, edited-document, and other-file links', async () => {
    const f = fixture()
    await f.click('unknown')
    assert.strictEqual(f.triggers, 0)
    const token = f.token(f.hover())
    await f.click(token)
    await f.click(token)
    assert.strictEqual(f.triggers, 1)
    const stale = f.token(f.hover())
    f.document.version++
    await f.click(stale)
    assert.strictEqual(f.triggers, 1)
    const other = f.token(f.hover())
    f.editor.document = { uri: vscode.Uri.file('/other.js'), version: f.document.version }
    await f.click(other)
    assert.strictEqual(f.triggers, 1)
  })

  it('does not add controls for missing or empty values', () => {
    const f = fixture()
    assert.strictEqual(f.helpers.valueHover('MISSING', f.document, f.range).contents.length, 1)
    assert.strictEqual(f.helpers.valueHover('EMPTY', f.document, f.range).contents.length, 1)
  })
})

it('refreshes the real VS Code hover after clicking Show value and Hide value', async function () {
  this.timeout(10000)
  const helpers = require('../../../lib/helpers')
  const settings = require('../../../lib/settings')
  const original = settings.secretpeekingEnabled
  const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, 'hover-toggle.txt')
  const range = new vscode.Range(0, 0, 0, 5)
  let latest
  let provider
  try {
    await vscode.extensions.getExtension('dotenv.dotenv-vscode').activate()
    settings.secretpeekingEnabled = () => false
    await vscode.workspace.fs.writeFile(uri, Buffer.from('HELLO'))
    const document = await vscode.workspace.openTextDocument(uri)
    await vscode.window.showTextDocument(document)
    provider = vscode.languages.registerHoverProvider({ scheme: 'file', pattern: uri.fsPath }, {
      provideHover: () => {
        latest = helpers.valueHover('HELLO', document, range)
        return latest
      }
    })
    const token = hover => JSON.parse(decodeURIComponent(hover.contents[1].value.match(/\?([^)]*)/)[1]))[0]
    let current = helpers.valueHover('HELLO', document, range)
    for (const expected of ['World', '█████']) {
      latest = undefined
      await vscode.commands.executeCommand('dotenv.toggleHoverValue', token(current))
      const deadline = Date.now() + 3000
      while (Date.now() < deadline) {
        if (latest) break
        await new Promise(resolve => setTimeout(resolve, 25))
      }
      assert(latest, 'The command should request a new hover from the provider')
      assert.strictEqual(latest.contents[0], expected)
      current = latest
    }
  } finally {
    await vscode.commands.executeCommand('editor.action.hideHover')
    provider?.dispose()
    settings.secretpeekingEnabled = original
    await vscode.workspace.fs.delete(uri)
  }
})
