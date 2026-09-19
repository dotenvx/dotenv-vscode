const { describe, it } = require('mocha')
const assert = require('assert')
const vscode = require('vscode')

describe('secure editor registration', () => {
  for (const name of ['.env', '.env.local', 'config.env', '.flaskenv', '.dev.vars', '.env.d/production']) {
    it(`opens ${name} in the secure editor by default`, async function () {
      this.timeout(10000)
      await vscode.extensions.getExtension('dotenv.dotenv-vscode').activate()
      const root = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, 'secure-integration')
      await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(root, '.env.d'))
      const uri = vscode.Uri.joinPath(root, name)
      await vscode.workspace.fs.writeFile(uri, Buffer.from('KEY=DUMMY_SECRET\n'))
      try {
        await vscode.commands.executeCommand('vscode.open', uri)
        const input = vscode.window.tabGroups.activeTabGroup.activeTab.input
        assert(input instanceof vscode.TabInputCustom)
        assert.strictEqual(input.viewType, 'dotenv.secureEditor')
        assert.strictEqual(input.uri.toString(), uri.toString())
      } finally {
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
      }
    })
  }
  it('keeps the normal text editor available as an explicit choice', async function () {
    const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, 'secure-integration/.env')
    try {
      await vscode.commands.executeCommand('vscode.openWith', uri, 'default')
      assert(vscode.window.tabGroups.activeTabGroup.activeTab.input instanceof vscode.TabInputText)
    } finally {
      await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
    }
  })
})
