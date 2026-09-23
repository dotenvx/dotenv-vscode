const vscode = require('vscode')
// Scopes written by older releases; used only to clean up their hiding rules.
const maskScopes = [
  'source.dotenv property.value.dotenv',
  'source.dotenv property.value.dotenv string',
  'source.dotenv property.value.dotenv variable',
  'source.dotenv property.value.dotenv keyword',
  'source.dotenv property.value.dotenv constant',
  'source.dotenv property.value.dotenv comment'
]
const legacyMaskScope = 'keyword.other.dotenv'

// WARNING. Do not change these without also adjusting package.json
const enableAutocloakingKey = 'dotenv.enableAutocloaking'
const cloakColorKey = 'dotenv.cloakColor'
const cloakIconKey = 'dotenv.cloakIcon'
const enableSecretpeekingKey = 'dotenv.enableSecretpeeking'

// other settings from vscode or other extensions
const editorTokenColorCustomizationsKey = 'editor.tokenColorCustomizations'

const toggleStateKey = 'autocloakingOverride'
let extensionState
let overrides = []

function initialize (context) {
  extensionState = context.globalState
  const stored = extensionState.get(toggleStateKey)
  overrides = Array.isArray(stored) ? stored : stored ? [stored] : []
}

async function setAutocloaking (enabled, uri) {
  if (!autocloakingFeatureEnabled(uri)) return false
  const override = { enabled, configured: !!userConfig(uri).get(enableAutocloakingKey), scope: scope(uri) }
  overrides = overrides.filter(item => item.scope !== override.scope).concat(override)
  await extensionState.update(toggleStateKey, overrides)
  return enabled
}

async function resetAutocloaking () {
  overrides = []
  await extensionState.update(toggleStateKey, undefined)
}

async function autocloakingOff (uri) {
  return setAutocloaking(false, uri)
}

async function autocloakingOn (uri) {
  return setAutocloaking(true, uri)
}

// Older releases persisted invisible syntax colors. Remove only their exact
// generated rules, reading the global value so workspace settings aren't copied.
async function removeLegacyMask () {
  const config = userConfig()
  const value = config.inspect(editorTokenColorCustomizationsKey)?.globalValue
  if (!value || !Array.isArray(value.textMateRules)) return

  const rules = value.textMateRules.filter(rule => !(
    rule && Object.keys(rule).length === 2 &&
    (rule.scope === legacyMaskScope || maskScopes.includes(rule.scope)) &&
    rule.settings && Object.keys(rule.settings).length === 1 &&
    rule.settings.foreground === '#FF000000'
  ))
  if (rules.length === value.textMateRules.length) return

  const next = { ...value }
  if (rules.length) next.textMateRules = rules
  else delete next.textMateRules
  await config.update(editorTokenColorCustomizationsKey,
    Object.keys(next).length ? next : undefined, vscode.ConfigurationTarget.Global)
}

function scope (uri) {
  return uri && (vscode.workspace.getWorkspaceFolder?.(uri)?.uri || uri).toString()
}

function userConfig (uri) {
  return vscode.workspace.getConfiguration(undefined, uri)
}

// settings
function autocloakingFeatureEnabled (uri) {
  return !!userConfig(uri).get(enableAutocloakingKey)
}

function autocloakingEnabled (uri) {
  const configured = autocloakingFeatureEnabled(uri)
  if (!configured) return false
  const override = overrides.find(item => item.scope === scope(uri))
  return override && override.configured === configured ? override.enabled : configured
}

function secretpeekingEnabled (uri) {
  return !!userConfig(uri).get(enableSecretpeekingKey)
}

function cloakColor (uri) {
  return userConfig(uri).get(cloakColorKey)
}

function cloakIcon (uri) {
  return userConfig(uri).get(cloakIconKey)
}

function missingText () {
  return 'MISSING from .env file'
}

module.exports.userConfig = userConfig

// actions
module.exports.autocloakingOff = autocloakingOff
module.exports.autocloakingOn = autocloakingOn
module.exports.initialize = initialize
module.exports.resetAutocloaking = resetAutocloaking
module.exports.removeLegacyMask = removeLegacyMask

// settings
module.exports.autocloakingFeatureEnabled = autocloakingFeatureEnabled
module.exports.autocloakingEnabled = autocloakingEnabled
module.exports.secretpeekingEnabled = secretpeekingEnabled
module.exports.cloakColor = cloakColor
module.exports.cloakIcon = cloakIcon

// other
module.exports.missingText = missingText
