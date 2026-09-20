const vscode = require('vscode')
const crypto = require('crypto')
const command = 'dotenv.toggleCompletionValue'
const links = new Map()
const batches = new WeakMap()
let pending
let running = false

function begin (document, position) {
  const line = document?.lineAt(position).text
  return { document, position, prefix: line?.slice(0, position.character), suffix: line?.slice(position.character) }
}

function matches (batch, document, position) {
  if (!document || !batch.document || batch.document.uri.toString() !== document.uri.toString() || batch.position.line !== position.line) return false
  const line = document.lineAt(position).text
  const prefix = line.slice(0, position.character)
  // Suggestions may have been filtered by typing since their provider ran.
  return prefix.startsWith(batch.prefix) && /^[\w.'"-]*$/.test(prefix.slice(batch.prefix.length)) && line.slice(position.character) === batch.suffix
}

function track (batch, items, render) {
  batch.items = items
  batch.render = render
  for (const item of items) batches.set(item, batch)
  return items
}

function bind (items, provider) {
  for (const item of items || []) {
    const batch = batches.get(item)
    if (batch) batch.provider = provider
  }
}

function append (markdown, batch, key, source, revealed) {
  if (!batch.document?.uri) return
  const id = crypto.randomBytes(16).toString('hex')
  links.set(id, { batch, key, source, revealed: !revealed, expires: Date.now() + 5 * 60 * 1000 })
  while (links.size > 10000) links.delete(links.keys().next().value)
  markdown.isTrusted = { enabledCommands: [command] }
  markdown.appendMarkdown(`\n\n[${revealed ? 'Hide value' : 'Reveal value'}](command:${command}?${encodeURIComponent(JSON.stringify([id]))})`)
}

// Replay the original provider's items so language-specific insertion rules survive.
// Only this one refreshed result may reveal a value; future requests start masked.
function refresh (document, position, provider) {
  const request = pending
  if (!request || request.batch.provider !== provider || !matches(request.batch, document, position)) return
  pending = undefined
  const batch = begin(document, position)
  batch.request = request
  batch.provider = provider
  const items = request.batch.items.map(original => {
    const item = Object.assign(new vscode.CompletionItem(original.label, original.kind), original)
    if (item.range instanceof vscode.Range) item.range = new vscode.Range(item.range.start, position)
    const key = typeof item.label === 'string' ? item.label : item.label.label
    item.preselect = key === request.key
    item.sortText = item.preselect ? '0' : '1'
    item.documentation = request.batch.render(key, batch)
    return item
  })
  return track(batch, items, request.batch.render)
}

function run (context) {
  context.subscriptions.push(vscode.commands.registerCommand(command, async id => {
    const request = typeof id === 'string' && links.get(id)
    const editor = vscode.window.activeTextEditor
    if (running || !request || request.expires < Date.now() || !editor || !matches(request.batch, editor.document, editor.selection.active)) return
    links.delete(id)
    running = true
    try {
      await vscode.commands.executeCommand('hideSuggestWidget')
      const active = vscode.window.activeTextEditor
      if (!active || !matches(request.batch, active.document, active.selection.active)) return
      pending = request
      await vscode.commands.executeCommand('editor.action.triggerSuggest')
    } finally {
      const timer = setTimeout(() => { if (pending === request) pending = undefined }, 1000)
      timer.unref()
      running = false
    }
  }), { dispose: () => { links.clear(); pending = undefined } })
}

module.exports = { begin, append, track, bind, refresh, run, command }
