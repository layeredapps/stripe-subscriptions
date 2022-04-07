/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/subscriptions/create-subscription', function () {
  const cachedResponses = {}
  beforeEach(async () => {
    if (Object.keys(cachedResponses).length) {
      return
    }
    await TestHelper.setupBefore()
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestStripeAccounts.createOwnerWithPlan({
      amount: '1000',
      trial_period_days: '0',
      interval: 'month',
      usage_type: 'licensed'
    })
    const user = await TestHelper.createUser()
    // invalid customerid
    const req = TestHelper.createRequest('/api/user/subscriptions/create-subscription')
    req.account = user.account
    req.session = user.session
    req.body = {
      planid: administrator.plan.planid
    }
    try {
      await req.post()
    } catch (error) {
      cachedResponses.missingCustomer = error.message
    }
    const req2 = TestHelper.createRequest('/api/user/subscriptions/create-subscription?customerid=invalid')
    req2.account = user.account
    req2.session = user.session
    req2.body = {
      planid: administrator.plan.planid
    }
    try {
      await req2.post()
    } catch (error) {
      cachedResponses.invalidCustomer = error.message
    }
    // missing payment method
    await TestHelper.createCustomer(user, {
      email: user.profile.contactEmail,
      description: user.profile.firstName,
      country: 'US'
    })
    const req3 = TestHelper.createRequest(`/api/user/subscriptions/create-subscription?customerid=${user.customer.customerid}`)
    req3.account = user.account
    req3.session = user.session
    req3.body = {
      planid: administrator.plan.planid
    }
    try {
      await req3.post()
    } catch (error) {
      cachedResponses.invalidPaymentMethod = error.message
    }
    // invalid account
    const user2 = await TestHelper.createUser()
    const req4 = TestHelper.createRequest(`/api/user/subscriptions/create-subscription?customerid=${user.customer.customerid}`)
    req4.account = user2.account
    req4.session = user2.session
    req4.body = {
      planid: administrator.plan.planid
    }
    try {
      await req4.post()
    } catch (error) {
      cachedResponses.invalidAccount = error.message
    }
    // invalid plan
    const user3 = await TestStripeAccounts.createUserWithPaymentMethod()
    const req5 = TestHelper.createRequest(`/api/user/subscriptions/create-subscription?customerid=${user3.customer.customerid}`)
    req5.account = user3.account
    req5.session = user3.session
    req5.body = {
      planid: '',
      paymentmethodid: user3.paymentMethod.paymentmethodid
    }
    try {
      await req5.post()
    } catch (error) {
      cachedResponses.missingPlan = error.message
    }
    req5.body = {
      planid: 'invalid',
      paymentmethodid: user3.paymentMethod.paymentmethodid
    }
    try {
      await req5.post()
    } catch (error) {
      cachedResponses.invalidPlan = error.message
    }
    // not published plan
    const administrator2 = await TestStripeAccounts.createOwnerWithNotPublishedPlan()
    req5.body = {
      planid: administrator2.plan.planid
    }
    try {
      await req5.post()
    } catch (error) {
      cachedResponses.notPublishedPlan = error.message
    }
    // unpublished plan
    const administrator3 = await TestStripeAccounts.createOwnerWithUnpublishedPlan()
    req5.body = {
      planid: administrator3.plan.planid
    }
    try {
      await req5.post()
    } catch (error) {
      cachedResponses.unpublishedPlan = error.message
    }
    // response
    const req6 = TestHelper.createRequest(`/api/user/subscriptions/create-subscription?customerid=${user3.customer.customerid}`)
    req6.account = user3.account
    req6.session = user3.session
    req6.body = {
      planid: administrator.plan.planid,
      paymentmethodid: user3.paymentMethod.paymentmethodid
    }
    req6.filename = __filename
    req6.saveResponse = true
    cachedResponses.returns = await req6.post()
  })
  describe('exceptions', () => {
    describe('invalid-customerid', () => {
      it('missing querystring customerid', async () => {
        const errorMessage = cachedResponses.missingCustomer
        assert.strictEqual(errorMessage, 'invalid-customerid')
      })

      it('invalid querystring customerid', async () => {
        const errorMessage = cachedResponses.invalidCustomer
        assert.strictEqual(errorMessage, 'invalid-customerid')
      })
    })

    describe('invalid-customer', () => {
      it('ineligible querystring customer requires payment method', async () => {
        const errorMessage = cachedResponses.invalidPaymentMethod
        assert.strictEqual(errorMessage, 'invalid-paymentmethodid')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async () => {
        const errorMessage = cachedResponses.invalidAccount
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-planid', () => {
      it('missing posted planid', async () => {
        const errorMessage = cachedResponses.missingPlan
        assert.strictEqual(errorMessage, 'invalid-planid')
      })

      it('invalid posted planid', async () => {
        const errorMessage = cachedResponses.invalidPlan
        assert.strictEqual(errorMessage, 'invalid-planid')
      })
    })

    describe('invalid-plan', () => {
      it('ineligible posted plan is not published', async () => {
        const errorMessage = cachedResponses.notPublishedPlan
        assert.strictEqual(errorMessage, 'invalid-plan')
      })

      it('ineligible posted plan is unpublished', async () => {
        const errorMessage = cachedResponses.unpublishedPlan
        assert.strictEqual(errorMessage, 'invalid-plan')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const subscriptionNow = cachedResponses.returns
      assert.strictEqual(subscriptionNow.object, 'subscription')
    })
  })
})
