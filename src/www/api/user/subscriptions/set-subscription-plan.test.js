/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/subscriptions/set-subscription-plan', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  let cachedResponses
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
      await TestHelper.rotateWebhook(true)
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    await TestHelper.setupBefore()
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestStripeAccounts.createOwnerWithPlan({
      amount: 1000,
      trial_period_days: '0',
      interval: 'month',
      usage_type: 'licensed'
    })
    const plan1 = administrator.plan
    const plan2 = await TestHelper.createPlan(administrator, {
      planid: 'plan2_whatever',
      productid: administrator.product.productid,
      usage_type: 'licensed',
      publishedAt: 'true',
      amount: '1000'
    })
    const freePlan = await TestHelper.createPlan(administrator, {
      productid: administrator.product.productid,
      usage_type: 'licensed',
      publishedAt: 'true',
      amount: '0'
    })
    const notPublishedPlan = await TestHelper.createPlan(administrator, {
      productid: administrator.product.productid,
      usage_type: 'licensed',
      trial_period_days: '0',
      amount: '1000'
    })
    const unpublishedPlan = await TestHelper.createPlan(administrator, {
      productid: administrator.product.productid,
      usage_type: 'licensed',
      publishedAt: 'true',
      unpublishedAt: 'true',
      trial_period_days: '0',
      amount: '1000'
    })
    const user = await TestStripeAccounts.createUserWithPaidSubscription(plan1)
    const user2 = await TestHelper.createUser()
    await TestHelper.createCustomer(user2, {
      email: user.profile.contactEmail,
      description: user.profile.firstName
    })
    // invalid and missing subscription
    const req = TestHelper.createRequest('/api/user/subscriptions/set-subscription-quantity')
    req.account = user.account
    req.session = user.session
    req.body = {
      planid: 'invalid'
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.missing = error.message
    }
    const req2 = TestHelper.createRequest('/api/user/subscriptions/set-subscription-quantity?subscriptionid=invalid')
    req2.account = user.account
    req2.session = user.session
    req2.body = {
      planid: 'invalid'
    }
    try {
      await req2.patch()
    } catch (error) {
      cachedResponses.invalid = error.message
    }
    const req3 = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-plan?subscriptionid=${user.subscription.subscriptionid}`)
    req3.account = user2.account
    req3.session = user2.session
    req3.body = {
      planid: administrator.plan.planid,
      paymentmethodid: user.paymentMethod.paymentmethodid
    }
    try {
      await req3.patch()
    } catch (error) {
      cachedResponses.account = error.message
    }
    // invalid plan
    const req4 = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-plan?subscriptionid=${user.subscription.subscriptionid}`)
    req4.account = user.account
    req4.session = user.session
    req4.body = {
      planid: '',
      paymentmethodid: user.paymentMethod.paymentmethodid
    }
    try {
      await req4.patch()
    } catch (error) {
      cachedResponses.missingPlan = error.message
    }
    const req5 = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-plan?subscriptionid=${user.subscription.subscriptionid}`)
    req5.account = user.account
    req5.session = user.session
    req5.body = {
      planid: 'invalid',
      paymentmethodid: user.paymentMethod.paymentmethodid
    }
    try {
      await req5.patch()
    } catch (error) {
      cachedResponses.invalidPlan = error.message
    }
    const req6 = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-plan?subscriptionid=${user.subscription.subscriptionid}`)
    req6.account = user.account
    req6.session = user.session
    req6.body = {
      planid: notPublishedPlan.planid,
      paymentmethodid: user.paymentMethod.paymentmethodid
    }
    try {
      await req6.patch()
    } catch (error) {
      cachedResponses.notPublishedPlan = error.message
    }
    const req7 = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-plan?subscriptionid=${user.subscription.subscriptionid}`)
    req7.account = user.account
    req7.session = user.session
    req7.body = {
      planid: unpublishedPlan.planid,
      paymentmethodid: user.paymentMethod.paymentmethodid
    }
    try {
      await req7.patch()
    } catch (error) {
      cachedResponses.unpublishedAtPlan = error.message
    }
    const req8 = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-plan?subscriptionid=${user.subscription.subscriptionid}`)
    req8.account = user.account
    req8.session = user.session
    req8.body = {
      planid: plan1.planid,
      paymentmethodid: user.paymentMethod.paymentmethodid
    }
    try {
      await req8.patch()
    } catch (error) {
      cachedResponses.unchanged = error.message
    }
    // payment
    await TestStripeAccounts.createUserWithFreeSubscription(freePlan, user2)
    const req9 = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-plan?subscriptionid=${user2.subscription.subscriptionid}`)
    req9.account = user2.account
    req9.session = user2.session
    req9.body = {
      planid: plan2.planid
    }
    try {
      await req9.patch()
    } catch (error) {
      cachedResponses.paymentDetails = error.message
    }
    // returns
    const req10 = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-plan?subscriptionid=${user.subscription.subscriptionid}`)
    req10.account = user.account
    req10.session = user.session
    req10.body = {
      planid: plan2.planid,
      paymentmethodid: user.paymentMethod.paymentmethodid
    }
    req10.filename = __filename
    req10.saveResponse = true
    cachedResponses.returns = await req10.patch()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    describe('invalid-subscriptionid', () => {
      it('missing querystring subscriptionid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalid
        assert.strictEqual(errorMessage, 'invalid-subscriptionid')
      })

      it('invalid querystring subscriptionid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missing
        assert.strictEqual(errorMessage, 'invalid-subscriptionid')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.account
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-planid', () => {
      it('missing posted planid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missingPlan
        assert.strictEqual(errorMessage, 'invalid-planid')
      })

      it('invalid posted planid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidPlan
        assert.strictEqual(errorMessage, 'invalid-planid')
      })
    })

    describe('invalid-plan', () => {
      it('invalid posted plan is not published', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.notPublishedPlan
        assert.strictEqual(errorMessage, 'invalid-plan')
      })

      it('invalid posted plan is unpublished', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.unpublishedAtPlan
        assert.strictEqual(errorMessage, 'invalid-plan')
      })

      it('invalid posted plan is unchanged', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.unchanged
        assert.strictEqual(errorMessage, 'invalid-plan')
      })
    })
  })

  describe('invalid-paymentmethodid', () => {
    it('invalid customer requires payments method', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.paymentDetails
      assert.strictEqual(errorMessage, 'invalid-paymentmethodid')
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const subscriptionNow = cachedResponses.returns
      assert.strictEqual(subscriptionNow.planid.startsWith('plan2_'), true)
    })
  })
})
