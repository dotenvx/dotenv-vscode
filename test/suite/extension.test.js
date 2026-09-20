const { describe, it } = require('mocha')
const assert = require('assert')
const vscode = require('vscode')

describe('File associations', () => {
  for (const filename of ['.env', '.env.local', '.env.example', '.env.custom-stage', 'config.env', '.flaskenv']) {
    it(`recognizes ${filename} as dotenv`, async function () {
      const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, filename)
      await vscode.workspace.fs.writeFile(uri, Buffer.from('HELLO=World\n'))
      const document = await vscode.workspace.openTextDocument(uri)

      assert.strictEqual(document.languageId, 'dotenv')
    })
  }

  it('respects explicit workspace associations', async function () {
    const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, '.env.custom')
    await vscode.workspace.fs.writeFile(uri, Buffer.from('HELLO=World\n'))
    const document = await vscode.workspace.openTextDocument(uri)

    assert.strictEqual(document.languageId, 'plaintext')
  })

  it('does not copy workspace file associations into user settings on activation', async function () {
    await vscode.extensions.getExtension('dotenv.dotenv-vscode').activate()
    const associations = vscode.workspace.getConfiguration('files').inspect('associations')

    assert.deepStrictEqual(associations.workspaceValue, { '*.css': 'css', '.env.custom': 'plaintext', '.dev.vars': 'dotenv', '**/.env.d/*': 'dotenv' })
    assert.strictEqual(associations.globalValue, undefined)
  })
})

describe('Custom dotenv cloaking', () => {
  const decorations = require('../../lib/decorations')

  for (const filename of ['.dev.vars', '.env.d/production', 'config.env']) {
    it(`cloaks ${filename} and provides a toggle`, async function () {
      await vscode.extensions.getExtension('dotenv.dotenv-vscode').activate()
      const root = vscode.workspace.workspaceFolders[0].uri
      await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(root, '.env.d'))
      const uri = vscode.Uri.joinPath(root, filename)
      await vscode.workspace.fs.writeFile(uri, Buffer.from('HELLO=World\n'))
      const document = await vscode.workspace.openTextDocument(uri)
      assert.strictEqual(document.languageId, 'dotenv')

      let applied
      decorations.decorate({}, { document, setDecorations: (type, ranges) => { applied = ranges } })
      assert.strictEqual(applied.length, 1)
      assert.strictEqual(applied[0].range.start.character, 5)
      assert.strictEqual(applied[0].range.end.character, 11)
      assert(!applied[0].renderOptions.after.contentText.includes('World'))

      const lenses = await vscode.commands.executeCommand('vscode.executeCodeLensProvider', uri)
      assert(lenses.some(lens => lens.command.command === 'dotenv.toggleAutocloaking'))
    })
  }

  it('toggles without writing global settings or changing document contents', async function () {
    await vscode.extensions.getExtension('dotenv.dotenv-vscode').activate()
    const settings = require('../../lib/settings')
    const document = await vscode.workspace.openTextDocument({
      language: 'dotenv',
      content: `PLAIN=secret
QUOTED="secret \${PLAIN}"
SINGLE='secret'
`
    })
    const original = document.getText()
    const config = vscode.workspace.getConfiguration()
    const keys = ['editor.tokenColorCustomizations', 'dotenv.enableAutocloaking']
    const before = keys.map(key => config.inspect(key).globalValue)
    assert.deepStrictEqual(before, [undefined, undefined])
    const initial = settings.autocloakingEnabled()
    let applied
    const editor = { document, setDecorations: (type, ranges) => { applied = ranges } }
    try {
      await vscode.commands.executeCommand('dotenv.toggleAutocloaking')
      assert.strictEqual(settings.autocloakingEnabled(), !initial)
      decorations.decorate({}, editor)
      assert.strictEqual(applied.length, initial ? 0 : 3)
      await vscode.commands.executeCommand('dotenv.toggleAutocloaking')
      assert.strictEqual(settings.autocloakingEnabled(), initial)
      decorations.decorate({}, editor)
      assert.strictEqual(applied.length, initial ? 3 : 0)
      assert.deepStrictEqual(keys.map(key => config.inspect(key).globalValue), before)
      assert.strictEqual(document.getText(), original)
    } finally {
      if (settings.autocloakingEnabled() !== initial) {
        await vscode.commands.executeCommand('dotenv.toggleAutocloaking')
      }
    }
  })

  it('clears the cloak and removes the toggle when switching language modes', async function () {
    const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, '.dev.vars')
    let document = await vscode.workspace.openTextDocument(uri)
    let applied
    const editor = { document, setDecorations: (type, ranges) => { applied = ranges } }
    decorations.decorate({}, editor)
    assert.strictEqual(applied.length, 1)

    try {
      document = await vscode.languages.setTextDocumentLanguage(document, 'plaintext')
      editor.document = document
      decorations.decorate({}, editor)
      assert.deepStrictEqual(applied, [])
      const lenses = await vscode.commands.executeCommand('vscode.executeCodeLensProvider', uri)
      assert(!(lenses || []).some(lens => lens.command?.command === 'dotenv.toggleAutocloaking'))
    } finally {
      await vscode.languages.setTextDocumentLanguage(document, 'dotenv')
    }
  })
})

describe('Dotenv editor commands', () => {
  it('registers cloaking and popup commands without a sidebar', async function () {
    const extension = vscode.extensions.getExtension('dotenv.dotenv-vscode')
    await extension.activate()
    const commands = await vscode.commands.getCommands(true)
    assert.deepStrictEqual(commands.filter(command => command.startsWith('dotenv.')).sort(), ['dotenv.toggleAutocloaking', 'dotenv.toggleCompletionValue', 'dotenv.toggleHoverValue'])
    assert.strictEqual(extension.packageJSON.displayName, 'Dotenv Official')
    assert.strictEqual(extension.packageJSON.contributes.views, undefined)
    assert.strictEqual(extension.packageJSON.contributes.viewsContainers, undefined)
  })
})
