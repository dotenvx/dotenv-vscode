const path = require('path')
const fs = require('fs/promises')
const os = require('os')

const { runTests } = require('@vscode/test-electron')

async function main () {
  const workspacePath = await fs.mkdtemp(path.join(os.tmpdir(), 'dotenv-vscode-test-'))
  try {
    await fs.writeFile(path.join(workspacePath, '.env'), 'HELLO=World\n')
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, '../')

    // The path to the extension test script
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, './suite/index')

    // Download VS Code, unzip it and run the integration test
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [workspacePath, '--disable-extensions', '--skip-welcome', '--skip-release-notes']
    })
  } catch (err) {
    console.error('Failed to run tests', err)
    process.exitCode = 1
  } finally {
    await fs.rm(workspacePath, { recursive: true, force: true })
  }
}

main()
