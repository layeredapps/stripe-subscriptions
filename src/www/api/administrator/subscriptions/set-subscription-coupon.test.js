/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/administrator/subscriptions/set-subscription-coupon', function () {
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
    const publishedCoupon = await TestHelper.createCoupon(administrator, {
      publishedAt: 'true',
      duration: 'repeating',
      duration_in_months: '3'
    })
    // subscription is cancelling
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
    await TestHelper.cancelSubscription(user)
    const user2 = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
    await TestHelper.createSubscriptionDiscount(administrator, user2.subscription, administrator.coupon)
    const user3 = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
    const req = TestHelper.createRequest(`/api/administrator/subscriptions/set-subscription-coupon?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      couponid: administrator.coupon.couponid
    }
    try {
      await req.patch(req)
    } catch (error) {
      cachedResponses.subscriptionCanceling = error.message
    }
    // subscription is already discounted
    const req2 = TestHelper.createRequest(`/api/administrator/subscriptions/set-subscription-coupon?subscriptionid=${user2.subscription.subscriptionid}`)
    req2.account = administrator.account
    req2.session = administrator.session
    req2.body = {
      couponid: administrator.coupon.couponid
    }
    try {
      await req2.patch(req)
    } catch (error) {
      cachedResponses.subscriptionDiscounted = error.message
    }
    // missing and invalid coupon
    const req3 = TestHelper.createRequest(`/api/administrator/subscriptions/set-subscription-coupon?subscriptionid=${user3.subscription.subscriptionid}`)
    req3.account = administrator.account
    req3.session = administrator.session
    req3.body = {
      couponid: ''
    }
    try {
      await req3.patch(req)
    } catch (error) {
      cachedResponses.missingCoupon = error.message
    }
    const req4 = TestHelper.createRequest(`/api/administrator/subscriptions/set-subscription-coupon?subscriptionid=${user3.subscription.subscriptionid}`)
    req4.account = administrator.account
    req4.session = administrator.session
    req4.body = {
      couponid: 'invalid'
    }
    try {
      await req4.patch(req)
    } catch (error) {
      cachedResponses.invalidCoupon = error.message
    }
    // not-published and unpublished coupon
    await TestHelper.createCoupon(administrator, {
      duration: 'repeating',
      duration_in_months: '3'
    })
    const req5 = TestHelper.createRequest(`/api/administrator/subscriptions/set-subscription-coupon?subscriptionid=${user3.subscription.subscriptionid}`)
    req5.account = administrator.account
    req5.session = administrator.session
    req5.body = {
      couponid: administrator.coupon.couponid
    }
    try {
      await req5.patch(req)
    } catch (error) {
      cachedResponses.notPublished = error.message
    }
    await TestHelper.createCoupon(administrator, {
      publishedAt: 'true',
      unpublishedAt: 'true',
      duration: 'repeating',
      duration_in_months: '3'
    })
    const req6 = TestHelper.createRequest(`/api/administrator/subscriptions/set-subscription-coupon?subscriptionid=${user3.subscription.subscriptionid}`)
    req6.account = administrator.account
    req6.session = administrator.session
    req6.body = {
      couponid: administrator.coupon.couponid
    }
    try {
      await req6.patch(req)
    } catch (error) {
      cachedResponses.unpublishedAt = error.message
    }
    // success
    const req7 = TestHelper.createRequest(`/api/administrator/subscriptions/set-subscription-coupon?subscriptionid=${user3.subscription.subscriptionid}`)
    req7.account = administrator.account
    req7.session = administrator.session
    req7.body = {
      couponid: publishedCoupon.couponid
    }
    req7.filename = __filename
    req7.saveResponse = true
    cachedResponses.returns = await req7.patch()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    describe('invalid-subscriptionid', () => {
      it('missing querystring subscriptionid', async function () {
        await bundledData(this.test.currentRetry())
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/set-subscription-coupon')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          couponid: 'fake'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-subscriptionid')
      })

      it('invalid querystring subscriptionid', async function () {
        await bundledData(this.test.currentRetry())
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/set-subscription-coupon?subscriptionid=invalid')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          couponid: 'fake'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-subscriptionid')
      })
    })

    describe('invalid-subscription', () => {
      it('ineligible subscription is canceling', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.subscriptionCanceling
        assert.strictEqual(errorMessage, 'invalid-subscription')
      })

      it('ineligible subscription has coupon', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.subscriptionDiscounted
        assert.strictEqual(errorMessage, 'invalid-subscription')
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
      it('ineligible posted coupon is not published', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.notPublished
        assert.strictEqual(errorMessage, 'invalid-coupon')
      })

      it('ineligible posted coupon is unpublished', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.unpublishedAt
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
