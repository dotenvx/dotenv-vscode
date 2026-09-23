const vscode = require('vscode')
const crypto = require('crypto')
const model = require('./secure-document')
const decryption = require('./decrypt-value')
const path = require('path')
const viewType = 'dotenv.sourceEditor'
const views = new Set()

function html (webview, extensionUri) {
  const nonce = crypto.randomBytes(24).toString('hex')
  const uri = path => webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, path))
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; font-src ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' ${webview.cspSource}; worker-src blob:; connect-src ${webview.cspSource};">
<link rel="stylesheet" href="${uri('media/editor/dist/main.css')}">
<link rel="stylesheet" href="${uri('media/editor/style.css')}"><title>Dotenv</title></head><body>
<div class="lens"><button id="toggle" hidden disabled>Toggle auto-cloaking</button><span id="status" role="status">Loading…</span></div>
<div id="editor" class="preparing" data-worker="${uri('media/editor/dist/worker.js')}"></div>
<script nonce="${nonce}" src="${uri('media/editor/dist/main.js')}"></script></body></html>`
}

function resolveCustomTextEditor (document, panel, context) {
  const webview = panel.webview
  webview.options = { enableScripts: true, localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media/editor')] }
  let client
  let busy = false
  let disposed = false
  let conflicted = false
  let queue = Promise.resolve()
  const text = () => model.normalizeEol(document.getText(), false)
  const options = () => {
    const config = vscode.workspace.getConfiguration('editor', document.uri)
    return Object.fromEntries(['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'tabSize', 'insertSpaces', 'wordWrap', 'renderWhitespace', 'cursorStyle', 'cursorBlinking', 'mouseWheelZoom'].map(key => [key, config.get(key)]))
  }
  const configuration = () => {
    const config = vscode.workspace.getConfiguration('dotenv', document.uri)
    return { autocloaking: config.get('enableAutocloaking', true), cloakColor: config.get('cloakColor', '#000000'), cloakIcon: config.get('cloakIcon', '█') }
  }
  const send = (extra = {}) => {
    if (client && !disposed) webview.postMessage({ type: 'document', client, text: text(), version: document.version, filename: path.basename(document.uri.fsPath || ''), options: options(), ...configuration(), ...extra })
  }
  const view = { panel, toggle: () => { if (configuration().autocloaking) webview.postMessage({ type: 'toggle' }) } }
  views.add(view)
  const subscriptions = [
    vscode.workspace.onDidChangeTextDocument(event => {
      if (event.document.uri.toString() === document.uri.toString() && !busy) send()
    }),
    vscode.workspace.onDidChangeConfiguration(event => {
      if (['enableAutocloaking', 'cloakColor', 'cloakIcon'].some(key => event.affectsConfiguration(`dotenv.${key}`, document.uri)) && client && !disposed) {
        webview.postMessage({ type: 'configuration', client, ...configuration() })
      }
      if (event.affectsConfiguration('editor', document.uri)) send()
    }),
    webview.onDidReceiveMessage(message => {
      return (queue = queue.then(async () => {
        if (!message || typeof message.client !== 'string') return
        if (message.type === 'ready') { client = message.client; conflicted = false; send(); return }
        if (message.client !== client) return
        if (message.type === 'decrypt') {
          if (conflicted || disposed || !panel.active || !panel.visible || message.version !== document.version) return
          const entry = model.entries(text()).find(entry => entry.id === message.entryId)
          if (!entry || !text().slice(entry.maskStart, entry.maskEnd).startsWith('encrypted:')) return
          const originalVersion = document.version
          const reply = extra => {
            if (!disposed && panel.active && panel.visible && document.version === originalVersion) {
              webview.postMessage({ type: 'decrypted', client, id: message.id, ...extra })
            }
          }
          if (model.entries(text()).filter(item => item.key === entry.key).length !== 1) {
            reply({ error: 'Use a unique variable name before decrypting this value.' })
            return
          }
          try { reply({ value: await decryption.decrypt(document, entry.key) }) } catch (error) { reply({ error: error.message }) }
          return
        }
        if (message.type === 'edit') {
          if (conflicted || typeof message.before !== 'string' || typeof message.text !== 'string' || message.before !== text()) {
            conflicted = true
            webview.postMessage({ type: 'conflict', client }); return
          }
          const after = model.normalizeEol(message.text, document.eol === vscode.EndOfLine.CRLF)
          const edit = model.change(document.getText(), after)
          busy = true
          try {
            if (edit) {
              const workspaceEdit = new vscode.WorkspaceEdit()
              workspaceEdit.replace(document.uri, new vscode.Range(document.positionAt(edit.start), document.positionAt(edit.end)), edit.text)
              if (!await vscode.workspace.applyEdit(workspaceEdit)) throw new Error('Edit failed')
            }
            webview.postMessage({ type: 'ack', client, id: message.id, version: document.version })
          } finally { busy = false }
          return
        }
        if (conflicted) return
        if (message.type === 'save') await document.save()
        if (message.type === 'undo' || message.type === 'redo') await vscode.commands.executeCommand(message.type)
      }).catch(() => {
        conflicted = true
        webview.postMessage({ type: 'conflict', client })
      }))
    }),
    panel.onDidDispose(() => { disposed = true; views.delete(view); subscriptions.forEach(subscription => subscription.dispose()) })
  ]
  webview.html = html(webview, context.extensionUri)
}
function run (context) {
  context.subscriptions.push(vscode.window.registerCustomEditorProvider(viewType, {
    resolveCustomTextEditor: (document, panel) => resolveCustomTextEditor(document, panel, context)
  }, { supportsMultipleEditorsPerDocument: true, webviewOptions: { retainContextWhenHidden: true } }))
}
function toggleActive () {
  const view = [...views].find(view => view.panel.active)
  if (!view) return false
  view.toggle()
  return true
}
module.exports = { run, toggleActive, resolveCustomTextEditor, html, viewType }
