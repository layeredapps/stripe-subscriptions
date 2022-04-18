/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts')
const ScreenshotData = require('../../../../screenshot-data.js')

describe('/administrator/subscriptions', function () {
  let cachedResponses, cachedPlans, cachedSubscriptions, cachedCoupons
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
      await TestHelper.rotateWebhook(true)
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    cachedPlans = []
    cachedSubscriptions = []
    cachedCoupons = []
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestStripeAccounts.createOwnerWithPlan({
      amount: '1000',
      trial_period_days: '0',
      interval: 'month',
      usage_type: 'licensed'
    })
    cachedPlans.unshift(administrator.plan.planid)
    const user1 = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
    cachedSubscriptions.unshift(user1.subscription.subscriptionid)
    await TestHelper.createPlan(administrator, {
      productid: administrator.product.productid,
      usage_type: 'licensed',
      publishedAt: 'true',
      amount: '2000',
      trial_period_days: '0'
    })
    cachedPlans.unshift(administrator.plan.planid)
    const user2 = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
    cachedSubscriptions.unshift(user2.subscription.subscriptionid)
    const coupon1 = await TestHelper.createCoupon(administrator, {
      publishedAt: 'true',
      duration: 'repeating',
      duration_in_months: '3'
    })
    cachedCoupons.unshift(coupon1.couponid)
    const coupon2 = await TestHelper.createCoupon(administrator, {
      publishedAt: 'true',
      duration: 'repeating',
      duration_in_months: '3'
    })
    cachedCoupons.unshift(coupon2.couponid)
    const req = TestHelper.createRequest('/administrator/subscriptions')
    req.account = administrator.account
    req.session = administrator.session
    await req.route.api.before(req)
    cachedResponses.before = req.data
    req.filename = __filename
    req.screenshots = [
      { hover: '#administrator-menu-container' },
      { click: '/administrator/subscriptions' }
    ]
    global.pageSize = 50
    global.packageJSON.dashboard.server.push(ScreenshotData.administratorIndex)
    cachedResponses.view = await req.get()
    cachedResponses.finished = true
  }
  describe('before', () => {
    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const data = cachedResponses.before
      assert.strictEqual(data.plans[0].planid, cachedPlans[0])
      assert.strictEqual(data.plans[1].planid, cachedPlans[1])
      assert.strictEqual(data.coupons[0].couponid, cachedCoupons[0])
      assert.strictEqual(data.coupons[1].couponid, cachedCoupons[1])
      assert.strictEqual(data.subscriptions[0].subscriptionid, cachedSubscriptions[0])
      assert.strictEqual(data.subscriptions[1].subscriptionid, cachedSubscriptions[1])
    })
  })

  describe('view', () => {
    it('should have row for each plan', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.view
      const doc = TestHelper.extractDoc(result.html)
      const plan1Row = doc.getElementById(cachedPlans[0])
      const plan2Row = doc.getElementById(cachedPlans[1])
      assert.strictEqual(plan1Row.tag, 'tr')
      assert.strictEqual(plan2Row.tag, 'tr')
    })

    it('should have row for each coupon', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.view
      const doc = TestHelper.extractDoc(result.html)
      const coupon1Row = doc.getElementById(cachedCoupons[0])
      const coupon2Row = doc.getElementById(cachedCoupons[1])
      assert.strictEqual(coupon1Row.tag, 'tr')
      assert.strictEqual(coupon2Row.tag, 'tr')
    })

    it('should have row for each subscription (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.view
      const doc = TestHelper.extractDoc(result.html)
      const subscription1Row = doc.getElementById(cachedSubscriptions[0])
      const subscription2Row = doc.getElementById(cachedSubscriptions[1])
      assert.strictEqual(subscription1Row.tag, 'tr')
      assert.strictEqual(subscription2Row.tag, 'tr')
    })
  })
})
