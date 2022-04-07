/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/administrator/subscriptions/charge', function () {
  const cachedResponses = {}
  beforeEach(async () => {
    if (Object.keys(cachedResponses).length) {
      return
    }
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestStripeAccounts.createOwnerWithPlan({
      amount: '1000',
      trial_period_days: '0',
      interval: 'month',
      usage_type: 'licensed'
    })
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
    const req = TestHelper.createRequest(`/administrator/subscriptions/charge?chargeid=${user.charge.chargeid}`)
    req.account = administrator.account
    req.session = administrator.session
    await req.route.api.before(req)
    cachedResponses.before = req.data
    req.filename = __filename
    req.screenshots = [
      { hover: '#administrator-menu-container' },
      { click: '/administrator/subscriptions' },
      { click: '/administrator/subscriptions/charges' },
      { click: `/administrator/subscriptions/charge?chargeid=${user.charge.chargeid}` }
    ]
    cachedResponses.result = await req.get()
  })
  describe('before', () => {
    it('should reject invalid charge', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/charge?chargeid=invalid')
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

    it('should bind data to req', async () => {
      const data = cachedResponses.before
      assert.strictEqual(data.charge.object, 'charge')
    })
  })

  describe('view', () => {
    it('should present the charge table (screenshots)', async () => {
      const result = cachedResponses.result
      const doc = TestHelper.extractDoc(result.html)
      const table = doc.getElementById('charges-table')
      assert.strictEqual(table.tag, 'table')
    })
  })
})
