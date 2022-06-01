/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/subscriptions/reset-subscription-canceling', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
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
    const administrator = await TestStripeAccounts.createOwnerWithPrice()
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
    // missing or invalid id
    const req = TestHelper.createRequest('/api/user/subscriptions/reset-subscription-canceling')
    req.account = user.account
    req.session = user.session
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.missing = error.message
    }
    const req2 = TestHelper.createRequest('/api/user/subscriptions/reset-subscription-canceling?subscriptionid=invalid')
    req2.account = user.account
    req2.session = user.session
    try {
      await req2.patch()
    } catch (error) {
      cachedResponses.invalid = error.message
    }
    // invalid subscription
    const req3 = TestHelper.createRequest(`/api/user/subscriptions/reset-subscription-canceling?subscriptionid=${user.subscription.subscriptionid}`)
    req3.account = user.account
    req3.session = user.session
    try {
      await req3.patch()
    } catch (error) {
      cachedResponses.invalidSubscription = error.message
    }
    // invalid account
    const user2 = await TestHelper.createUser()
    const req4 = TestHelper.createRequest(`/api/user/subscriptions/reset-subscription-canceling?subscriptionid=${user.subscription.subscriptionid}`)
    req4.account = user2.account
    req4.session = user2.session
    try {
      await req4.patch()
    } catch (error) {
      cachedResponses.invalidAccount = error.message
    }
    // returns
    await TestHelper.cancelSubscription(user)
    const req5 = TestHelper.createRequest(`/api/user/subscriptions/reset-subscription-canceling?subscriptionid=${user.subscription.subscriptionid}`)
    req5.account = user.account
    req5.session = user.session
    req5.filename = __filename
    req5.saveResponse = true
    cachedResponses.returns = await req5.patch()
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
      it('invalid querystring subscription is active', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidSubscription
        assert.strictEqual(errorMessage, 'invalid-subscription')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidAccount
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const subscriptionNow = cachedResponses.returns
      assert.strictEqual(subscriptionNow.stripeObject.cancel_at_period_end, false)
    })
  })
})
