/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/account/subscriptions/pay-invoice', function () {
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
    global.subscriptionRefundPeriod = 7 * 24 * 60 * 60
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const user = await TestStripeAccounts.createUserWithPaymentMethod()
    cachedInvoice = await TestHelper.createAmountOwed(user)
    const req = TestHelper.createRequest(`/account/subscriptions/pay-invoice?invoiceid=${user.invoice.invoiceid}`)
    req.account = user.account
    req.session = user.session
    req.filename = __filename
    req.body = {
      paymentmethodid: user.paymentMethod.paymentmethodid
    }
    req.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/subscriptions' },
      { click: '/account/subscriptions/invoices' },
      { click: `/account/subscriptions/invoice?invoiceid=${user.invoice.invoiceid}` },
      { click: `/account/subscriptions/pay-invoice?invoiceid=${user.invoice.invoiceid}` },
      { fill: '#submit-form' }
    ]
    const req2 = TestHelper.createRequest(`/account/subscriptions/pay-invoice?invoiceid=${user.invoice.invoiceid}`)
    req2.account = user.account
    req2.session = user.session
    cachedResponses.returns = await req2.get()
    await req.route.api.before(req)
    // crsf
    req.puppeteer = false
    req.body['csrf-token'] = 'invalid'
    cachedResponses.csrf = await req.post()
    delete (req.puppeteer)
    delete (req.body['csrf-token'])
    // submit
    cachedResponses.before = req.data
    global.pageSize = 50
    cachedResponses.submit = await req.post()
    const user2 = await TestHelper.createUser()
    req2.account = user2.account
    req2.session = user2.session
    try {
      await req2.route.api.before(req2)
    } catch (error) {
      cachedResponses.invalidAccount = error.message
    }
    try {
      await req.route.api.before(req)
    } catch (error) {
      cachedResponses.invalidInvoice = error.message
    }
    cachedResponses.finished = true
  }
  describe('exceptions', () => {
    it('should reject invalid invoice', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/subscriptions/pay-invoice?invoiceid=invalid')
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-invoiceid')
    })

    it('invalid-account', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.invalidAccount
      assert.strictEqual(errorMessage, 'invalid-account')
    })

    it('should reject paid invoice', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.invalidInvoice
      assert.strictEqual(errorMessage, 'invalid-invoice')
    })
  })

  describe('before', () => {
    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const data = cachedResponses.before
      assert.strictEqual(data.invoice.id, cachedInvoice.invoiceid)
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
    it('should pay invoice (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submit
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })

  describe('errors', () => {
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
