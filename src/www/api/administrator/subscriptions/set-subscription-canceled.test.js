/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/administrator/subscriptions/set-subscription-canceled', function () {
  let cachedResponses
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
      await TestHelper.rotateWebhook(true)
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
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
    const req = TestHelper.createRequest('/api/administrator/subscriptions/set-subscription-canceled')
    req.account = administrator.account
    req.session = administrator.session
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.missing = error.message
    }
    const req2 = TestHelper.createRequest('/api/administrator/subscriptions/set-subscription-canceled?subscriptionid=invalid')
    req2.account = administrator.account
    req2.session = administrator.session
    try {
      await req2.patch()
    } catch (error) {
      cachedResponses.invalid = error.message
    }
    // invalid subscription
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
    await TestHelper.cancelSubscription(user)
    const req3 = TestHelper.createRequest(`/api/administrator/subscriptions/set-subscription-canceled?subscriptionid=${user.subscription.subscriptionid}`)
    req3.account = administrator.account
    req3.session = administrator.session
    req3.body = {
      refund: 'credit'
    }
    try {
      await req3.patch()
    } catch (error) {
      cachedResponses.invalidSubscription = error.message
    }
    // returns
    await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan, user)
    const req4 = TestHelper.createRequest(`/api/administrator/subscriptions/set-subscription-canceled?subscriptionid=${user.subscription.subscriptionid}`)
    req4.account = administrator.account
    req4.session = administrator.session
    req4.body = {
      refund: 'refund'
    }
    req4.filename = __filename
    req4.saveResponse = true
    cachedResponses.returns = await req4.patch()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    describe('invalid-subscriptionid', () => {
      it('missing querystring subscriptionid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missing
        assert.strictEqual(errorMessage, 'invalid-subscriptionid')
      })

      it('invalid querystring subscriptionid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalid
        assert.strictEqual(errorMessage, 'invalid-subscriptionid')
      })
    })

    describe('invalid-subscription', () => {
      it('ineligible querystring subscription is not active', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidSubscription
        assert.strictEqual(errorMessage, 'invalid-subscription')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const subscriptionNow = cachedResponses.returns
      assert.strictEqual(subscriptionNow.stripeObject.cancel_at_period_end, true)
    })
  })
})
