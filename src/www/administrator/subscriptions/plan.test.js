/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const ScreenshotData = require('../../../../screenshot-data.js')

describe('/administrator/subscriptions/plan', function () {
  describe('before', () => {
    it('should bind data to req', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPlan({
        amount: '1000',
        trial_period_days: '0',
        interval: 'month',
        usage_type: 'licensed'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/plan?planid=${administrator.plan.planid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.plan.planid, administrator.plan.planid)
    })
  })

  describe('view', () => {
    it('should present the plan table (screenshots)', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPlan({
        amount: '1000',
        trial_period_days: '0',
        interval: 'month',
        usage_type: 'licensed'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/plan?planid=${administrator.plan.planid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#administrator-menu-container' },
        { click: '/administrator/subscriptions' },
        { click: '/administrator/subscriptions/plans' },
        { click: `/administrator/subscriptions/plan?planid=${administrator.plan.planid}` }
      ]
      global.pageSize = 50
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorIndex)
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorPlans)
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const tbody = doc.getElementById(administrator.plan.planid)
      assert.strictEqual(tbody.tag, 'tbody')
    })
  })

  describe('errors', () => {
    it('invalid-planid', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/plan?planid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-planid')
    })
  })
})
