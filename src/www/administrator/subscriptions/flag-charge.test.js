/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/administrator/subscriptions/flag-charge', function () {
  let cachedResponses
  let cachedCharge
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
    cachedCharge = user.charge
    const req = TestHelper.createRequest(`/administrator/subscriptions/flag-charge?chargeid=${user.charge.chargeid}`)
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      amount: '1000'
    }
    await req.route.api.before(req)
    cachedResponses.before = req.data
    cachedResponses.returns = await req.get()
    req.filename = __filename
    req.screenshots = [
      { hover: '#administrator-menu-container' },
      { click: '/administrator/subscriptions' },
      { click: '/administrator/subscriptions/charges' },
      { click: `/administrator/subscriptions/charge?chargeid=${user.charge.chargeid}` },
      { click: `/administrator/subscriptions/flag-charge?chargeid=${user.charge.chargeid}` },
      { fill: '#submit-form' }
    ]
    cachedResponses.submit = await req.post()
    try {
      await req.route.api.before(req)
    } catch (error) {
      cachedResponses.invalidCharge = error.message
    }
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    it('should reject invalid chargeid', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/flag-charge?chargeid=invalid')
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

    it('should reject flagged charge', async () => {
      const errorMessage = cachedResponses.invalidCharge
      assert.strictEqual(errorMessage, 'invalid-charge')
    })
  })

  describe('before', () => {
    it('should bind data to req', async () => {
      await bundledData()
      const data = cachedResponses.before
      assert.strictEqual(data.charge.id, cachedCharge.chargeid)
    })
  })

  describe('view', () => {
    it('should present the form', async () => {
      await bundledData()
      const result = cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should flag charge (screenshots)', async () => {
      await bundledData()
      const result = cachedResponses.submit
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })
})
