/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/account/subscriptions/refund-invoice', function () {
  let cachedResponses
  let cachedUser
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
    const administrator = await TestStripeAccounts.createOwnerWithPlan({
      usage_type: 'licensed',
      publishedAt: 'true',
      amount: '100000',
      trial_period_days: '0'
    })
    const user = cachedUser = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
    const req2 = TestHelper.createRequest(`/account/subscriptions/refund-invoice?invoiceid=${user.invoice.invoiceid}`)
    req2.account = user.account
    req2.session = user.session
    cachedResponses.returns = await req2.get()
    const user2 = await TestHelper.createUser()
    req2.account = user2.account
    req2.session = user2.session
    await req2.route.api.before(req2)
    cachedResponses.invalidAccount = req2.error
    const req = TestHelper.createRequest(`/account/subscriptions/refund-invoice?invoiceid=${user.invoice.invoiceid}`)
    req.account = user.account
    req.session = user.session
    req.filename = __filename
    req.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/subscriptions' },
      { click: '/account/subscriptions/invoices' },
      { click: `/account/subscriptions/invoice?invoiceid=${user.invoice.invoiceid}` },
      { click: `/account/subscriptions/refund-invoice?invoiceid=${user.invoice.invoiceid}` },
      { fill: '#submit-form' }
    ]
    await req.route.api.before(req)
    cachedResponses.before = req.data
    // csrf
    req.puppeteer = false
    req.body = {
      'csrf-token': ''
    }
    cachedResponses.csrf = await req.post()
    delete (req.puppeteer)
    delete (req.body)
    // submit
    global.pageSize = 50
    cachedResponses.submit = await req.post()
    cachedResponses.finished = true
  }

  describe('before', () => {
    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const data = cachedResponses.before
      assert.strictEqual(data.invoice.invoiceid, cachedUser.invoice.invoiceid)
      assert.strictEqual(data.charge.invoice, cachedUser.invoice.invoiceid)
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
    it('should cancel subscription (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submit
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })

  describe('errors', () => {
    it('invalid-invoiceid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/subscriptions/refund-invoice?invoiceid=invalid')
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
