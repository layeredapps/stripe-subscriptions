/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/administrator/subscriptions/prices-count', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('returns', () => {
    it('integer', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createPrice(administrator, {
          productid: administrator.product.productid,
          usage_type: 'licensed',
          publishedAt: 'true',
          trial_period_days: '0',
          amount: '1000'
        })
      }
      const req = TestHelper.createRequest('/api/administrator/subscriptions/prices-count')
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.saveResponse = true
      const result = await req.get()
      assert.strictEqual(result, global.pageSize + 1)
    })
  })
})
