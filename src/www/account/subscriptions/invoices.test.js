/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/account/subscriptions/invoices', function () {
  let cachedResponses, cachedInvoices
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
      await TestHelper.rotateWebhook(true)
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
      publishedAt: 'true'
    })
    const user = await TestStripeAccounts.createUserWithPaymentMethod()
    for (let i = 0, len = global.pageSize + 2; i < len; i++) {
      await TestHelper.createPlan(administrator, {
        productid: administrator.product.productid,
        usage_type: 'licensed',
        publishedAt: 'true',
        amount: '100000',
        trial_period_days: '0'
      })
      await TestStripeAccounts.createUserWithFreeSubscription(administrator.plan, user)
      cachedInvoices.unshift(user.invoice.invoiceid)
    }
    const req1 = TestHelper.createRequest('/account/subscriptions/invoices')
    req1.account = user.account
    req1.session = user.session
    req1.filename = __filename
    req1.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/subscriptions' },
      { click: '/account/subscriptions/invoices' }
    ]
    await req1.route.api.before(req1)
    cachedResponses.before = req1.data
    global.pageSize = 50
    cachedResponses.returns = await req1.get()
    global.pageSize = 3
    delete (req1.screenshots)
    cachedResponses.pageSize = await req1.get()
    global.pageSize = 2
    const req2 = TestHelper.createRequest('/account/subscriptions/invoices?offset=1')
    req2.account = user.account
    req2.session = user.session
    cachedResponses.offset = await req2.get()
    cachedResponses.finished = true
  }
  describe('before', () => {
    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const data = cachedResponses.before
      assert.strictEqual(data.invoices[0].id, cachedInvoices[0])
      assert.strictEqual(data.invoices[1].id, cachedInvoices[1])
    })
  })

  describe('view', () => {
    it('should return one page (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      const table = doc.getElementById('invoices-table')
      const rows = table.getElementsByTagName('tr')
      assert.strictEqual(rows.length, 5)
      // 4 created in loop
      // 1 table header
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
