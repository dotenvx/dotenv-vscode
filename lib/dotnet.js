const vscode = require('vscode')
const helpers = require('./helpers')

// Share the System.Environment API across C#, F#, and Visual Basic.
const call = String.raw`(?<![\w.])(?:(?:global::|Global\.)?System\s*\.\s*)?Environment\s*\.\s*GetEnvironmentVariable\s*`
const flags = document => document.languageId === 'vb' ? 'gi' : 'g'

const completion = {
  provideCompletionItems (document, position) {
    const line = document.lineAt(position).text
    const prefix = line.slice(0, position.character)
    const regex = new RegExp(call + String.raw`\(\s*(?:@?"[\w.-]*)?$`, flags(document))
    const match = regex.exec(prefix)
    if (!match) return undefined

    const start = match.index + match[0].indexOf('(')
    const argument = prefix.slice(start)
    const quote = argument.indexOf('"')
    // Replace the remaining literal and its auto-inserted closing quote too.
    const remaining = quote < 0 ? '' : (line.slice(position.character).match(/^[\w.-]*"?/) || [''])[0]
    const spacing = argument.match(/^\(\s*/)[0]
    const opening = spacing + (argument.includes('@"') ? '@"' : '"')
    return helpers.autocomplete('(', document, position).map(item => {
      item.insertText = `${opening}${item.label.label}"`
      item.filterText = item.insertText
      item.range = new vscode.Range(position.line, start, position.line, position.character + remaining.length)
      return item
    })
  }
}

const hover = {
  provideHover (document, position) {
    const line = document.lineAt(position).text
    const regex = new RegExp(call + String.raw`\(\s*@?"([\w.-]+)"\s*(?=\)|,)`, flags(document))
    for (const match of line.matchAll(regex)) {
      const key = match[1]
      const start = match.index + match[0].indexOf('"') + 1
      const end = start + key.length
      if (position.character < start || position.character >= end) continue
      return helpers.valueHover(key, document, new vscode.Range(position.line, start, position.line, end))
    }
    return undefined
  }
}

module.exports = { completion, hover }
