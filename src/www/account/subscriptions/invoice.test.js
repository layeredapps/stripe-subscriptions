/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/account/subscriptions/invoice', function () {
  let cachedResponses
  let cachedInvoice
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
    const administrator = await TestStripeAccounts.createOwnerWithPrice()
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
    cachedInvoice = user.invoice
    const req1 = TestHelper.createRequest(`/account/subscriptions/invoice?invoiceid=${user.invoice.invoiceid}`)
    req1.account = user.account
    req1.session = user.session
    req1.filename = __filename
    req1.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/subscriptions' },
      { click: '/account/subscriptions/invoices' },
      { click: `/account/subscriptions/invoice?invoiceid=${user.invoice.invoiceid}` }
    ]
    await req1.route.api.before(req1)
    cachedResponses.before = req1.data
    global.pageSize = 50
    cachedResponses.returns = await req1.get()
    const user2 = await TestHelper.createUser()
    const req2 = TestHelper.createRequest(`/account/subscriptions/invoice?invoiceid=${user.invoice.invoiceid}`)
    req2.account = user2.account
    req2.session = user2.session
    await req2.route.api.before(req2)
    cachedResponses.invalidAccount = req2.error
    cachedResponses.finished = true
  }

  describe('before', () => {
    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const data = cachedResponses.before
      assert.strictEqual(data.invoice.invoiceid, cachedInvoice.invoiceid)
    })
  })

  describe('view', () => {
    it('should have row for invoice (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      const tbody = doc.getElementById(cachedInvoice.invoiceid)
      assert.strictEqual(tbody.tag, 'tbody')
    })
  })

  describe('errors', () => {
    it('invalid-invoiceid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/subscriptions/invoice?invoiceid=invalid')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-invoiceid')
    })

    it('invalid-account', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.invalidAccount
      assert.strictEqual(errorMessage, 'invalid-account')
    })
  })
})
