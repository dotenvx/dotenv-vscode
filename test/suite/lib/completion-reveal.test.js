const { describe, it } = require('mocha')
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const vscode = require('vscode')

function fixture () {
  let line = 'process.env.'
  const document = { uri: vscode.Uri.file('/test/index.js'), lineAt: () => ({ text: line }) }
  const editor = { document, selection: { active: new vscode.Position(0, line.length) } }
  const provider = {}
  let handler
  let result
  let triggers = 0
  const fakeVscode = {
    ...vscode,
    window: { activeTextEditor: editor },
    commands: {
      registerCommand: (name, callback) => { handler = callback; return { dispose () {} } },
      executeCommand: async name => {
        if (name === 'editor.action.triggerSuggest') {
          triggers++
          result = reveal.refresh(editor.document, editor.selection.active, provider)
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
  const settings = { cloakIcon: () => '█', secretpeekingEnabled: () => true }
  const reveal = load('completion-reveal.js', { vscode: fakeVscode, './settings': settings })
  const helpers = load('helpers.js', {
    vscode: fakeVscode,
    './completion-reveal': reveal,
    './hover-reveal': require('../../../lib/hover-reveal'),
    './settings': settings,
    './env-files': {
      read: () => [
        { label: '.env', parsed: { HELLO: 'FIRSTSECRET', OTHER: 'OTHERSECRET' } },
        { label: '.env.local', parsed: { HELLO: '[click](command:evil)' } }
      ]
    }
  })
  reveal.run({ subscriptions: [] })
  const original = helpers.autocomplete('.', document, editor.selection.active)
  // Model language providers that customize insertion and replacement ranges.
  original[0].insertText = 'HELLO'
  original[0].range = new vscode.Range(0, 12, 0, 12)
  reveal.bind(original, provider)
  const tokens = item => [...item.documentation.value.matchAll(/command:dotenv.toggleCompletionValue\?([^)]*)/g)].map(match => JSON.parse(decodeURIComponent(match[1]))[0])
  return {
    original,
    tokens,
    reveal,
    settings,
    helpers,
    editor,
    provider,
    click: async token => { result = undefined; await handler(token); return result },
    get triggers () { return triggers },
    type: text => { line += text; editor.selection.active = new vscode.Position(0, line.length) }
  }
}

describe('completion popup reveal', () => {
  it('keeps autocomplete suggestions but removes expanded details when peeking is disabled', async () => {
    const f = fixture()
    const token = f.tokens(f.original[0])[0]
    f.settings.secretpeekingEnabled = () => false
    const items = f.helpers.autocomplete('.', f.editor.document, f.editor.selection.active)
    assert(items.length > 0)
    assert.strictEqual(items[0].label.label, 'HELLO')
    assert.strictEqual(items[0].insertText, '.HELLO')
    assert.strictEqual(items[0].documentation, undefined)
    assert.strictEqual(await f.click(token), undefined)
    assert.strictEqual(f.triggers, 0)
  })
  it('reveals one source only, preserves insertion, and masks again on hide and fresh requests', async () => {
    const f = fixture()
    const original = f.original[0]
    assert(!original.documentation.value.includes('FIRSTSECRET'))
    assert(!original.documentation.value.includes('command:evil'))
    const token = f.tokens(original)[0]
    f.type('HE')
    const revealed = await f.click(token)
    assert(revealed[0].documentation.value.includes('FIRSTSECRET'))
    assert(revealed[0].documentation.value.includes('Hide value'))
    assert(!revealed[0].documentation.value.includes('command:evil'))
    assert(!revealed[1].documentation.value.includes('OTHERSECRET'))
    assert(!revealed[0].label.detail.includes('FIRSTSECRET'))
    assert.strictEqual(revealed[0].insertText, 'HELLO')
    assert.strictEqual(revealed[0].range.start.character, 12)
    assert.strictEqual(revealed[0].range.end.character, 14)
    assert.strictEqual(revealed[0].preselect, true)
    assert.strictEqual(f.settings.secretpeekingEnabled(), true)
    const hidden = await f.click(f.tokens(revealed[0])[0])
    assert(!hidden[0].documentation.value.includes('FIRSTSECRET'))
    assert.strictEqual(f.reveal.refresh(f.editor.document, f.editor.selection.active, f.provider), undefined)
    const fresh = f.helpers.autocomplete('.', f.editor.document, f.editor.selection.active)
    assert(!fresh[0].documentation.value.includes('FIRSTSECRET'))
  })

  it('escapes revealed text and allows only the dedicated command', async () => {
    const f = fixture()
    const result = await f.click(f.tokens(f.original[0])[1])
    const markdown = result[0].documentation
    assert(markdown.value.includes('\\[click\\]'))
    assert.strictEqual(markdown.isTrusted.enabledCommands.length, 1)
    assert.strictEqual(markdown.isTrusted.enabledCommands[0], 'dotenv.toggleCompletionValue')
    assert(!markdown.supportHtml)
    assert(!result[0].documentation.value.includes('FIRSTSECRET'))
  })

  it('ignores unknown, replayed, and stale-context links', async () => {
    const f = fixture()
    await f.click('unknown')
    assert.strictEqual(f.triggers, 0)
    const token = f.tokens(f.original[0])[0]
    await f.click(token)
    assert.strictEqual(f.triggers, 1)
    await f.click(token)
    assert.strictEqual(f.triggers, 1)
    f.type(' + otherExpression')
    await f.click(f.tokens(f.original[1])[0])
    assert.strictEqual(f.triggers, 1)
  })
})
