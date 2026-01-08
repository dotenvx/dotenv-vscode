const vscode = require('vscode')
const dotenv = require('dotenv')
const fs = require('fs')
const path = require('path')
const settings = require('./settings')

// Memoization cache: maps directory path to found .env file path (or null if none found)
const envFileCache = new Map()

// Priority order for .env files (higher priority first)
const ENV_FILE_PRIORITY = ['.env.local', '.env']

/**
 * Get all .env* files in a directory, sorted by priority
 * @param {string} dirPath - Directory to search
 * @returns {string[]} Array of .env file paths, sorted by priority
 */
function getEnvFilesInDirectory (dirPath) {
  try {
    const files = fs.readdirSync(dirPath)
    const envFiles = files.filter(file => file.startsWith('.env'))

    // Sort by priority: .env.local first, then .env, then others alphabetically
    return envFiles.sort((a, b) => {
      const priorityA = ENV_FILE_PRIORITY.indexOf(a)
      const priorityB = ENV_FILE_PRIORITY.indexOf(b)

      // If both are in priority list, sort by priority
      if (priorityA !== -1 && priorityB !== -1) {
        return priorityA - priorityB
      }
      // If only a is in priority list, a comes first
      if (priorityA !== -1) return -1
      // If only b is in priority list, b comes first
      if (priorityB !== -1) return 1
      // Otherwise sort alphabetically
      return a.localeCompare(b)
    }).map(file => path.join(dirPath, file))
  } catch (err) {
    return []
  }
}

/**
 * Find the nearest .env* file starting from startPath and walking up the directory tree
 * @param {string} startPath - Starting directory path
 * @returns {string|null} Path to the nearest .env file, or null if not found
 */
function findNearestEnvFile (startPath) {
  // Check cache first
  if (envFileCache.has(startPath)) {
    return envFileCache.get(startPath)
  }

  // Get workspace root as boundary (don't go above it)
  const workspaceRoot = vscode.workspace.workspaceFolders
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : null

  let currentDir = startPath
  const visitedDirs = []

  while (currentDir) {
    visitedDirs.push(currentDir)

    const envFiles = getEnvFilesInDirectory(currentDir)
    if (envFiles.length > 0) {
      const envFilePath = envFiles[0] // Use highest priority file

      // Cache result for all visited directories
      for (const dir of visitedDirs) {
        envFileCache.set(dir, envFilePath)
      }

      return envFilePath
    }

    // Stop if we've reached workspace root or filesystem root
    if (workspaceRoot && currentDir === workspaceRoot) {
      break
    }

    const parentDir = path.dirname(currentDir)
    if (parentDir === currentDir) {
      // Reached filesystem root
      break
    }

    currentDir = parentDir
  }

  // No .env file found - cache null for all visited directories
  for (const dir of visitedDirs) {
    envFileCache.set(dir, null)
  }

  return null
}

/**
 * Clear the env file cache. Called when .env files change.
 */
function clearEnvFileCache () {
  envFileCache.clear()
}

function envEntries () {
  const parsed = envParsed()

  if (parsed) {
    const entries = Object.entries(parsed) // converts key: value to [key, value]

    return entries
  } else {
    return [['KEY', 'VALUE']] // serves as example
  }
}

function envParsed () {
  let envFilePath = null

  // Try monorepo support first if enabled
  if (settings.monorepoSupportEnabled()) {
    const activeEditor = vscode.window.activeTextEditor
    if (activeEditor) {
      const documentPath = activeEditor.document.uri.fsPath
      const documentDir = path.dirname(documentPath)
      envFilePath = findNearestEnvFile(documentDir)
    }
  }

  // Fall back to workspace root if no file found or monorepo support disabled
  if (!envFilePath) {
    const workspacePath = vscode.workspace.workspaceFolders
      ? vscode.workspace.workspaceFolders[0].uri.fsPath.replace(/\\/g, '/')
      : undefined

    if (workspacePath) {
      envFilePath = path.join(workspacePath, '.env')
    }
  }

  let parsed = {}

  if (envFilePath) {
    parsed = dotenv.config({ path: envFilePath }).parsed
  } else {
    parsed = dotenv.config().parsed
  }

  return parsed
}

