/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/administrator/subscriptions/refunds-count', function () {
  describe('returns', () => {
    it('integer', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPlan({
        amount: '1000',
        trial_period_days: '0',
        interval: 'month',
        usage_type: 'licensed'
      })
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
        await TestHelper.createRefund(administrator, user.charge.chargeid)
      }
      const req = TestHelper.createRequest('/api/administrator/subscriptions/refunds-count')
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.saveResponse = true
      const result = await req.get()
      assert.strictEqual(result, global.pageSize + 1)
    })
  })
})
