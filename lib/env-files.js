const fs = require('fs')
const path = require('path')
const vscode = require('vscode')
const dotenv = require('dotenv')

function isDotenv (uri) {
  const open = vscode.workspace.textDocuments.find(document => document.uri.toString() === uri.toString())
  if (open) return open.languageId === 'dotenv'

  const associations = vscode.workspace.getConfiguration('files', uri).get('associations', {})
  // Respect explicit language associations, including opting out of dotenv.
  const matches = Object.entries(associations)
    .filter(([pattern]) => vscode.languages.match({ pattern: pattern.includes('/') ? pattern : `**/${pattern}` }, { uri, languageId: '' }))
    .sort(([a], [b]) => b.length - a.length)
  if (matches.length) return matches[0][1] === 'dotenv'
  const name = path.basename(uri.fsPath)
  return name.startsWith('.env') || name.endsWith('.env') || name === '.flaskenv'
}

function read (document) {
  const uri = document?.uri
  if (uri && uri.scheme !== 'file') return []
  const workspace = uri ? vscode.workspace.getWorkspaceFolder(uri) : vscode.workspace.workspaceFolders?.[0]
  // An individual file still supports dotenv files alongside it, but never
  // falls back to an unrelated workspace or the extension host's working dir.
  const root = workspace?.uri.fsPath || (uri && path.dirname(uri.fsPath))
  if (!root) return []
  let directory = uri ? path.dirname(uri.fsPath) : root
  const sources = []
  while (true) {
    const candidates = new Map()
    try {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if ((entry.isFile() || entry.isSymbolicLink())) {
          const file = vscode.Uri.file(path.join(directory, entry.name))
          candidates.set(file.toString(), file)
        }
      }
    } catch (_) { /* A missing or unreadable directory must not break providers. */ }
    for (const open of vscode.workspace.textDocuments) {
      if (open.uri.scheme === 'file' && path.dirname(open.uri.fsPath) === directory) candidates.set(open.uri.toString(), open.uri)
    }
    for (const file of [...candidates.values()].sort((a, b) => a.fsPath.localeCompare(b.fsPath))) {
      if (!isDotenv(file)) continue
      try {
        const open = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === file.toString())
        const parsed = dotenv.parse(open ? open.getText() : fs.readFileSync(file.fsPath))
        sources.push({ file, label: path.relative(root, file.fsPath).split(path.sep).join('/'), parsed })
      } catch (_) { /* A deleted or unreadable file must not break other files. */ }
    }
    if (path.relative(root, directory) === '') break
    const parent = path.dirname(directory)
    if (parent === directory) break
    directory = parent
  }
  return sources
}

module.exports = { read }
