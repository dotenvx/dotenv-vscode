const vscode = require('vscode')
const settings = require('./settings')
const values = require('./yaml-values')
const mask = vscode.window.createTextEditorDecorationType({ letterSpacing: '-1ch', opacity: '0', color: 'transparent' })
function supported (document) { return document.languageId === 'yaml' }
function ranges (document) {
  const config = vscode.workspace.getConfiguration('dotenv', document.uri)
  return values.ranges(document.getText(), config.get('yamlSections', values.defaultSections))
}
function decorate (editor) {
  const patches = supported(editor.document) && settings.autocloakingEnabled() ? ranges(editor.document) : []
  editor.setDecorations(mask, patches.map(({ start, end }) => ({
    range: new vscode.Range(editor.document.positionAt(start), editor.document.positionAt(end)),
    renderOptions: { after: { color: settings.cloakColor(), contentText: settings.cloakIcon().repeat(end - start) } }
  })))
}
module.exports = { decorate, ranges, supported, dispose: mask }
