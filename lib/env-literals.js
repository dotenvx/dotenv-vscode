const vscode = require('vscode')
const helpers = require('./helpers')
const settings = require('./settings')

// Each completion pattern captures the delimiter/spacing and optional partial
// string separately so accepting a suggestion preserves surrounding syntax.
function createProviders (patterns) {
  return {
    completion: {
      provideCompletionItems (document, position) {
        const line = document.lineAt(position).text
        const prefix = line.slice(0, position.character)
        for (const pattern of patterns) {
          const match = prefix.match(pattern.completion)
          if (!match) continue
          const opening = match[1]
          const partial = match[2] || ''
          const start = position.character - opening.length - partial.length
          const quote = pattern.quote === undefined ? '"' : pattern.quote
          const suffix = line.slice(position.character)
          let remaining = partial || pattern.bare ? suffix.match(/^[\w.-]*/)[0] : ''
          if (partial.startsWith(quote) && quote && suffix[remaining.length] === quote) remaining += quote
          return helpers.autocomplete('(', document, position).map(item => {
            const delimiter = pattern.bare && !/^[A-Za-z_]\w*$/.test(item.label.label) ? "'" : quote
            item.insertText = `${opening}${delimiter}${item.label.label}${delimiter}`
            item.filterText = item.insertText
            item.range = new vscode.Range(position.line, start, position.line, position.character + remaining.length)
            return item
          })
        }
        return undefined
      }
    },
    hover: {
      provideHover (document, position) {
        const line = document.lineAt(position).text
        for (const pattern of patterns) {
          for (const match of line.matchAll(pattern.hover)) {
            const key = match[1]
            const start = match.index + match[0].lastIndexOf(key)
            const end = start + key.length
            if (position.character < start || position.character >= end) continue
            const parsed = helpers.envParsed() || {}
            const range = new vscode.Range(position.line, start, position.line, end)
            if (!Object.prototype.hasOwnProperty.call(parsed, key)) return new vscode.Hover(settings.missingText(), range)
            const value = parsed[key]
            const display = settings.secretpeekingEnabled()
              ? value
              : settings.cloakIcon().repeat(Math.max(0, value.length - 2)) + value.slice(-2)
            return new vscode.Hover(display || '(empty)', range)
          }
        }
        return undefined
      }
    }
  }
}

const c = createProviders([{
  completion: /(?<![\w.:>])(?:(?:std)?::)?getenv\s*(\(\s*)("[\w.-]*)?$/,
  hover: /(?<![\w.:>])(?:(?:std)?::)?getenv\s*\(\s*"([\w.-]+)"\s*(?=\))/g
}])

const julia = createProviders([{
  completion: /(?<![\w.])(?:Base\.)?ENV\s*(\[\s*)("[\w.-]*)?$/,
  hover: /(?<![\w.])(?:Base\.)?ENV\s*\[\s*"([\w.-]+)"\s*(?=\])/g
}, {
  completion: /(?<![\w.])(?:Base\.)?get\s*\(\s*(?:Base\.)?ENV\s*(,\s*)("[\w.-]*)?$/,
  hover: /(?<![\w.])(?:Base\.)?get\s*\(\s*(?:Base\.)?ENV\s*,\s*"([\w.-]+)"\s*(?=,)/g
}])

const erlang = createProviders([{
  completion: /(?<![\w:'])os\s*:\s*getenv\s*(\(\s*)("[\w.-]*)?$/,
  hover: /(?<![\w:'])os\s*:\s*getenv\s*\(\s*"([\w.-]+)"\s*(?=[,)])/g
}])

const perl = createProviders([{
  completion: /(?<![\w$])\$ENV\s*(\{\s*)("[\w.-]*)$/,
  hover: /(?<![\w$])\$ENV\s*\{\s*"([\w.-]+)"\s*(?=\})/g
}, {
  quote: "'",
  completion: /(?<![\w$])\$ENV\s*(\{\s*)('[\w.-]*)$/,
  hover: /(?<![\w$])\$ENV\s*\{\s*'([\w.-]+)'\s*(?=\})/g
}, {
  quote: '',
  bare: true,
  completion: /(?<![\w$])\$ENV\s*(\{\s*)([A-Za-z_]\w*)?$/,
  hover: /(?<![\w$])\$ENV\s*\{\s*([A-Za-z_]\w*)\s*(?=\})/g
}])

const swift = createProviders([{
  completion: /(?<![\w.])(?:Foundation\s*\.\s*)?ProcessInfo\s*\.\s*processInfo\s*\.\s*environment\s*(\[\s*)("[\w.-]*)?$/,
  hover: /(?<![\w.])(?:Foundation\s*\.\s*)?ProcessInfo\s*\.\s*processInfo\s*\.\s*environment\s*\[\s*"([\w.-]+)"\s*(?=\])/g
}, {
  completion: /(?<![\w.])(?:(?:Darwin|Glibc)\s*\.\s*)?getenv\s*(\(\s*)("[\w.-]*)?$/,
  hover: /(?<![\w.])(?:(?:Darwin|Glibc)\s*\.\s*)?getenv\s*\(\s*"([\w.-]+)"\s*(?=\))/g
}])

const clojure = createProviders([{
  completion: /\([\s,]*(?:java\.lang\.)?System\/getenv([\s,]+)("[\w.-]*)?$/,
  hover: /\([\s,]*(?:java\.lang\.)?System\/getenv[\s,]+"([\w.-]+)"[\s,]*(?=\))/g
}])

module.exports = { c, julia, erlang, perl, swift, clojure }
