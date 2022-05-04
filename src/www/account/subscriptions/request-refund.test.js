/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/account/subscriptions/request-refund', function () {
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
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    global.subscriptionRefundPeriod = 0
    const administrator = await TestStripeAccounts.createOwnerWithPlan({
      usage_type: 'licensed',
      publishedAt: 'true',
      amount: '100000',
      trial_period_days: '0'
    })
    const user = cachedUser = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
    const req = TestHelper.createRequest(`/account/subscriptions/request-refund?invoiceid=${user.invoice.invoiceid}`)
    req.account = user.account
    req.session = user.session

    await req.route.api.before(req)
    cachedResponses.before = req.data
    const req2 = TestHelper.createRequest(`/account/subscriptions/request-refund?invoiceid=${user.invoice.invoiceid}`)
    req2.account = user.account
    req2.session = user.session
    cachedResponses.returns = await req2.get()
    const user2 = await TestHelper.createUser()
    const req3 = TestHelper.createRequest(`/account/subscriptions/request-refund?invoiceid=${user.invoice.invoiceid}`)
    req3.account = user2.account
    req3.session = user2.session
    await req3.route.api.before(req3)
    cachedResponses.invalidAccount = req3.error
    // xss
    req2.body = {
      reason: '<script>'
    }
    cachedResponses.xss = await req2.post()
    // csrf
    req2.puppeteer = false
    req2.body['csrf-token'] = ''
    cachedResponses.csrf = await req2.post()
    delete (req2.puppeteer)
    delete (req2.body['csrf-token'])
    // submit
    req2.filename = __filename
    req2.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/subscriptions' },
      { click: '/account/subscriptions/invoices' },
      { click: `/account/subscriptions/invoice?invoiceid=${user.invoice.invoiceid}` },
      { click: `/account/subscriptions/request-refund?invoiceid=${user.invoice.invoiceid}` },
      { fill: '#submit-form' }
    ]
    req2.body = {
      reason: 'this is a reason'
    }
    global.pageSize = 50
    cachedResponses.submit = await req2.post()
    cachedResponses.finished = true
  }

  describe('before', () => {
    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const data = cachedResponses.before
      assert.strictEqual(data.invoice.invoiceid, cachedUser.invoice.invoiceid)
      assert.strictEqual(data.charge.id, cachedUser.charge.chargeid)
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
    it('should create refund request (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submit
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })

  describe('errors', () => {
    it('invalid-invoice', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/subscriptions/request-refund?invoiceid=invalid')
      req.account = user.account
      req.session = user.session
      req.body = {
        reason: 'this is a reason'
      }
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-invoiceid')
    })

    it('invalid-account', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.invalidAccount
      assert.strictEqual(errorMessage, 'invalid-account')
    })

    it('invalid-xss-input', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.xss
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-xss-input')
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
