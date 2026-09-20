const { describe, it } = require('mocha')
const assert = require('assert')
const vscode = require('vscode')
const path = require('path')
const esbuild = require('esbuild')
const provider = require('../../../lib/secure-editor')
const decryption = require('../../../lib/decrypt-value')
describe('Monaco renderer integration', () => {
  it('masks every observed animation frame on load, typing and tab switches', async function () {
    this.timeout(30000)
    const root = path.resolve(__dirname, '../../..')
    esbuild.buildSync({ entryPoints: [path.join(root, 'test/renderer/main.js')], bundle: true, outfile: path.join(root, 'media/editor/dist/test-renderer.js'), format: 'iife', platform: 'browser', loader: { '.ttf': 'file' }, logLevel: 'silent' })
    const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, '.env.renderer')
    await vscode.workspace.fs.writeFile(uri, Buffer.from('KEY=SECRET_INITIAL\nMULTI="SECRET_FIRST\nSECRET_SECOND"\n# COMMENTED=SECRET_COMMENT\nENCRYPTED="encrypted:renderer-fixture"\n'))
    const document = await vscode.workspace.openTextDocument(uri)
    const panel = vscode.window.createWebviewPanel('dotenv.rendererTest', 'Dotenv renderer test', vscode.ViewColumn.One, { enableScripts: true, retainContextWhenHidden: true })
    let onReady
    const ready = new Promise(resolve => { onReady = resolve })
    let onRevealed
    let onResult
    let onError
    const result = new Promise((resolve, reject) => { onResult = resolve; onError = reject })
    const listener = panel.webview.onDidReceiveMessage(message => {
      if (message.type === 'revealedBeforeSwitch') onRevealed()
      if (message.type === 'rendererReady') onReady()
      if (message.type === 'rendererResult') onResult(message)
      if (message.type === 'rendererError') { onReady(); onError(new Error(message.error)) }
    })
    const originalDecrypt = decryption.decrypt
    decryption.decrypt = async () => '<script>DECRYPTED_UI</script>'
    try {
      provider.resolveCustomTextEditor(document, panel, { extensionUri: vscode.Uri.file(root) })
      panel.webview.html = panel.webview.html.replace(/dist\/main.js/g, 'dist/test-renderer.js')
      await ready
      const notes = await vscode.workspace.openTextDocument({ content: 'Other tab' })
      for (let i = 0; i < 5; i++) {
        const revealed = new Promise(resolve => { onRevealed = resolve })
        await panel.webview.postMessage({ type: 'revealBeforeSwitch' })
        await revealed
        await vscode.window.showTextDocument(notes, vscode.ViewColumn.One)
        await new Promise(resolve => setTimeout(resolve, 80))
        panel.reveal(vscode.ViewColumn.One)
        await new Promise(resolve => setTimeout(resolve, 80))
      }
      await panel.webview.postMessage({ type: 'finishRendererTest' })
      const checked = await result
      console.log('Monaco animation-frame results:', JSON.stringify(checked))
      assert(checked.frames > 30)
      assert(checked.maskedFrames > 20)
      assert(checked.revealedFrames > 0, 'Positive control must detect deliberately revealed values')
      assert.deepStrictEqual(checked.failures, [])
      assert(document.getText().includes('NEXT_9=SECRET_TYPED_9'))
      await document.save()
    } finally { decryption.decrypt = originalDecrypt; listener.dispose(); panel.dispose() }
  })
})
