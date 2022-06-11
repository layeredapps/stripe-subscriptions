/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/administrator/subscriptions/usage-records-count', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('returns', () => {
    it('integer', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice({
        publishedAt: 'true',
        currency: 'usd',
        recurring_interval: 'month',
        recurring_interval_count: '1',
        recurring_usage_type: 'metered',
        recurring_aggregate_usage: 'sum',
        billing_scheme: 'tiered',
        tax_behavior: 'inclusive',
        tiers_mode: 'volume',
        tier1_up_to: '1000',
        tier1_flat_amount: '9999',
        tier2_up_to: 'inf',
        tier2_flat_amount: '8999'
      })
      let accountUser
      for (let i = 0, len = global.pageSize; i < len; i++) {
        const user = accountUser = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
        await TestHelper.createUsageRecord(user, 100)
      }
      await TestStripeAccounts.createUserWithPaidSubscription(administrator.price, accountUser)
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
