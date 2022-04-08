/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/administrator/subscriptions/revoke-subscription-coupon', function () {
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
    // subscription without discount
    const req = TestHelper.createRequest(`/administrator/subscriptions/revoke-subscription-coupon?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = administrator.account
    req.session = administrator.session
    try {
      await req.route.api.before(req)
    } catch (error) {
      cachedResponses.invalidSubscription = error.message
    }
    // before
    await TestHelper.createCoupon(administrator, {
      publishedAt: 'true',
      percent_off: '25',
      duration: 'repeating',
      duration_in_months: '3'
    })
    await TestHelper.createSubscriptionDiscount(administrator, user.subscription, administrator.coupon)
    const req2 = TestHelper.createRequest(`/administrator/subscriptions/revoke-subscription-coupon?subscriptionid=${user.subscription.subscriptionid}`)
    req2.account = administrator.account
    req2.session = administrator.session
    await req2.route.api.before(req2)
    cachedResponses.before = req2.data
    // get
    cachedResponses.get = await req.get()
    // post
    req.filename = __filename
    req.screenshots = [
      { hover: '#administrator-menu-container' },
      { click: '/administrator/subscriptions' },
      { click: '/administrator/subscriptions/subscriptions' },
      { click: `/administrator/subscriptions/subscription?subscriptionid=${user.subscription.subscriptionid}` },
      { click: `/administrator/subscriptions/revoke-subscription-coupon?subscriptionid=${user.subscription.subscriptionid}` },
      { fill: '#submit-form' }
    ]
    cachedResponses.returns = await req.post()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    it('should reject invalid subscription', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/revoke-subscription-coupon?subscriptionid=invalid')
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

    it('should reject subscription without discount', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.invalidSubscription
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
    it('should remove coupon (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })
})
