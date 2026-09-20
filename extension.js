const secureEditor = require('./lib/secure-editor')
const autocloaking = require('./lib/autocloaking')
const autocompletion = require('./lib/autocompletion')
const peeking = require('./lib/peeking')
const completionReveal = require('./lib/completion-reveal')
const hoverReveal = require('./lib/hover-reveal')

async function activate (context) {
  completionReveal.run(context)
  hoverReveal.run(context)
  secureEditor.run(context)
  console.log('Dotenv is active')

  console.log('Load autocloaking')
  await autocloaking.run(context)

  console.log('Load autocompletion')
  await autocompletion.run(context)

  console.log('Load secret peeking')
  peeking.run(context)
}

function deactivate () {
  console.log('Dotenv is no longer active')
}

module.exports = {
  activate,
  deactivate
}
