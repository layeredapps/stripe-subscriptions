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
    const administrator = await TestStripeAccounts.createOwnerWithPrice({
      unit_amount: 3000,
      recurring_interval: 'month',
      recurring_usage_type: 'licensed'
    })
    const coupon1 = await TestHelper.createCoupon(administrator, {
      publishedAt: 'true'
    })
    const coupon2 = await TestHelper.createCoupon(administrator, {
      publishedAt: 'true'
    })
    const unpublishedCoupon = await TestHelper.createCoupon(administrator, {
      publishedAt: 'true',
      unpublishedAt: 'true'
    })
    const notPublishedCoupon = await TestHelper.createCoupon(administrator, {
    })
    const currencyCoupon = await TestHelper.createCoupon(administrator, {
      amount_off: '2500',
      currency: 'jpy'
    })
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
    // missing and invalid id
    const req = TestHelper.createRequest('/api/user/subscriptions/set-subscription-coupon')
    req.account = user.account
    req.session = user.session
    req.body = {
      couponid: 'invalid'
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.missing = error.message
    }
    const req2 = TestHelper.createRequest('/api/user/subscriptions/set-subscription-coupon?subscriptionid=invalid')
    req2.account = user.account
    req2.session = user.session
    req2.body = {
      couponid: 'invalid'
    }
    try {
      await req2.patch()
    } catch (error) {
      cachedResponses.invalid = error.message
    }
    // invalid subscription
    await TestHelper.createSubscriptionDiscount(administrator, user.subscription, coupon1)
    const req3 = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-coupon?subscriptionid=${user.subscription.subscriptionid}`)
    req3.account = user.account
    req3.session = user.session
    req3.body = {
      couponid: coupon2.couponid
    }
    try {
      await req3.patch()
    } catch (error) {
      cachedResponses.invalidSubscription = error.message
    }
    await TestStripeAccounts.createUserWithPaidSubscription(administrator.price, user)
    await TestHelper.cancelSubscription(user)
    const req4 = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-coupon?subscriptionid=${user.subscription.subscriptionid}`)
    req4.account = user.account
    req4.session = user.session
    req4.body = {
      couponid: coupon1.couponid
    }
    try {
      await req4.patch()
    } catch (error) {
      cachedResponses.invalidSubscription2 = error.message
    }
    // invalid account
    await TestStripeAccounts.createUserWithPaidSubscription(administrator.price, user)
    const user2 = await TestHelper.createUser()
    const req5 = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-coupon?subscriptionid=${user.subscription.subscriptionid}`)
    req5.account = user2.account
    req5.session = user2.session
    req5.body = {
      couponid: coupon1.couponid
    }
    try {
      await req5.patch()
    } catch (error) {
      cachedResponses.invalidAccount = error.message
    }
    // invalid and missing coupon
    const req6 = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-coupon?subscriptionid=${user.subscription.subscriptionid}`)
    req6.account = user.account
    req6.session = user.session
    req6.body = {
      couponid: ''
    }
    try {
      await req6.patch()
    } catch (error) {
      cachedResponses.missingCoupon = error.message
    }
    const req7 = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-coupon?subscriptionid=${user.subscription.subscriptionid}`)
    req7.account = user.account
    req7.session = user.session
    req7.body = {
      couponid: 'invalid'
    }
    try {
      await req7.patch()
    } catch (error) {
      cachedResponses.invalidCoupon = error.message
    }
    // unpublished coupon
    const req8 = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-coupon?subscriptionid=${user.subscription.subscriptionid}`)
    req8.account = user.account
    req8.session = user.session
    req8.body = {
      couponid: notPublishedCoupon.couponid
    }
    try {
      await req8.patch()
    } catch (error) {
      cachedResponses.notPublishedCoupon = error.message
    }
    const req9 = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-coupon?subscriptionid=${user.subscription.subscriptionid}`)
    req9.account = user.account
    req9.session = user.session
    req9.body = {
      couponid: unpublishedCoupon.couponid
    }
    try {
      await req9.patch()
    } catch (error) {
      cachedResponses.unpublishedAtCoupon = error.message
    }
    const req10 = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-coupon?subscriptionid=${user.subscription.subscriptionid}`)
    req10.account = user.account
    req10.session = user.session
    req10.body = {
      couponid: currencyCoupon.couponid
    }
    try {
      await req10.patch()
    } catch (error) {
      cachedResponses.currencyCoupon = error.message
    }
    // returns
    const req11 = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-coupon?subscriptionid=${user.subscription.subscriptionid}`)
    req11.account = user.account
    req11.session = user.session
    req11.body = {
      couponid: coupon1.couponid
    }
    req11.filename = __filename
    req11.saveResponse = true
    cachedResponses.returns = await req11.patch()
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
      it('invalid posted coupon is not published', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.notPublishedCoupon
        assert.strictEqual(errorMessage, 'invalid-coupon')
      })

      it('invalid posted coupon is unpublished', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.unpublishedAtCoupon
        assert.strictEqual(errorMessage, 'invalid-coupon')
      })

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
