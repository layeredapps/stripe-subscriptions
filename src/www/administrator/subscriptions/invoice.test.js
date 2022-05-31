/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')
const ScreenshotData = require('../../../../screenshot-data.js')

describe('/administrator/subscriptions/invoice', function () {
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
    const administrator = await TestStripeAccounts.createOwnerWithPrice({
      unit_amount: 3000,
      recurring_interval: 'month',
      recurring_usage_type: 'licensed'
    })
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
    // before
    const req = TestHelper.createRequest(`/administrator/subscriptions/invoice?invoiceid=${user.invoice.invoiceid}`)
    req.account = administrator.account
    req.session = administrator.session
    await req.route.api.before(req)
    cachedResponses.before = req.data
    // get
    req.filename = __filename
    req.screenshots = [
      { hover: '#administrator-menu-container' },
      { click: '/administrator/subscriptions' },
      { click: '/administrator/subscriptions/invoices' },
      { click: `/administrator/subscriptions/invoice?invoiceid=${user.invoice.invoiceid}` }
    ]
    global.pageSize = 50
    global.packageJSON.dashboard.server.push(ScreenshotData.administratorIndex)
    global.packageJSON.dashboard.server.push(ScreenshotData.administratorInvoices)
    cachedResponses.get = await req.get()
    cachedResponses.finished = true
  }

  describe('before', () => {
    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const data = cachedResponses.before
      assert.strictEqual(data.invoice.object, 'invoice')
    })
  })

  describe('view', () => {
    it('should present the invoice table (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.get
      const doc = TestHelper.extractDoc(result.html)
      const table = doc.getElementById('invoices-table')
      assert.strictEqual(table.tag, 'table')
    })
  })

  describe('error', () => {
    it('invalid-invoiceid', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/invoice?invoiceid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-invoiceid')
    })
  })
})
