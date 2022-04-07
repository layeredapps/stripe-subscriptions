/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/administrator/subscriptions/charge', function () {
  const cachedResponses = {}
  beforeEach(async () => {
    if (Object.keys(cachedResponses).length) {
      return
    }
    await TestHelper.setupBefore()
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestStripeAccounts.createOwnerWithPlan({
      amount: '1000',
      trial_period_days: '0',
      interval: 'month',
      usage_type: 'licensed'
    })
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
    // missing and invalid id
    const req = TestHelper.createRequest('/api/administrator/subscriptions/charge')
    req.account = administrator.account
    req.session = administrator.session
    try {
      await req.get()
    } catch (error) {
      cachedResponses.missing = error.message
    }
    const req2 = TestHelper.createRequest('/api/administrator/subscriptions/charge?chargeid=invalid')
    req2.account = administrator.account
    req2.session = administrator.session
    try {
      await req2.get()
    } catch (error) {
      cachedResponses.invalid = error.message
    }
    // returns
    const req3 = TestHelper.createRequest(`/api/administrator/subscriptions/charge?chargeid=${user.charge.chargeid}`)
    req3.account = administrator.account
    req3.session = administrator.session
    req3.filename = __filename
    req3.saveResponse = true
    cachedResponses.returns = await req3.get()
  })

  describe('exceptions', () => {
    describe('invalid-chargeid', () => {
      it('missing querystring chargeid', async () => {
        const errorMessage = cachedResponses.missing
        assert.strictEqual(errorMessage, 'invalid-chargeid')
      })

      it('invalid querystring chargeid', async () => {
        const errorMessage = cachedResponses.invalid
        assert.strictEqual(errorMessage, 'invalid-chargeid')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const charge = cachedResponses.returns
      assert.strictEqual(charge.object, 'charge')
    })
  })
})
