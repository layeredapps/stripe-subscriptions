/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/administrator/subscriptions/invoices', function () {
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
    await TestHelper.setupBefore()
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestStripeAccounts.createOwnerWithPlan({
      amount: '1000',
      trial_period_days: '0',
      interval: 'month',
      usage_type: 'licensed'
    })
    for (let i = 0, len = global.pageSize + 2; i < len; i++) {
      const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
      cachedInvoices.unshift(user.invoice.invoiceid)
    }
    const req = TestHelper.createRequest('/api/administrator/subscriptions/invoices?offset=1')
    req.account = administrator.account
    req.session = administrator.session
    cachedResponses.offset = await req.get()
    const req2 = TestHelper.createRequest('/api/administrator/subscriptions/invoices?limit=1')
    req2.account = administrator.account
    req2.session = administrator.session
    cachedResponses.limit = await req2.get()
    const req3 = TestHelper.createRequest('/api/administrator/subscriptions/invoices?all=true')
    req3.account = administrator.account
    req3.session = administrator.session
    cachedResponses.all = await req3.get()
    const req4 = TestHelper.createRequest('/api/administrator/subscriptions/invoices')
    req4.account = administrator.account
    req4.session = administrator.session
    req4.filename = __filename
    req4.saveResponse = true
    cachedResponses.returns = await req4.get()
    global.pageSize = 3
    cachedResponses.pageSize = await req4.get()
    cachedResponses.finished = true
  }
  describe('receives', () => {
    it('optional querystring offset (integer)', async function () {
      await bundledData(this.test.currentRetry())
      const offset = 1
      const invoicesNow = cachedResponses.offset
      for (let i = 0, len = global.pageSize; i < len; i++) {
        assert.strictEqual(invoicesNow[i].invoiceid, cachedInvoices[offset + i])
      }
    })

    it('optional querystring limit (integer)', async function () {
      await bundledData(this.test.currentRetry())
      const limit = 1
      const invoicesNow = cachedResponses.limit
      assert.strictEqual(invoicesNow.length, limit)
    })

    it('optional querystring all (boolean)', async () => {
      const invoicesNow = cachedResponses.all
      assert.strictEqual(invoicesNow.length, cachedInvoices.length)
    })
  })

  describe('returns', () => {
    it('array', async () => {
      const stripeAccounts = cachedResponses.returns
      assert.strictEqual(stripeAccounts.length, global.pageSize)
    })
  })

  describe('configuration', () => {
    it('environment PAGE_SIZE', async () => {
      global.pageSize = 3
      const stripeAccounts = cachedResponses.pageSize
      assert.strictEqual(stripeAccounts.length, global.pageSize)
    })
  })
})
