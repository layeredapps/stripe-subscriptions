/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/administrator/subscriptions/usage-record', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('exceptions', () => {
    describe('invalid-usagerecordid', () => {
      it('missing querystring usagerecordid', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/usage-record')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-usagerecordid')
      })

      it('invalid querystring usagerecordid', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/usage-record?usagerecordid=invalid')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-usagerecordid')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice({
        currency: 'usd',
        recurring_interval: 'month',
        recurring_interval_count: '1',
        recurring_usage_type: 'metered',
        recurring_aggregate_usage: 'sum',
        billing_scheme: 'tiered',
        tiers_mode: 'volume',
        tier1_up_to: '1000',
        tier1_flat_amount: '9999',
        tier2_up_to: 'inf',
        tier2_flat_amount: '8999'
      })
      const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
      await TestHelper.createUsageRecord(user, 100)
      const req = TestHelper.createRequest(`/api/administrator/subscriptions/usage-record?usagerecordid=${user.usageRecord.usagerecordid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.saveResponse = true
      const usageRecord = await req.get()
      assert.strictEqual(usageRecord.usagerecordid, user.usageRecord.usagerecordid)
    })
  })
})
