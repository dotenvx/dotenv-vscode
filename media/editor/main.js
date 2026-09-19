/* global acquireVsCodeApi, self, Worker, getComputedStyle, MutationObserver */
import * as monaco from 'monaco-editor/editor/editor.api.js'
import 'monaco-editor/editor/contrib/find/browser/findController.js'
import 'monaco-editor/editor/contrib/clipboard/browser/clipboard.js'
import 'monaco-editor/editor/contrib/multicursor/browser/multicursor.js'
import 'monaco-editor/editor/contrib/linesOperations/browser/linesOperations.js'
import 'monaco-editor/editor/contrib/wordOperations/browser/wordOperations.js'
import 'monaco-editor/editor/contrib/indentation/browser/indentation.js'
import 'monaco-editor/editor/contrib/comment/browser/comment.js'
import 'monaco-editor/editor/contrib/contextmenu/browser/contextmenu.js'
import 'monaco-editor/editor/contrib/bracketMatching/browser/bracketMatching.js'
import 'monaco-editor/editor/contrib/folding/browser/folding.js'
import { entries } from '../../lib/secure-document'

const vscode = acquireVsCodeApi()
const client = Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-')
const container = document.getElementById('editor')
const status = document.getElementById('status')
const toggle = document.getElementById('toggle')
const workerUrl = URL.createObjectURL(new Blob([`importScripts(${JSON.stringify(container.dataset.worker)})`], { type: 'text/javascript' }))
self.MonacoEnvironment = { getWorker: () => new Worker(workerUrl) }
let editor
let masked = true
let applying = false
let previous = ''
let sequence = 0
let version = 0
let decorations
let conflict = false
const pending = new Set()
const request = (type, extra = {}) => vscode.postMessage({ type, client, ...extra })

