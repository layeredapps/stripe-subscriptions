/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/administrator/subscriptions/forgive-invoice', function () {
  let cachedResponses
  async function bundledData () {
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestStripeAccounts.createOwnerWithPlan({
      amount: '1000',
      trial_period_days: '0',
      interval: 'month',
      usage_type: 'licensed'
    })
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
    let req = TestHelper.createRequest(`/administrator/subscriptions/forgive-invoice?invoiceid=${user.invoice.invoiceid}`)
    req.account = administrator.account
    req.session = administrator.session
    try {
      await req.route.api.before(req)
    } catch (error) {
      cachedResponses.paidInvoice = error.message
    }
    await TestHelper.createAmountOwed(user)
    await TestHelper.forgiveInvoice(administrator, user.invoice.invoiceid)
    req = TestHelper.createRequest(`/administrator/subscriptions/forgive-invoice?invoiceid=${user.invoice.invoiceid}`)
    req.account = administrator.account
    req.session = administrator.session
    try {
      await req.route.api.before(req)
    } catch (error) {
      cachedResponses.forgivenInvoice = error.message
    }
    await TestHelper.createAmountOwed(user)
    req = TestHelper.createRequest(`/administrator/subscriptions/forgive-invoice?invoiceid=${user.invoice.invoiceid}`)
    req.account = administrator.account
    req.session = administrator.session
    await req.route.api.before(req)
    cachedResponses.before = req.data
    cachedResponses.view = await req.get()
    req.body = {}
    req.filename = __filename
    req.screenshots = [
      { hover: '#administrator-menu-container' },
      { click: '/administrator/subscriptions' },
      { click: '/administrator/subscriptions/invoices' },
      { click: `/administrator/subscriptions/invoice?invoiceid=${user.invoice.invoiceid}` },
      { click: `/administrator/subscriptions/forgive-invoice?invoiceid=${user.invoice.invoiceid}` },
      { fill: '#submit-form' }
    ]
    cachedResponses.result = await req.post()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    it('should reject invalid invoiceid', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/forgive-invoice?invoiceid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-invoiceid')
    })

    it('should reject paid invoice', async () => {
      const errorMessage = cachedResponses.paidInvoice
      assert.strictEqual(errorMessage, 'invalid-invoice')
    })

    it('should reject uncollectible invoice', async () => {
      const errorMessage = cachedResponses.forgivenInvoice
      assert.strictEqual(errorMessage, 'invalid-invoice')
    })
  })

  describe('before', () => {
    it('should bind data to req', async () => {
      await bundledData()
      const data = cachedResponses.before
      assert.strictEqual(data.invoice.object, 'invoice')
    })
  })

  describe('view', () => {
    it('should present the form', async () => {
      await bundledData()
      const result = cachedResponses.view
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should forgive invoice (screenshots)', async () => {
      await bundledData()
      const result = cachedResponses.result
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })
})
