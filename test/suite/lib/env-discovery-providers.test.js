const { describe, it, before, after } = require('mocha')
const assert = require('assert')
const vscode = require('vscode')
const helpers = require('../../../lib/helpers')
const settings = require('../../../lib/settings')

describe('dotenv discovery through language providers', () => {
  let root
  const write = async (name, text) => {
    const uri = vscode.Uri.joinPath(root, name)
    await vscode.workspace.fs.writeFile(uri, Buffer.from(text))
    return uri
  }
  before(async () => {
    await vscode.extensions.getExtension('dotenv.dotenv-vscode').activate()
    root = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, 'discovery-providers')
    await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(root, 'app/src'))
    await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(root, 'sibling'))
    await write('app/.env.local', 'DISCOVERY_KEY=localvalue\nONLY_LOCAL=localonly\nEMPTY=\n')
    await write('app/.env.production', 'DISCOVERY_KEY=productionvalue\nONLY_PROD=prodonly\n')
    await write('sibling/.env', 'SIBLING_ONLY=wrongapp')
  })
  after(async () => {
    await vscode.workspace.fs.delete(root, { recursive: true })
  })

  for (const [extension, complete, reference] of [
    ['js', 'process.env.', 'process.env.DISCOVERY_KEY'],
    ['ts', 'process.env.', 'process.env.DISCOVERY_KEY'],
    ['py', 'os.getenv(', 'os.getenv("DISCOVERY_KEY")'],
    ['cs', 'Environment.GetEnvironmentVariable(', 'Environment.GetEnvironmentVariable("DISCOVERY_KEY")'],
    ['cpp', 'getenv(', 'getenv("DISCOVERY_KEY")']
  ]) {
    it(`finds local variants and source-labeled conflicts for ${extension}`, async () => {
      const uri = await write(`app/src/index.${extension}`, `${complete}\n${reference}`)
      const document = await vscode.workspace.openTextDocument(uri)
      const completions = await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', uri, new vscode.Position(0, complete.length))
      const keys = completions.items.map(item => typeof item.label === 'string' ? item.label : item.label.label)
      assert(keys.includes('ONLY_LOCAL'))
      assert(keys.includes('ONLY_PROD'))
      assert(!keys.includes('SIBLING_ONLY'))
      assert.strictEqual(completions.items.filter(item => item.label.label === 'DISCOVERY_KEY').length, 1)
      const item = completions.items.find(item => item.label.label === 'DISCOVERY_KEY')
      assert(item.label.description.includes('.env.local'))
      assert(item.label.description.includes('.env.production'))
      assert(!item.documentation.value.includes('localvalue'))
      assert(!item.documentation.value.includes('productionvalue'))
      const hovers = await vscode.commands.executeCommand('vscode.executeHoverProvider', uri, new vscode.Position(1, reference.indexOf('DISCOVERY_KEY') + 2))
      const content = hovers.flatMap(hover => hover.contents).map(value => value.value || value).join('\n')
      assert(content.includes('█'.repeat('localvalue'.length)))
      assert(!content.includes('localvalue'))
      assert(!content.includes('productionvalue'))
      assert(content.includes('.env.local'))
      assert(content.includes('.env.production'))
      assert.strictEqual(document.getText(), `${complete}\n${reference}`)
    })
  }

  for (const extension of ['js', 'ts', 'jsx', 'tsx']) {
    it(`completes and peeks at imported env through registered ${extension} providers`, async () => {
      const uri = await write(`app/src/imported.${extension}`, "import { env } from 'node:process'\nenv.\nenv.DISCOVERY_KEY")
      const completions = await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', uri, new vscode.Position(1, 4))
      const item = completions.items.find(item => item.label.label === 'DISCOVERY_KEY')
      assert(item)
      assert(!item.documentation.value.includes('localvalue'))
      const hovers = await vscode.commands.executeCommand('vscode.executeHoverProvider', uri, new vscode.Position(2, 8))
      const content = hovers.flatMap(hover => hover.contents).map(value => value.value || value).join('\n')
      assert(content.includes('█'.repeat('localvalue'.length)))
      assert(!content.includes('localvalue'))
      assert(!content.includes('productionvalue'))
    })
  }

  it('keeps suggestions without value details when secret peeking is disabled', async () => {
    const original = settings.secretpeekingEnabled
    try {
      settings.secretpeekingEnabled = () => false
      const uri = await write('app/src/masked.js', 'process.env.')
      const document = await vscode.workspace.openTextDocument(uri)
      const item = helpers.autocomplete('.', document, new vscode.Position(0, 12)).find(item => item.label.label === 'DISCOVERY_KEY')
      assert.strictEqual(helpers.valueHover('DISCOVERY_KEY', document), undefined)
      assert.strictEqual(item.documentation, undefined)
      assert(item.label.description.includes('.env.local'))
      assert.strictEqual(item.insertText, '.DISCOVERY_KEY')
    } finally {
      settings.secretpeekingEnabled = original
    }
  })

  it('keeps short and long values masked in suggestions without peeking details', async () => {
    const originalPeeking = settings.secretpeekingEnabled
    const originalIcon = settings.cloakIcon
    try {
      settings.secretpeekingEnabled = () => false
      settings.cloakIcon = () => '█'
      const uri = await write('app/src/full-mask.js', 'process.env.')
      const document = await vscode.workspace.openTextDocument(uri)
      for (const value of ['x', 'xy', 'World', '🌴secret']) {
        await write('app/.env.mask-test', `MASK_TEST=${value}\n`)
        const item = helpers.autocomplete('.', document, new vscode.Position(0, 12)).find(item => item.label.label === 'MASK_TEST')
        const mask = '█'.repeat(value.length)
        assert.strictEqual(item.label.detail, ` ${mask}`)
        assert.strictEqual(item.documentation, undefined)
        assert.strictEqual(helpers.valueHover('MASK_TEST', document), undefined)
      }
      settings.secretpeekingEnabled = () => true
      assert(helpers.valueHover('MASK_TEST', document).contents[0].value.includes('█'.repeat('🌴secret'.length)))
    } finally {
      settings.secretpeekingEnabled = originalPeeking
      settings.cloakIcon = originalIcon
    }
  })

  it('shows unsaved dotenv changes immediately and does not interpret values as Markdown', async () => {
    const uri = vscode.Uri.joinPath(root, 'app/.env.local')
    const document = await vscode.workspace.openTextDocument(uri)
    const edit = new vscode.WorkspaceEdit()
    edit.replace(uri, new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length)), 'UNSAVED_KEY=[click](command:evil)\n')
    await vscode.workspace.applyEdit(edit)
    const code = await vscode.workspace.openTextDocument(vscode.Uri.joinPath(root, 'app/src/index.js'))
    const item = helpers.autocomplete('.', code, new vscode.Position(0, 12)).find(item => item.label.label === 'UNSAVED_KEY')
    assert(item)
    assert.deepStrictEqual(item.documentation.isTrusted, { enabledCommands: ['dotenv.toggleCompletionValue'] })
    assert(!item.documentation.supportHtml)
    assert(!item.documentation.value.includes('command:evil'))
    assert(!helpers.envValues(code).has('ONLY_LOCAL'))
    // Revert this disposable fixture so it doesn't leave a dirty editor behind.
    await vscode.window.showTextDocument(document)
    await vscode.commands.executeCommand('workbench.action.files.revert')
  })
})
