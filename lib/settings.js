const vscode = require('vscode')
const scope = 'keyword.other.dotenv'

// WARNING. Do not change these without also adjusting package.json
const enableAutocloakingKey = 'dotenv.enableAutocloaking'
const cloakColorKey = 'dotenv.cloakColor'
const cloakIconKey = 'dotenv.cloakIcon'
const enableSecretpeekingKey = 'dotenv.enableSecretpeeking'

// other settings from vscode or other extensions
const editorTokenColorCustomizationsKey = 'editor.tokenColorCustomizations'

async function autocloakingOff () {
  await userConfig().update(enableAutocloakingKey, false, vscode.ConfigurationTarget.Global)
  return false
}

async function mask () {
  const value = _editorTokenColorCustomizations() || {}
  value.textMateRules = _textMateRules(true)

  await userConfig().update(editorTokenColorCustomizationsKey, value, vscode.ConfigurationTarget.Global)

  return true
}

async function unmask () {
  const value = _editorTokenColorCustomizations() || {}
  value.textMateRules = _textMateRules(false)

  await userConfig().update(editorTokenColorCustomizationsKey, value, vscode.ConfigurationTarget.Global)

  return false
}

async function autocloakingOn () {
  await userConfig().update(enableAutocloakingKey, true, vscode.ConfigurationTarget.Global)
  return true
}

function userConfig () {
  return vscode.workspace.getConfiguration()
}

// settings
function autocloakingEnabled () {
  return !!userConfig().get(enableAutocloakingKey)
}

function secretpeekingEnabled () {
  return !!userConfig().get(enableSecretpeekingKey)
}

function cloakColor () {
  return userConfig().get(cloakColorKey)
}

function cloakIcon () {
  return userConfig().get(cloakIconKey)
}

// other settings
function _editorTokenColorCustomizations () {
  return userConfig().get(editorTokenColorCustomizationsKey)
}

function _existingTextMateRules () {
  const tokenColorCustomizations = _editorTokenColorCustomizations()

  if (tokenColorCustomizations) {
    if (tokenColorCustomizations.textMateRules) {
      return tokenColorCustomizations.textMateRules
    } else {
      return []
    }
  } else {
    return []
  }
}

function _textMateRules (enableMask) {
  const rules = _existingTextMateRules()
  const newRules = []

  for (const rule of rules) {
    if (rule.scope === scope) {
      // removes the hide rule. re-set in next few lines.
    } else {
      newRules.push(rule) // preserve any other rules
    }
  }

  if (enableMask) {
    const maskRule = {
      scope,
      settings: { foreground: '#FF000000' } // set transparency to 0
    }
    newRules.push(maskRule) // add new rule
  }

  return newRules
}

function missingText () {
  return 'MISSING from .env file'
}

module.exports.userConfig = userConfig

// actions
module.exports.autocloakingOff = autocloakingOff
module.exports.autocloakingOn = autocloakingOn
module.exports.mask = mask
module.exports.unmask = unmask

// settings
module.exports.autocloakingEnabled = autocloakingEnabled
module.exports.secretpeekingEnabled = secretpeekingEnabled
module.exports.cloakColor = cloakColor
module.exports.cloakIcon = cloakIcon

// other
module.exports.missingText = missingText
