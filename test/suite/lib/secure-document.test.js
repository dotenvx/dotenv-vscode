const { describe, it } = require('mocha')
const assert = require('assert')
const { entries, validValue, normalizeEol, change } = require('../../../lib/secure-document')

describe('secure dotenv document', () => {
  it('locates only values while preserving comments, export, duplicates and CRLF', () => {
    const text = '# comment=hidden\r\n export KEY = "hello # world"  # note\r\nKEY=second\r\nEMPTY=  # empty\r\n'
    const rows = entries(text)
    assert.deepStrictEqual(rows.map(row => [row.key, row.value]), [['KEY', '"hello # world"'], ['KEY', 'second'], ['EMPTY', '']])
    const row = rows[0]
    const next = text.slice(0, row.start) + '"changed"' + text.slice(row.end)
    assert.strictEqual(next, '# comment=hidden\r\n export KEY = "changed"  # note\r\nKEY=second\r\nEMPTY=  # empty\r\n')
  })
  it('keeps multiline values and escaped quotes together', () => {
    const text = 'KEY="line1\nline2 \\"quoted\\""\nOTHER=`line3\nline4`\n'
    const rows = entries(text)
    assert.strictEqual(rows.length, 2)
    assert.strictEqual(rows[0].value, '"line1\nline2 \\"quoted\\""')
    assert.strictEqual(rows[1].value, '`line3\nline4`')
  })
  it('never treats continuation text or malformed lines as visible content', () => {
    const rows = entries('KEY="unterminated\nSECRET_CONTINUATION\nOTHER=value\n')
    assert.strictEqual(rows.length, 1)
    assert.strictEqual(rows[0].key, 'KEY')
    assert.strictEqual(entries('a sentence with secret words\n# secret comment').length, 0)
  })
  it('validates individual values without allowing injected assignments', () => {
    for (const value of ['', 'plain', '"quoted"', "'single'", '`multi\nline`', '"multi\nline"']) assert(validValue(value), value)
    for (const value of ['plain\nOTHER=secret', '"unclosed', '"closed"suffix', '"escaped\\"', 'plain # comment']) assert(!validValue(value), value)
  })
  it('normalizes textarea line endings and produces a minimal replacement', () => {
    assert.strictEqual(normalizeEol('a\nb\r\nc', true), 'a\r\nb\r\nc')
    for (const [before, after] of [['ABC=first\r\n', 'ABC=second\r\n'], ['', 'NEW=value\n'], ['abc', ''], ['KEY=😀\n', 'KEY=hello\n'], ['a\r\nb', 'a\r\nx\r\nb']]) {
      const edit = change(before, after)
      assert.strictEqual(before.slice(0, edit.start) + edit.text + before.slice(edit.end), after)
    }
    assert.strictEqual(change('same', 'same'), undefined)
  })
})
