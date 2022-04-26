/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/subscriptions/delete-subscription', function () {
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
    const administrator = await TestStripeAccounts.createOwnerWithPlan({
      amount: '1000',
      trial_period_days: '0',
      interval: 'month',
      usage_type: 'licensed'
    })
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
    // missing or invalid id
    const req = TestHelper.createRequest('/api/user/subscriptions/delete-subscription')
    req.account = user.account
    req.session = user.session
    req.body = {
      refund: 'at_period_end'
    }
    try {
      await req.delete()
    } catch (error) {
      cachedResponses.missing = error.message
    }
    const req2 = TestHelper.createRequest('/api/user/subscriptions/delete-subscription?subscriptionid=invalid')
    req2.account = user.account
    req2.session = user.session
    try {
      await req2.delete()
    } catch (error) {
      cachedResponses.invalid = error.message
    }
    // invalid account
    const user2 = await TestHelper.createUser()
    const req3 = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-canceled?subscriptionid=${user.subscription.subscriptionid}`)
    req3.account = user2.account
    req3.session = user2.session
    req3.body = {
      refund: 'at_period_end'
    }
    try {
      await req3.patch()
    } catch (error) {
      cachedResponses.invalidAccount = error.message
    }
    // invalid subscription
    await TestHelper.cancelSubscription(user)
    const req4 = TestHelper.createRequest(`/api/user/subscriptions/delete-subscription?subscriptionid=${user.subscription.subscriptionid}`)
    req4.account = user.account
    req4.session = user.session
    try {
      await req4.delete()
    } catch (error) {
      cachedResponses.invalidSubscription = error.message
    }
    // returns
    await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan, user)
    const req5 = TestHelper.createRequest(`/api/user/subscriptions/delete-subscription?subscriptionid=${user.subscription.subscriptionid}`)
    req5.account = user.account
    req5.session = user.session
    req5.body = {
      refund: 'credit'
    }
    req5.filename = __filename
    req5.saveResponse = true
    cachedResponses.returns = await req5.delete()
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

    describe('invalid-account', () => {
      it('ineligible accessing account', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidAccount
        assert.strictEqual(errorMessage, 'invalid-account')
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
    it('boolean', async () => {
      const deleted = cachedResponses.returns
      assert.strictEqual(deleted, true)
    })
  })
})
