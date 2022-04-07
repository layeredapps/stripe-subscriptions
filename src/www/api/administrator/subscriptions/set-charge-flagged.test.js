/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/administrator/subscriptions/set-charge-flagged', function () {
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
    // missing and invalid id
    const req = TestHelper.createRequest('/api/administrator/subscriptions/set-charge-flagged')
    req.account = administrator.account
    req.session = administrator.session
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.missing = error.message
    }
    const req2 = TestHelper.createRequest('/api/administrator/subscriptions/set-charge-flagged?chargeid=invalid')
    req2.account = administrator.account
    req2.session = administrator.session
    try {
      await req2.patch()
    } catch (error) {
      cachedResponses.invalid = error.message
    }
    // invalid charge
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
    await TestHelper.flagCharge(administrator, user.charge.chargeid)
    const req3 = TestHelper.createRequest(`/api/administrator/subscriptions/set-charge-flagged?chargeid=${user.charge.chargeid}`)
    req3.account = administrator.account
    req3.session = administrator.session
    try {
      await req3.patch()
    } catch (error) {
      cachedResponses.invalidCharge = error.message
    }
    // returns
    const user2 = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
    const req4 = TestHelper.createRequest(`/api/administrator/subscriptions/set-charge-flagged?chargeid=${user2.charge.chargeid}`)
    req4.account = administrator.account
    req4.session = administrator.session
    req4.filename = __filename
    req4.saveResponse = true
    cachedResponses.returns = await req4.patch()
  })
  describe('exceptions', () => {
    describe('invalid-chargeid', () => {
      it('missing querystring charge', async () => {
        const errorMessage = cachedResponses.missing
        assert.strictEqual(errorMessage, 'invalid-chargeid')
      })

      it('invalid querystring charge', async () => {
        const errorMessage = cachedResponses.invalid
        assert.strictEqual(errorMessage, 'invalid-chargeid')
      })
    })

    describe('invalid-charge', () => {
      it('ineligible querystring charge is already flagged', async () => {
        const errorMessage = cachedResponses.invalidCharge
        assert.strictEqual(errorMessage, 'invalid-charge')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const charge = cachedResponses.returns
      assert.strictEqual(charge.stripeObject.fraud_details.user_report, 'fraudulent')
    })
  })
})
