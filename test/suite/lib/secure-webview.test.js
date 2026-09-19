const { describe, it } = require('mocha')
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')
function fixture () {
  const ids = Object.fromEntries(['editor', 'status', 'toggle'].map(id => [id, { addEventListener (name, fn) { this[name] = fn } }]))
  const document = { hidden: false, getElementById: id => ids[id], addEventListener (name, fn) { this[name] = fn } }
  const window = { addEventListener (name, fn) { this[name] = fn } }
  const requests = []
  const editor = { value: '', getCursor: () => ({}), getScrollInfo: () => ({}), setCursor () {}, scrollTo () {}, clearHistory () {}, setOption () {}, on (name, fn) { this[name] = fn }, getValue () { return this.value }, setValue (text) { this.value = text; if (this.change) this.change() } }
  const CodeMirror = () => editor
  CodeMirror.defineMode = () => {}
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../../media/secure-editor.js'), 'utf8'), {
    document, window, CodeMirror, dotenvDocument: require('../../../lib/secure-document'), crypto: { getRandomValues: array => array.fill(1) }, acquireVsCodeApi: () => ({ postMessage: message => requests.push(message) })
  })
  const state = (revealed, text, generation = requests[requests.length - 1].generation) => window.message({ data: { type: 'state', client: requests[0].client, generation, revealed, text } })
  state(false, 'KEY=████')
  return { ids, document, window, editor, requests, state }
}
describe('source editor masking', () => {
  it('hides immediately and ignores stale reveal replies', () => {
    const f = fixture()
    f.ids.toggle.click()
    f.state(true, '# comment\nKEY=SECRET')
    assert(f.editor.value.includes('SECRET'))
    f.ids.toggle.click()
    assert.strictEqual(f.editor.value, '# comment\nKEY=██████')
    f.state(true, 'KEY=SECRET', 1)
    assert(!f.editor.value.includes('SECRET'))
  })
  it('sends typing before hide so switching tabs does not discard edits', () => {
    const f = fixture()
    f.ids.toggle.click()
    f.state(true, 'KEY=SECRET')
    f.editor.setValue('KEY=CHANGED')
    f.document.hidden = true
    f.document.visibilitychange()
    assert.deepStrictEqual(f.requests.slice(-2).map(r => r.type), ['edit', 'hide'])
    assert(!f.editor.value.includes('CHANGED'))
    f.state(true, 'KEY=SECRET')
    assert(!f.editor.value.includes('SECRET'))
  })
})