function hover (language, document, position) {
  const regexDict = {
    javascript: /(?:process|import\.meta)\.env\.([A-Z]{1}[A-Z_0123456789]+)/,
    ruby: /ENV\[['"]([A-Z]{1}[A-Z_0123456789]+)['"]\]/,
    python: /os\.(?:(?:environ(?:(?:\.get\(["']([A-Z]{1}[A-Z_0123456789]+)["']\))|(?:\[["']([A-Z]{1}[A-Z_0123456789]+)["']\])))|(?:getenv\(["']([A-Z]{1}[A-Z_0123456789]+)["']\)))/,
    php: /(?:(?:\$_(?:SERVER|ENV)\[["']([A-Z]{1}[A-Z_0123456789]+)["']\])|(?:getenv\(["']([A-Z]{1}[A-Z_0123456789]+)["']\)))/,
    go: /os.Getenv\(["']([A-Z]{1}[A-Z_0123456789]+)["']\)/,
    java: /dotenv.get\(["']([A-Z]{1}[A-Z_0123456789]+)["']\)/,
    csharp: /Environment.GetEnvironmentVariable\(["']([A-Z]{1}[A-Z_0123456789]+)["']\)/,
    rust: /std::env::(?:var|var_os)\(["']([A-Z]{1}[A-Z_0123456789]+)["']\)/,
    dart: /String.fromEnvironment\(["']([A-Z]{1}[A-Z_0123456789]+)["']\)/,
    kotlin: /System.getenv\(["']([A-Z]{1}[A-Z_0123456789]+)["']\)/,
    elixir: /System.get_env\(["']([A-Z]{1}[A-Z_0123456789]+)["']\)/
  }
  const reg = regexDict[language]
  const line = document.lineAt(position).text
  const matches = line.match(reg)

  if (!matches) {
    return undefined
  } else {
    const key = matches.filter(item => item !== undefined)[1]

    const start = line.indexOf(key)
    const end = start + key.length
    if (position.character >= start && position.character <= end) {
      const parsed = envParsed()
      const value = parsed[key]

      if (settings.secretpeekingEnabled()) {
        return new vscode.Hover(value)
      } else {
        return new vscode.Hover(_partialMask(value))
      }
    } else {
      return new vscode.Hover(settings.missingText())
    }
  }
}

function _partialMask (str) {
  const lastTwoChars = str.slice(-2)
  const maskChars = settings.cloakIcon().repeat(str.length - 2)

  return `${maskChars}${lastTwoChars}`
}

function autocomplete (triggerCharacter, document, position) {
  const entries = envEntries()
  const quote = triggerCharacter === '.' ? '' : '"' // for javascript, doesn't use quotation in env reference so make sure not to add to insert/filter text
  return entries.map(function (env) {
    const key = env[0].trim()
    const value = env[1].trim()
    let formattedValue = settings.missingText()

    if (value) {
      if (settings.secretpeekingEnabled()) {
        formattedValue = value
      } else {
        formattedValue = _partialMask(value)
      }
    }

    // https://code.visualstudio.com/api/references/vscode-api#CompletionItemLabel
    const completionItemLabel = {
      label: key,
      // detail: ` ${value}`
      detail: ` ${formattedValue}`
    }
    const item = new vscode.CompletionItem(completionItemLabel, vscode.CompletionItemKind.Variable)
    item.insertText = `${triggerCharacter}${quote}${key}${quote}`
    item.filterText = `${triggerCharacter}${quote}${key}${quote}`
    item.range = new vscode.Range(new vscode.Position(position.line, position.character - 1), position) // Picks up trigger character as prefix to fix the scoring it does when sorting
    item.sortText = '0' // Make this the sortText so that any ENV variables will go to the top of the list above anything else

    const s = `.env
<hr/>

**${key}**

<pre><code>${formattedValue}</code></pre>
`
    const doc = new vscode.MarkdownString(s)
    doc.value = s
    doc.supportHtml = true
    // item.documentation = value // update with more details
    item.documentation = doc // more details

    return item
  })
}

module.exports.envEntries = envEntries
module.exports.envParsed = envParsed
module.exports.hover = hover
module.exports.autocomplete = autocomplete
module.exports.findNearestEnvFile = findNearestEnvFile
module.exports.getEnvFilesInDirectory = getEnvFilesInDirectory
module.exports.clearEnvFileCache = clearEnvFileCache
