const vscode = require('vscode')
const providers = require('./providers')

const run = function (context) {
  const javascriptHover = vscode.languages.registerHoverProvider({ scheme: 'file', language: 'javascript' }, providers.javascriptHover)
  const typescriptHover = vscode.languages.registerHoverProvider({ scheme: 'file', language: 'typescript' }, providers.javascriptHover)
  const javascriptreactHover = vscode.languages.registerHoverProvider({ scheme: 'file', language: 'javascriptreact' }, providers.javascriptHover)
  const typescriptreactHover = vscode.languages.registerHoverProvider({ scheme: 'file', language: 'typescriptreact' }, providers.javascriptHover)
  const vueHover = vscode.languages.registerHoverProvider({ scheme: 'file', language: 'vue' }, providers.javascriptHover)
  const rubyHover = vscode.languages.registerHoverProvider({ scheme: 'file', language: 'ruby' }, providers.rubyHover)
  const pythonHover = vscode.languages.registerHoverProvider({ scheme: 'file', language: 'python' }, providers.pythonHover)
  const phpHover = vscode.languages.registerHoverProvider({ scheme: 'file', language: 'php' }, providers.phpHover)
  const goHover = vscode.languages.registerHoverProvider({ scheme: 'file', language: 'go' }, providers.goHover)
  const javaHover = vscode.languages.registerHoverProvider({ scheme: 'file', language: 'java' }, providers.javaHover)
  const dotnetHover = vscode.languages.registerHoverProvider(
    ['csharp', 'fsharp', 'vb'].map(language => ({ scheme: 'file', language })),
    providers.csharpHover
  )
  const rustHover = vscode.languages.registerHoverProvider({ scheme: 'file', language: 'rust' }, providers.rustHover)
  const dartHover = vscode.languages.registerHoverProvider({ scheme: 'file', language: 'dart' }, providers.dartHover)
  const kotlinHover = vscode.languages.registerHoverProvider({ scheme: 'file', language: 'kotlin' }, providers.kotlinHover)
  const elixirHover = vscode.languages.registerHoverProvider({ scheme: 'file', language: 'elixir' }, providers.elixirHover)

  context.subscriptions.push(javascriptHover)
  context.subscriptions.push(typescriptHover)
  context.subscriptions.push(javascriptreactHover)
  context.subscriptions.push(typescriptreactHover)
  context.subscriptions.push(vueHover)
  context.subscriptions.push(rubyHover)
  context.subscriptions.push(pythonHover)
  context.subscriptions.push(phpHover)
  context.subscriptions.push(goHover)
  context.subscriptions.push(javaHover)
  context.subscriptions.push(dotnetHover)
  context.subscriptions.push(rustHover)
  context.subscriptions.push(dartHover)
  context.subscriptions.push(kotlinHover)
  context.subscriptions.push(elixirHover)
  return true
}

module.exports.run = run
