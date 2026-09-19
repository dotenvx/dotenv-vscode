const vscode = require('vscode')
const crypto = require('crypto')
const model = require('./secure-document')
const viewType = 'dotenv.secureEditor'
const views = new Set()

function html (webview, extensionUri) {
  const nonce = crypto.randomBytes(24).toString('hex')
  const uri = path => webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, path))
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
<link rel="stylesheet" href="${uri('node_modules/codemirror/lib/codemirror.css')}">
<link rel="stylesheet" href="${uri('media/secure-editor.css')}"><title>Dotenv</title></head><body>
<div class="lens"><button id="toggle" disabled>Toggle auto-cloaking</button><span id="status" role="status"></span></div>
<div id="editor"></div>
<script nonce="${nonce}" src="${uri('node_modules/codemirror/lib/codemirror.js')}"></script>
<script nonce="${nonce}" src="${uri('lib/secure-document.js')}"></script>
<script nonce="${nonce}" src="${uri('media/secure-editor.js')}"></script></body></html>`
}

const masked = model.masked

function resolveCustomTextEditor (document, panel, context) {
  const webview = panel.webview
  webview.options = { enableScripts: true, localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media'), vscode.Uri.joinPath(context.extensionUri, 'lib'), vscode.Uri.joinPath(context.extensionUri, 'node_modules/codemirror/lib')] }
  let client
  let generation = 0
  let revealed = false
  let busy = false
  let disposed = false
  let queue = Promise.resolve()
  const text = () => model.normalizeEol(document.getText(), false)
  const send = (extra = {}) => {
    if (!client || disposed) return
    webview.postMessage({ type: 'state', client, generation, revealed, text: revealed ? text() : masked(text()), ...extra })
  }
  const view = { panel, toggle: () => webview.postMessage({ type: 'toggle' }) }
  views.add(view)
  const subscriptions = [
    vscode.workspace.onDidChangeTextDocument(event => {
      if (event.document.uri.toString() === document.uri.toString() && !busy) send()
    }),
    webview.onDidReceiveMessage(message => {
      return (queue = queue.then(async () => {
        if (!message || typeof message.client !== 'string') return
        if (message.type === 'ready') { client = message.client; revealed = false; send(); return }
        if (message.client !== client) return
        if (message.type === 'hide') { generation = message.generation; revealed = false; send(); return }
        if (message.type === 'reveal' && panel.visible) { generation = message.generation; revealed = true; send(); return }
        if (message.type === 'edit') {
          if (!revealed || typeof message.before !== 'string' || typeof message.text !== 'string' || message.before !== text()) {
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
            webview.postMessage({ type: 'ack', client, id: message.id })
          } finally { busy = false }
          return
        }
        if (message.type === 'save') await document.save()
        if (message.type === 'undo' || message.type === 'redo') await vscode.commands.executeCommand(message.type)
      }).catch(() => webview.postMessage({ type: 'conflict', client })))
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

module.exports = { run, toggleActive, resolveCustomTextEditor, html, viewType, masked }
