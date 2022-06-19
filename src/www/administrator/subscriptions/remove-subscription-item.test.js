/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')
const ScreenshotData = require('../../../../screenshot-data.js')

describe('/administrator/subscriptions/remove-subscription-item', function () {
  let cachedResponses
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
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
    const price2 = await TestHelper.createPrice(administrator)
    await TestHelper.addSubscriptionItem(user, price2.priceid, 1)
    // before
    const req = TestHelper.createRequest(`/administrator/subscriptions/remove-subscription-item?subscriptionitemid=${user.subscription.stripeObject.items.data[0].id}`)
    req.account = administrator.account
    req.session = administrator.session
    await req.route.api.before(req)
    cachedResponses.before = req.data
    // returns
    cachedResponses.returns = await req.get()
    req.filename = __filename
    req.body = {}
    req.screenshots = [
      { hover: '#administrator-menu-container' },
      { click: '/administrator/subscriptions' },
      { click: '/administrator/subscriptions/subscriptions' },
      { click: `/administrator/subscriptions/subscription?subscriptionid=${user.subscription.subscriptionid}` },
      { click: `/administrator/subscriptions/subscription-item?subscriptionitemid=${user.subscription.stripeObject.items.data[0].id}` },
      { click: `/administrator/subscriptions/remove-subscription-item?subscriptionitemid=${user.subscription.stripeObject.items.data[0].id}` },
      { fill: '#submit-form' }
    ]
    global.pageSize = 50
    global.packageJSON.dashboard.server.push(ScreenshotData.administratorIndex)
    global.packageJSON.dashboard.server.push(ScreenshotData.administratorSubscriptions)
    cachedResponses.submit = await req.post()
    cachedResponses.finished = true
  }

  describe('before', () => {
    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const data = cachedResponses.before
      assert.strictEqual(data.subscriptionItem.object, 'subscription_item')
    })
  })

  describe('view', () => {
    it('should present the form', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should remove item (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submit
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })

  describe('errors', () => {
    it('invalid-subscriptionid', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/remove-subscription-item?subscriptionitemid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-subscriptionitemid')
    })
  })
})