monaco.languages.register({ id: 'dotenv' })
monaco.languages.setLanguageConfiguration('dotenv', {
  comments: { lineComment: '#' },
  brackets: [['{', '}']],
  autoClosingPairs: [{ open: '"', close: '"' }, { open: "'", close: "'" }, { open: '`', close: '`' }]
})
monaco.languages.setMonarchTokensProvider('dotenv', {
  tokenizer: {
    root: [
      [/^\s*(?:export\s+)?[\w.-]+(?=\s*[=:])/, 'key'],
      [/#.*$/, 'comment'], [/=/, 'delimiter'],
      [/"/, 'string', '@double'], [/'/, 'string', '@single'], [/`/, 'string', '@backtick'],
      [/[^#"'`=]+/, 'string']
    ],
    double: [[/\\./, 'string.escape'], [/"/, 'string', '@pop'], [/[^"\\]+/, 'string']],
    single: [[/'/, 'string', '@pop'], [/[^']+/, 'string']],
    backtick: [[/`/, 'string', '@pop'], [/[^`]+/, 'string']]
  }
})
function theme () {
  const style = getComputedStyle(document.body)
  const highContrast = document.body.className.includes('high-contrast')
  const light = document.body.classList.contains('vscode-light') || document.body.classList.contains('vscode-high-contrast-light')
  const colors = {}
  for (const key of ['editor.background', 'editor.foreground', 'editorLineNumber.foreground', 'editorLineNumber.activeForeground', 'editorCursor.foreground', 'editor.selectionBackground', 'editor.inactiveSelectionBackground', 'editor.lineHighlightBackground', 'editorIndentGuide.background1', 'editorWhitespace.foreground']) {
    const value = style.getPropertyValue('--vscode-' + key.replaceAll('.', '-')).trim()
    if (value.startsWith('#')) colors[key] = value
  }
  monaco.editor.defineTheme('dotenv', {
    base: highContrast ? (light ? 'hc-light' : 'hc-black') : light ? 'vs' : 'vs-dark',
    inherit: true,
    colors,
    rules: highContrast ? [] : [{ token: 'key', foreground: light ? '001080' : '9CDCFE' }, { token: 'string', foreground: light ? 'A31515' : 'CE9178' }, { token: 'comment', foreground: light ? '008000' : '6A9955' }]
  })
  monaco.editor.setTheme('dotenv')
}
function applyMask () {
  if (!editor) return
  const model = editor.getModel()
  decorations.set(masked
    ? entries(model.getValue()).filter(entry => entry.maskEnd > entry.maskStart).map(entry => {
      const start = model.getPositionAt(entry.maskStart)
      const end = model.getPositionAt(entry.maskEnd)
      return { range: new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column), options: { inlineClassName: 'dotenv-mask', stickiness: monaco.editor.TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges } }
    })
    : [])
  status.textContent = conflict ? 'File changed elsewhere. Copy your edits before reopening.' : ''
  toggle.setAttribute('aria-label', masked ? 'Reveal dotenv values' : 'Hide dotenv values')
}
function conceal () {
  container.classList.add('preparing')
  masked = true
  applyMask()
  if (editor && !document.hidden) {
    editor.render(true)
    container.classList.remove('preparing')
  }
}
function toggleMask () {
  if (!editor) return
  container.classList.add('preparing')
  masked = !masked
  applyMask()
  editor.render(true)
  if (!document.hidden) container.classList.remove('preparing')
  editor.focus()
}
function updateDocument (message) {
  if (pending.size) {
    if (message.version > version) {
      conflict = true
      if (editor) editor.updateOptions({ readOnly: true })
      applyMask()
    }
    return
  }
  version = message.version
  container.classList.add('preparing')
  if (!editor) {
    theme()
    const model = monaco.editor.createModel('', 'dotenv')
    editor = monaco.editor.create(container, {
      model,
      theme: 'dotenv',
      automaticLayout: true,
      ...message.options,
      minimap: { enabled: false },
      stickyScroll: { enabled: false },
      quickSuggestions: false,
      suggestOnTriggerCharacters: false,
      hover: { enabled: false },
      folding: true,
      scrollBeyondLastLine: false,
      find: { seedSearchStringFromSelection: 'never', globalFindClipboard: false },
      ariaLabel: 'Dotenv source editor. Values are visually masked until revealed.'
    })
    decorations = editor.createDecorationsCollection()
    editor.addAction({ id: 'dotenv.save', label: 'Save', keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS], run: () => request('save') })
    for (const [id, keys] of [['undo', [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ]], ['redo', [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ, monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyY]]]) {
      editor.addAction({ id, label: id === 'undo' ? 'Undo' : 'Redo', keybindings: keys, run: () => request(id) })
    }
    editor.onDidChangeModelContent(() => {
      // This listener and Monaco decorations run in the renderer, synchronously
      // before the browser paints. No extension-host response is needed.
      applyMask()
      if (applying) return
      const text = model.getValue()
      const id = ++sequence
      pending.add(id)
      request('edit', { id, before: previous, text })
      previous = text
    })
  }
  editor.updateOptions(message.options || {})
  const model = editor.getModel()
  if (model.getValue() !== message.text) {
    const selections = editor.getSelections()
    const scroll = editor.getScrollTop()
    applying = true
    model.setValue(message.text)
    applying = false
    editor.setSelections(selections)
    editor.setScrollTop(scroll)
  }
  previous = message.text
  applyMask()
  editor.render(true)
  toggle.disabled = false
  if (!document.hidden) container.classList.remove('preparing')
}
window.addEventListener('message', event => {
  const message = event.data
  if (!message) return
  if (message.type === 'toggle') { toggleMask(); return }
  if (message.client !== client) return
  if (message.type === 'document') updateDocument(message)
  if (message.type === 'ack') { pending.delete(message.id); version = message.version }
  if (message.type === 'conflict') { conflict = true; editor.updateOptions({ readOnly: true }); applyMask() }
})
toggle.addEventListener('click', toggleMask)
document.addEventListener('visibilitychange', conceal)
new MutationObserver(theme).observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] })
request('ready')

export { editor as sourceEditor }
