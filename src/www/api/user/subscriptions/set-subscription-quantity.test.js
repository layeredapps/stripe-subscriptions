/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/subscriptions/set-subscription-quantity', function () {
  const cachedResponses = {}
  before(async () => {
    await TestHelper.setupBefore()
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestStripeAccounts.createOwnerWithPlan({
      amount: '1000',
      trial_period_days: '0',
      interval: 'month',
      usage_type: 'licensed'
    })
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
    const user2 = await TestHelper.createUser()
    // missing and invalid id
    const req = TestHelper.createRequest('/api/user/subscriptions/set-subscription-quantity')
    req.account = user.account
    req.session = user.session
    req.body = {
      quantity: '10'
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
      quantity: '10'
    }
    try {
      await req2.patch()
    } catch (error) {
      cachedResponses.invalid = error.message
    }
    // invalid account
    const req3 = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-quantity?subscriptionid=${user.subscription.subscriptionid}`)
    req3.account = user2.account
    req3.session = user2.session
    req3.body = {
      quantity: '1'
    }
    try {
      await req3.patch()
    } catch (error) {
      cachedResponses.account = error.message
    }
    // invalid quantity
    const req4 = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-quantity?subscriptionid=${user.subscription.subscriptionid}`)
    req4.account = user.account
    req4.session = user.session
    req4.body = {
      quantity: 'letters'
    }
    try {
      await req4.patch()
    } catch (error) {
      cachedResponses.invalidQuantity = error.message
    }
    const req5 = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-quantity?subscriptionid=${user.subscription.subscriptionid}`)
    req5.account = user.account
    req5.session = user.session
    req5.body = {
      quantity: '1'
    }
    try {
      await req5.patch()
    } catch (error) {
      cachedResponses.unchangedQuantity = error.message
    }
    const req6 = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-quantity?subscriptionid=${user.subscription.subscriptionid}`)
    req6.account = user.account
    req6.session = user.session
    req6.body = {
      quantity: '-1'
    }
    try {
      await req6.patch()
    } catch (error) {
      cachedResponses.negativeQuantity = error.message
    }
    const req7 = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-quantity?subscriptionid=${user.subscription.subscriptionid}`)
    req7.account = user.account
    req7.session = user.session
    req7.body = {
      quantity: '0'
    }
    try {
      await req7.patch()
    } catch (error) {
      cachedResponses.zeroQuantity = error.message
    }
    // returns
    const req8 = TestHelper.createRequest(`/api/user/subscriptions/set-subscription-quantity?subscriptionid=${user.subscription.subscriptionid}`)
    req8.account = user.account
    req8.session = user.session
    req8.body = {
      quantity: '2'
    }
    req8.filename = __filename
    req8.saveResponse = true
    cachedResponses.returns = await req8.patch()
  })
  describe('exceptions', () => {
    describe('invalid-subscriptionid', () => {
      it('missing querystring subscriptionid', async () => {
        const errorMessage = cachedResponses.missing
        assert.strictEqual(errorMessage, 'invalid-subscriptionid')
      })

      it('invalid querystring subscriptionid', async () => {
        const errorMessage = cachedResponses.invalid
        assert.strictEqual(errorMessage, 'invalid-subscriptionid')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async () => {
        const errorMessage = cachedResponses.account
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-quantity', () => {
      it('invalid posted quantity', async () => {
        const errorMessage = cachedResponses.invalidQuantity
        assert.strictEqual(errorMessage, 'invalid-quantity')
      })

      it('invalid posted quantity is unchanged', async () => {
        const errorMessage = cachedResponses.unchangedQuantity
        assert.strictEqual(errorMessage, 'invalid-quantity')
      })

      it('invalid posted quantity is negative', async () => {
        const errorMessage = cachedResponses.negativeQuantity
        assert.strictEqual(errorMessage, 'invalid-quantity')
      })

      it('invalid posted quantity is zero', async () => {
        const errorMessage = cachedResponses.zeroQuantity
        assert.strictEqual(errorMessage, 'invalid-quantity')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const subscriptionNow = cachedResponses.returns
      assert.strictEqual(subscriptionNow.stripeObject.quantity, 2)
    })
  })
})
