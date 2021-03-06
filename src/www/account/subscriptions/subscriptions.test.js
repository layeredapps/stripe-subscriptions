/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/account/subscriptions/subscriptions', function () {
  let cachedResponses, cachedSubscriptions
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    cachedSubscriptions = []
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestHelper.createOwner()
    await TestHelper.createProduct(administrator, {
      active: 'true'
    })
    const user = await TestStripeAccounts.createUserWithPaymentMethod()
    for (let i = 0, len = global.pageSize + 2; i < len; i++) {
      await TestHelper.createPrice(administrator, {
        productid: administrator.product.productid,
        currency: 'usd',
        recurring_interval: 'month',
        recurring_interval_count: '1',
        recurring_usage_type: 'metered',
        recurring_aggregate_usage: 'sum',
        billing_scheme: 'tiered',
        tax_behavior: 'inclusive',
        tiers_mode: 'volume',
        tier1_up_to: '1000',
        tier1_flat_amount: '9999',
        tier2_up_to: 'inf',
        tier2_flat_amount: '8999',
        active: 'true'
      })
      await TestStripeAccounts.createUserWithFreeSubscription(administrator.price, user)
      cachedSubscriptions.unshift(user.subscription.subscriptionid)
    }
    const req1 = TestHelper.createRequest('/account/subscriptions/subscriptions')
    req1.account = user.account
    req1.session = user.session
    req1.filename = __filename
    await req1.route.api.before(req1)
    cachedResponses.before = req1.data
    req1.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/subscriptions' },
      { click: '/account/subscriptions/subscriptions' }
    ]
    global.pageSize = 50
    cachedResponses.returns = await req1.get()
    delete (req1.screenshots)
    global.pageSize = 3
    cachedResponses.pageSize = await req1.get()
    global.pageSize = 2
    const req2 = TestHelper.createRequest('/account/subscriptions/subscriptions?offset=1')
    req2.account = user.account
    req2.session = user.session
    cachedResponses.offset = await req2.get()
    cachedResponses.finished = true
  }
  describe('before', () => {
    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const data = cachedResponses.before
      assert.strictEqual(data.subscriptions.length, global.pageSize)
      assert.strictEqual(data.subscriptions[0].id, cachedSubscriptions[0])
      assert.strictEqual(data.subscriptions[1].id, cachedSubscriptions[1])
    })
  })

  describe('view', () => {
    it('should return one page (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      const table = doc.getElementById('subscriptions-table')
      const rows = table.getElementsByTagName('tr')
      assert.strictEqual(rows.length, 5)
      // 4 created in loop
      // 1 table header
    })

    it('should change page size', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.pageSize
      const doc = TestHelper.extractDoc(result.html)
      const table = doc.getElementById('subscriptions-table')
      const rows = table.getElementsByTagName('tr')
      assert.strictEqual(rows.length, global.pageSize + 2)
    })

    it('should change offset', async function () {
      await bundledData(this.test.currentRetry())
      const offset = 1
      const result = cachedResponses.offset
      const doc = TestHelper.extractDoc(result.html)
      for (let i = 0, len = global.pageSize; i < len; i++) {
        assert.strictEqual(doc.getElementById(cachedSubscriptions[offset + i]).tag, 'tr')
      }
    })
  })
})
