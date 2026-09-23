const vscode = require('vscode')
const decorations = require('./decorations')
const settings = require('./settings')
const secureEditor = require('./secure-editor')
const yaml = require('./yaml-cloaking')

const run = async function (context) {
  settings.initialize(context)
  context.subscriptions.push(decorations.dispose)
  const refresh = decorateMasking(context)
  buildToggle(context)

  const toggleAutocloaking = vscode.commands.registerCommand('dotenv.toggleAutocloaking', async () => {
    if (secureEditor.toggleActive()) return
    const updating = dotenvToggleAutocloaking()
    refresh()
    await updating
  })
  context.subscriptions.push(toggleAutocloaking)

  await settings.removeLegacyMask()
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
        const resetting = settings.resetAutocloaking()
        decorateVisibleEditors()
        await resetting
      } else if (event.affectsConfiguration('dotenv.cloakColor') || event.affectsConfiguration('dotenv.cloakIcon') || event.affectsConfiguration('dotenv.yamlSections')) {
        decorateVisibleEditors()
      }
    })
  )

  decorateVisibleEditors()
  return decorateVisibleEditors
}

const toggleLink = {
  provideCodeLenses: function (document, token) {
    if (yaml.supported(document) && !yaml.ranges(document).length) return []
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
  const codeLens = vscode.languages.registerCodeLensProvider([{ language: 'dotenv' }, { language: 'yaml' }], toggleLink)

  context.subscriptions.push(codeLens)

  return true
}

async function dotenvToggleAutocloaking () {
  const uri = vscode.window.activeTextEditor?.document.uri
  if (settings.autocloakingEnabled(uri)) {
    await settings.autocloakingOff(uri)
  } else {
    await settings.autocloakingOn(uri)
  }

  return true
}

module.exports.run = run
