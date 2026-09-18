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
    mask: async () => calls.push('mask'),
    unmask: async () => calls.push('unmask')
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
    commands: { registerCommand: subscribe('command') }
  }
  const dependencies = {
    vscode,
    './settings': settings,
    './decorations': { decorate: (context, editor) => calls.push(editor) }
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
  it('decorates all visible editors before the first asynchronous settings write', async () => {
    const fixture = setup()
    const running = fixture.run(fixture.context)
    assert.deepStrictEqual(fixture.calls, [...fixture.editors, 'mask'])
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

  it('refreshes all editors and the syntax mask when disabling from settings', async () => {
    const fixture = setup()
    await fixture.run(fixture.context)
    fixture.calls.length = 0
    fixture.setEnabled(false)
    await fixture.listeners.configuration({ affectsConfiguration: key => key === 'dotenv.enableAutocloaking' })
    assert.deepStrictEqual(fixture.calls, [...fixture.editors, 'unmask'])
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

  it('disposes every registered listener', async () => {
    const fixture = setup()
    await fixture.run(fixture.context)
    fixture.context.subscriptions.forEach(subscription => subscription.dispose())
    assert.deepStrictEqual(fixture.disposed.sort(), Object.keys(fixture.listeners).sort())
  })
})

describe('persistent syntax mask', () => {
  it('targets the current grammar, migrates the old mask, and preserves other rules', async () => {
    const customRule = { scope: 'comment', settings: { foreground: '#123456' } }
    let value = { textMateRules: [customRule, { scope: 'keyword.other.dotenv', settings: { foreground: '#FF000000' } }] }
    const module = { exports: {} }
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../../lib/settings.js'), 'utf8'), {
      module,
      require: () => ({
        ConfigurationTarget: { Global: 1 },
        workspace: { getConfiguration: () => ({ get: () => value, update: async (key, next) => { value = next } }) }
      })
    })
    const settings = module.exports
    await settings.mask()
    const grammar = require('../../../syntaxes/dotenv.tmLanguage.json')
    const valueScope = grammar.patterns.find(pattern => pattern.comment === 'ENV entry').captures['3'].name
    assert(value.textMateRules.some(rule => rule.scope === `${grammar.scopeName} ${valueScope}`))
    assert(!value.textMateRules.some(rule => rule.scope === 'keyword.other.dotenv'))
    assert.strictEqual(value.textMateRules[0], customRule)
    assert(value.textMateRules.slice(1).every(rule => rule.settings.foreground.endsWith('00')))
    const count = value.textMateRules.length
    await settings.mask()
    assert.strictEqual(value.textMateRules.length, count)
    await settings.unmask()
    assert.strictEqual(value.textMateRules.length, 1)
    assert.strictEqual(value.textMateRules[0], customRule)
  })
})
