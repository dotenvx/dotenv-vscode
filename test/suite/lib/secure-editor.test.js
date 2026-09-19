const { describe, it } = require('mocha')
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')

function fixture (text = '# private comment\r\nexport KEY = "DUMMY_SECRET" # keep\r\nEMPTY=\r\n') {
  const changes = []
  const undo = []
  const redo = []
  const clipboard = []
  const document = { version: 1, eol: 2, uri: { toString: () => 'file:///test/.env' }, getText: () => text, positionAt: offset => ({ offset }), save: async () => true }
  const subscribe = (list, callback) => { list.push(callback); return { dispose: () => { const index = list.indexOf(callback); if (index >= 0) list.splice(index, 1) } } }
  const changed = next => { text = next; document.version++; changes.slice().forEach(fn => fn({ document })) }
  const vscode = {
    Uri: { joinPath: (_, name) => name },
    EndOfLine: { CRLF: 2 },
    Range: class { constructor (start, end) { this.start = start; this.end = end } },
    WorkspaceEdit: class { replace (uri, range, value) { this.range = range; this.value = value } },
    workspace: {
      onDidChangeTextDocument: fn => subscribe(changes, fn),
      applyEdit: async edit => { undo.push(text); redo.length = 0; changed(text.slice(0, edit.range.start.offset) + edit.value + text.slice(edit.range.end.offset)); return true }
    },
    env: { clipboard: { writeText: async value => clipboard.push(value) } },
    commands: { executeCommand: async command => { const from = command === 'undo' ? undo : redo; const to = command === 'undo' ? redo : undo; if (from.length) { to.push(text); changed(from.pop()) } } }
  }
  const module = { exports: {} }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../../lib/secure-editor.js'), 'utf8'), {
    module,
    require: name => name === 'vscode' ? vscode : name === './secure-document' ? require('../../../lib/secure-document') : require(name)
  })
  const views = []
  function open () {
    const messages = []
    const visibility = []
    const disposed = []
    let receive
    const panel = {
      visible: true,
      active: true,
      webview: { cspSource: 'test:', asWebviewUri: value => value, postMessage: async value => { messages.push(value); return true }, onDidReceiveMessage: callback => { receive = callback; return { dispose: () => {} } } },
      onDidChangeViewState: fn => subscribe(visibility, fn),
      onDidDispose: fn => subscribe(disposed, fn)
    }
    module.exports.resolveCustomTextEditor(document, panel, { extensionUri: '/extension' })
    let epoch = 0
    const view = { panel, messages, send: (type, extra = {}) => receive({ client: 'test', epoch: ++epoch, version: document.version, type, ...extra }), last: () => messages[messages.length - 1], hide: () => { panel.visible = false; visibility.slice().forEach(fn => fn()) }, dispose: () => disposed.slice().forEach(fn => fn()) }
    views.push(view)
    return view
  }
  return { open, document, clipboard, changed, changes }
}

describe('secure editor protocol', () => {
  it('preserves source layout while withholding values until reveal', async () => {
    const f = fixture()
    const v = f.open()
    await v.send('ready')
    assert(!JSON.stringify(v.last()).includes('DUMMY_SECRET'))
    assert(v.last().text.includes('# private comment\nexport KEY = '))
    assert(v.last().text.includes(' # keep\nEMPTY='))
    await v.send('reveal')
    assert(v.last().text.includes('DUMMY_SECRET'))
    await v.send('hide')
    assert(!JSON.stringify(v.last()).includes('DUMMY_SECRET'))
  })
  it('applies queued typing before hiding and preserves CRLF and undo', async () => {
    const f = fixture()
    const v = f.open()
    await v.send('ready')
    await v.send('reveal')
    const before = v.last().text
    const after = before.replace('DUMMY_SECRET', 'edited')
    await Promise.all([v.send('edit', { id: 1, before, text: after }), v.send('edit', { id: 2, before: after, text: after + 'NEXT=value\n' }), v.send('hide')])
    assert(f.document.getText().includes('"edited" # keep\r\n'))
    assert(f.document.getText().endsWith('NEXT=value\r\n'))
    assert(!v.last().text.includes('edited'))
    await v.send('undo')
    assert(!f.document.getText().includes('NEXT='))
    await v.send('redo')
    assert(f.document.getText().includes('NEXT='))
  })
  it('rejects stale edits without overwriting external changes', async () => {
    const f = fixture()
    const v = f.open()
    await v.send('ready')
    await v.send('reveal')
    const before = v.last().text
    f.changed('KEY=external')
    await v.send('edit', { before, text: 'KEY=overwrite' })
    assert.strictEqual(f.document.getText(), 'KEY=external')
    assert.strictEqual(v.last().type, 'conflict')
  })
  it('starts splits masked and rejects edits without reveal', async () => {
    const f = fixture()
    const a = f.open()
    await a.send('ready')
    await a.send('reveal')
    const b = f.open()
    await b.send('ready')
    assert(!b.last().text.includes('DUMMY_SECRET'))
    await b.send('edit', { before: a.last().text, text: 'KEY=bad' })
    assert(f.document.getText().includes('DUMMY_SECRET'))
    a.dispose()
    b.dispose()
    assert.strictEqual(f.changes.length, 0)
  })
})
