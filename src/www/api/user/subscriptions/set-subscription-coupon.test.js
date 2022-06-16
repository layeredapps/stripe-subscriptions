/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/subscriptions/set-subscription-coupon', function () {
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
    const coupon1 = await TestHelper.createCoupon(administrator, {
      active: 'true'
    })
    const coupon2 = await TestHelper.createCoupon(administrator, {
      active: 'true'
    })
    const currencyCoupon = await TestHelper.createCoupon(administrator, {
      active: 'true',
      amount_off: '2500',
      currency: 'jpy'
    })
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
    // missing and invalid id
    let req = TestHelper.createRequest('/api/user/subscriptions/set-subscription-coupon')
    req.account = user.account
    req.session = user.session
    req.body = {
      couponid: coupon1.couponid
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.missing = error.message
    }
    req = TestHelper.createRequest('/api/user/subscriptions/set-subscription-coupon?subscriptionid=invalid')
    req.account = user.account
    req.session = user.session
    req.body = {
      couponid: coupon1.couponid
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.invalid = error.message
    }
    // invalid subscription
    await TestHelper.createSubscriptionDiscount(administrator, user.subscription, coupon1)
    req = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-coupon?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = user.account
    req.session = user.session
    req.body = {
      couponid: coupon2.couponid
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.invalidSubscription = error.message
    }
    await TestStripeAccounts.createUserWithPaidSubscription(administrator.price, user)
    await TestHelper.cancelSubscription(user)
    req = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-coupon?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = user.account
    req.session = user.session
    req.body = {
      couponid: coupon1.couponid
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.invalidSubscription2 = error.message
    }
    // invalid account
    await TestStripeAccounts.createUserWithPaidSubscription(administrator.price, user)
    const user2 = await TestHelper.createUser()
    req = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-coupon?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = user2.account
    req.session = user2.session
    req.body = {
      couponid: coupon1.couponid
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.invalidAccount = error.message
    }
    // invalid and missing coupon
    req = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-coupon?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = user.account
    req.session = user.session
    req.body = {
      couponid: ''
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.missingCoupon = error.message
    }
    req = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-coupon?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = user.account
    req.session = user.session
    req.body = {
      couponid: 'invalid'
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.invalidCoupon = error.message
    }
    // invalid coupon
    req = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-coupon?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = user.account
    req.session = user.session
    req.body = {
      couponid: currencyCoupon.couponid
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.currencyCoupon = error.message
    }
    // returns
    req = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-coupon?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = user.account
    req.session = user.session
    req.body = {
      couponid: coupon1.couponid
    }
    req.filename = __filename
    req.saveResponse = true
    cachedResponses.returns = await req.patch()
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
      it('invalid querystring subscription has coupon', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidSubscription
        assert.strictEqual(errorMessage, 'invalid-subscription')
      })

      it('invalid querystring subscription is canceling', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidSubscription2
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

    describe('invalid-couponid', () => {
      it('missing posted couponid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missingCoupon
        assert.strictEqual(errorMessage, 'invalid-couponid')
      })

      it('invalid posted couponid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidCoupon
        assert.strictEqual(errorMessage, 'invalid-couponid')
      })
    })

    describe('invalid-coupon', () => {
      it('invalid posted coupon is other currency', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.currencyCoupon
        assert.strictEqual(errorMessage, 'invalid-coupon')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const subscriptionNow = cachedResponses.returns
      assert.strictEqual(subscriptionNow.stripeObject.discount.coupon.object, 'coupon')
    })
  })
})
