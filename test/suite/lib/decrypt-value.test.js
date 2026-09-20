const { describe, it } = require('mocha')
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')
function fixture ({ error, output = 'KEY="decrypted value"', trusted = true, dirty = false } = {}) {
  const calls = []
  const module = { exports: {} }
  const document = { uri: { scheme: 'file', fsPath: '/project/.env.ci' }, isDirty: dirty }
  const dependencies = {
    vscode: { workspace: { isTrusted: trusted, getConfiguration: () => ({ get: () => '/usr/local/bin/dotenvx' }) } },
    child_process: { execFile: (...args) => { calls.push(args); args[3](error, output) } }
  }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../../lib/decrypt-value.js'), 'utf8'), {
    module, require: name => dependencies[name] || require(name)
  })
  return { calls, decrypt: () => module.exports.decrypt(document, 'KEY') }
}
describe('encrypted value decryption', () => {
  it('captures stdout using a shell-free, read-only dotenvx command', async () => {
    const f = fixture()
    assert.strictEqual(await f.decrypt(), 'decrypted value')
    const [executable, args, options] = f.calls[0]
    assert.strictEqual(executable, '/usr/local/bin/dotenvx')
    assert.deepStrictEqual(Array.from(args), ['decrypt', '--stdout', '-f', '/project/.env.ci', '-k', 'KEY'])
    assert.strictEqual(options.cwd, '/project')
    assert.strictEqual(options.shell, undefined)
    assert(options.timeout > 0)
  })
  it('does not expand shell substitutions or environment references in decrypted values', async () => {
    assert.strictEqual(await fixture({ output: 'KEY="$(touch /tmp/should-not-exist) $HOME"' }).decrypt(), '$(touch /tmp/should-not-exist) $HOME')
  })
  it('does not run a command in untrusted workspaces or on unsaved files', async () => {
    for (const options of [{ trusted: false }, { dirty: true }]) {
      const f = fixture(options)
      await assert.rejects(f.decrypt())
      assert.strictEqual(f.calls.length, 0)
    }
  })
  it('reports missing CLI and keys without exposing raw errors', async () => {
    await assert.rejects(fixture({ error: { code: 'ENOENT', message: 'SECRET' } }).decrypt(), /Install dotenvx/)
    await assert.rejects(fixture({ error: { code: 1, message: 'SECRET' } }).decrypt(), /matching private key/)
    await assert.rejects(fixture({ output: 'KEY="encrypted:unchanged"' }).decrypt(), /matching private key/)
    await assert.rejects(fixture({ output: '' }).decrypt(), /matching private key/)
  })
})
