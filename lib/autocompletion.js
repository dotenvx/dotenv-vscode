const vscode = require('vscode')
const providers = require('./providers')
const envLiterals = require('./env-literals')
const reveal = require('./completion-reveal')

function register (selector, provider, ...triggers) {
  return vscode.languages.registerCompletionItemProvider(selector, {
    ...provider,
    provideCompletionItems (document, position, ...args) {
      const refreshed = reveal.refresh(document, position, provider)
      if (refreshed) return refreshed
      const items = provider.provideCompletionItems(document, position, ...args)
      reveal.bind(items, provider)
      return items
    }
  }, ...triggers)
}

const run = function (context) {
  const javascript = register({ scheme: 'file', language: 'javascript' }, providers.javascriptCompletion, '.')
  const typescript = register({ scheme: 'file', language: 'typescript' }, providers.javascriptCompletion, '.')
  const javascriptreact = register({ scheme: 'file', language: 'javascriptreact' }, providers.javascriptCompletion, '.')
  const typescriptreact = register({ scheme: 'file', language: 'typescriptreact' }, providers.javascriptCompletion, '.')
  const vue = register({ scheme: 'file', language: 'vue' }, providers.javascriptCompletion, '.')
  const ruby = register({ scheme: 'file', language: 'ruby' }, providers.rubyCompletion, '[')
  const python = register({ scheme: 'file', language: 'python' }, providers.pythonCompletion, '(')
  const pythonArray = register({ scheme: 'file', language: 'python' }, providers.pythonArrayCompletion, '[')
  const php = register({ scheme: 'file', language: 'php' }, providers.phpCompletion, '[')
  const phpGetEnv = register({ scheme: 'file', language: 'php' }, providers.phpGetEnvCompletion, '(')
  const go = register({ scheme: 'file', language: 'go' }, providers.goCompletion, '(')
  const java = register({ scheme: 'file', language: 'java' }, providers.javaCompletion, '(')
  const dotnet = register(
    ['csharp', 'fsharp', 'vb'].map(language => ({ scheme: 'file', language })),
    providers.csharpCompletion, '(', '"'
  )
  const rust = register({ scheme: 'file', language: 'rust' }, providers.rustCompletion, '(')
  const dart = register({ scheme: 'file', language: 'dart' }, providers.dartCompletion, '(')
  const kotlin = register({ scheme: 'file', language: 'kotlin' }, providers.kotlinCompletion, '(')
  const elixir = register({ scheme: 'file', language: 'elixir' }, providers.elixirCompletion, '(')

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
  context.subscriptions.push(
    register(
      ['c', 'cpp'].map(language => ({ scheme: 'file', language })),
      envLiterals.c.completion, '(', '"'
    ),
    register(
      { scheme: 'file', language: 'julia' }, envLiterals.julia.completion, '[', ',', '"'
    ),
    register(
      { scheme: 'file', language: 'erlang' }, envLiterals.erlang.completion, '(', '"'
    ),
    register(
      { scheme: 'file', language: 'perl' }, envLiterals.perl.completion, '{', '"', "'"
    ),
    register(
      { scheme: 'file', language: 'swift' }, envLiterals.swift.completion, '[', '(', '"'
    ),
    register(
      { scheme: 'file', language: 'clojure' }, envLiterals.clojure.completion, ' ', ',', '"'
    )
  )
  return true
}

module.exports.run = run
