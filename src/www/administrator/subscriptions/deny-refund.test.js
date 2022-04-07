/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/administrator/subscriptions/deny-refund', function () {
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
    let req = TestHelper.createRequest(`/administrator/subscriptions/deny-refund?chargeid=${user.charge.chargeid}`)
    req.account = administrator.account
    req.session = administrator.session
    try {
      await req.route.api.before(req)
    } catch (error) {
      cachedResponses.invalidCharge = error.message
    }
    await TestHelper.requestRefund(user, user.charge.chargeid)
    req = TestHelper.createRequest(`/administrator/subscriptions/deny-refund?chargeid=${user.charge.chargeid}`)
    req.account = administrator.account
    req.session = administrator.session
    await req.route.api.before(req)
    cachedResponses.before = req.data
    cachedResponses.view = await req.get()
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
    cachedResponses.result = await req.post()
    try {
      await req.route.api.before(req)
    } catch (error) {
      cachedResponses.alreadyDenied = error.message
    }
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    it('should reject invalid chargeid', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/deny-refund?chargeid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-chargeid')
    })

    it('should reject charge without refund request', async () => {
      const errorMessage = cachedResponses.invalidCharge
      assert.strictEqual(errorMessage, 'invalid-charge')
    })

    it('should reject denied refund', async () => {
      const errorMessage = cachedResponses.alreadyDenied
      assert.strictEqual(errorMessage, 'invalid-charge')
    })
  })

  describe('before', () => {
    it('should bind data to req', async () => {
      await bundledData()
      const data = cachedResponses.before
      assert.strictEqual(data.charge.object, 'charge')
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
    it('should deny refund (screenshots)', async () => {
      await bundledData()
      const result = cachedResponses.result
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })
})
