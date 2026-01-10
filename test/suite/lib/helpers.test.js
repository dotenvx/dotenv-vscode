const assert = require('assert')
const path = require('path')

const helpers = require('../../../lib/helpers')

// Path to test fixtures
const monorepoRoot = path.join(__dirname, '..', 'examples', 'monorepo')
const appADir = path.join(monorepoRoot, 'packages', 'app-a')
const appASrcDir = path.join(appADir, 'src')
const appBSrcDir = path.join(monorepoRoot, 'packages', 'app-b', 'src')

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

  describe('#getEnvFilesInDirectory', function () {
    it('returns empty array for directory with no .env files', function () {
      const result = helpers.getEnvFilesInDirectory(appASrcDir)
      assert.deepEqual(result, [])
    })

    it('returns all .env* files in directory', function () {
      const result = helpers.getEnvFilesInDirectory(appADir)
      assert.strictEqual(result.length, 2)
      // Files should be present
      assert.ok(result.some(f => f.endsWith('.env')))
      assert.ok(result.some(f => f.endsWith('.env.local')))
    })

    it('prioritizes .env.local over .env', function () {
      const result = helpers.getEnvFilesInDirectory(appADir)
      const envLocalIndex = result.findIndex(f => f.endsWith('.env.local'))
      const envIndex = result.findIndex(f => f.endsWith('.env') && !f.endsWith('.env.local'))
      assert.ok(envLocalIndex < envIndex, '.env.local should come before .env')
    })

    it('returns .env files in monorepo root', function () {
      const result = helpers.getEnvFilesInDirectory(monorepoRoot)
      assert.strictEqual(result.length, 1)
      assert.ok(result[0].endsWith('.env'))
    })
  })

  describe('#findNearestEnvFile', function () {
    beforeEach(function () {
      // Clear cache before each test
      helpers.clearEnvFileCache()
    })

    it('returns .env in same directory when present', function () {
      const result = helpers.findNearestEnvFile(appADir)
      // Should find .env.local (higher priority) in app-a directory
      assert.ok(result.endsWith('.env.local'))
      assert.ok(result.includes('app-a'))
    })

    it('walks up to find .env in parent directory', function () {
      // app-b/src has no .env, should walk up to monorepo root
      const result = helpers.findNearestEnvFile(appBSrcDir)
      assert.ok(result !== null)
      assert.ok(result.endsWith('.env'))
      assert.ok(result.includes('monorepo'))
      assert.ok(!result.includes('app-b'))
    })

    it('returns null when no .env found', function () {
      // Use a directory that doesn't exist or has no .env in tree
      const result = helpers.findNearestEnvFile('/tmp')
      assert.strictEqual(result, null)
    })

    it('caches results for faster subsequent lookups', function () {
      // First call
      helpers.findNearestEnvFile(appASrcDir)

      // Second call should use cache (we can't easily verify this,
      // but we can verify it returns the same result)
      const result = helpers.findNearestEnvFile(appASrcDir)
      assert.ok(result !== null)
      assert.ok(result.includes('app-a'))
    })

    it('cache can be cleared', function () {
      // Populate cache
      helpers.findNearestEnvFile(appASrcDir)

      // Clear cache
      helpers.clearEnvFileCache()

      // Should still work after clearing (will repopulate cache)
      const result = helpers.findNearestEnvFile(appASrcDir)
      assert.ok(result !== null)
    })
  })

  describe('#clearEnvFileCache', function () {
    it('clears the cache without throwing', function () {
      // Should not throw
      assert.doesNotThrow(() => {
        helpers.clearEnvFileCache()
      })
    })
  })
})
