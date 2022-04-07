/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/administrator/subscriptions/refund', function () {
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
    await TestHelper.createRefund(administrator, user.charge.chargeid)
    // before
    const req = TestHelper.createRequest(`/administrator/subscriptions/refund?refundid=${administrator.refund.refundid}`)
    req.account = administrator.account
    req.session = administrator.session
    await req.route.api.before(req)
    cachedResponses.before = req.data
    // get
    req.filename = __filename
    req.screenshots = [
      { hover: '#administrator-menu-container' },
      { click: '/administrator/subscriptions' },
      { click: '/administrator/subscriptions/refunds' },
      { click: `/administrator/subscriptions/refund?refundid=${administrator.refund.refundid}` }
    ]
    cachedResponses.get = await req.get()
  })
  describe('before', () => {
    it('should reject invalid refundid', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/refund?refundid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-refundid')
    })

    it('should bind data to req', async () => {
      const data = cachedResponses.before
      assert.strictEqual(data.refund.object, 'refund')
    })
  })

  describe('view', () => {
    it('should have row for refund (screenshots)', async () => {
      const result = cachedResponses.get
      const doc = TestHelper.extractDoc(result.html)
      const table = doc.getElementById('refunds-table')
      assert.strictEqual(table.tag, 'table')
    })
  })
})
