const vscode = require('vscode')
const providers = require('./providers')

const run = function (context) {
  const javascript = vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'javascript' }, providers.javascriptCompletion, '.')
  const typescript = vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'typescript' }, providers.javascriptCompletion, '.')
  const javascriptreact = vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'javascriptreact' }, providers.javascriptCompletion, '.')
  const typescriptreact = vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'typescriptreact' }, providers.javascriptCompletion, '.')
  const vue = vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'vue' }, providers.javascriptCompletion, '.')
  const ruby = vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'ruby' }, providers.rubyCompletion, '[')
  const python = vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'python' }, providers.pythonCompletion, '(')
  const pythonArray = vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'python' }, providers.pythonArrayCompletion, '[')
  const php = vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'php' }, providers.phpCompletion, '[')
  const phpGetEnv = vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'php' }, providers.phpGetEnvCompletion, '(')
  const go = vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'go' }, providers.goCompletion, '(')
  const java = vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'java' }, providers.javaCompletion, '(')
  const dotnet = vscode.languages.registerCompletionItemProvider(
    ['csharp', 'fsharp', 'vb'].map(language => ({ scheme: 'file', language })),
    providers.csharpCompletion, '(', '"'
  )
  const rust = vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'rust' }, providers.rustCompletion, '(')
  const dart = vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'dart' }, providers.dartCompletion, '(')
  const kotlin = vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'kotlin' }, providers.kotlinCompletion, '(')
  const elixir = vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'elixir' }, providers.elixirCompletion, '(')

  context.subscriptions.push(javascript)
  context.subscriptions.push(typescript)
  context.subscriptions.push(javascriptreact)
  context.subscriptions.push(typescriptreact)
  context.subscriptions.push(vue)
  context.subscriptions.push(ruby)
  context.subscriptions.push(python)
  context.subscriptions.push(pythonArray)
  context.subscriptions.push(php)
  context.subscriptions.push(phpGetEnv)
  context.subscriptions.push(go)
  context.subscriptions.push(java)
  context.subscriptions.push(dotnet)
  context.subscriptions.push(rust)
  context.subscriptions.push(dart)
  context.subscriptions.push(kotlin)
  context.subscriptions.push(elixir)
  return true
}

module.exports.run = run
