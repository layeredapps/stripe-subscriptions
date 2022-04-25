/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/administrator/subscriptions/usage-record', () => {
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
      const administrator = await TestStripeAccounts.createOwnerWithPlan({
        usage_type: 'metered',
        amount: 1000
      })
      const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
      await TestHelper.createUsageRecord(user, 100)
      const req = TestHelper.createRequest(`/api/administrator/subscriptions/usage-record?usagerecordid=${user.usageRecord.stripeObject.id}`)
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.saveResponse = true
      const usageRecord = await req.get()
      assert.strictEqual(usageRecord.usagerecordid, user.usageRecord.stripeObject.id)
    })
  })
})
