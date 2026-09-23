const vscode = require('vscode')
const settings = require('./settings')
const yaml = require('./yaml-cloaking')

const maskDecoration = vscode.window.createTextEditorDecorationType({
  letterSpacing: '-1ch',
  opacity: '0',
  color: 'transparent'
})

const parse = function (sourceCode, uri) {
  const arr = []
  // const stillDisplayCommentsRegex = /((=|:)\s?".+"|(=|:)\s?'.+'|(=|:)\s?`.+`|(=|:).*\s?(\s#)?)/
  const regex = /=.+/
  let lineIndex = 0

  const lines = sourceCode.split('\n')
  for (const line of lines) {
    lineIndex += 1

    const r = new RegExp(regex, 'g')
    const matches = r.exec(line)

    if (matches) {
      const firstMatch = matches[0]

      if (firstMatch) {
        const startIndex = line.indexOf(firstMatch)
        const endIndex = startIndex + firstMatch.length

        // build line and column start and ends
        arr.push({
          maskedText: settings.cloakIcon(uri).repeat(firstMatch.length),
          start: { line: lineIndex, column: startIndex },
          end: { line: lineIndex, column: endIndex }
        })
      }
    }
  }

  return arr
}

const applyDecorations = function (_ctx, editor, patches) {
  const decorationsArray = patches
    .map(function (patch) {
      const range = new vscode.Range(
        new vscode.Position(patch.start.line - 1, patch.start.column),
        new vscode.Position(patch.end.line - 1, patch.end.column)
      )
      return {
        range,
        renderOptions: {
          after: {
            color: settings.cloakColor(editor.document.uri),
            contentText: `=${patch.maskedText}`
          }
        }
      }
    })

  editor.setDecorations(maskDecoration, decorationsArray)
}

const decorate = (context, editor) => {
  if (!editor) {
    return
  }

  try {
    yaml.decorate(editor)
    if (editor.document.languageId !== 'dotenv' || !settings.autocloakingEnabled(editor.document.uri)) {
      applyDecorations(context, editor, [])
    } else {
      const sourceCode = editor.document.getText()
      const patches = parse(sourceCode, editor.document.uri)
      applyDecorations(context, editor, patches)
    }
  } catch (e) {
    console.log(e)
  }
}

module.exports.decorate = decorate

module.exports.dispose = { dispose: () => { maskDecoration.dispose(); yaml.dispose.dispose() } }
