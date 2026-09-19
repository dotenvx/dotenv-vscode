const { describe, it } = require('mocha')
const assert = require('assert')
const vscode = require('vscode')
const providers = require('../../../lib/env-literals')
const helpers = require('../../../lib/helpers')
const settings = require('../../../lib/settings')

const document = text => ({ lineAt: () => ({ text }) })

for (const [language, provider, calls, unrelated] of [
  ['clojure', providers.clojure, ['System/getenv', 'java.lang.System/getenv'], ['(OtherSystem/getenv ', '(other/System/getenv ', '(System/getProperty ', '(System/getenv key', '(System/getenv (str ', '(System/getenv "HELLO" ']],
  ['swift', providers.swift, ['ProcessInfo.processInfo.environment', 'Foundation.ProcessInfo.processInfo.environment', 'getenv', 'Darwin.getenv', 'Glibc.getenv'], ['OtherProcessInfo.processInfo.environment[', 'other.ProcessInfo.processInfo.environment[', 'ProcessInfo.processInfo.environment[variable', 'ProcessInfo.processInfo.environment["KEY\\(', 'object.getenv(', 'other_getenv(', 'getenv("HELLO", ']],
  ['perl', providers.perl, ['$ENV'], ['$OTHER{', '$ENVIRONMENT{', '$ENV{$key', '$ENV{"$key', '$ENV{key . ', '$ENV{"HELLO"} . ']],
  ['erlang', providers.erlang, ['os:getenv', 'os : getenv'], ['other_os:getenv(', 'other:getenv(', 'os:getenvs(', 'os:getenv("HELLO", ', 'os:getenv(Name', "os:getenv('"]],
  ['c', providers.c, ['getenv', 'std::getenv', '::getenv'], ['my_getenv(', 'object.getenv(', 'object->getenv(', 'other::getenv(']],
  ['julia', providers.julia, ['ENV', 'Base.ENV', 'get', 'Base.get'], ['OTHER_ENV[', 'other.ENV[', 'get(other, ', 'get(ENV, "HELLO", ']]
]) {
  const expression = (api, key) => language === 'clojure' ? `(${api} ${key})` : language === 'perl' ? `${api}{${key}}` : (api.endsWith('ENV') || api.endsWith('.environment')) ? `${api}[${key}]` : language === 'julia' ? `${api}(ENV, ${key}, "fallback")` : `${api}(${key})`
  describe(`${language} environment literals`, () => {
    for (const api of calls) {
      for (const partial of ['|', '"|"', '"HE|LLO"']) {
        it(`completes ${api} ${partial} without duplicate quotes`, () => {
          const marked = expression(api, partial)
          const offset = marked.indexOf('|')
          const text = marked.replace('|', '')
          const items = provider.completion.provideCompletionItems(document(text), new vscode.Position(0, offset))
          const item = items.find(item => item.label.label === 'HELLO')
          assert.strictEqual(text.slice(0, item.range.start.character) + item.insertText + text.slice(item.range.end.character), expression(api, language === 'perl' && partial === '|' ? 'HELLO' : '"HELLO"'))
        })
      }
      it(`hovers the correct ${api} call and key`, () => {
        const text = `HELLO + ${expression(api, '"UNKNOWN"')} + ${expression(api, '"HELLO"')}`
        const result = provider.hover.provideHover(document(text), new vscode.Position(0, text.lastIndexOf('HELLO')))
        assert.strictEqual(result.contents[0], 'World')
        assert.strictEqual(result.range.start.character, text.lastIndexOf('HELLO'))
        assert.strictEqual(provider.hover.provideHover(document(text), new vscode.Position(0, 1)), undefined)
      })
    }
    for (const text of unrelated) {
      it(`ignores unrelated context ${text}`, () => {
        assert.strictEqual(provider.completion.provideCompletionItems(document(text), new vscode.Position(0, text.length)), undefined)
      })
    }
    it('handles masking, empty values, missing keys and missing files', () => {
      const originalParse = helpers.envValues
      const originalPeeking = settings.secretpeekingEnabled
      try {
        settings.secretpeekingEnabled = () => false
        helpers.envValues = () => new Map(Object.entries({ lower_key: 'World', EMPTY: '' }).map(([key, value]) => [key, [{ value, source: '.env' }]]))
        for (const [key, value] of [['lower_key', '███ld'], ['EMPTY', '(empty)'], ['UNKNOWN', settings.missingText()]]) {
          const text = expression(calls[0], `"${key}"`)
          assert.strictEqual(provider.hover.provideHover(document(text), new vscode.Position(0, text.indexOf(key))).contents[0], value)
        }
        helpers.envValues = () => new Map()
        const text = expression(calls[0], '"HELLO"')
        assert.strictEqual(provider.hover.provideHover(document(text), new vscode.Position(0, text.indexOf('HELLO'))).contents[0], settings.missingText())
      } finally {
        helpers.envValues = originalParse
        settings.secretpeekingEnabled = originalPeeking
      }
    })
  })
}

