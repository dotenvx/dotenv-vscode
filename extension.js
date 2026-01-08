const vscode = require('vscode')
const autocloaking = require('./lib/autocloaking')
const autocompletion = require('./lib/autocompletion')
const commands = require('./lib/commands')
const peeking = require('./lib/peeking')
const fileAssociations = require('./lib/fileAssociations')
const helpers = require('./lib/helpers')

async function activate (context) {
  console.log('Dotenv is active')

  console.log('Set file associations')
  fileAssociations.run()

  console.log('Load autocompletion')
  await autocompletion.run(context)

  console.log('Load commands')
  commands.run(context)

  console.log('Load secret peeking')
  peeking.run(context)

  console.log('Load autocloaking')
  await autocloaking.run(context)

  // Watch for .env file changes to invalidate cache
  console.log('Setup .env file watcher')
  const envFileWatcher = vscode.workspace.createFileSystemWatcher('**/.env*')

  envFileWatcher.onDidCreate(() => {
    console.log('.env file created, clearing cache')
    helpers.clearEnvFileCache()
  })

  envFileWatcher.onDidDelete(() => {
    console.log('.env file deleted, clearing cache')
    helpers.clearEnvFileCache()
  })

  envFileWatcher.onDidChange(() => {
    console.log('.env file changed, clearing cache')
    helpers.clearEnvFileCache()
  })

  context.subscriptions.push(envFileWatcher)
}

function deactivate () {
  console.log('Dotenv is no longer active')
}

module.exports = {
  activate,
  deactivate
}
