const { describe, it } = require('mocha')
const assert = require('assert')
const { entries, change, normalizeEol } = require('../../../lib/secure-document')
describe('Monaco dotenv value ranges', () => {
  it('keeps quote delimiters visible while masking their contents', () => {
    for (const quote of ['"', "'", '`']) {
      const text = `KEY=${quote}first\\${quote}second\nthird${quote} # comment\nEMPTY=${quote}${quote}\nNEXT=plain\n`
      const found = entries(text)
      assert.deepStrictEqual(found.map(entry => text.slice(entry.maskStart, entry.maskEnd)), [`first\\${quote}second\nthird`, '', 'plain'])
      assert.strictEqual(text[found[0].maskStart - 1], quote)
      assert.strictEqual(text[found[0].maskEnd], quote)
      const unfinished = `KEY=${quote}secret\\${quote}`
      const entry = entries(unfinished)[0]
      assert.strictEqual(unfinished.slice(entry.maskStart, entry.maskEnd), `secret\\${quote}`)
    }
  })
  it('covers multiline secrets, duplicate keys and quoted hashes without masking comments', () => {
    const text = '# comment\r\nexport KEY = "first\r\nsecond" # keep\r\nKEY=third\r\nHASH="with#hash"\r\nEMPTY=\r\n'
    const found = entries(text)
    assert.deepStrictEqual(found.map(entry => entry.value), ['"first\r\nsecond"', 'third', '"with#hash"', ''])
    for (const entry of found) assert.strictEqual(text.slice(entry.start, entry.end), entry.value)
  })
  it('also masks commented assignments', () => {
    assert.deepStrictEqual(entries('# KEY=SECRET_COMMENT\n# Just a comment\n').map(entry => entry.value), ['SECRET_COMMENT'])
  })
  it('masks the rest of an unfinished quoted value while typing', () => {
    const text = 'KEY="SECRET_FIRST\nSECRET_SECOND\n'
    assert.strictEqual(entries(text)[0].end, text.length)
  })
  it('preserves UTF-16 offsets and CRLF boundaries in document edits', () => {
    const before = 'KEY=🌴\r\nNEXT=value\r\n'
    const after = 'KEY=🌴x\r\nNEXT=value\r\n'
    const edit = change(before, after)
    assert.strictEqual(before.slice(0, edit.start) + edit.text + before.slice(edit.end), after)
    assert.strictEqual(normalizeEol('a\nb\r\nc', true), 'a\r\nb\r\nc')
  })
})
