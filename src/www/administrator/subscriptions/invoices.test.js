/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')
const ScreenshotData = require('../../../../screenshot-data.js')

describe('/administrator/subscriptions/invoices', function () {
  let cachedResponses, cachedInvoices
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    cachedInvoices = []
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestHelper.createOwner()
    await TestHelper.createProduct(administrator, {
      active: 'true'
    })
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
      const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
      cachedInvoices.unshift(user.invoice.invoiceid)
    }
    const req1 = TestHelper.createRequest('/administrator/subscriptions/invoices')
    req1.account = administrator.account
    req1.session = administrator.session
    req1.filename = __filename
    req1.screenshots = [
      { hover: '#administrator-menu-container' },
      { click: '/administrator/subscriptions' },
      { click: '/administrator/subscriptions/invoices' }
    ]
    await req1.route.api.before(req1)
    cachedResponses.before = req1.data
    global.pageSize = 50
    global.packageJSON.dashboard.server.push(ScreenshotData.administratorIndex)
    global.packageJSON.dashboard.server.push(ScreenshotData.administratorInvoices)
    cachedResponses.returns = await req1.get()
    global.pageSize = 3
    delete (req1.screenshots)
    cachedResponses.pageSize = await req1.get()
    global.pageSize = 2
    const req2 = TestHelper.createRequest('/administrator/subscriptions/invoices?offset=1')
    req2.account = administrator.account
    req2.session = administrator.session
    cachedResponses.offset = await req2.get()
    cachedResponses.finished = true
  }
  describe('before', () => {
    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const data = cachedResponses.before
      assert.strictEqual(data.invoices.length, global.pageSize)
      assert.strictEqual(data.invoices[0].id, cachedInvoices[0])
      assert.strictEqual(data.invoices[1].id, cachedInvoices[1])
    })
  })

  describe('view', () => {
    it('should return one page (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      global.pageSize = 50
      const result = cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      const table = doc.getElementById('invoices-table')
      const rows = table.getElementsByTagName('tr')
      assert.strictEqual(rows.length, global.pageSize + 1)
    })

    it('should change page size', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.pageSize
      const doc = TestHelper.extractDoc(result.html)
      const table = doc.getElementById('invoices-table')
      const rows = table.getElementsByTagName('tr')
      assert.strictEqual(rows.length, global.pageSize + 2)
    })

    it('should change offset', async function () {
      await bundledData(this.test.currentRetry())
      const offset = 1
      const result = cachedResponses.offset
      const doc = TestHelper.extractDoc(result.html)
      for (let i = 0, len = global.pageSize; i < len; i++) {
        assert.strictEqual(doc.getElementById(cachedInvoices[offset + i]).tag, 'tr')
      }
    })
  })
})
