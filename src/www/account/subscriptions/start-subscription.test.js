/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')

describe('/account/subscriptions', function () {
  let cachedResponses, cachedPlans
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
      await TestHelper.rotateWebhook(true)
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    cachedPlans = []
    const owner = await TestStripeAccounts.createOwnerWithPlan()
    cachedPlans.push(owner.plan.planid)
    const user = await TestStripeAccounts.createUserWithPaymentMethod()
    const req1 = TestHelper.createRequest('/account/subscriptions/start-subscription')
    req1.account = user.account
    req1.session = user.session
    req1.filename = __filename
    req1.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/subscriptions' },
      { click: '/account/subscriptions/plans' },
      { click: `/account/subscriptions/plan?planid=${owner.plan.planid}` },
      { click: `/account/subscriptions/start-subscription?planid=${owner.plan.planid}` }
    ]
    await req1.route.api.before(req1)
    cachedResponses.before = req1.data
    global.pageSize = 50
    cachedResponses.returns = await req1.get()
    cachedResponses.finished = true
  }
  describe('before', () => {
    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const data = cachedResponses.before
      assert.strictEqual(data.plans.length, 1)
    })
  })

  describe('view', () => {
    it('should have option for each plan (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      const planOption = doc.getElementById(cachedPlans[0])
      assert.strictEqual(planOption.tag, 'option')
    })
  })
})
