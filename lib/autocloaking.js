const vscode = require('vscode')
const decorations = require('./decorations')
const settings = require('./settings')

const run = async function (context) {
  if (settings.autocloakingEnabled()) {
    await settings.mask()
  } else {
    await settings.unmask()
  }

  decorateMasking(context)
  buildToggle(context)

  const toggleAutocloaking = vscode.commands.registerCommand('dotenv.toggleAutocloaking', async function () { await dotenvToggleAutocloaking() })

  context.subscriptions.push(toggleAutocloaking)
}

function decorateMasking (context) {
  decorations.decorate(context, vscode.window.activeTextEditor)

  // Update when a file opens
  vscode.window.onDidChangeActiveTextEditor(function (editor) {
    decorations.decorate(context, editor)
  })
  vscode.workspace.onDidOpenTextDocument(function (event) {
    const openEditor = vscode.window.visibleTextEditors.filter(function (editor) {
      try {
        return editor.document.uri === event.uri
      } catch (e) {
        console.log(e)
        return false
      }
    })[0]
    decorations.decorate(context, openEditor)
  })

  // Update when moving around the editor
  // vscode.window.onDidChangeTextEditorSelection(function () {
  //   decorations.decorate(context, vscode.window.activeTextEditor)
  // })

  // Update if the config was changed
  vscode.workspace.onDidChangeConfiguration(function (event) {
    if (event.affectsConfiguration('dotenv.enableAutocloaking')) {
      decorations.decorate(context, vscode.window.activeTextEditor)
    }
  })
}

const toggleLink = {
  provideCodeLenses: function (document, token) {
    const range = new vscode.Range(0, 1, 10, 10) // place at top of file
    const lens = new vscode.CodeLens(range, {
      command: 'dotenv.toggleAutocloaking',
      title: 'Toggle auto-cloaking'
    })
    return [
      lens
    ]
  }
}

function buildToggle (context) {
  const codeLens = vscode.languages.registerCodeLensProvider({ pattern: '**/.env*' }, toggleLink)

  context.subscriptions.push(codeLens)

  return true
}

async function dotenvToggleAutocloaking () {
  if (settings.autocloakingEnabled()) {
    await settings.unmask()
    await settings.autocloakingOff()
  } else {
    await settings.mask()
    await settings.autocloakingOn()
  }

  return true
}

module.exports.run = run
