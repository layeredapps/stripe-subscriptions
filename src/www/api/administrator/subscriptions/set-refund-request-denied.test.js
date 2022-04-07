/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/administrator/subscriptions/set-refund-request-denied', function () {
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
    const req = TestHelper.createRequest('/api/administrator/subscriptions/set-refund-request-denied')
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      reason: 'no'
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.missing = error.message
    }
    const req2 = TestHelper.createRequest('/api/administrator/subscriptions/set-refund-request-denied?chargeid=invalid')
    req2.account = administrator.account
    req2.session = administrator.session
    req2.body = {
      reason: 'no'
    }
    try {
      await req2.patch()
    } catch (error) {
      cachedResponses.invalid = error.message
    }
    // invalid charge
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
    const req3 = TestHelper.createRequest(`/api/administrator/subscriptions/set-refund-request-denied?chargeid=${user.charge.chargeid}`)
    req3.account = administrator.account
    req3.session = administrator.session
    req3.body = {
      reason: 'no'
    }
    try {
      await req3.patch()
    } catch (error) {
      cachedResponses
        .invalidCharge = error.message
    }
    await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan, user)
    await TestHelper.requestRefund(user, user.charge.chargeid)
    await TestHelper.denyRefund(administrator, user, user.charge.chargeid)
    const req4 = TestHelper.createRequest(`/api/administrator/subscriptions/set-refund-request-denied?chargeid=${user.charge.chargeid}`)
    req4.account = administrator.account
    req4.session = administrator.session
    req4.body = {
      reason: 'no'
    }
    try {
      await req4.patch()
    } catch (error) {
      cachedResponses.invalidCharge2 = error.message
    }
    // returns
    await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan, user)
    await TestHelper.requestRefund(user, user.charge.chargeid)
    const req5 = TestHelper.createRequest(`/api/administrator/subscriptions/set-refund-request-denied?chargeid=${user.charge.chargeid}`)
    req5.account = administrator.account
    req5.session = administrator.session
    req5.body = {
      reason: 'no'
    }
    req5.filename = __filename
    req5.saveResponse = true
    cachedResponses.returns = await req5.patch()
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

    describe('invalid-charge', () => {
      it('ineligible querystring charge has no refund request', async () => {
        const errorMessage = cachedResponses.invalidCharge
        assert.strictEqual(errorMessage, 'invalid-charge')
      })

      it('ineligible querystring charge has denied request already', async () => {
        const errorMessage = cachedResponses.invalidCharge2
        assert.strictEqual(errorMessage, 'invalid-charge')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const charge = cachedResponses.returns
      assert.notStrictEqual(charge.refundDenied, undefined)
      assert.notStrictEqual(charge.refundDenied, null)
      assert.strictEqual(charge.refundDeniedReason, 'no')
    })
  })
})
