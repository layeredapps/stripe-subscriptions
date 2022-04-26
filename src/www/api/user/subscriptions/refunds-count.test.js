/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/user/subscriptions/refunds-count', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('returns', () => {
    it('integer', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPlan({ amount: '10000', interval: 'day' })
      const user = await TestStripeAccounts.createUserWithPaymentMethod()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createPlan(administrator, {
          productid: administrator.product.productid,
          usage_type: 'licensed',
          publishedAt: 'true',
          trial_period_days: '0',
          amount: '10000',
          interval: 'day'
        })
        await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan, user)
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
