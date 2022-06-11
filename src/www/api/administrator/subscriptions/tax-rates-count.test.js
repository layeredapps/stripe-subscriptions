/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/administrator/subscriptions/tax-rates-count', function () {
  describe('returns', () => {
    it('integer', async () => {
      const administrator = await TestHelper.createOwner()
      for (let i = 0, len = global.pageSize + 2; i < len; i++) {
        await TestHelper.createTaxRate(administrator)
      }
      const req = TestHelper.createRequest('/api/administrator/subscriptions/tax-rates-count')
      req.account = administrator.account
      req.session = administrator.session
      const result = await req.get()
      assert.strictEqual(result, global.pageSize + 2)
    })
  })
})
