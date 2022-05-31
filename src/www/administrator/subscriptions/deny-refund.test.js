/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')
const ScreenshotData = require('../../../../screenshot-data.js')

describe('/administrator/subscriptions/deny-refund', function () {
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
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestStripeAccounts.createOwnerWithPrice({
      unit_amount: 3000,
      recurring_interval: 'month',
      recurring_usage_type: 'licensed'
    })
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
    let req = TestHelper.createRequest(`/administrator/subscriptions/deny-refund?chargeid=${user.charge.chargeid}`)
    req.account = administrator.account
    req.session = administrator.session
    await req.route.api.before(req)
    cachedResponses.invalidCharge = req.error
    await TestHelper.requestRefund(user, user.charge.chargeid)
    req = TestHelper.createRequest(`/administrator/subscriptions/deny-refund?chargeid=${user.charge.chargeid}`)
    req.account = administrator.account
    req.session = administrator.session
    await req.route.api.before(req)
    cachedResponses.before = req.data
    cachedResponses.view = await req.get()
    // xss
    req.body = {
      reason: '<script>'
    }
    cachedResponses.xss = await req.post()
    // csrf
    req.puppeteer = false
    req.body = {
      reason: 'excuse',
      'csrf-token': ''
    }
    cachedResponses.csrf = await req.post()
    delete (req.puppeteer)
    // submit
    req.body = {
      reason: 'this is a reason'
    }
    req.filename = __filename
    req.screenshots = [
      { hover: '#administrator-menu-container' },
      { click: '/administrator/subscriptions' },
      { click: '/administrator/subscriptions/refund-requests' },
      { click: `/administrator/subscriptions/charge?chargeid=${user.charge.chargeid}` },
      { click: `/administrator/subscriptions/deny-refund?chargeid=${user.charge.chargeid}` },
      { fill: '#submit-form' }
    ]
    global.pageSize = 50
    global.packageJSON.dashboard.server.push(ScreenshotData.administratorIndex)
    cachedResponses.result = await req.post()
    await req.route.api.before(req)
    cachedResponses.alreadyDenied = req.error
    cachedResponses.finished = true
  }

  describe('before', () => {
    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const data = cachedResponses.before
      assert.strictEqual(data.charge.object, 'charge')
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
    it('should deny refund (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.result
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })

  describe('errors', () => {
    it('invalid-chargeid', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/deny-refund?chargeid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-chargeid')
    })

    it('no-refund-request', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.invalidCharge
      assert.strictEqual(errorMessage, 'no-refund-request')
    })

    it('already-denied', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.alreadyDenied
      assert.strictEqual(errorMessage, 'already-denied')
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
