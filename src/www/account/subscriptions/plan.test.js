/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')

describe('/account/subscriptions/plan', function () {
  describe('before', () => {
    it('should reject invalid plan', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/subscriptions/plan?planid=invalid')
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-planid')
    })

    it('should reject never published plan', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithNotPublishedPlan()
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/subscriptions/plan?planid=${administrator.plan.planid}`)
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-plan')
    })

    it('should reject unpublished plan', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithUnpublishedPlan()
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/subscriptions/plan?planid=${administrator.plan.planid}`)
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-plan')
    })

    it('should bind data to req', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPlan({
        amount: '1000',
        trial_period_days: '0',
        interval: 'month',
        usage_type: 'licensed'
      })
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/subscriptions/plan?planid=${administrator.plan.planid}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.plan.planid, administrator.plan.planid)
    })
  })

  describe('view', () => {
    it('should have row for plan (screenshots)', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPlan({
        amount: '1000',
        trial_period_days: '0',
        interval: 'month',
        usage_type: 'licensed'
      })
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/subscriptions/plan?planid=${administrator.plan.planid}`)
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/subscriptions' },
        { click: '/account/subscriptions/plans' },
        { click: `/account/subscriptions/plan?planid=${administrator.plan.planid}` }
      ]
      global.pageSize = 50
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const tbody = doc.getElementById(administrator.plan.planid)
      assert.strictEqual(tbody.tag, 'tbody')
    })
  })
})
