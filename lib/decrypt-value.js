const { execFile } = require('child_process')
const path = require('path')
const dotenv = require('dotenv')
const vscode = require('vscode')

async function decrypt (document, key) {
  if (!vscode.workspace.isTrusted) throw new Error('Trust this workspace before decrypting values.')
  if (document.uri.scheme !== 'file' || document.isDirty) throw new Error('Save this file before decrypting a value.')
  const executable = vscode.workspace.getConfiguration('dotenv', document.uri).get('dotenvxPath', 'dotenvx')
  const args = ['decrypt', '--stdout', '-f', document.uri.fsPath, '-k', key]
  return new Promise((resolve, reject) => {
    execFile(executable, args, { cwd: path.dirname(document.uri.fsPath), timeout: 15000, maxBuffer: 4 * 1024 * 1024, windowsHide: true }, (error, stdout) => {
      // Never forward CLI output/errors: either may contain keys or plaintext.
      if (error) {
        reject(new Error(error.code === 'ENOENT'
          ? 'Install dotenvx or set dotenv.dotenvxPath to its executable.'
          : 'Could not decrypt. Check that the matching private key is available to dotenvx locally.'))
        return
      }
      const value = dotenv.parse(stdout)[key]
      if (value === undefined || value.startsWith('encrypted:')) {
        reject(new Error('Could not decrypt. Add the matching private key to your local .env.keys file or dotenvx key store.'))
        return
      }
      resolve(value)
    })
  })
}

module.exports = { decrypt }
