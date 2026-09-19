const { describe, it } = require('mocha')
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')
function fixture (initial = 'KEY=SECRET\r\n') {
  let text = initial
  const changes = []
  const undo = []
  const redo = []
  let saves = 0
  const document = { version: 1, eol: 2, uri: { toString: () => 'file:///test/.env' }, getText: () => text, positionAt: offset => ({ offset }), save: async () => { saves++; return true } }
  const changed = next => { text = next; document.version++; changes.forEach(fn => fn({ document })) }
  const subscribe = (list, fn) => { list.push(fn); return { dispose: () => list.splice(list.indexOf(fn), 1) } }
  const vscode = {
    Uri: { joinPath: (_, name) => name },
    EndOfLine: { CRLF: 2 },
    Range: class { constructor (start, end) { this.start = start; this.end = end } },
    WorkspaceEdit: class { replace (uri, range, value) { this.range = range; this.value = value } },
    workspace: {
      getConfiguration: () => ({ get: () => undefined }),
      onDidChangeConfiguration: () => ({ dispose () {} }),
      onDidChangeTextDocument: fn => subscribe(changes, fn),
      applyEdit: async edit => { undo.push(text); redo.length = 0; changed(text.slice(0, edit.range.start.offset) + edit.value + text.slice(edit.range.end.offset)); return true }
    },
    commands: { executeCommand: async command => { const from = command === 'undo' ? undo : redo; const to = command === 'undo' ? redo : undo; if (from.length) { to.push(text); changed(from.pop()) } } }
  }
  const module = { exports: {} }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../../lib/secure-editor.js'), 'utf8'), {
    module, require: name => name === 'vscode' ? vscode : name === './secure-document' ? require('../../../lib/secure-document') : require(name)
  })
  const messages = []
  let receive
  const panel = {
    active: true,
    visible: true,
    webview: { cspSource: 'test:', asWebviewUri: value => value, postMessage: async value => messages.push(value), onDidReceiveMessage: fn => { receive = fn; return { dispose () {} } } },
    onDidDispose: () => ({ dispose () {} })
  }
  module.exports.resolveCustomTextEditor(document, panel, { extensionUri: '/extension' })
  return { document, messages, changed, saves: () => saves, send: (type, extra = {}) => receive({ client: 'test', type, ...extra }) }
}
describe('Monaco document synchronization', () => {
  it('serializes rapid edits, preserves CRLF, and saves the last edit', async () => {
    const f = fixture()
    await f.send('ready')
    await Promise.all([
      f.send('edit', { id: 1, before: 'KEY=SECRET\n', text: 'KEY=NEW\n' }),
      f.send('edit', { id: 2, before: 'KEY=NEW\n', text: 'KEY=NEW\nNEXT=value\n' }),
      f.send('save')
    ])
    assert.strictEqual(f.document.getText(), 'KEY=NEW\r\nNEXT=value\r\n')
    assert.strictEqual(f.saves(), 1)
    await f.send('undo')
    assert.strictEqual(f.document.getText(), 'KEY=NEW\r\n')
    await f.send('redo')
    assert(f.document.getText().includes('NEXT=value'))
  })
  it('rejects stale edits and blocks further writes after a conflict', async () => {
    const f = fixture()
    await f.send('ready')
    f.changed('KEY=EXTERNAL\r\n')
    await f.send('edit', { before: 'KEY=SECRET\n', text: 'KEY=bad\n' })
    await f.send('edit', { before: 'KEY=EXTERNAL\n', text: 'KEY=bad\n' })
    assert.strictEqual(f.document.getText(), 'KEY=EXTERNAL\r\n')
    assert.strictEqual(f.messages.at(-1).type, 'conflict')
  })
})
