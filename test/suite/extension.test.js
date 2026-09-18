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

    assert.deepStrictEqual(associations.workspaceValue, { '*.css': 'css', '.env.custom': 'plaintext' })
    assert.strictEqual(associations.globalValue, undefined)
  })
})
