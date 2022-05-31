/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/account/subscriptions/add-tax-id', function () {
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
    global.subscriptionRefundPeriod = 7 * 24 * 60 * 60
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const user = await TestStripeAccounts.createUserWithPaymentMethod()
    const req2 = TestHelper.createRequest(`/account/subscriptions/add-tax-id?customerid=${user.customer.customerid}`)
    req2.account = user.account
    req2.session = user.session
    cachedResponses.returns = await req2.get()
    const req = TestHelper.createRequest(`/account/subscriptions/add-tax-id?customerid=${user.customer.customerid}`)
    req.account = user.account
    req.session = user.session
    req.filename = __filename
    req.body = {
      type: 'eu_vat',
      value: 'DE123456789'
    }
    req.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/subscriptions' },
      { click: '/account/subscriptions/billing-profiles' },
      { click: `/account/subscriptions/billing-profile?customerid=${user.customer.customerid}` },
      { click: `/account/subscriptions/add-tax-id?customerid=${user.customer.customerid}` },
      { fill: '#submit-form' }
    ]
    await req.route.api.before(req)
    cachedResponses.before = req.data
    console.log(cachedResponses.before)
    // csrf
    req.puppeteer = false
    req.body['csrf-token'] = 'invalid'
    cachedResponses.csrf = await req.post()
    delete (req.puppeteer)
    delete (req.body['csrf-token'])
    // submit
    global.pageSize = 50
    cachedResponses.submit = await req.post()
    const user2 = await TestHelper.createUser()
    req2.account = user2.account
    req2.session = user2.session
    await req2.route.api.before(req2)
    cachedResponses.invalidAccount = req2.error
    await req.route.api.before(req)
    cachedResponses.invalidInvoice = req.error
    cachedResponses.finished = true
  }

  describe('before', () => {
    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const data = cachedResponses.before
      assert.strictEqual(data.customer.object, 'customer')
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
    it('should create tax id (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submit
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })

  describe('errors', () => {
    it('invalid-customerid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/subscriptions/add-tax-id?customerid=invalid')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-customerid')
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