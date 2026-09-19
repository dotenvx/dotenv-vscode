/* global acquireVsCodeApi, CodeMirror, dotenvDocument */
const vscode = acquireVsCodeApi()
const client = Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-')
const toggle = document.getElementById('toggle')
const status = document.getElementById('status')
let revealed = false
let updating = false
let hiding = true
let previous = ''
let sequence = 0
let generation = 0
const pending = new Set()
const request = (type, extra = {}) => vscode.postMessage({ type, client, generation, ...extra })
CodeMirror.defineMode('dotenv', () => ({
  startState: () => ({ quote: null }),
  token: (stream, state) => {
    if (!state.quote && stream.eatSpace()) return null
    if (!state.quote && stream.peek() === '#') { stream.skipToEnd(); return 'comment' }
    if (!state.quote && stream.sol() && stream.match(/(?:export\s+)?[\w.-]+(?=\s*[=:])/)) return 'def'
    if (!state.quote && stream.match(/[=:]/)) return 'operator'
    if (!state.quote && /["'`]/.test(stream.peek() || ' ')) state.quote = stream.next()
    let escaped = false
    while (!stream.eol()) {
      const ch = stream.next()
      if (state.quote && ch === state.quote && !escaped) { state.quote = null; break }
      if (!state.quote && ch === '#') { stream.backUp(1); break }
      escaped = ch === '\\' && !escaped
    }
    return 'string'
  }
}))
const editor = CodeMirror(document.getElementById('editor'), {
  value: '',
  mode: 'dotenv',
  lineNumbers: true,
  lineWrapping: false,
  readOnly: true,
  indentUnit: 2,
  tabSize: 2,
  viewportMargin: 20,
  extraKeys: {
    'Cmd-S': () => request('save'),
    'Ctrl-S': () => request('save'),
    'Cmd-Z': () => request('undo'),
    'Ctrl-Z': () => request('undo'),
    'Shift-Cmd-Z': () => request('redo'),
    'Ctrl-Y': () => request('redo'),
    Esc: () => hide()
  }
})
function setText (text) {
  const cursor = editor.getCursor()
  const scroll = editor.getScrollInfo()
  updating = true
  editor.setValue(text)
  editor.clearHistory()
  editor.setCursor(cursor)
  editor.scrollTo(scroll.left, scroll.top)
  updating = false
  previous = text
}
function hide () {
  hiding = true
  revealed = false
  editor.setOption('readOnly', true)
  // Clear plaintext synchronously, even when the extension host is stalled.
  // The host returns the correctly parsed masked source after queued edits.
  setText(dotenvDocument.masked(editor.getValue()))
  status.textContent = 'Values hidden'
  generation++
  request('hide')
}
function toggleValues () {
  if (revealed) hide()
  else { hiding = false; generation++; request('reveal') }
}
editor.on('change', () => {
  if (updating || !revealed) return
  const text = editor.getValue()
  const id = ++sequence
  pending.add(id)
  request('edit', { id, before: previous, text })
  previous = text
  editor.clearHistory()
})
window.addEventListener('message', event => {
  const message = event.data
  if (!message) return
  if (message.type === 'toggle') { toggleValues(); return }
  if (message.client !== client) return
  if (message.type === 'ack') { pending.delete(message.id); return }
  if (message.type === 'conflict') {
    editor.setOption('readOnly', true)
    status.textContent = 'File changed elsewhere. Copy your edits before reopening this file.'
    return
  }
  if (message.type !== 'state' || message.generation !== generation || (message.revealed && (hiding || document.hidden))) return
  if (pending.size && message.revealed) return
  revealed = message.revealed
  setText(message.text)
  editor.setOption('readOnly', !revealed)
  toggle.disabled = false
  status.textContent = revealed ? '' : 'Values hidden · toggle to edit'
})
toggle.addEventListener('click', toggleValues)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) hide()
  else { generation++; request('hide') }
})
request('ready')
