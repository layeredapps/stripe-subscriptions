/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')
const ScreenshotData = require('../../../../screenshot-data.js')

describe('/administrator/subscriptions/subscription', function () {
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
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
    // before
    const req = TestHelper.createRequest(`/administrator/subscriptions/subscription?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = administrator.account
    req.session = administrator.session
    await req.route.api.before(req)
    cachedResponses.before = req.data
    // returns
    req.filename = __filename
    req.screenshots = [
      { hover: '#administrator-menu-container' },
      { click: '/administrator/subscriptions' },
      { click: '/administrator/subscriptions/subscriptions' },
      { click: `/administrator/subscriptions/subscription?subscriptionid=${user.subscription.subscriptionid}` }
    ]
    global.pageSize = 50
    global.packageJSON.dashboard.server.push(ScreenshotData.administratorIndex)
    global.packageJSON.dashboard.server.push(ScreenshotData.administratorSubscriptions)
    cachedResponses.returns = await req.get()
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
    it('should present the subscription table (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      const table = doc.getElementById('subscriptions-table')
      assert.strictEqual(table.tag, 'table')
    })
  })

  describe('errors', () => {
    it('invalid-subscriptionid', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/subscription?subscriptionid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-subscriptionid')
    })
  })
})
