/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/administrator/subscriptions/invoices', function () {
  let cachedResponses, cachedInvoices
  async function bundledData () {
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
    for (let i = 0, len = global.pageSize + 2; i < len; i++) {
      await TestHelper.createPlan(administrator, {
        productid: administrator.product.productid,
        usage_type: 'licensed',
        publishedAt: 'true',
        amount: '100000',
        trial_period_days: '0'
      })
      const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
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
    cachedResponses.returns = await req1.get()
    global.pageSize = 3
    cachedResponses.pageSize = await req1.get()
    const req2 = TestHelper.createRequest('/administrator/subscriptions/invoices?offset=1')
    req2.account = administrator.account
    req2.session = administrator.session
    cachedResponses.offset = await req2.get()
    cachedResponses.finished = true
  }
  describe('before', () => {
    it('should bind data to req', async () => {
      await bundledData()
      const data = cachedResponses.before
      assert.strictEqual(data.invoices.length, global.pageSize)
      assert.strictEqual(data.invoices[0].id, cachedInvoices[0])
      assert.strictEqual(data.invoices[1].id, cachedInvoices[1])
    })
  })

  describe('view', () => {
    it('should return one page (screenshots)', async () => {
      await bundledData()
      const result = cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      const table = doc.getElementById('invoices-table')
      const rows = table.getElementsByTagName('tr')
      assert.strictEqual(rows.length, global.pageSize + 1)
    })

    it('should change page size', async () => {
      await bundledData()
      global.pageSize = 3
      const result = cachedResponses.pageSize
      const doc = TestHelper.extractDoc(result.html)
      const table = doc.getElementById('invoices-table')
      const rows = table.getElementsByTagName('tr')
      assert.strictEqual(rows.length, global.pageSize + 1)
    })

    it('should change page size', async () => {
      await bundledData()
      const offset = 1
      const result = cachedResponses.offset
      const doc = TestHelper.extractDoc(result.html)
      for (let i = 0, len = global.pageSize; i < len; i++) {
        assert.strictEqual(doc.getElementById(cachedInvoices[offset + i]).tag, 'tr')
      }
    })
  })
})
