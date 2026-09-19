const esbuild = require('esbuild')
const fs = require('fs')
const path = require('path')
const outdir = path.join(__dirname, '../media/editor/dist')
fs.mkdirSync(outdir, { recursive: true })
esbuild.buildSync({
  entryPoints: [path.join(__dirname, '../media/editor/main.js')],
  bundle: true,
  outdir,
  format: 'iife',
  platform: 'browser',
  minify: true,
  loader: { '.ttf': 'file' },
  logLevel: 'info',
  legalComments: 'eof'
})
esbuild.buildSync({
  entryPoints: [require.resolve('monaco-editor/editor/editor.worker.js')],
  bundle: true,
  outfile: path.join(outdir, 'worker.js'),
  format: 'iife',
  minify: true,
  logLevel: 'info'
})
fs.copyFileSync(path.join(__dirname, '../node_modules/monaco-editor/LICENSE'), path.join(outdir, 'MONACO-LICENSE.txt'))
