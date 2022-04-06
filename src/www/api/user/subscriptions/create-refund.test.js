/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/subscriptions/create-refund', function () {
  const cachedResponses = {}
  before(async () => {
    await TestHelper.setupBefore()
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestStripeAccounts.createOwnerWithPlan({ amount: '100000' })
    const user = await TestHelper.createUser()
    // missing and invalid id
    const req = TestHelper.createRequest('/api/user/subscriptions/create-refund')
    req.account = user.account
    req.session = user.session
    try {
      await req.post()
    } catch (error) {
      cachedResponses.missing = error.message
    }
    const req2 = TestHelper.createRequest('/api/user/subscriptions/create-refund?chargeid=invalid')
    req2.account = user.account
    req2.session = user.session
    try {
      await req2.post()
    } catch (error) {
      cachedResponses.invalid = error.message
    }
    // invalid charge
    const user2 = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
    await TestHelper.createRefund(administrator, user2.charge.chargeid)
    const req3 = TestHelper.createRequest(`/api/user/subscriptions/create-refund?chargeid=${user2.charge.chargeid}`)
    req3.account = user2.account
    req3.session = user2.session
    req3.body = {
      amount: '1000'
    }
    try {
      await req3.post()
    } catch (error) {
      cachedResponses.invalidCharge = error.message
    }
    global.subscriptionRefundPeriod = 0
    await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan, user2)
    const req4 = TestHelper.createRequest(`/api/user/subscriptions/create-refund?chargeid=${user2.charge.chargeid}`)
    req4.account = user2.account
    req4.session = user2.session
    try {
      await req4.post()
    } catch (error) {
      cachedResponses.invalidCharge2 = error.message
    }
    global.subscriptionRefundPeriod = 7 * 24 * 60 * 60
    // invalid account
    const req5 = TestHelper.createRequest(`/api/user/subscriptions/create-refund?chargeid=${user2.charge.chargeid}`)
    req5.account = user.account
    req5.session = user.session
    try {
      await req5.post()
    } catch (error) {
      cachedResponses.invalidAccount = error.message
    }
    // returns
    const req6 = TestHelper.createRequest(`/api/user/subscriptions/create-refund?chargeid=${user2.charge.chargeid}`)
    req6.account = user2.account
    req6.session = user2.session
    req6.filename = __filename
    req6.saveResponse = true
    cachedResponses.returns = await req6.post()
    // env
    global.subscriptionRefundPeriod = 0
    await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan, user2)
    const req7 = TestHelper.createRequest(`/api/user/subscriptions/create-refund?chargeid=${user2.charge.chargeid}`)
    req7.account = user2.account
    req7.session = user2.session
    req7.filename = __filename
    req7.saveResponse = true
    try {
      await req7.post()
    } catch (error) {
      cachedResponses.envError = error.message
    }
    global.subscriptionRefundPeriod = 7 * 24 * 60 * 60
    cachedResponses.envSuccess = await req7.post()
  })
  describe('exceptions', () => {
    describe('invalid-chargeid', () => {
      it('missing querystring chargeid', async () => {
        const errorMessage = cachedResponses.missing
        assert.strictEqual(errorMessage, 'invalid-chargeid')
      })

      it('invalid querystring chargeid', async () => {
        const errorMessage = cachedResponses.invalid
        assert.strictEqual(errorMessage, 'invalid-chargeid')
      })
    })

    describe('invalid-charge', () => {
      it('ineligible querystring charge is refunded', async () => {
        const errorMessage = cachedResponses.invalidCharge
        assert.strictEqual(errorMessage, 'invalid-charge')
      })

      it('ineligible querystring charge is out of refund period', async () => {
        const errorMessage = cachedResponses.invalidCharge2
        assert.strictEqual(errorMessage, 'invalid-charge')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async () => {
        const errorMessage = cachedResponses.invalidAccount
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const refund = cachedResponses.returns
      assert.strictEqual(refund.object, 'refund')
    })
  })

  describe('configuration', () => {
    it('environment SUBSCRIPTION_REFUND_PERIOD', async () => {
      const refundError = cachedResponses.envError
      assert.strictEqual(refundError, 'invalid-charge')
      const refundSuccess = cachedResponses.envSuccess
      assert.strictEqual(refundSuccess.object, 'refund')
    })
  })
})
