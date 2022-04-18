/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')
const ScreenshotData = require('../../../../screenshot-data.js')

describe('/administrator/subscriptions/apply-subscription-coupon', function () {
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
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestStripeAccounts.createOwnerWithPlan({ amount: '1000' })
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
    // canceling subscription
    await TestHelper.cancelSubscription(user)
    const req = TestHelper.createRequest(`/administrator/subscriptions/apply-subscription-coupon?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = administrator.account
    req.session = administrator.session
    try {
      await req.route.api.before(req)
    } catch (error) {
      cachedResponses.cancelingSubscription = error.message
    }
    // free subscription
    const administrator2 = await TestStripeAccounts.createOwnerWithPlan({ amount: 0 })
    const user2 = await TestStripeAccounts.createUserWithFreeSubscription(administrator2.plan)
    const req2 = TestHelper.createRequest(`/administrator/subscriptions/apply-subscription-coupon?subscriptionid=${user2.subscription.subscriptionid}`)
    req2.account = administrator.account
    req2.session = administrator.session
    try {
      await req2.route.api.before(req2)
    } catch (error) {
      cachedResponses.freeSubscription = error.message
    }
    // has coupon
    const user3 = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
    await TestHelper.createCoupon(administrator, {
      publishedAt: 'true',
      duration: 'repeating',
      duration_in_months: '3'
    })
    await TestHelper.createSubscriptionDiscount(administrator, user3.subscription, administrator.coupon)
    const req3 = TestHelper.createRequest(`/administrator/subscriptions/apply-subscription-coupon?subscriptionid=${user3.subscription.subscriptionid}`)
    req3.account = administrator.account
    req3.session = administrator.session
    req3.body = {
      couponid: administrator.coupon.couponid
    }
    try {
      await req3.route.api.before(req3)
    } catch (error) {
      cachedResponses.existingCoupon = error.message
    }
    // before
    await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan, user)
    const req4 = TestHelper.createRequest(`/administrator/subscriptions/apply-subscription-coupon?subscriptionid=${user.subscription.subscriptionid}`)
    req4.account = administrator.account
    req4.session = administrator.session
    await req4.route.api.before(req4)
    cachedResponses.before = req4.data
    // get
    cachedResponses.get = await req4.get()
    // post
    req4.filename = __filename
    req4.body = {
      couponid: administrator.coupon.couponid
    }
    req4.screenshots = [
      { hover: '#administrator-menu-container' },
      { click: '/administrator/subscriptions' },
      { click: '/administrator/subscriptions/subscriptions' },
      { click: `/administrator/subscriptions/subscription?subscriptionid=${user.subscription.subscriptionid}` },
      { click: `/administrator/subscriptions/apply-subscription-coupon?subscriptionid=${user.subscription.subscriptionid}` },
      { fill: '#submit-form' }
    ]
    global.pageSize = 50
    global.packageJSON.dashboard.server.push(ScreenshotData.administratorIndex)
    global.packageJSON.dashboard.server.push(ScreenshotData.administratorSubscriptions)
    cachedResponses.returns = await req4.post()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    it('should reject invalid subscription', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/apply-subscription-coupon?subscriptionid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-subscriptionid')
    })

    it('should reject canceling subscription', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.cancelingSubscription
      assert.strictEqual(errorMessage, 'invalid-subscription')
    })

    it('should reject free subscription', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.freeSubscription
      assert.strictEqual(errorMessage, 'invalid-subscription')
    })

    it('should reject subscription with coupon', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.existingCoupon
      assert.strictEqual(errorMessage, 'invalid-subscription')
    })
  })

  describe('before', () => {
    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const data = cachedResponses.before
      assert.strictEqual(data.subscription.object, 'subscription')
    })
  })

  describe('view', () => {
    it('should present the form', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.get
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should apply coupon (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })
})
