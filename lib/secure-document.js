// Locate raw value ranges without serializing the file through dotenv.parse:
// edits must preserve comments, quoting, whitespace, duplicates and line endings.
function entries (text) {
  const result = []
  let offset = 0
  while (offset < text.length) {
    const newline = text.indexOf('\n', offset)
    const lineEnd = newline < 0 ? text.length : newline
    const line = text.slice(offset, lineEnd).replace(/\r$/, '')
    const match = /^[ \t]*(?:export[ \t]+)?([\w.-]+)[ \t]*(?:=|:[ \t]+)/.exec(line)
    if (!match) { offset = lineEnd + 1; continue }
    let start = offset + match[0].length
    while (text[start] === ' ' || text[start] === '\t') start++
    let end = start
    const quote = text[start]
    if (quote === '"' || quote === "'" || quote === '`') {
      end++
      while (end < text.length) {
        if (text[end] === quote) {
          let slashes = 0
          for (let i = end - 1; i >= start && text[i] === '\\'; i--) slashes++
          if (slashes % 2 === 0) { end++; break }
        }
        end++
      }
    } else {
      end = text.indexOf('#', start)
      if (end < 0 || end > lineEnd) end = lineEnd
      while (end > start && /[ \t\r]/.test(text[end - 1])) end--
    }
    result.push({ id: result.length, key: match[1], start, end, value: text.slice(start, end) })
    const next = text.indexOf('\n', Math.max(end, lineEnd))
    offset = next < 0 ? text.length : next + 1
  }
  return result
}

function validValue (value) {
  const trimmed = value.trim()
  const quote = trimmed[0]
  if (quote === '"' || quote === "'" || quote === '`') {
    if (trimmed.length < 2 || trimmed[trimmed.length - 1] !== quote) return false
    let slashes = 0
    for (let i = trimmed.length - 2; i >= 0 && trimmed[i] === '\\'; i--) slashes++
    if (slashes % 2) return false
  }
  const parsed = entries(`KEY=${value}`)
  return parsed.length === 1 && parsed[0].value === value.trim()
}

function normalizeEol (text, crlf) {
  return text.replace(/\r\n|\r|\n/g, crlf ? '\r\n' : '\n')
}

function change (before, after) {
  if (before === after) return undefined
  let start = 0
  while (start < before.length && start < after.length && before[start] === after[start]) start++
  let end = before.length
  let replacementEnd = after.length
  while (end > start && replacementEnd > start && before[end - 1] === after[replacementEnd - 1]) { end--; replacementEnd-- }
  // Do not split CRLF pairs when mapping offsets to VS Code positions.
  if (start > 0 && before[start - 1] === '\r' && before[start] === '\n') start--
  if (end > 0 && before[end - 1] === '\r' && before[end] === '\n') { end++; replacementEnd++ }
  return { start, end, text: after.slice(start, replacementEnd) }
}

function masked (text) {
  let result = ''
  let offset = 0
  for (const entry of entries(text)) {
    result += text.slice(offset, entry.start) + entry.value.replace(/[^\r\n]/g, '█')
    offset = entry.end
  }
  return result + text.slice(offset)
}

if (typeof module !== 'undefined') module.exports = { entries, validValue, normalizeEol, change, masked }
else globalThis.dotenvDocument = { masked }
