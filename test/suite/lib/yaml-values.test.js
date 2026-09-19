const { describe, it } = require('mocha')
const assert = require('assert')
const { ranges } = require('../../../lib/yaml-values')
const hidden = (text, sections) => ranges(text, sections).map(({ start, end }) => text.slice(start, end))

describe('YAML environment cloaking', () => {
  it('masks env_variables values but preserves surrounding configuration and comments', () => {
    assert.deepStrictEqual(hidden('runtime: php\nenv: flex\nenv_variables:\n  APP_ENV: local\n  APP_DEBUG: true\n  DB_PASSWORD: "secret" # visible\nbeta_settings:\n  project: cloud-instance\n'), ['local', 'true', 'secret'])
  })
  it('supports nested Docker maps, lists, quotes, hashes and pass-through variables', () => {
    const text = 'services:\n  api:\n    image: demo\n    environment:\n      - TOKEN=secret\n      - "URL=https://example.com/#hash"\n      - PASSTHROUGH\n      - EMPTY=\n  worker:\n    environment: { PASSWORD: \'secret\', PORT: 3000 }\n'
    assert.deepStrictEqual(hidden(text), ['secret', 'https://example.com/#hash', 'secret', '3000'])
  })
  it('keeps Kubernetes names and references visible', () => {
    const text = 'spec:\n  containers:\n    - env:\n        - name: TOKEN\n          value: secret\n        - name: FROM_SECRET\n          valueFrom:\n            secretKeyRef:\n              name: credentials\n              key: token\n'
    assert.deepStrictEqual(hidden(text), ['secret'])
  })
  it('masks block and multiline scalars while preserving quotes and indentation', () => {
    const text = 'env:\r\n  LITERAL: |- # visible\r\n    first\r\n    second\r\n  FOLDED: >\r\n    third\r\n  QUOTED: "fourth\r\n    fifth"\r\n'
    assert.deepStrictEqual(hidden(text), ['first', 'second', 'third', 'fourth', 'fifth'])
  })
  it('supports custom sections and disabling YAML masking', () => {
    const text = 'secrets:\n  KEY: secret\nenvironment:\n  KEY: standard\n'
    assert.deepStrictEqual(hidden(text, ['secrets']), ['secret'])
    assert.deepStrictEqual(hidden(text, []), [])
  })
  it('masks referenced anchor values without expanding recursive aliases', () => {
    const text = 'defaults: &defaults\n  TOKEN: secret\n  loop: *defaults\nservices:\n  api:\n    environment: *defaults\n'
    assert.deepStrictEqual(hidden(text), ['secret'])
  })
  it('handles multiple documents, duplicates, and unfinished quotes while typing', () => {
    assert.deepStrictEqual(hidden('env: { A: first, A: second }\n---\nenv:\n  TOKEN: "unfinished\n'), ['first', 'second', 'unfinished'])
  })
})
