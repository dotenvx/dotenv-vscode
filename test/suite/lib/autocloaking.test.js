const { describe, it } = require('mocha')
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')

function setup () {
  const listeners = {}
  const calls = []
  const disposed = []
  let enabled = true
  const subscribe = name => callback => {
    listeners[name] = callback
    return { dispose: () => disposed.push(name) }
  }
  const editor = uri => ({ document: { uri: { toString: () => uri } } })
  const editors = [editor('file:///project/.env'), editor('file:///project/.env')]
  const settings = {
    autocloakingEnabled: () => enabled,
    initialize: () => {},
    removeLegacyMask: async () => {},
    resetAutocloaking: async () => {},
    autocloakingOn: async () => { enabled = true },
    autocloakingOff: async () => { enabled = false }
  }
  const vscode = {
    window: {
      visibleTextEditors: editors,
      onDidChangeVisibleTextEditors: subscribe('visible'),
      onDidChangeActiveTextEditor: subscribe('active')
    },
    workspace: {
      onDidOpenTextDocument: subscribe('open'),
      onDidChangeTextDocument: subscribe('edit'),
      onDidChangeConfiguration: subscribe('configuration')
    },
    languages: { registerCodeLensProvider: subscribe('lenses') },
    commands: { registerCommand: (name, callback) => subscribe('command')(callback) }
  }
  const dependencies = {
    vscode,
    './secure-editor': { toggleActive: () => false },
    './yaml-cloaking': { supported: () => false },
    './settings': settings,
    './decorations': {
      decorate: (context, editor) => calls.push(editor),
      dispose: { dispose: () => disposed.push('decoration') }
    }
  }
  const module = { exports: {} }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../../lib/autocloaking.js'), 'utf8'), {
    require: name => dependencies[name], module
  })
  return {
    run: module.exports.run,
    context: { subscriptions: [] },
    listeners,
    calls,
    editors,
    disposed,
    setEnabled: value => { enabled = value }
  }
}

describe('autocloaking lifecycle', () => {
  it('decorates all visible editors on activation', async () => {
    const fixture = setup()
    const running = fixture.run(fixture.context)
    assert.deepStrictEqual(fixture.calls, fixture.editors)
    await running
  })

  it('decorates newly visible editors even when the document is already open', async () => {
    const fixture = setup()
    await fixture.run(fixture.context)
    fixture.calls.length = 0
    fixture.listeners.visible()
    assert.deepStrictEqual(fixture.calls, fixture.editors)
  })

  it('refreshes both split editors on edits using URI values', async () => {
    const fixture = setup()
    await fixture.run(fixture.context)
    fixture.calls.length = 0
    fixture.listeners.edit({ document: { uri: { toString: () => 'file:///project/.env' } } })
    assert.deepStrictEqual(fixture.calls, fixture.editors)
    fixture.calls.length = 0
    fixture.listeners.edit({ document: { uri: { toString: () => 'file:///project/other.js' } } })
    assert.deepStrictEqual(fixture.calls, [])
  })

  it('refreshes all editors when disabling from settings', async () => {
    const fixture = setup()
    await fixture.run(fixture.context)
    fixture.calls.length = 0
    fixture.setEnabled(false)
    await fixture.listeners.configuration({ affectsConfiguration: key => key === 'dotenv.enableAutocloaking' })
    assert.deepStrictEqual(fixture.calls, fixture.editors)
  })

  it('refreshes all editors when the cloak appearance changes', async () => {
    const fixture = setup()
    await fixture.run(fixture.context)
    fixture.calls.length = 0
    await fixture.listeners.configuration({ affectsConfiguration: key => key === 'dotenv.cloakIcon' })
    assert.deepStrictEqual(fixture.calls, fixture.editors)
  })

  it('refreshes visible editors when their document language changes', async () => {
    const fixture = setup()
    await fixture.run(fixture.context)
    fixture.calls.length = 0
    fixture.listeners.open({ uri: { toString: () => 'file:///project/.env' } })
    assert.deepStrictEqual(fixture.calls, fixture.editors)
  })

  it('refreshes both editors after toggling in either direction', async () => {
    const fixture = setup()
    await fixture.run(fixture.context)
    for (let i = 0; i < 2; i++) {
      fixture.calls.length = 0
      await fixture.listeners.command()
      assert.deepStrictEqual(fixture.calls, fixture.editors)
    }
  })

  it('disposes every registered listener', async () => {
    const fixture = setup()
    await fixture.run(fixture.context)
    fixture.context.subscriptions.forEach(subscription => subscription.dispose())
    assert.deepStrictEqual(fixture.disposed.sort(), [...Object.keys(fixture.listeners), 'decoration'].sort())
  })
})

