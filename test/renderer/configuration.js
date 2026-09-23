/* global getComputedStyle, requestAnimationFrame, Image */
import { bridge } from './setup.js'
import { sourceEditor } from '../../media/editor/main.js'

window.addEventListener('message', async event => {
  if (event.data?.type !== 'checkCloaking') return
  const { masked, id } = event.data
  try {
    for (let i = 0; i < 100; i++) {
      if (sourceEditor && document.getElementById('toggle').getAttribute('aria-label') === (masked ? 'Reveal dotenv values' : 'Hide dotenv values')) break
      await new Promise(resolve => setTimeout(resolve, 25))
    }
    for (let i = 0; i < 3; i++) await new Promise(resolve => requestAnimationFrame(resolve))
    const spans = [...document.querySelectorAll('.view-line span')].filter(span => !span.children.length && span.textContent.includes('SECRET_CONFIGURATION'))
    if (!spans.length) throw new Error('Secret text was not rendered')
    for (const span of spans) {
      const style = getComputedStyle(span)
      const hidden = style.color === 'rgba(0, 0, 0, 0)' || style.color === 'transparent' || style.opacity === '0'
      if (hidden !== masked) throw new Error(`Expected masked=${masked}, got color=${style.color}`)
    }
    let tile
    let colors
    if (masked) {
      tile = getComputedStyle(spans[0]).backgroundImage
      if (!tile.startsWith('url("data:image/png')) throw new Error('Missing cloak glyph tile')
      const image = new Image()
      image.src = tile.slice(5, -2)
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const context = canvas.getContext('2d')
      context.drawImage(image, 0, 0)
      const pixels = context.getImageData(0, 0, image.width, image.height).data
      colors = []
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] > 200) colors.push(Array.from(pixels.slice(i, i + 3)).join(','))
      }
    }
    bridge.postMessage({ type: 'cloakingChecked', id, tile, colors })
  } catch (error) { bridge.postMessage({ type: 'cloakingChecked', id, error: error.message }) }
})
bridge.postMessage({ type: 'configurationReady' })
