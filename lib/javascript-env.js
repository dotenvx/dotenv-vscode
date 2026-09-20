// Recognize named imports without treating imports inside comments or strings as code.
function importedNames (document) {
  const names = []
  const tokens = /\/\*[\s\S]*?\*\/|\/\/[^\r\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\bimport\s+(?:[\w$]+\s*,\s*)?\{([^}]*)\}\s*from\s*(['"])(?:node:)?process\2/g
  for (const match of document.getText().matchAll(tokens)) {
    if (match[1] === undefined) continue
    const specifiers = match[1].replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g, ' ')
    for (const specifier of specifiers.split(',')) {
      const env = specifier.trim().match(/^env(?:\s+as\s+([A-Za-z_$][\w$]*))?$/)
      if (env) names.push(env[1] || 'env')
    }
  }
  return names
}

function reference (document, suffix, flags) {
  const names = importedNames(document)
  if (!names.length) return undefined
  const escaped = names.map(name => name.replace(/\$/g, '\\$')).join('|')
  return new RegExp(`(?<![\\w$.])(?:${escaped})\\.${suffix}`, flags)
}

module.exports = { reference }
