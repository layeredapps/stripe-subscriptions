/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')
const ScreenshotData = require('../../../../screenshot-data.js')

describe('/administrator/subscriptions/forgive-invoice', function () {
  let cachedResponses
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestStripeAccounts.createOwnerWithPrice()
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
    let req = TestHelper.createRequest(`/administrator/subscriptions/forgive-invoice?invoiceid=${user.invoice.invoiceid}`)
    req.account = administrator.account
    req.session = administrator.session
    await req.route.api.before(req)
    cachedResponses.paidInvoice = req.error
    await TestHelper.createAmountOwed(user)
    await TestHelper.forgiveInvoice(administrator, user.invoice.invoiceid)
    req = TestHelper.createRequest(`/administrator/subscriptions/forgive-invoice?invoiceid=${user.invoice.invoiceid}`)
    req.account = administrator.account
    req.session = administrator.session
    await req.route.api.before(req)
    cachedResponses.forgivenInvoice = req.error
    await TestHelper.createAmountOwed(user)
    req = TestHelper.createRequest(`/administrator/subscriptions/forgive-invoice?invoiceid=${user.invoice.invoiceid}`)
    req.account = administrator.account
    req.session = administrator.session
    await req.route.api.before(req)
    cachedResponses.before = req.data
    cachedResponses.view = await req.get()
    // csrf
    req.puppeteer = false
    req.body = {
      'csrf-token': ''
    }
    cachedResponses.csrf = await req.post()
    delete (req.puppeteer)
    delete (req.body)
    // submit
    req.filename = __filename
    req.screenshots = [
      { hover: '#administrator-menu-container' },
      { click: '/administrator/subscriptions' },
      { click: '/administrator/subscriptions/invoices' },
      { click: `/administrator/subscriptions/invoice?invoiceid=${user.invoice.invoiceid}` },
      { click: `/administrator/subscriptions/forgive-invoice?invoiceid=${user.invoice.invoiceid}` },
      { fill: '#submit-form' }
    ]
    global.pageSize = 50
    global.packageJSON.dashboard.server.push(ScreenshotData.administratorIndex)
    global.packageJSON.dashboard.server.push(ScreenshotData.administratorInvoices)
    cachedResponses.result = await req.post()
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
    it('should present the form', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.view
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should forgive invoice (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.result
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })

  describe('errors', () => {
    it('invalid-invoiceid', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/forgive-invoice?invoiceid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-invoiceid')
    })

    it('already-paid', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.paidInvoice
      assert.strictEqual(errorMessage, 'already-paid')
    })

    it('already-forgiven', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.forgivenInvoice
      assert.strictEqual(errorMessage, 'already-forgiven')
    })

    it('invalid-csrf-token', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.csrf
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-csrf-token')
    })
  })
})
