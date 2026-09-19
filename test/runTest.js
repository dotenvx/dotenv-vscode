const path = require('path')
const fs = require('fs/promises')
const os = require('os')

const { runTests } = require('@vscode/test-electron')

async function main () {
  const workspacePath = await fs.mkdtemp(path.join(os.tmpdir(), 'dotenv-vscode-test-'))
  const userDataPath = await fs.mkdtemp(path.join(os.tmpdir(), 'dotenv-vscode-profile-'))
  try {
    await fs.cp(path.join(__dirname, 'suite/examples'), path.join(workspacePath, 'examples'), { recursive: true })
    await fs.writeFile(path.join(workspacePath, '.env'), 'HELLO=World\n')
    await fs.mkdir(path.join(workspacePath, '.vscode'))
    await fs.writeFile(path.join(workspacePath, '.vscode', 'settings.json'), JSON.stringify({
      'files.associations': { '*.css': 'css', '.env.custom': 'plaintext', '.dev.vars': 'dotenv', '**/.env.d/*': 'dotenv' }
    }))
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = [
      path.resolve(__dirname, '../'),
      path.resolve(__dirname, 'fixtures/languages')
    ]

    // The path to the extension test script
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, './suite/index')

    // Download VS Code, unzip it and run the integration test
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [workspacePath, `--user-data-dir=${userDataPath}`, '--disable-extensions', '--skip-welcome', '--skip-release-notes', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows']
    })
  } catch (err) {
    console.error('Failed to run tests', err)
    process.exitCode = 1
  } finally {
    await fs.rm(workspacePath, { recursive: true, force: true })
    await fs.rm(userDataPath, { recursive: true, force: true })
  }
}

main()
