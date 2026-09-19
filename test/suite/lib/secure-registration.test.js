const { describe, it } = require('mocha')
const assert = require('assert')
const vscode = require('vscode')
describe('Dotenv Monaco registration', () => {
  for (const file of ['.env', '.env.local', '.env.production', 'config.env', '.flaskenv']) {
    it(`opens ${file} with the source editor and allows the native editor`, async () => {
      const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, file)
      await vscode.workspace.fs.writeFile(uri, Buffer.from('KEY=SECRET_REGISTRATION\n'))
      await vscode.commands.executeCommand('vscode.open', uri)
      assert.strictEqual(vscode.window.tabGroups.activeTabGroup.activeTab.input.viewType, 'dotenv.sourceEditor')
      await vscode.commands.executeCommand('vscode.openWith', uri, 'default')
      assert(vscode.window.tabGroups.activeTabGroup.activeTab.input instanceof vscode.TabInputText)
    })
  }
})
