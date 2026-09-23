const { describe, it } = require('mocha')
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const vscode = require('vscode')
const values = require('../../../lib/yaml-values')

describe('YAML decoration integration', () => {
  it('cloaks standard YAML sections and follows the shared auto-cloaking setting', async () => {
    const document = await vscode.workspace.openTextDocument({ language: 'yaml', content: 'image: public\nenvironment:\n  TOKEN: "secret" # visible\ncustom:\n  KEY: hidden\n' })
    let enabled = true
    let patches
    const module = { exports: {} }
    const dependencies = {
      vscode: {
        Range: vscode.Range,
        window: { createTextEditorDecorationType: () => ({}) }
      },
      './settings': { autocloakingEnabled: uri => { assert.strictEqual(uri, document.uri); return enabled }, cloakColor: () => '#000000', cloakIcon: () => '█' },
      './yaml-values': values
    }
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../../lib/yaml-cloaking.js'), 'utf8'), { module, require: name => dependencies[name] })
    const editor = { document, setDecorations: (type, next) => { patches = next } }
    module.exports.decorate(editor)
    assert.strictEqual(patches.length, 1)
    assert.strictEqual(document.getText(patches[0].range), 'secret')
    assert.strictEqual(patches[0].renderOptions.after.contentText, '██████')
    enabled = false
    module.exports.decorate(editor)
    assert.strictEqual(patches.length, 0)
    enabled = true
    module.exports.decorate(editor)
    assert.strictEqual(patches.length, 1)
    assert.strictEqual(document.getText(patches[0].range), 'secret')
    editor.document = { languageId: 'plaintext' }
    module.exports.decorate(editor)
    assert.strictEqual(patches.length, 0)
  })
})
