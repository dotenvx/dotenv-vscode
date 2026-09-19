/* global getComputedStyle, requestAnimationFrame */
import { bridge } from './setup.js'
import { sourceEditor } from '../../media/editor/main.js'
import * as monaco from 'monaco-editor/editor/editor.api.js'
let frames = 0
let maskedFrames = 0
let revealedFrames = 0
const failures = []
let expectMasked = true
let running = true
function inspect () {
  if (!running) return
  frames++
  const container = document.getElementById('editor')
  if (!document.hidden && getComputedStyle(container).visibility !== 'hidden') {
    for (const span of document.querySelectorAll('.view-line span')) {
      if (span.children.length || !span.textContent.includes('SECRET_')) continue
      const style = getComputedStyle(span)
      const hidden = style.color === 'rgba(0, 0, 0, 0)' || style.color === 'transparent' || style.opacity === '0'
      if (hidden) maskedFrames++
      else if (expectMasked) failures.push({ frame: frames, color: style.color })
      else revealedFrames++
    }
  }
  requestAnimationFrame(inspect)
}
requestAnimationFrame(inspect)
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
async function waitFrames (count) {
  for (let i = 0; i < count; i++) await new Promise(resolve => requestAnimationFrame(resolve))
}
async function run () {
  for (let i = 0; i < 100; i++) {
    if (sourceEditor) break
    await wait(50)
  }
  if (!sourceEditor) throw new Error('Editor did not load')
  for (const [value, numeric] of [['3000', true], ['-0.5', true], ['+1_000.25', true], ['42 # comment', true], ['127.0.0.1', false], ['abc123', false], ['12px', false], ['"123"', false], ['1.2.3', false], ['1_', false]]) {
    const tokens = monaco.editor.tokenize(`KEY=${value}`, 'dotenv')[0]
    if (tokens.some(token => token.type === 'number.dotenv') !== numeric) throw new Error(`Incorrect number highlighting: ${value}`)
  }
  await waitFrames(3)
  for (let i = 0; i < 10; i++) {
    const model = sourceEditor.getModel()
    sourceEditor.setPosition(model.getPositionAt(model.getValueLength()))
    sourceEditor.trigger('test', 'type', { text: `\nNEXT_${i}=SECRET_TYPED_${i}` })
    await waitFrames(3)
  }
  // Test the real reveal control as a positive detection control.
  expectMasked = false
  document.getElementById('toggle').click()
  await waitFrames(3)
  document.getElementById('toggle').click()
  expectMasked = true
  await waitFrames(3)
  bridge.postMessage({ type: 'rendererReady' })
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) expectMasked = true })
window.addEventListener('message', event => {
  if (event.data?.type === 'revealBeforeSwitch') {
    expectMasked = false
    document.getElementById('toggle').click()
    waitFrames(2).then(() => bridge.postMessage({ type: 'revealedBeforeSwitch' }))
  }
  if (event.data?.type === 'finishRendererTest') {
    running = false
    bridge.postMessage({ type: 'rendererResult', frames, maskedFrames, revealedFrames, failures })
  }
})
run().catch(error => bridge.postMessage({ type: 'rendererError', error: error.message }))
