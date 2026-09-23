const { describe, it } = require('mocha')
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const vscode = require('vscode')

function fixture (featureEnabled = true) {
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
  const settings = { cloakIcon: () => '█', secretpeekingEnabled: () => featureEnabled, missingText: () => 'MISSING' }
  const reveal = load('hover-reveal.js', { vscode: fakeVscode, './settings': settings })
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
  it('returns no hover when disabled and rejects previously issued reveal links', async () => {
    const f = fixture()
    const masked = f.hover()
    const token = f.token(masked)
    f.settings.secretpeekingEnabled = () => false
    assert.strictEqual(f.hover(), undefined)
    const before = f.triggers
    assert.strictEqual(await f.click(token), undefined)
    assert.strictEqual(f.triggers, before)
  })
  it('shows and hides a masked value without changing settings or fresh hovers', async () => {
    const f = fixture()
    const masked = f.hover()
    assert(masked.contents[0].value.startsWith('.env\n\n'))
    assert(!masked.contents[0].value.includes('SECRET'))
    assert(masked.contents[0].value.includes('██████'))
    assert(masked.contents[1].value.includes('Reveal value'))
    assert(!masked.contents[1].value.includes('SECRET'))
    const shown = await f.click(f.token(masked))
    assert(shown.contents[0].value.startsWith('.env\n\n'))
    assert(shown.contents[0].value.includes('SECRET'))
    assert(shown.contents[1].value.includes('Hide value'))
    assert(f.editor.selection.active.isEqual(f.range.start))
    assert(!f.hover().contents[0].value.includes('SECRET'), 'A fresh peek must recloak even after revealing another popup')
    const hidden = await f.click(f.token(shown))
    assert(hidden.contents[0].value.startsWith('.env\n\n'))
    assert(!hidden.contents[0].value.includes('SECRET'))
    assert(hidden.contents[0].value.includes('██████'))
    assert.strictEqual(f.settings.secretpeekingEnabled(), true)
    assert(!f.hover().contents[0].value.includes('SECRET'))
    assert.strictEqual(hidden.contents[1].isTrusted.enabledCommands[0], 'dotenv.toggleHoverValue')
    assert.strictEqual(hidden.contents[1].isTrusted.enabledCommands.length, 1)
  })

  it('can hide values when peeking is enabled', async () => {
    const f = fixture(true)
    const shown = await f.click(f.token(f.hover()))
    const hidden = await f.click(f.token(shown))
    assert(hidden.contents[0].value.includes('██████'))
    assert(!f.hover().contents[0].value.includes('SECRET'))
    assert.strictEqual(f.settings.secretpeekingEnabled(), true)
  })

  it('shows every source even when files contain the same value', () => {
    const f = fixture()
    f.helpers.envValues = () => new Map([['HELLO', [
      { source: '.env', value: 'SECRET' },
      { source: '.env.local', value: 'SECRET' }
    ]]])
    const content = f.hover().contents[0].value
    assert(content.includes('.env\n\n'))
    assert(content.includes('.env.local\n\n'))
    assert(!content.includes('SECRET'))
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

it('refreshes the real VS Code hover after clicking Reveal value and Hide value', async function () {
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
    settings.secretpeekingEnabled = () => true
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
      assert(latest.contents[0].value.includes(expected))
      current = latest
    }
  } finally {
    await vscode.commands.executeCommand('editor.action.hideHover')
    provider?.dispose()
    settings.secretpeekingEnabled = original
    await vscode.workspace.fs.delete(uri)
  }
})

it('disables in-code hovers when the actual secret-peeking setting is unchecked', async function () {
  // Settings writes and cold language-provider startup can exceed Mocha's 2s default on CI.
  this.timeout(30000)
  const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, 'peeking-setting.js')
  const config = vscode.workspace.getConfiguration('dotenv', uri)
  const original = config.inspect('enableSecretpeeking').workspaceValue
  const originalCloaking = config.inspect('enableAutocloaking').workspaceValue
  const settings = require('../../../lib/settings')
  try {
    await vscode.extensions.getExtension('dotenv.dotenv-vscode').activate()
    await vscode.workspace.fs.writeFile(uri, Buffer.from('process.env.HELLO\n'))
    await vscode.workspace.openTextDocument(uri)
    for (const [enabled, cloaking, revealEditor] of [[true, true, false], [true, true, true], [true, false, false], [false, true, false], [false, false, false], [true, true, false]]) {
      await config.update('enableAutocloaking', cloaking, vscode.ConfigurationTarget.Workspace)
      await settings.resetAutocloaking()
      if (revealEditor) await settings.autocloakingOff(uri)
      await config.update('enableSecretpeeking', enabled, vscode.ConfigurationTarget.Workspace)
      const hovers = await vscode.commands.executeCommand('vscode.executeHoverProvider', uri, new vscode.Position(0, 14))
      const content = hovers.flatMap(hover => hover.contents).map(item => item.value || '').join('\n')
      assert.strictEqual(content.includes('.env'), enabled)
      assert(!content.includes('World'))
      assert.strictEqual(content.includes('█████'), enabled)
      const completions = await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', uri, new vscode.Position(0, 12))
      const item = completions.items.find(item => item.label.label === 'HELLO')
      assert(item, 'Autocomplete must remain available')
      assert.strictEqual(!!item.documentation, enabled)
      if (enabled) {
        assert(item.documentation.value.includes('█████'))
        assert(!item.documentation.value.includes('World'))
        assert(content.includes('Reveal value'))
      }
      if (!enabled) {
        assert(!content.includes('█████'))
        assert(!content.includes('Reveal value'))
      }
    }
  } finally {
    await settings.resetAutocloaking()
    await config.update('enableAutocloaking', originalCloaking, vscode.ConfigurationTarget.Workspace)
    await config.update('enableSecretpeeking', original, vscode.ConfigurationTarget.Workspace)
    await vscode.workspace.fs.delete(uri)
  }
})
