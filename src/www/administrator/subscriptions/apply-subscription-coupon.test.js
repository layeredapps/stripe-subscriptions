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
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestStripeAccounts.createOwnerWithPrice()
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
    // canceling subscription
    await TestHelper.cancelSubscription(user)
    const req = TestHelper.createRequest(`/administrator/subscriptions/apply-subscription-coupon?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = administrator.account
    req.session = administrator.session
    await req.route.api.before(req)
    cachedResponses.cancelingSubscription = req.error
    // free subscription
    const administrator2 = await TestStripeAccounts.createOwnerWithPrice({
      productid: administrator.product.productid,
      unit_amount: 0,
      currency: 'usd',
      tax_behavior: 'inclusive',
      recurring_interval: 'month',
      recurring_interval_count: '1',
      recurring_usage_type: 'licensed'
    })
    const user2 = await TestStripeAccounts.createUserWithFreeSubscription(administrator2.price)
    const req2 = TestHelper.createRequest(`/administrator/subscriptions/apply-subscription-coupon?subscriptionid=${user2.subscription.subscriptionid}`)
    req2.account = administrator.account
    req2.session = administrator.session
    await req2.route.api.before(req2)
    cachedResponses.freeSubscription = req2.error
    // has coupon
    const user3 = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
    await TestHelper.createCoupon(administrator, {
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
    await req3.route.api.before(req3)
    cachedResponses.existingCoupon = req3.error
    // before
    await TestStripeAccounts.createUserWithPaidSubscription(administrator.price, user)
    const req4 = TestHelper.createRequest(`/administrator/subscriptions/apply-subscription-coupon?subscriptionid=${user.subscription.subscriptionid}`)
    req4.account = administrator.account
    req4.session = administrator.session
    await req4.route.api.before(req4)
    cachedResponses.before = req4.data
    // get
    cachedResponses.get = await req4.get()
    // csrf
    req4.puppeteer = false
    req4.body = {
      'csrf-token': ''
    }
    cachedResponses.csrf = await req4.post()
    delete (req4.puppeteer)
    delete (req4.body['csrf-token'])
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

  describe('errors', () => {
    it('invalid-subscriptionid', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/apply-subscription-coupon?subscriptionid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-subscriptionid')
    })

    it('invalid-subscription-canceling', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.cancelingSubscription
      assert.strictEqual(errorMessage, 'invalid-subscription-canceling')
    })

    it('invalid-subscription-free', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.freeSubscription
      assert.strictEqual(errorMessage, 'invalid-subscription-free')
    })

    it('already-discounted', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.existingCoupon
      assert.strictEqual(errorMessage, 'already-discounted')
    })

    it('invalid-csrf-token', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.csrf
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-csrf-token')
    })
  })
})
