/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/subscriptions/create-cancelation-refund', function () {
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
    // missing and invalid id
    const req = TestHelper.createRequest('/api/user/subscriptions/create-cancelation-refund')
    req.account = user.account
    req.session = user.session
    req.body = {
      refund: 'at_period_end'
    }
    try {
      await req.post()
    } catch (error) {
      cachedResponses.missing = error.message
    }
    const req2 = TestHelper.createRequest('/api/user/subscriptions/create-cancelation-refund?subscriptionid=invalid')
    req2.account = user.account
    req2.session = user.session
    try {
      await req2.post()
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
      cachedResponses.account = error.message
    }
    // invalid subscription
    const user3 = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
    await TestHelper.cancelSubscription(user3)
    const req4 = TestHelper.createRequest(`/api/user/subscriptions/create-cancelation-refund?subscriptionid=${user3.subscription.subscriptionid}`)
    req4.account = user3.account
    req4.session = user3.session
    try {
      await req4.post()
    } catch (error) {
      cachedResponses.inactiveSubscription = error.message
    }
    await TestHelper.createPrice(administrator, {
      productid: administrator.product.productid,
      publishedAt: 'true',
      unit_amount: 0,
      recurring_interval: 'month',
      recurring_usage_type: 'licensed'
    })
    const user4 = await TestStripeAccounts.createUserWithFreeSubscription(administrator.price)
    const req5 = TestHelper.createRequest(`/api/user/subscriptions/create-cancelation-refund?subscriptionid=${user4.subscription.subscriptionid}`)
    req5.account = user4.account
    req5.session = user4.session
    try {
      await req5.post()
    } catch (error) {
      cachedResponses.freeSubscription = error.message
    }
    // returns
    const req6 = TestHelper.createRequest(`/api/user/subscriptions/create-cancelation-refund?subscriptionid=${user.subscription.subscriptionid}`)
    req6.account = user.account
    req6.session = user.session
    req6.body = {
      refund: 'credit'
    }
    req6.filename = __filename
    req6.saveResponse = true
    cachedResponses.returns = await req6.post()
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
        const errorMessage = cachedResponses.account
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-subscription', () => {
      it('ineligible querystring subscription is not active', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.inactiveSubscription
        assert.strictEqual(errorMessage, 'invalid-subscription')
      })

      it('ineligible querystring subscription is free', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.freeSubscription
        assert.strictEqual(errorMessage, 'invalid-subscription')
      })

      // TODO: requires modifying create-subscription to skip requiring payment method
      // it('ineligible querystring subscription is in free trial', async () => {
      //   const administrator = await TestStripeAccounts.createOwnerWithPrice()
      //   const user = await TestHelper.createUser()
      //   await TestHelper.createCustomer(user, {
      //     email: user.profile.contactEmail,
      //     description: user.profile.fullName
      //   })
      //   await TestHelper.createSubscription(user, administrator.price.priceid)
      //   const req2 = TestHelper.createRequest(`/api/user/subscriptions/create-cancelation-refund?subscriptionid=${user.subscription.subscriptionid}`)
      //   req2.account = user.account
      //   req2.session = user.session
      //   let errorMessage
      //   try {
      //     await req2.post()
      //   } catch (error) {
      //     errorMessage = error.message
      //   }
      //   assert.strictEqual(errorMessage, 'invalid-subscription')
      // })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const refundNow = cachedResponses.returns
      assert.strictEqual(refundNow.object, 'refund')
    })
  })
})
