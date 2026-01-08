const assert = require('assert')

const helpers = require('../../../lib/helpers')

describe('helpers', function () {
  describe('#envParsed', function () {
    it('returns envParsed', function () {
      const result = helpers.envParsed()

      assert.equal(result.HELLO, 'World')
    })
  })

  describe('#envEntries', function () {
    it('returns', function () {
      const result = helpers.envEntries()

      assert.deepEqual(result[0], ['HELLO', 'World'])
    })
  })
})
