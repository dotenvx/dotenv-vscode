import * as monaco from 'monaco-editor/editor/editor.api.js'
import { entries } from '../../lib/secure-document'

export function decryptHover (editor, request, metadata) {
  let current
  let timer
  let serial = 0
  const node = document.createElement('div')
  node.className = 'dotenv-decrypt-hover'
  node.setAttribute('role', 'dialog')
  node.setAttribute('aria-label', 'Encrypted environment value')
  const source = document.createElement('div')
  const value = document.createElement('div')
  value.className = 'dotenv-decrypt-value'
  value.setAttribute('aria-live', 'polite')
  const button = document.createElement('button')
  button.type = 'button'
  node.append(source, value, button)
  const widget = {
    getId: () => 'dotenv.decryptHover',
    getDomNode: () => node,
    getPosition: () => current ? { position: current.position, preference: [monaco.editor.ContentWidgetPositionPreference.ABOVE, monaco.editor.ContentWidgetPositionPreference.BELOW] } : null,
    allowEditorOverflow: true
  }
  editor.addContentWidget(widget)
  function hide () {
    clearTimeout(timer)
    current = undefined
    value.textContent = ''
    editor.layoutContentWidget(widget)
  }
  const delayHide = () => { clearTimeout(timer); timer = setTimeout(hide, 250) }
  node.addEventListener('mouseenter', () => clearTimeout(timer))
  node.addEventListener('mouseleave', delayHide)
  node.addEventListener('keydown', event => {
    if (event.key === 'Escape') { hide(); editor.focus() }
  })
  function show (position) {
    if (!position || document.hidden) return
    const model = editor.getModel()
    const text = model.getValue()
    const offset = model.getOffsetAt(position)
    const entry = entries(text).find(entry => offset >= entry.maskStart && offset < entry.maskEnd && text.slice(entry.maskStart, entry.maskEnd).startsWith('encrypted:'))
    if (!entry) { delayHide(); return }
    clearTimeout(timer)
    if (current?.entry.id === entry.id) return
    current = { entry, position: model.getPositionAt(entry.maskStart), id: ++serial, revealed: false }
    source.textContent = `${metadata().filename || '.env'} · ${entry.key}`
    value.textContent = 'Encrypted value'
    button.textContent = 'Decrypt value'
    button.disabled = false
    editor.layoutContentWidget(widget)
  }
  button.addEventListener('click', () => {
    if (!current) return
    if (current.revealed) {
      current.revealed = false
      current.id = ++serial
      value.textContent = 'Encrypted value'
      button.textContent = 'Decrypt value'
    } else {
      button.disabled = true
      value.textContent = 'Decrypting…'
      request('decrypt', { id: current.id, entryId: current.entry.id, version: metadata().version })
    }
    editor.layoutContentWidget(widget)
  })
  editor.onMouseMove(event => {
    if (event.target.element && node.contains(event.target.element)) { clearTimeout(timer); return }
    if (event.target.position) show(event.target.position)
    else delayHide()
  })
  editor.onMouseLeave(delayHide)
  editor.onDidChangeModelContent(hide)
  editor.onDidScrollChange(hide)
  editor.onKeyDown(event => { if (event.keyCode === monaco.KeyCode.Escape) hide() })
  editor.addAction({ id: 'dotenv.decryptValue', label: 'Decrypt value', run: () => { show(editor.getPosition()); button.focus() } })
  return {
    hide,
    receive (message) {
      if (!current || message.id !== current.id || document.hidden) return
      button.disabled = false
      if (message.error) {
        value.textContent = message.error
        button.textContent = 'Retry decryption'
      } else if (typeof message.value === 'string') {
        current.revealed = true
        value.textContent = message.value || '(empty)'
        button.textContent = 'Hide value'
      }
      editor.layoutContentWidget(widget)
    }
  }
}
