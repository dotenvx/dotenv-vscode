const { describe, it } = require('mocha')
const assert = require('assert')
const vscode = require('vscode')
const path = require('path')
const esbuild = require('esbuild')
const provider = require('../../../lib/secure-editor')
const decryption = require('../../../lib/decrypt-value')
describe('Monaco renderer integration', () => {
  it('honors disabled cloaking on load, settings changes, edits, and tab switches', async function () {
    this.timeout(30000)
    const root = path.resolve(__dirname, '../../..')
    esbuild.buildSync({ entryPoints: [path.join(root, 'test/renderer/configuration.js')], bundle: true, outfile: path.join(root, 'media/editor/dist/test-renderer.js'), format: 'iife', platform: 'browser', loader: { '.ttf': 'file' }, logLevel: 'silent' })
    const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, '.env.configuration')
    const config = vscode.workspace.getConfiguration('dotenv', uri)
    const originals = Object.fromEntries(['enableAutocloaking', 'cloakColor', 'cloakIcon'].map(key => [key, config.inspect(key).workspaceValue]))
    let panel
    let listener
    try {
      await config.update('enableAutocloaking', false, vscode.ConfigurationTarget.Workspace)
      await config.update('cloakColor', '#ff0000', vscode.ConfigurationTarget.Workspace)
      await config.update('cloakIcon', '*', vscode.ConfigurationTarget.Workspace)
      await vscode.workspace.fs.writeFile(uri, Buffer.from('KEY=SECRET_CONFIGURATION\n'))
      const document = await vscode.workspace.openTextDocument(uri)
      panel = vscode.window.createWebviewPanel('dotenv.configurationTest', 'Dotenv configuration test', vscode.ViewColumn.One, { enableScripts: true, retainContextWhenHidden: true })
      let ready
      const loaded = new Promise(resolve => { ready = resolve })
      const checks = new Map()
      listener = panel.webview.onDidReceiveMessage(message => {
        if (message.type === 'configurationReady') ready()
        if (message.type === 'cloakingChecked') {
          const { resolve, reject } = checks.get(message.id)
          checks.delete(message.id)
          if (message.error) reject(new Error(message.error))
          else resolve(message)
        }
      })
      let sequence = 0
      const check = masked => new Promise((resolve, reject) => {
        const id = ++sequence
        checks.set(id, { resolve, reject })
        panel.webview.postMessage({ type: 'checkCloaking', id, masked })
      })
      provider.resolveCustomTextEditor(document, panel, { extensionUri: vscode.Uri.file(root) })
      panel.webview.html = panel.webview.html.replace(/dist\/main.js/g, 'dist/test-renderer.js')
      await loaded
      await check(false)
      const edit = new vscode.WorkspaceEdit()
      edit.insert(uri, new vscode.Position(1, 0), 'NEXT=SECRET_CONFIGURATION_EDITED\n')
      await vscode.workspace.applyEdit(edit)
      await check(false)
      const notes = await vscode.workspace.openTextDocument({ content: 'Other tab' })
      await vscode.window.showTextDocument(notes, vscode.ViewColumn.One)
      await new Promise(resolve => setTimeout(resolve, 100))
      panel.reveal(vscode.ViewColumn.One)
      await check(false)
      await config.update('enableAutocloaking', true, vscode.ConfigurationTarget.Workspace)
      const star = await check(true)
      assert(star.colors.includes('255,0,0'), 'Initial cloak color must be used')
      await config.update('cloakIcon', '?', vscode.ConfigurationTarget.Workspace)
      const question = await check(true)
      assert.notStrictEqual(question.tile, star.tile, 'Changing the icon must change the rendered mask')
      await config.update('cloakColor', '#00ff00', vscode.ConfigurationTarget.Workspace)
      const green = await check(true)
      assert(green.colors.includes('0,255,0'), 'Color changes must apply immediately')
      assert(!green.colors.includes('255,0,0'))
      await config.update('enableAutocloaking', false, vscode.ConfigurationTarget.Workspace)
      await check(false)
      await document.save()
    } finally {
      listener?.dispose()
      panel?.dispose()
      for (const [key, value] of Object.entries(originals)) await config.update(key, value, vscode.ConfigurationTarget.Workspace)
    }
  })
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
