const vscode = require('vscode')
const decorations = require('./decorations')
const settings = require('./settings')

const run = async function (context) {
  // Apply decorations and subscribe before waiting for configuration writes.
  decorateMasking(context)
  buildToggle(context)

  const toggleAutocloaking = vscode.commands.registerCommand('dotenv.toggleAutocloaking', dotenvToggleAutocloaking)
  context.subscriptions.push(toggleAutocloaking)

  await syncMask()
}

async function syncMask () {
  if (settings.autocloakingEnabled()) {
    await settings.mask()
  } else {
    await settings.unmask()
  }
}

function decorateMasking (context) {
  const decorateVisibleEditors = () => {
    for (const editor of vscode.window.visibleTextEditors) {
      decorations.decorate(context, editor)
    }
  }
  const decorateDocument = document => {
    for (const editor of vscode.window.visibleTextEditors) {
      if (editor.document.uri.toString() === document.uri.toString()) {
        decorations.decorate(context, editor)
      }
    }
  }

  context.subscriptions.push(
    vscode.window.onDidChangeVisibleTextEditors(decorateVisibleEditors),
    vscode.window.onDidChangeActiveTextEditor(editor => decorations.decorate(context, editor)),
    // Also fires when an open document's language mode changes.
    vscode.workspace.onDidOpenTextDocument(decorateDocument),
    vscode.workspace.onDidChangeTextDocument(event => decorateDocument(event.document)),
    vscode.workspace.onDidChangeConfiguration(async event => {
      if (event.affectsConfiguration('dotenv.enableAutocloaking')) {
        decorateVisibleEditors()
        await syncMask()
      } else if (event.affectsConfiguration('dotenv.cloakColor') || event.affectsConfiguration('dotenv.cloakIcon')) {
        decorateVisibleEditors()
      }
    })
  )

  decorateVisibleEditors()
}

const toggleLink = {
  provideCodeLenses: function (document, token) {
    const range = new vscode.Range(0, 0, 0, 0) // place at top of file
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
  const codeLens = vscode.languages.registerCodeLensProvider({ language: 'dotenv' }, toggleLink)

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
