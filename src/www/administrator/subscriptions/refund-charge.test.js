/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')
const ScreenshotData = require('../../../../screenshot-data.js')

describe('/administrator/subscriptions/refund-charge', function () {
  let cachedResponses
  let cachedCharge
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
    cachedCharge = user.charge
    const req = TestHelper.createRequest(`/administrator/subscriptions/refund-charge?chargeid=${user.charge.chargeid}`)
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      amount: '3000'
    }
    await req.route.api.before(req)
    cachedResponses.before = req.data
    cachedResponses.returns = await req.get()
    // csrf
    req.puppeteer = false
    req.body['csrf-token'] = ''
    cachedResponses.csrf = await req.post()
    delete (req.puppeteer)
    delete (req.body['csrf-token'])
    // submit
    req.filename = __filename
    req.screenshots = [
      { hover: '#administrator-menu-container' },
      { click: '/administrator/subscriptions' },
      { click: '/administrator/subscriptions/charges' },
      { click: `/administrator/subscriptions/charge?chargeid=${user.charge.chargeid}` },
      { click: `/administrator/subscriptions/refund-charge?chargeid=${user.charge.chargeid}` },
      { fill: '#submit-form' }
    ]
    global.pageSize = 50
    global.packageJSON.dashboard.server.push(ScreenshotData.administratorIndex)
    global.packageJSON.dashboard.server.push(ScreenshotData.administratorCharges)
    cachedResponses.submit = await req.post()
    await req.route.api.before(req)
    // already refunded
    cachedResponses.alreadyRefunded = req.error
    // not paid
    // const user2 = await TestStripeAccounts.createUserWithPaymentMethod()
    // await TestHelper.createAmountOwed(user2)
    // req = TestHelper.createRequest(`/administrator/subscriptions/refund-charge?chargeid=${user2.charge.chargeid}`)
    // req.account = administrator.account
    // req.session = administrator.session
    // await req.route.api.before(req)
    // cachedResponses.notPaid = req.error
    cachedResponses.finished = true
  }

  describe('before', () => {
    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const data = cachedResponses.before
      assert.strictEqual(data.charge.id, cachedCharge.chargeid)
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
    it('should refund charge (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submit
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })

  describe('errors', () => {
    it('invalid-chargeid', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/refund-charge?chargeid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-chargeid')
    })

    it('already-refunded', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.alreadyRefunded
      console.log(errorMessage)
      assert.strictEqual(errorMessage, 'already-refunded')
    })

    // it('not-paid', async function () {
    //   await bundledData(this.test.currentRetry())
    //   const errorMessage = cachedResponses.notPaid
    //   assert.strictEqual(errorMessage, 'not-paid')
    // })

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
