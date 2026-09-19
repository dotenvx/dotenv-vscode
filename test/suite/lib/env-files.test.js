const { describe, it, beforeEach, afterEach } = require('mocha')
const assert = require('assert')
const fs = require('fs')
const os = require('os')
const path = require('path')
const vm = require('vm')
const vscode = require('vscode')

// Use real filesystem contents and VS Code's glob matcher, with independent
// workspace roots so these tests cannot read a developer's own dotenv files.
describe('dotenv discovery', () => {
  let base, roots, documents, associations, read
  const write = (name, content) => {
    const filename = path.join(base, name)
    fs.mkdirSync(path.dirname(filename), { recursive: true })
    fs.writeFileSync(filename, content)
    return filename
  }
  const document = name => ({ uri: vscode.Uri.file(path.join(base, name)) })
  const values = name => read(document(name)).flatMap(source => Object.entries(source.parsed))

  beforeEach(() => {
    base = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenv-discovery-'))
    roots = [path.join(base, 'repo')]
    documents = []
    associations = {}
    fs.mkdirSync(roots[0])
    const module = { exports: {} }
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../../lib/env-files.js'), 'utf8'), {
      module,
      require: name => name === 'vscode'
        ? {
            Uri: vscode.Uri,
            languages: vscode.languages,
            workspace: {
              get textDocuments () { return documents },
              get workspaceFolders () { return roots.map(root => ({ uri: vscode.Uri.file(root) })) },
              getWorkspaceFolder: uri => roots.map(root => ({ uri: vscode.Uri.file(root) })).find(folder => {
                const relative = path.relative(folder.uri.fsPath, uri.fsPath)
                return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)
              }),
              getConfiguration: () => ({ get: () => associations })
            }
          }
        : require(name)
    })
    read = module.exports.read
  })
  afterEach(() => fs.rmSync(base, { recursive: true, force: true }))

  it('includes all dotenv filename variants without requiring a plain .env', () => {
    for (const name of ['.env.local', '.env.production', '.env.example', '.flaskenv', 'custom.env']) write(`repo/${name}`, `${name.replace(/\W/g, '_')}=value`)
    write('repo/ignored.txt', 'IGNORED=value')
    assert.strictEqual(values('repo/src/index.ts').length, 5)
  })

  it('finds package and ancestor files but excludes sibling projects', () => {
    write('repo/.env', 'SHARED=root')
    write('repo/apps/api/.env.local', 'API=local\nSHARED=package')
    write('repo/apps/web/.env', 'WEB=sibling')
    const result = read(document('repo/apps/api/src/index.js'))
    assert.deepStrictEqual(Array.from(result, source => source.label), ['apps/api/.env.local', '.env'])
    assert.deepStrictEqual(Array.from(values('repo/apps/api/src/index.js'), entry => Array.from(entry)), [['API', 'local'], ['SHARED', 'package'], ['SHARED', 'root']])
  })

  it('uses the document’s workspace rather than the first workspace', () => {
    roots.push(path.join(base, 'second'))
    write('repo/.env', 'FIRST=wrong')
    write('second/.env', 'SECOND=correct')
    assert.deepStrictEqual(Array.from(values('second/index.js'), entry => Array.from(entry)), [['SECOND', 'correct']])
  })

  it('stops at the workspace boundary', () => {
    write('.env', 'OUTSIDE=wrong')
    assert.strictEqual(values('repo/index.js').length, 0)
  })

  it('supports custom language associations and explicit exclusions', () => {
    associations = { '.dev.vars*': 'dotenv', '**/secrets.conf': 'dotenv', '.env.ignore': 'plaintext' }
    write('repo/.dev.vars.staging', 'CLOUDFLARE=yes')
    write('repo/secrets.conf', 'CUSTOM=yes')
    write('repo/.env.ignore', 'IGNORED=yes')
    assert.deepStrictEqual(Array.from(values('repo/index.js'), ([key]) => key).sort(), ['CLOUDFLARE', 'CUSTOM'])
  })

  it('uses unsaved content and an explicitly selected Dotenv language mode', () => {
    write('repo/.env', 'VALUE=old')
    documents = [
      { ...document('repo/.env'), languageId: 'dotenv', getText: () => 'VALUE=unsaved' },
      { ...document('repo/custom'), languageId: 'dotenv', getText: () => 'CUSTOM=unsaved' }
    ]
    assert.deepStrictEqual(Array.from(values('repo/index.js'), entry => Array.from(entry)), [['VALUE', 'unsaved'], ['CUSTOM', 'unsaved']])
  })

  it('picks up creation, edits, renames and deletion without restarting', () => {
    assert.strictEqual(values('repo/index.js').length, 0)
    const file = write('repo/.env', 'VALUE=first')
    assert.strictEqual(values('repo/index.js')[0][1], 'first')
    fs.writeFileSync(file, 'VALUE=second')
    fs.renameSync(file, `${file}.local`)
    assert.strictEqual(values('repo/index.js')[0][1], 'second')
    fs.unlinkSync(`${file}.local`)
    assert.strictEqual(values('repo/index.js').length, 0)
  })

  it('parses values without mutating the extension host environment', () => {
    const original = process.env.DOTENV_DISCOVERY_TEST
    write('repo/.env', 'DOTENV_DISCOVERY_TEST=mustnotload\nEMPTY=\nSPACES="  preserved  "')
    const parsed = Object.fromEntries(values('repo/index.js'))
    assert.strictEqual(parsed.EMPTY, '')
    assert.strictEqual(parsed.SPACES, '  preserved  ')
    assert.strictEqual(process.env.DOTENV_DISCOVERY_TEST, original)
  })

  it('supports a single file outside a workspace without borrowing another root', () => {
    write('repo/.env', 'WRONG=value')
    write('standalone/.env', 'RIGHT=value')
    assert.deepStrictEqual(Array.from(values('standalone/index.js'), ([key]) => key), ['RIGHT'])
    assert.strictEqual(read({ uri: vscode.Uri.parse('untitled:example') }).length, 0)
  })

  it('reads symlinked dotenv files and ignores broken links and directories', () => {
    const target = write('shared', 'LINKED=yes')
    fs.symlinkSync(target, path.join(base, 'repo/.env'))
    fs.symlinkSync(path.join(base, 'missing'), path.join(base, 'repo/.env.broken'))
    fs.mkdirSync(path.join(base, 'repo/.env.directory'))
    assert.deepStrictEqual(Array.from(values('repo/index.js'), ([key]) => key), ['LINKED'])
  })
})