describe('cloaking settings isolation', () => {
  function loadSettings (globalValue, workspaceValue) {
    const writes = []
    const stored = new Map()
    let configured = true
    const module = { exports: {} }
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../../lib/settings.js'), 'utf8'), {
      module,
      require: () => ({
        ConfigurationTarget: { Global: 1 },
        workspace: {
          getConfiguration: () => ({
            get: key => key === 'dotenv.enableAutocloaking' ? configured : workspaceValue || globalValue,
            inspect: () => ({ globalValue, workspaceValue }),
            update: async (key, next, target) => {
              writes.push({ key, next, target })
              globalValue = next
            }
          })
        }
      })
    })
    const context = {
      globalState: {
        get: key => stored.get(key),
        update: async (key, value) => { stored.set(key, value) }
      }
    }
    const settings = module.exports
    settings.initialize(context)
    return { settings, writes, context, configure: value => { configured = value } }
  }

  it('does not write settings on a fresh install, toggle, or reload', async () => {
    const { settings, writes, context } = loadSettings()
    await settings.removeLegacyMask()
    assert.strictEqual(settings.autocloakingEnabled(), true)
    await settings.autocloakingOff()
    settings.initialize(context)
    assert.strictEqual(settings.autocloakingEnabled(), false)
    await settings.autocloakingOn()
    assert.strictEqual(settings.autocloakingEnabled(), true)
    assert.deepStrictEqual(writes, [])
  })

  it('honors configuration changes over a saved toggle', async () => {
    const { settings, configure } = loadSettings()
    await settings.autocloakingOn()
    configure(false)
    assert.strictEqual(settings.autocloakingEnabled(), false)
    await settings.autocloakingOn()
    assert.strictEqual(settings.autocloakingEnabled(), true)
    await settings.resetAutocloaking()
    assert.strictEqual(settings.autocloakingEnabled(), false)
  })

  it('removes only exact generated global rules and never copies workspace colors', async () => {
    const custom = { scope: 'comment', settings: { foreground: '#123456' } }
    const modified = { scope: 'keyword.other.dotenv', settings: { foreground: '#FF000000', fontStyle: 'italic' } }
    const named = { name: 'My rule', scope: 'keyword.other.dotenv', settings: { foreground: '#FF000000' } }
    const scopes = ['keyword.other.dotenv', ...['', ' string', ' variable', ' keyword', ' constant', ' comment'].map(suffix => `source.dotenv property.value.dotenv${suffix}`)]
    const legacy = scopes.map(scope => ({ scope, settings: { foreground: '#FF000000' } }))
    const { settings, writes } = loadSettings({ comments: '#abcdef', textMateRules: [custom, ...legacy, modified, named] }, { strings: '#ffffff' })
    await settings.removeLegacyMask()
    assert.strictEqual(writes.length, 1)
    assert.strictEqual(writes[0].target, 1)
    assert.strictEqual(writes[0].next.comments, '#abcdef')
    assert.strictEqual(writes[0].next.strings, undefined)
    assert.deepStrictEqual(Array.from(writes[0].next.textMateRules), [custom, modified, named])
    await settings.removeLegacyMask()
    assert.strictEqual(writes.length, 1)
  })

  it('removes an empty customization left after legacy cleanup', async () => {
    const { settings, writes } = loadSettings({ textMateRules: [{ scope: 'keyword.other.dotenv', settings: { foreground: '#FF000000' } }] })
    await settings.removeLegacyMask()
    assert.strictEqual(writes.length, 1)
    assert.strictEqual(writes[0].next, undefined)
  })

  it('leaves unrelated global and workspace-only rules untouched', async () => {
    const legacy = { textMateRules: [{ scope: 'keyword.other.dotenv', settings: { foreground: '#FF000000' } }] }
    for (const value of [undefined, { textMateRules: [] }, { textMateRules: [{ scope: 'comment', settings: { foreground: '#ffffff' } }] }]) {
      const { settings, writes } = loadSettings(value, legacy)
      await settings.removeLegacyMask()
      assert.deepStrictEqual(writes, [])
    }
  })
})
