/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/administrator/subscriptions/reset-subscription-coupon', function () {
  const cachedResponses = {}
  before(async () => {
    await TestHelper.setupBefore()
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestStripeAccounts.createOwnerWithPlan({
      amount: '1000',
      trial_period_days: '0',
      interval: 'month',
      usage_type: 'licensed'
    })
    await TestHelper.createCoupon(administrator, {
      publishedAt: 'true',
      percent_off: '25',
      duration: 'repeating',
      duration_in_months: '3'
    })
    // missing and invalid id
    const req = TestHelper.createRequest('/api/administrator/subscriptions/reset-subscription-coupon')
    req.account = administrator.account
    req.session = administrator.session
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.missing = error.message
    }
    const req2 = TestHelper.createRequest('/api/administrator/subscriptions/reset-subscription-coupon?subscriptionid=invalid')
    req2.account = administrator.account
    req2.session = administrator.session
    try {
      await req2.patch()
    } catch (error) {
      cachedResponses.invalid = error.message
    }
    // invalid subscription
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
    const req3 = TestHelper.createRequest(`/api/administrator/subscriptions/reset-subscription-coupon?subscriptionid=${user.subscription.subscriptionid}`)
    req3.account = administrator.account
    req3.session = administrator.session
    try {
      await req3.patch()
    } catch (error) {
      cachedResponses.invalidSubscription = error.message
    }
    // returns
    await TestHelper.createSubscriptionDiscount(administrator, user.subscription, administrator.coupon)
    const req4 = TestHelper.createRequest(`/api/administrator/subscriptions/reset-subscription-coupon?subscriptionid=${user.subscription.subscriptionid}`)
    req4.account = administrator.account
    req4.session = administrator.session
    req4.filename = __filename
    req4.saveResponse = true
    cachedResponses.returns = await req4.patch()
  })
  describe('exceptions', () => {
    describe('invalid-subscriptionid', () => {
      it('missing querystring subscriptionid', async () => {
        const errorMessage = cachedResponses.missing
        assert.strictEqual(errorMessage, 'invalid-subscriptionid')
      })

      it('invalid querystring subscriptionid', async () => {
        const errorMessage = cachedResponses.invalid
        assert.strictEqual(errorMessage, 'invalid-subscriptionid')
      })
    })

    describe('invalid-subscription', () => {
      it('ineligible querystring subscription has no discount', async () => {
        const errorMessage = cachedResponses.invalidSubscription
        assert.strictEqual(errorMessage, 'invalid-subscription')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const subscriptionNow = cachedResponses.returns
      assert.strictEqual(undefined, subscriptionNow.coupon)
    })
  })
})
