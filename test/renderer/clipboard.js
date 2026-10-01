/* global ClipboardEvent, DataTransfer, HTMLTextAreaElement */
import { bridge } from './setup.js'
import { sourceEditor } from '../../media/editor/main.js'

window.addEventListener('message', async event => {
  if (event.data?.type !== 'testCut') return
  const { id, selection, before, readOnly = false, reveal = false } = event.data
  try {
    for (let i = 0; i < 100; i++) {
      if (sourceEditor?.getValue() === before) break
      await new Promise(resolve => setTimeout(resolve, 25))
    }
    if (sourceEditor?.getValue() !== before) throw new Error('Editor did not load the expected text')
    if (reveal) document.getElementById('toggle').click()
    sourceEditor.updateOptions({ readOnly })
    sourceEditor.setSelection(selection)
    sourceEditor.focus()
    const input = document.activeElement
    // VS Code's forwarded browser cut command requires a native text input;
    // Chromium cannot execute it against an EditContext-backed element.
    if (!(input instanceof HTMLTextAreaElement)) throw new Error('Cut requires a native textarea input')
    // Scripted execCommand is denied without a user gesture in the test host.
    // Deliver the browser clipboard event and verify Monaco's actual handling.
    const clipboardData = new DataTransfer()
    input.dispatchEvent(new ClipboardEvent('cut', { clipboardData, bubbles: true, cancelable: true }))
    await new Promise(resolve => setTimeout(resolve, 50))
    bridge.postMessage({ type: 'cutResult', id, text: sourceEditor.getValue(), clipboard: clipboardData.getData('text/plain') })
  } catch (error) { bridge.postMessage({ type: 'cutResult', id, error: error.message }) }
})
bridge.postMessage({ type: 'clipboardReady' })
