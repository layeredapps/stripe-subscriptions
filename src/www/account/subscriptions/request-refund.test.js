/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/account/subscriptions/request-refund', function () {
  const cachedResponses = {}
  let cachedUser
  beforeEach(async () => {
    if (Object.keys(cachedResponses).length) {
      return
    }
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
    req.filename = __filename
    req.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/subscriptions' },
      { click: '/account/subscriptions/invoices' },
      { click: `/account/subscriptions/invoice?invoiceid=${user.invoice.invoiceid}` },
      { click: `/account/subscriptions/request-refund?invoiceid=${user.invoice.invoiceid}` },
      { fill: '#submit-form' }
    ]
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
    try {
      await req3.route.api.before(req3)
    } catch (error) {
      cachedResponses.invalidAccount = error.message
    }
    const req4 = TestHelper.createRequest(`/account/subscriptions/request-refund?invoiceid=${user.invoice.invoiceid}`)
    req4.account = user.account
    req4.session = user.session
    req4.body = {
      reason: 'this is a reason'
    }
    cachedResponses.submit = await req4.post()
  })
  describe('exceptions', () => {
    it('invalid-invoice', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/subscriptions/request-refund?invoiceid=invalid')
      req.account = user.account
      req.session = user.session
      req.body = {
        reason: 'this is a reason'
      }
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-invoiceid')
    })
    it('invalid-account', async () => {
      const errorMessage = cachedResponses.invalidAccount
      assert.strictEqual(errorMessage, 'invalid-account')
    })
  })

  describe('before', () => {
    it('should bind data to req', async () => {
      const data = cachedResponses.before
      assert.strictEqual(data.invoice.invoiceid, cachedUser.invoice.invoiceid)
      assert.strictEqual(data.charge.id, cachedUser.charge.chargeid)
    })
  })

  describe('view', () => {
    it('should present the form', async () => {
      const result = cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should create refund request (screenshots)', async () => {
      const result = cachedResponses.submit
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })
})
