/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/user/subscriptions/invoices-count', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('returns', () => {
    it('integer', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        active: 'true'
      })
      const user = await TestStripeAccounts.createUserWithPaymentMethod()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createPrice(administrator, {
          productid: administrator.product.productid,
          unit_amount: 3000,
          currency: 'usd',
          tax_behavior: 'inclusive',
          recurring_interval: 'month',
          recurring_interval_count: '1',
          recurring_usage_type: 'licensed',
          active: 'true'
        })
        await TestStripeAccounts.createUserWithPaidSubscription(administrator.price, user)
      }
      const req = TestHelper.createRequest(`/api/user/subscriptions/invoices-count?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.saveResponse = true
      const result = await req.get()
      assert.strictEqual(result, global.pageSize + 1)
    })
  })
})
