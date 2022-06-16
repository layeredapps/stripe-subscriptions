/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/user/subscriptions/refunds-count', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('returns', () => {
    it('integer', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice()
      const user = await TestStripeAccounts.createUserWithPaymentMethod()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createPrice(administrator, {
          productid: administrator.product.productid,
          unit_amount: 3000,
          currency: 'usd',
          tax_behavior: 'inclusive',
          recurring_interval: 'month',
          recurring_usage_type: 'licensed',
          recurring_interval_count: '1',
          active: 'true'
        })
        await TestStripeAccounts.createUserWithPaidSubscription(administrator.price, user)
        await TestHelper.createRefund(administrator, user.charge.chargeid)
      }
      const req = TestHelper.createRequest(`/api/user/subscriptions/refunds-count?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.saveResponse = true
      const result = await req.get()
      assert.strictEqual(result, global.pageSize + 1)
    })
  })
})