describe('registered environment literal providers', () => {
  for (const [language, extension, expression] of [['clojure', 'clj', '(System/getenv "HELLO")'], ['swift', 'swift', 'ProcessInfo.processInfo.environment["HELLO"]'], ['perl', 'pl', '$ENV{"HELLO"}'], ['erlang', 'erl', 'os:getenv("HELLO")'], ['c', 'c', 'getenv("HELLO")'], ['cpp', 'cpp', 'std::getenv("HELLO")'], ['julia', 'jl', 'ENV["HELLO"]']]) {
    it(`provides completion and hover through VS Code for ${language}`, async () => {
      await vscode.extensions.getExtension('dotenv.dotenv-vscode').activate()
      const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, `env-literal-test.${extension}`)
      await vscode.workspace.fs.writeFile(uri, Buffer.from(expression))
      const doc = await vscode.workspace.openTextDocument(uri)
      await vscode.languages.setTextDocumentLanguage(doc, language)
      const position = new vscode.Position(0, expression.indexOf('HELLO') + 2)
      const hover = await vscode.commands.executeCommand('vscode.executeHoverProvider', uri, position)
      assert(hover.some(item => item.contents.some(content => (content.value || content) === 'World')))
      const completions = await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', uri, position)
      assert(completions.items.some(item => (item.label.label || item.label) === 'HELLO'))
    })
  }
})

describe('Erlang default argument', () => {
  it('completes only the key and preserves the default', () => {
    const text = 'os:getenv("HE", "fallback")'
    const items = providers.erlang.completion.provideCompletionItems(document(text), new vscode.Position(0, text.indexOf('HE') + 2))
    const item = items.find(item => item.label.label === 'HELLO')
    assert.strictEqual(text.slice(0, item.range.start.character) + item.insertText + text.slice(item.range.end.character), 'os:getenv("HELLO", "fallback")')
  })

  it('hovers the key without treating the default as a key', () => {
    const text = 'os:getenv("HELLO", "HELLO")'
    assert.strictEqual(providers.erlang.hover.provideHover(document(text), new vscode.Position(0, text.indexOf('HELLO'))).contents[0], 'World')
    assert.strictEqual(providers.erlang.hover.provideHover(document(text), new vscode.Position(0, text.lastIndexOf('HELLO'))), undefined)
  })
})

describe('Perl literal forms', () => {
  for (const [input, expected] of [
    ["$ENV{'|'}", "$ENV{'HELLO'}"],
    ["$ENV{ 'HE|LLO' }", "$ENV{ 'HELLO' }"],
    ['$ENV{HE|LLO}', '$ENV{HELLO}'],
    ['$ENV{  |}', '$ENV{  HELLO}']
  ]) {
    it(`preserves the key syntax in ${input}`, () => {
      const offset = input.indexOf('|')
      const text = input.replace('|', '')
      const items = providers.perl.completion.provideCompletionItems(document(text), new vscode.Position(0, offset))
      const item = items.find(item => item.label.label === 'HELLO')
      assert.strictEqual(text.slice(0, item.range.start.character) + item.insertText + text.slice(item.range.end.character), expected)
    })
  }

  for (const text of ["$ENV{'HELLO'}", '$ENV{HELLO}', '$ENV{ HELLO }']) {
    it(`hovers ${text}`, () => {
      const result = providers.perl.hover.provideHover(document(text), new vscode.Position(0, text.indexOf('HELLO')))
      assert.strictEqual(result.contents[0], 'World')
      assert.strictEqual(result.range.start.character, text.indexOf('HELLO'))
    })
  }

  for (const text of ['$ENV{$HELLO}', '$ENV{"$HELLO"}', '$ENV{HELLO . "OTHER"}', '$OTHER{HELLO}']) {
    it(`ignores nonliteral or unrelated hover ${text}`, () => {
      assert.strictEqual(providers.perl.hover.provideHover(document(text), new vscode.Position(0, text.indexOf('HELLO'))), undefined)
    })
  }
})

describe('Swift environment subscripts', () => {
  it('preserves whitespace and a nil-coalescing fallback', () => {
    const text = 'ProcessInfo . processInfo . environment [ "HE" ] ?? "fallback"'
    const position = new vscode.Position(0, text.indexOf('HE') + 2)
    const item = providers.swift.completion.provideCompletionItems(document(text), position).find(item => item.label.label === 'HELLO')
    assert.strictEqual(text.slice(0, item.range.start.character) + item.insertText + text.slice(item.range.end.character), text.replace('"HE"', '"HELLO"'))
  })

  it('does not hover the fallback or a computed key', () => {
    const text = 'ProcessInfo.processInfo.environment["MISSING"] ?? "HELLO"'
    assert.strictEqual(providers.swift.hover.provideHover(document(text), new vscode.Position(0, text.indexOf('HELLO'))), undefined)
    const computed = 'ProcessInfo.processInfo.environment["HELLO" + suffix]'
    assert.strictEqual(providers.swift.hover.provideHover(document(computed), new vscode.Position(0, computed.indexOf('HELLO'))), undefined)
  })
})

describe('Clojure environment calls', () => {
  it('preserves commas, whitespace, and surrounding forms', () => {
    const text = '(or (System/getenv,  "HE" ) "fallback")'
    const items = providers.clojure.completion.provideCompletionItems(document(text), new vscode.Position(0, text.indexOf('HE') + 2))
    const item = items.find(item => item.label.label === 'HELLO')
    assert.strictEqual(text.slice(0, item.range.start.character) + item.insertText + text.slice(item.range.end.character), text.replace('"HE"', '"HELLO"'))
  })

  it('does not hover computed arguments, unrelated functions, or fallbacks', () => {
    for (const text of ['(System/getenv (str "HELLO" suffix))', '(System/getProperty "HELLO")', '(or (System/getenv "MISSING") "HELLO")']) {
      assert.strictEqual(providers.clojure.hover.provideHover(document(text), new vscode.Position(0, text.indexOf('HELLO'))), undefined)
    }
  })
})
