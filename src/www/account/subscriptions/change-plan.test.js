/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/account/subscriptions/change-plan', function () {
  let cachedResponses, cachedPlans
  async function bundledData () {
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    cachedPlans = []
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestStripeAccounts.createOwnerWithPlan({
      amount: '1000',
      trial_period_days: '0',
      interval: 'month',
      usage_type: 'licensed'
    })
    const plan1 = administrator.plan
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
    const req1 = TestHelper.createRequest(`/account/subscriptions/change-plan?subscriptionid=${user.subscription.subscriptionid}`)
    req1.account = user.account
    req1.session = user.session
    cachedResponses.noPlans = await req1.get()
    const plan2 = await TestHelper.createPlan(administrator, {
      productid: administrator.product.productid,
      usage_type: 'licensed',
      publishedAt: 'true',
      amount: '2000',
      trial_period_days: '0'
    })
    const plan3 = await TestHelper.createPlan(administrator, {
      productid: administrator.product.productid,
      usage_type: 'licensed',
      publishedAt: 'true',
      unpublishedAt: 'true',
      amount: '1000',
      trial_period_days: '0'
    })
    cachedPlans.push(plan1.planid, plan2.planid, plan3.planid)
    const req2 = TestHelper.createRequest(`/account/subscriptions/change-plan?subscriptionid=${user.subscription.subscriptionid}`)
    req2.account = user.account
    req2.session = user.session
    await req2.route.api.before(req2)
    cachedResponses.before = req2.data
    cachedResponses.returns = await req2.get()
    const req3 = TestHelper.createRequest(`/account/subscriptions/change-plan?subscriptionid=${user.subscription.subscriptionid}`)
    req3.account = user.account
    req3.session = user.session
    req3.filename = __filename
    req3.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/subscriptions' },
      { click: '/account/subscriptions/subscriptions' },
      { click: `/account/subscriptions/subscription?subscriptionid=${user.subscription.subscriptionid}` },
      { click: `/account/subscriptions/change-plan?subscriptionid=${user.subscription.subscriptionid}` },
      { fill: '#submit-form' }
    ]
    req3.body = {
      planid: plan2.planid,
      paymentmethodid: user.paymentMethod.paymentmethodid
    }
    cachedResponses.submit = await req3.post()
    const freePlan = await TestHelper.createPlan(administrator, {
      productid: administrator.product.productid,
      usage_type: 'licensed',
      publishedAt: 'true',
      amount: '0',
      trial_period_days: '0'
    })
    const user2 = await TestStripeAccounts.createUserWithFreeSubscription(freePlan)
    const req4 = TestHelper.createRequest(`/account/subscriptions/change-plan?subscriptionid=${user2.subscription.subscriptionid}`)
    req4.account = user2.account
    req4.session = user2.session
    req4.body = {
      planid: plan2.planid,
      paymentmethodid: ''
    }
    cachedResponses.invalidPaymentMethod = await req4.post()
    cachedResponses.finished = true
  }
  describe('before', () => {
    it('should bind data to req', async () => {
      await bundledData()
      const data = cachedResponses.before
      assert.strictEqual(data.plans.length, 1)
      assert.strictEqual(data.plans[0].planid, cachedPlans[1])
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

    it('should remove the form if there are no plans', async () => {
      await bundledData()
      const result = cachedResponses.noPlans
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'no-plans')
    })
  })

  describe('submit', () => {
    it('should apply plan update (screenshots)', async () => {
      await bundledData()
      const result = cachedResponses.submit
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })

  describe('errors', () => {
    it('should reject paid plan without payment information', async () => {
      await bundledData()
      const result = cachedResponses.invalidPaymentMethod
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-paymentmethodid')
    })
  })
})
