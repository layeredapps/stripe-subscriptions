/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/administrator/subscriptions/usage-records-count', function () {
  describe('returns', () => {
    it('integer', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPlan({
        usage_type: 'metered',
        amount: 1000
      })
      let accountUser
      for (let i = 0, len = global.pageSize; i < len; i++) {
        const user = accountUser = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
        await TestHelper.createUsageRecord(user, 100)
      }
      await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan, accountUser)
      await TestHelper.createUsageRecord(accountUser, 100)
      await TestHelper.wait(1100)
      await TestHelper.createUsageRecord(accountUser, 100)
      const req = TestHelper.createRequest('/api/administrator/subscriptions/usage-records-count')
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.saveResponse = true
      const result = await req.get()
      assert.strictEqual(result, global.pageSize + 2)
    })
  })
})
