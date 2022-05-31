/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/administrator/subscriptions/charges-count', function () {
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
          publishedAt: 'true',
          unit_amount: 3000,
          recurring_interval: 'month',
          recurring_usage_type: 'licensed'
        })
        await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
      }
      const req = TestHelper.createRequest('/api/administrator/subscriptions/charges-count')
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.saveResponse = true
      const result = await req.get()
      assert.strictEqual(result, global.pageSize + 1)
    })
  })
})
