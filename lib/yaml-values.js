const YAML = require('yaml')

const defaultSections = ['env_variables', 'environment', 'env']

// Work with source offsets, never reserialize the YAML or expand aliases to JS.
function ranges (text, sections = defaultSections) {
  const result = []
  const names = new Set(sections)
  for (const document of YAML.parseAllDocuments(text, { prettyErrors: false, logLevel: 'silent' })) {
    const protectedNodes = new Set()
    function scalar (node, assignment) {
      if (!node.range) return
      let [start, end] = node.range
      const quote = text[start]
      if (node.type === 'QUOTE_DOUBLE' || node.type === 'QUOTE_SINGLE') {
        start++
        if (text[end - 1] === quote) end--
      }
      if (assignment) {
        const match = /^[\w.-]+=/.exec(text.slice(start, end))
        if (!match) return // Docker pass-through names have no inline secret.
        start += match[0].length
        if ((text[start] === '"' || text[start] === "'") && text[end - 1] === text[start] && end > start + 1) { start++; end-- }
      }
      if (node.type === 'BLOCK_LITERAL' || node.type === 'BLOCK_FOLDED') {
        const newline = text.indexOf('\n', start)
        start = newline < 0 ? end : newline + 1
      }
      // Separate lines preserve indentation, line breaks, and block indicators.
      const source = text.slice(start, end)
      const lines = /[^\r\n]+/g
      let line
      while ((line = lines.exec(source))) {
        const spaces = /^[ \t]*/.exec(line[0])[0].length
        const from = start + line.index + spaces
        const to = start + line.index + line[0].length
        if (to > from) result.push({ start: from, end: to })
      }
    }
    function protect (node, assignment = false) {
      if (!node || protectedNodes.has(node)) return
      protectedNodes.add(node)
      if (YAML.isAlias(node)) {
        protect(node.resolve(document), assignment)
      } else if (YAML.isScalar(node)) {
        scalar(node, assignment)
      } else if (YAML.isMap(node)) {
        for (const pair of node.items) protect(pair.value)
      } else if (YAML.isSeq(node)) {
        for (const item of node.items) {
          if (YAML.isMap(item) && item.has('name')) {
            // Kubernetes env entries: names and valueFrom references stay readable.
            protect(item.get('value', true))
          } else protect(item, YAML.isScalar(item))
        }
      }
    }
    function visit (node) {
      if (YAML.isMap(node)) {
        for (const pair of node.items) {
          if (YAML.isScalar(pair.key) && names.has(String(pair.key.value)) &&
              (YAML.isMap(pair.value) || YAML.isSeq(pair.value) || YAML.isAlias(pair.value))) protect(pair.value)
          visit(pair.value)
        }
      } else if (YAML.isSeq(node)) node.items.forEach(visit)
    }
    visit(document.contents)
  }
  return result.sort((a, b) => a.start - b.start)
}

module.exports = { ranges, defaultSections }
