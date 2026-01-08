const assert = require('assert')
const path = require('path')
const vscode = require('vscode')

const settings = require('../../../lib/settings')
const providers = require('../../../lib/providers')

describe('providers', function () {
  describe('#javascriptCompletion', function () {
    it('returns undefined at line 0 and wrong position for process', async function () {
      const javascriptFile = path.join(__dirname, '..', 'examples', 'javascript.js')
      const document = await vscode.workspace.openTextDocument(javascriptFile)
      const position = new vscode.Position(1, 22)

      const result = providers.javascriptCompletion.provideCompletionItems(document, position)

      assert.equal(result, undefined)
    })

    it('returns value at line 1 and correct position for process', async function () {
      const javascriptFile = path.join(__dirname, '..', 'examples', 'javascript.js')
      const document = await vscode.workspace.openTextDocument(javascriptFile)
      const position = new vscode.Position(1, 24)

      const result = providers.javascriptCompletion.provideCompletionItems(document, position)

      assert.equal(result[0].insertText, '.HELLO')
      assert.equal(result[0].label.label, 'HELLO')
      assert.equal(result[0].label.detail, ' World')
    })

    it('returns undefined at line 0 and wrong position for import.meta', async function () {
      const javascriptFile = path.join(__dirname, '..', 'examples', 'javascript.js')
      const document = await vscode.workspace.openTextDocument(javascriptFile)
      const position = new vscode.Position(3, 27)

      const result = providers.javascriptCompletion.provideCompletionItems(document, position)

      assert.equal(result, undefined)
    })

    it('returns value at line 1 and correct position for import.meta', async function () {
      const javascriptFile = path.join(__dirname, '..', 'examples', 'javascript.js')
      const document = await vscode.workspace.openTextDocument(javascriptFile)
      const position = new vscode.Position(3, 28)

      const result = providers.javascriptCompletion.provideCompletionItems(document, position)

      assert.equal(result[0].insertText, '.HELLO')
      assert.equal(result[0].label.label, 'HELLO')
      assert.equal(result[0].label.detail, ' World')
    })
  })

  describe('#rubyCompletion', function () {
    it('returns undefined at line 0 and wrong position', async function () {
      const rubyFile = path.join(__dirname, '..', 'examples', 'ruby.rb')
      const document = await vscode.workspace.openTextDocument(rubyFile)
      const position = new vscode.Position(1, 7)

      const result = providers.rubyCompletion.provideCompletionItems(document, position)

      assert.equal(result, undefined)
    })

    it('returns value at line 1 and correct position', async function () {
      const rubyFile = path.join(__dirname, '..', 'examples', 'ruby.rb')
      const document = await vscode.workspace.openTextDocument(rubyFile)
      const position = new vscode.Position(1, 9)

      const result = providers.rubyCompletion.provideCompletionItems(document, position)

      assert.equal(result[0].insertText, '["HELLO"')
      assert.equal(result[0].label.label, 'HELLO')
      assert.equal(result[0].label.detail, ' World')
    })
  })

  describe('#pythonCompletion', function () {
    it('returns undefined at line 0 and wrong position for os.environ.get format', async function () {
      const pythonFile = path.join(__dirname, '..', 'examples', 'python.py')
      const document = await vscode.workspace.openTextDocument(pythonFile)
      const position = new vscode.Position(3, 19)

      const result = providers.pythonCompletion.provideCompletionItems(document, position)

      assert.equal(result, undefined)
    })

    it('returns value at line 1 and correct position for os.environ.get format', async function () {
      const pythonFile = path.join(__dirname, '..', 'examples', 'python.py')
      const document = await vscode.workspace.openTextDocument(pythonFile)
      const position = new vscode.Position(3, 21)

      const result = providers.pythonCompletion.provideCompletionItems(document, position)

      assert.equal(result[0].insertText, '("HELLO"')
      assert.equal(result[0].label.label, 'HELLO')
      assert.equal(result[0].label.detail, ' World')
    })

    it('returns undefined at line 0 and wrong position for os.getenv format', async function () {
      const pythonFile = path.join(__dirname, '..', 'examples', 'python.py')
      const document = await vscode.workspace.openTextDocument(pythonFile)
      const position = new vscode.Position(4, 13)

      const result = providers.pythonCompletion.provideCompletionItems(document, position)

      assert.equal(result, undefined)
    })

    it('returns value at line 1 and correct position for os.getenv format', async function () {
      const pythonFile = path.join(__dirname, '..', 'examples', 'python.py')
      const document = await vscode.workspace.openTextDocument(pythonFile)
      const position = new vscode.Position(4, 16)

      const result = providers.pythonCompletion.provideCompletionItems(document, position)

      assert.equal(result[0].insertText, '("HELLO"')
      assert.equal(result[0].label.label, 'HELLO')
      assert.equal(result[0].label.detail, ' World')
    })

    it('returns undefined at line 0 and wrong position for os.environ[] format', async function () {
      const pythonFile = path.join(__dirname, '..', 'examples', 'python.py')
      const document = await vscode.workspace.openTextDocument(pythonFile)
      const position = new vscode.Position(5, 15)

      const result = providers.pythonArrayCompletion.provideCompletionItems(document, position)

      assert.equal(result, undefined)
    })

    it('returns value at line 1 and correct position for os.environ[] format', async function () {
      const pythonFile = path.join(__dirname, '..', 'examples', 'python.py')
      const document = await vscode.workspace.openTextDocument(pythonFile)
      const position = new vscode.Position(5, 17)

      const result = providers.pythonArrayCompletion.provideCompletionItems(document, position)

      assert.equal(result[0].insertText, '["HELLO"')
      assert.equal(result[0].label.label, 'HELLO')
      assert.equal(result[0].label.detail, ' World')
    })
  })

  describe('#phpCompletion', function () {
    it('returns undefined at line 0 and wrong position for $_ENV[] format', async function () {
      const phpFile = path.join(__dirname, '..', 'examples', 'php.php')
      const document = await vscode.workspace.openTextDocument(phpFile)
      const position = new vscode.Position(3, 15)

      const result = providers.phpCompletion.provideCompletionItems(document, position)

      assert.equal(result, undefined)
    })

    it('returns value at line 1 and correct position for $_ENV[] format', async function () {
      const phpFile = path.join(__dirname, '..', 'examples', 'php.php')
      const document = await vscode.workspace.openTextDocument(phpFile)
      const position = new vscode.Position(3, 17)

      const result = providers.phpCompletion.provideCompletionItems(document, position)

      assert.equal(result[0].insertText, '["HELLO"')
      assert.equal(result[0].label.label, 'HELLO')
      assert.equal(result[0].label.detail, ' World')
    })

    it('returns undefined at line 0 and wrong position for $_SERVER[] format', async function () {
      const phpFile = path.join(__dirname, '..', 'examples', 'php.php')
      const document = await vscode.workspace.openTextDocument(phpFile)
      const position = new vscode.Position(4, 18)

      const result = providers.phpCompletion.provideCompletionItems(document, position)

      assert.equal(result, undefined)
    })

    it('returns value at line 1 and correct position for $_SERVER[] format', async function () {
      const phpFile = path.join(__dirname, '..', 'examples', 'php.php')
      const document = await vscode.workspace.openTextDocument(phpFile)
      const position = new vscode.Position(4, 20)

      const result = providers.phpCompletion.provideCompletionItems(document, position)

      assert.equal(result[0].insertText, '["HELLO"')
      assert.equal(result[0].label.label, 'HELLO')
      assert.equal(result[0].label.detail, ' World')
    })

    it('returns undefined at line 0 and wrong position for getenv() format', async function () {
      const phpFile = path.join(__dirname, '..', 'examples', 'php.php')
      const document = await vscode.workspace.openTextDocument(phpFile)
      const position = new vscode.Position(5, 16)

      const result = providers.phpGetEnvCompletion.provideCompletionItems(document, position)

      assert.equal(result, undefined)
    })

    it('returns value at line 1 and correct position for getenv() format', async function () {
      const phpFile = path.join(__dirname, '..', 'examples', 'php.php')
      const document = await vscode.workspace.openTextDocument(phpFile)
      const position = new vscode.Position(5, 18)

      const result = providers.phpGetEnvCompletion.provideCompletionItems(document, position)

      assert.equal(result[0].insertText, '("HELLO"')
      assert.equal(result[0].label.label, 'HELLO')
      assert.equal(result[0].label.detail, ' World')
    })
  })

  describe('#goCompletion', function () {
    it('returns undefined at line 0 and wrong position', async function () {
      const goFile = path.join(__dirname, '..', 'examples', 'go.go')
      const document = await vscode.workspace.openTextDocument(goFile)
      const position = new vscode.Position(1, 8)

      const result = providers.goCompletion.provideCompletionItems(document, position)

      assert.equal(result, undefined)
    })

    it('returns value at line 1 and correct position', async function () {
      const goFile = path.join(__dirname, '..', 'examples', 'go.go')
      const document = await vscode.workspace.openTextDocument(goFile)
      const position = new vscode.Position(1, 10)

      const result = providers.goCompletion.provideCompletionItems(document, position)

      assert.equal(result[0].insertText, '("HELLO"')
      assert.equal(result[0].label.label, 'HELLO')
      assert.equal(result[0].label.detail, ' World')
    })
  })

  describe('#javaCompletion', function () {
    it('returns undefined at line 0 and wrong position', async function () {
      const javaFile = path.join(__dirname, '..', 'examples', 'java.java')
      const document = await vscode.workspace.openTextDocument(javaFile)
      const position = new vscode.Position(1, 8)

      const result = providers.javaCompletion.provideCompletionItems(document, position)

      assert.equal(result, undefined)
    })

    it('returns value at line 1 and correct position', async function () {
      const javaFile = path.join(__dirname, '..', 'examples', 'java.java')
      const document = await vscode.workspace.openTextDocument(javaFile)
      const position = new vscode.Position(1, 11)

      const result = providers.javaCompletion.provideCompletionItems(document, position)

      assert.equal(result[0].insertText, '("HELLO"')
      assert.equal(result[0].label.label, 'HELLO')
      assert.equal(result[0].label.detail, ' World')
    })
  })

  describe('#csharpCompletion', function () {
    it('returns undefined at line 0 and wrong position', async function () {
      const csharpFile = path.join(__dirname, '..', 'examples', 'csharp.cs')
      const document = await vscode.workspace.openTextDocument(csharpFile)
      const position = new vscode.Position(1, 32)

      const result = providers.csharpCompletion.provideCompletionItems(document, position)

      assert.equal(result, undefined)
    })

    it('returns value at line 1 and correct position', async function () {
      const csharpFile = path.join(__dirname, '..', 'examples', 'csharp.cs')
      const document = await vscode.workspace.openTextDocument(csharpFile)
      const position = new vscode.Position(1, 35)

      const result = providers.csharpCompletion.provideCompletionItems(document, position)

      assert.equal(result[0].insertText, '("HELLO"')
      assert.equal(result[0].label.label, 'HELLO')
      assert.equal(result[0].label.detail, ' World')
    })
  })

  describe('#rustCompletion', function () {
    it('returns undefined at line 0 and wrong position with var format', async function () {
      const rustFile = path.join(__dirname, '..', 'examples', 'rust.rs')
      const document = await vscode.workspace.openTextDocument(rustFile)
      const position = new vscode.Position(1, 12)

      const result = providers.rustCompletion.provideCompletionItems(document, position)

      assert.equal(result, undefined)
    })

    it('returns value at line 1 and correct position with var format', async function () {
      const rustFile = path.join(__dirname, '..', 'examples', 'rust.rs')
      const document = await vscode.workspace.openTextDocument(rustFile)
      const position = new vscode.Position(1, 14)

      const result = providers.rustCompletion.provideCompletionItems(document, position)

      assert.equal(result[0].insertText, '("HELLO"')
      assert.equal(result[0].label.label, 'HELLO')
      assert.equal(result[0].label.detail, ' World')
    })

    it('returns undefined at line 0 and wrong position with var_os format', async function () {
      const rustFile = path.join(__dirname, '..', 'examples', 'rust.rs')
      const document = await vscode.workspace.openTextDocument(rustFile)
      const position = new vscode.Position(3, 15)

      const result = providers.rustCompletion.provideCompletionItems(document, position)

      assert.equal(result, undefined)
    })

    it('returns value at line 1 and correct position with var_os format', async function () {
      const rustFile = path.join(__dirname, '..', 'examples', 'rust.rs')
      const document = await vscode.workspace.openTextDocument(rustFile)
      const position = new vscode.Position(3, 17)

      const result = providers.rustCompletion.provideCompletionItems(document, position)

      assert.equal(result[0].insertText, '("HELLO"')
      assert.equal(result[0].label.label, 'HELLO')
      assert.equal(result[0].label.detail, ' World')
    })
  })

  describe('#dartCompletion', function () {
    it('returns undefined at line 0 and wrong position', async function () {
      const dartFile = path.join(__dirname, '..', 'examples', 'dart.dart')
      const document = await vscode.workspace.openTextDocument(dartFile)
      const position = new vscode.Position(1, 21)

      const result = providers.dartCompletion.provideCompletionItems(document, position)

      assert.equal(result, undefined)
    })

    it('returns value at line 1 and correct position', async function () {
      const dartFile = path.join(__dirname, '..', 'examples', 'dart.dart')
      const document = await vscode.workspace.openTextDocument(dartFile)
      const position = new vscode.Position(1, 23)

      const result = providers.dartCompletion.provideCompletionItems(document, position)

      assert.equal(result[0].insertText, '("HELLO"')
      assert.equal(result[0].label.label, 'HELLO')
      assert.equal(result[0].label.detail, ' World')
    })
  })

  describe('#kotlinCompletion', function () {
    it('returns undefined at line 0 and wrong position', async function () {
      const kotlinFile = path.join(__dirname, '..', 'examples', 'kotlin.kt')
      const document = await vscode.workspace.openTextDocument(kotlinFile)
      const position = new vscode.Position(1, 12)

      const result = providers.kotlinCompletion.provideCompletionItems(document, position)

      assert.equal(result, undefined)
    })

    it('returns value at line 1 and correct position', async function () {
      const kotlinFile = path.join(__dirname, '..', 'examples', 'kotlin.kt')
      const document = await vscode.workspace.openTextDocument(kotlinFile)
      const position = new vscode.Position(1, 14)

      const result = providers.kotlinCompletion.provideCompletionItems(document, position)

      assert.equal(result[0].insertText, '("HELLO"')
      assert.equal(result[0].label.label, 'HELLO')
      assert.equal(result[0].label.detail, ' World')
    })
  })

  describe('#elixirCompletion', function () {
    it('returns undefined at line 0 and wrong position', async function () {
      const elixirFile = path.join(__dirname, '..', 'examples', 'elixir.exs')
      const document = await vscode.workspace.openTextDocument(elixirFile)
      const position = new vscode.Position(1, 13)

      const result = providers.elixirCompletion.provideCompletionItems(document, position)

      assert.equal(result, undefined)
    })

    it('returns value at line 1 and correct position', async function () {
      const elixirFile = path.join(__dirname, '..', 'examples', 'elixir.exs')
      const document = await vscode.workspace.openTextDocument(elixirFile)
      const position = new vscode.Position(1, 15)

      const result = providers.elixirCompletion.provideCompletionItems(document, position)

      assert.equal(result[0].insertText, '("HELLO"')
      assert.equal(result[0].label.label, 'HELLO')
      assert.equal(result[0].label.detail, ' World')
    })
  })

  describe('#javascriptHover', function () {
    it('returns undefined at 0 line for process', async function () {
      const javascriptFile = path.join(__dirname, '..', 'examples', 'javascript.js')
      const document = await vscode.workspace.openTextDocument(javascriptFile)
      const position = new vscode.Position(0, 22)

      const result = providers.javascriptHover.provideHover(document, position)

      assert.equal(result.contents[0], settings.missingText())
    })

    it('returns value at 0 line and correct position for process', async function () {
      const javascriptFile = path.join(__dirname, '..', 'examples', 'javascript.js')
      const document = await vscode.workspace.openTextDocument(javascriptFile)
      const position = new vscode.Position(0, 26)

      const result = providers.javascriptHover.provideHover(document, position)

      assert.equal(result.contents[0], 'World')
    })

    it('returns undefined at 0 line for import.meta', async function () {
      const javascriptFile = path.join(__dirname, '..', 'examples', 'javascript.js')
      const document = await vscode.workspace.openTextDocument(javascriptFile)
      const position = new vscode.Position(2, 27)

      const result = providers.javascriptHover.provideHover(document, position)

      assert.equal(result.contents[0], settings.missingText())
    })

    it('returns value at 0 line and correct position for import.meta', async function () {
      const javascriptFile = path.join(__dirname, '..', 'examples', 'javascript.js')
      const document = await vscode.workspace.openTextDocument(javascriptFile)
      const position = new vscode.Position(2, 30)

      const result = providers.javascriptHover.provideHover(document, position)

      assert.equal(result.contents[0], 'World')
    })
  })

  describe('#rubyHover', function () {
    it('returns undefined at 0 line', async function () {
      const rubyFile = path.join(__dirname, '..', 'examples', 'ruby.rb')
      const document = await vscode.workspace.openTextDocument(rubyFile)
      const position = new vscode.Position(0, 9)

      const result = providers.rubyHover.provideHover(document, position)

      assert.equal(result.contents[0], settings.missingText())
    })

    it('returns value at 0 line and correct position', async function () {
      const rubyFile = path.join(__dirname, '..', 'examples', 'ruby.rb')
      const document = await vscode.workspace.openTextDocument(rubyFile)
      const position = new vscode.Position(0, 13)

      const result = providers.rubyHover.provideHover(document, position)

      assert.equal(result.contents[0], 'World')
    })
  })

  describe('#pythonHover', function () {
    it('returns undefined at 0 line for os.environ.get format', async function () {
      const pythonFile = path.join(__dirname, '..', 'examples', 'python.py')
      const document = await vscode.workspace.openTextDocument(pythonFile)
      const position = new vscode.Position(0, 19)

      const result = providers.pythonHover.provideHover(document, position)

      assert.equal(result.contents[0], settings.missingText())
    })

    it('returns value at 0 line and correct position for os.environ.get format', async function () {
      const pythonFile = path.join(__dirname, '..', 'examples', 'python.py')
      const document = await vscode.workspace.openTextDocument(pythonFile)
      const position = new vscode.Position(0, 23)

      const result = providers.pythonHover.provideHover(document, position)

      assert.equal(result.contents[0], 'World')
    })

    it('returns undefined at 0 line for os.getenv format', async function () {
      const pythonFile = path.join(__dirname, '..', 'examples', 'python.py')
      const document = await vscode.workspace.openTextDocument(pythonFile)
      const position = new vscode.Position(1, 13)

      const result = providers.pythonHover.provideHover(document, position)

      assert.equal(result.contents[0], settings.missingText())
    })

    it('returns value at 0 line and correct position for os.getenv format', async function () {
      const pythonFile = path.join(__dirname, '..', 'examples', 'python.py')
      const document = await vscode.workspace.openTextDocument(pythonFile)
      const position = new vscode.Position(1, 17)

      const result = providers.pythonHover.provideHover(document, position)

      assert.equal(result.contents[0], 'World')
    })

    it('returns undefined at 0 line for os.environ[] format', async function () {
      const pythonFile = path.join(__dirname, '..', 'examples', 'python.py')
      const document = await vscode.workspace.openTextDocument(pythonFile)
      const position = new vscode.Position(2, 14)

      const result = providers.pythonHover.provideHover(document, position)

      assert.equal(result.contents[0], settings.missingText())
    })

    it('returns value at 0 line and correct position for os.environ[] format', async function () {
      const pythonFile = path.join(__dirname, '..', 'examples', 'python.py')
      const document = await vscode.workspace.openTextDocument(pythonFile)
      const position = new vscode.Position(2, 18)

      const result = providers.pythonHover.provideHover(document, position)

      assert.equal(result.contents[0], 'World')
    })
  })

  describe('#phpHover', function () {
    it('returns undefined at 0 line for $_ENV[] format', async function () {
      const phpFile = path.join(__dirname, '..', 'examples', 'php.php')
      const document = await vscode.workspace.openTextDocument(phpFile)
      const position = new vscode.Position(0, 15)

      const result = providers.phpHover.provideHover(document, position)

      assert.equal(result.contents[0], settings.missingText())
    })

    it('returns value at 0 line and correct position for $_ENV[] format', async function () {
      const phpFile = path.join(__dirname, '..', 'examples', 'php.php')
      const document = await vscode.workspace.openTextDocument(phpFile)
      const position = new vscode.Position(0, 20)

      const result = providers.phpHover.provideHover(document, position)

      assert.equal(result.contents[0], 'World')
    })

    it('returns undefined at 0 line for $_SERVER[] format', async function () {
      const phpFile = path.join(__dirname, '..', 'examples', 'php.php')
      const document = await vscode.workspace.openTextDocument(phpFile)
      const position = new vscode.Position(1, 17)

      const result = providers.phpHover.provideHover(document, position)

      assert.equal(result.contents[0], settings.missingText())
    })

    it('returns value at 0 line and correct position for $_SERVER[] format', async function () {
      const phpFile = path.join(__dirname, '..', 'examples', 'php.php')
      const document = await vscode.workspace.openTextDocument(phpFile)
      const position = new vscode.Position(1, 22)

      const result = providers.phpHover.provideHover(document, position)

      assert.equal(result.contents[0], 'World')
    })

    it('returns undefined at 0 line for getenv() format', async function () {
      const phpFile = path.join(__dirname, '..', 'examples', 'php.php')
      const document = await vscode.workspace.openTextDocument(phpFile)
      const position = new vscode.Position(2, 16)

      const result = providers.phpHover.provideHover(document, position)

      assert.equal(result.contents[0], settings.missingText())
    })

    it('returns value at 0 line and correct position for getenv() format', async function () {
      const phpFile = path.join(__dirname, '..', 'examples', 'php.php')
      const document = await vscode.workspace.openTextDocument(phpFile)
      const position = new vscode.Position(2, 22)

      const result = providers.phpHover.provideHover(document, position)

      assert.equal(result.contents[0], 'World')
    })
  })

  describe('#goHover', function () {
    it('returns undefined at 0 line', async function () {
      const goFile = path.join(__dirname, '..', 'examples', 'go.go')
      const document = await vscode.workspace.openTextDocument(goFile)
      const position = new vscode.Position(0, 9)

      const result = providers.goHover.provideHover(document, position)

      assert.equal(result.contents[0], settings.missingText())
    })

    it('returns value at 0 line and correct position', async function () {
      const goFile = path.join(__dirname, '..', 'examples', 'go.go')
      const document = await vscode.workspace.openTextDocument(goFile)
      const position = new vscode.Position(0, 13)

      const result = providers.goHover.provideHover(document, position)

      assert.equal(result.contents[0], 'World')
    })
  })

  describe('#javaHover', function () {
    it('returns undefined at 0 line', async function () {
      const javaFile = path.join(__dirname, '..', 'examples', 'java.java')
      const document = await vscode.workspace.openTextDocument(javaFile)
      const position = new vscode.Position(0, 9)

      const result = providers.javaHover.provideHover(document, position)

      assert.equal(result.contents[0], settings.missingText())
    })

    it('returns value at 0 line and correct position', async function () {
      const javaFile = path.join(__dirname, '..', 'examples', 'java.java')
      const document = await vscode.workspace.openTextDocument(javaFile)
      const position = new vscode.Position(0, 16)

      const result = providers.javaHover.provideHover(document, position)

      assert.equal(result.contents[0], 'World')
    })
  })

  describe('#csharpHover', function () {
    it('returns undefined at 0 line', async function () {
      const csharpFile = path.join(__dirname, '..', 'examples', 'csharp.cs')
      const document = await vscode.workspace.openTextDocument(csharpFile)
      const position = new vscode.Position(0, 32)

      const result = providers.csharpHover.provideHover(document, position)

      assert.equal(result.contents[0], settings.missingText())
    })

    it('returns value at 0 line and correct position', async function () {
      const csharpFile = path.join(__dirname, '..', 'examples', 'csharp.cs')
      const document = await vscode.workspace.openTextDocument(csharpFile)
      const position = new vscode.Position(0, 37)

      const result = providers.csharpHover.provideHover(document, position)

      assert.equal(result.contents[0], 'World')
    })
  })

  describe('#rustHover', function () {
    it('returns undefined at 0 line with var format', async function () {
      const rustFile = path.join(__dirname, '..', 'examples', 'rust.rs')
      const document = await vscode.workspace.openTextDocument(rustFile)
      const position = new vscode.Position(0, 12)

      const result = providers.rustHover.provideHover(document, position)

      assert.equal(result.contents[0], settings.missingText())
    })

    it('returns value at 0 line and correct position with var format', async function () {
      const rustFile = path.join(__dirname, '..', 'examples', 'rust.rs')
      const document = await vscode.workspace.openTextDocument(rustFile)
      const position = new vscode.Position(0, 16)

      const result = providers.rustHover.provideHover(document, position)

      assert.equal(result.contents[0], 'World')
    })

    it('returns undefined at 0 line with var_os format', async function () {
      const rustFile = path.join(__dirname, '..', 'examples', 'rust.rs')
      const document = await vscode.workspace.openTextDocument(rustFile)
      const position = new vscode.Position(2, 12)

      const result = providers.rustHover.provideHover(document, position)

      assert.equal(result.contents[0], settings.missingText())
    })

    it('returns value at 0 line and correct position with var_os format', async function () {
      const rustFile = path.join(__dirname, '..', 'examples', 'rust.rs')
      const document = await vscode.workspace.openTextDocument(rustFile)
      const position = new vscode.Position(2, 22)

      const result = providers.rustHover.provideHover(document, position)

      assert.equal(result.contents[0], 'World')
    })
  })

  describe('#dartHover', function () {
    it('returns undefined at 0 line with var format', async function () {
      const dartFile = path.join(__dirname, '..', 'examples', 'dart.dart')
      const document = await vscode.workspace.openTextDocument(dartFile)
      const position = new vscode.Position(0, 21)

      const result = providers.dartHover.provideHover(document, position)

      assert.equal(result.contents[0], settings.missingText())
    })

    it('returns value at 0 line and correct position', async function () {
      const dartFile = path.join(__dirname, '..', 'examples', 'dart.dart')
      const document = await vscode.workspace.openTextDocument(dartFile)
      const position = new vscode.Position(0, 27)

      const result = providers.dartHover.provideHover(document, position)

      assert.equal(result.contents[0], 'World')
    })
  })

  describe('#kotlinHover', function () {
    it('returns undefined at 0 line with var format', async function () {
      const kotlinFile = path.join(__dirname, '..', 'examples', 'kotlin.kt')
      const document = await vscode.workspace.openTextDocument(kotlinFile)
      const position = new vscode.Position(0, 12)

      const result = providers.kotlinHover.provideHover(document, position)

      assert.equal(result.contents[0], settings.missingText())
    })

    it('returns value at 0 line and correct position', async function () {
      const kotlinFile = path.join(__dirname, '..', 'examples', 'kotlin.kt')
      const document = await vscode.workspace.openTextDocument(kotlinFile)
      const position = new vscode.Position(0, 17)

      const result = providers.kotlinHover.provideHover(document, position)

      assert.equal(result.contents[0], 'World')
    })
  })

  describe('#elixirHover', function () {
    it('returns undefined at 0 line with var format', async function () {
      const elixirFile = path.join(__dirname, '..', 'examples', 'elixir.exs')
      const document = await vscode.workspace.openTextDocument(elixirFile)
      const position = new vscode.Position(0, 12)

      const result = providers.elixirHover.provideHover(document, position)

      assert.equal(result.contents[0], settings.missingText())
    })

    it('returns value at 0 line and correct position', async function () {
      const elixirFile = path.join(__dirname, '..', 'examples', 'elixir.exs')
      const document = await vscode.workspace.openTextDocument(elixirFile)
      const position = new vscode.Position(0, 17)

      const result = providers.elixirHover.provideHover(document, position)

      assert.equal(result.contents[0], 'World')
    })
  })
})
