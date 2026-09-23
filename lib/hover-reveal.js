const vscode = require('vscode')
const crypto = require('crypto')
const settings = require('./settings')
const command = 'dotenv.toggleHoverValue'
const links = new Map()
let pending
let running = false

function matches (request, document, key, range) {
  return request && document?.uri && request.uri === document.uri.toString() &&
    request.version === document.version && request.key === key && range && request.range.isEqual(range)
}

function begin (document, key, range, defaultRevealed) {
  const request = pending
  if (!matches(request, document, key, range)) return defaultRevealed
  pending = undefined
  return request.revealed
}

function control (document, key, range, revealed) {
  if (!document?.uri || !range) return undefined
  const id = crypto.randomBytes(16).toString('hex')
  links.set(id, { uri: document.uri.toString(), version: document.version, key, range, revealed: !revealed, expires: Date.now() + 5 * 60 * 1000 })
  while (links.size > 10000) links.delete(links.keys().next().value)
  const markdown = new vscode.MarkdownString()
  markdown.isTrusted = { enabledCommands: [command] }
  markdown.appendMarkdown(`[${revealed ? 'Hide value' : 'Reveal value'}](command:${command}?${encodeURIComponent(JSON.stringify([id]))})`)
  return markdown
}

function run (context) {
  context.subscriptions.push(vscode.commands.registerCommand(command, async id => {
    const request = typeof id === 'string' && links.get(id)
    const editor = vscode.window.activeTextEditor
    if (running || !request || request.expires < Date.now() || !editor || !matches(request, editor.document, request.key, request.range)) return
    links.delete(id)
    if (!settings.secretpeekingEnabled(editor.document.uri)) return
    running = true
    try {
      await vscode.commands.executeCommand('editor.action.hideHover')
      if (vscode.window.activeTextEditor !== editor || !matches(request, editor.document, request.key, request.range)) return
      // VS Code reopens hovers at the cursor, which may differ from the mouse position.
      editor.selection = new vscode.Selection(request.range.start, request.range.start)
      if (!settings.secretpeekingEnabled(editor.document.uri)) return
      pending = request
      await vscode.commands.executeCommand('editor.action.showHover', { focus: 'autoFocusImmediately' })
    } finally {
      const timer = setTimeout(() => { if (pending === request) pending = undefined }, 1000)
      timer.unref()
      running = false
    }
  }), { dispose: () => { links.clear(); pending = undefined } })
}

module.exports = { begin, control, run, command }
