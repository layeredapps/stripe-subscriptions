/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/subscriptions/create-refund-request', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  let cachedResponses
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    await TestHelper.setupBefore()
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestStripeAccounts.createOwnerWithPrice()
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
    // missing or invalid id
    const req = TestHelper.createRequest('/api/user/subscriptions/create-refund-request')
    req.account = user.account
    req.session = user.session
    req.body = {
      reason: 'refund plz'
    }
    try {
      await req.post()
    } catch (error) {
      cachedResponses.missing = error.message
    }
    const req2 = TestHelper.createRequest('/api/user/subscriptions/create-refund-request?chargeid=invalid')
    req2.account = user.account
    req2.session = user.session
    req2.body = {
      reason: 'refund plz'
    }
    try {
      await req2.post()
    } catch (error) {
      cachedResponses.invalid = error.message
    }
    // invalid charge
    await TestHelper.createRefund(administrator, user.charge.chargeid)
    const req3 = TestHelper.createRequest(`/api/user/subscriptions/create-refund-request?chargeid=${user.charge.chargeid}`)
    req3.account = user.account
    req3.session = user.session
    req3.body = {
      reason: 'refund plz'
    }
    try {
      await req3.post()
    } catch (error) {
      cachedResponses.invalidCharge = error.message
    }
    await TestStripeAccounts.createUserWithPaidSubscription(administrator.price, user)
    await TestHelper.requestRefund(user, user.charge.chargeid)
    const req4 = TestHelper.createRequest(`/api/user/subscriptions/create-refund-request?chargeid=${user.charge.chargeid}`)
    req4.account = user.account
    req4.session = user.session
    req4.body = {
      reason: 'refund plz'
    }
    try {
      await req4.post()
    } catch (error) {
      cachedResponses.invalidCharge2 = error.message
    }
    // invalid account
    await TestStripeAccounts.createUserWithPaidSubscription(administrator.price, user)
    const user2 = await TestHelper.createUser()
    const req5 = TestHelper.createRequest(`/api/user/subscriptions/create-refund-request?chargeid=${user.charge.chargeid}`)
    req5.account = user2.account
    req5.session = user2.session
    req5.body = {
      reason: 'refund plz'
    }
    try {
      await req5.post()
    } catch (error) {
      cachedResponses.invalidAccount = error.message
    }
    // returns
    const req6 = TestHelper.createRequest(`/api/user/subscriptions/create-refund-request?chargeid=${user.charge.chargeid}`)
    req6.account = user.account
    req6.session = user.session
    req6.body = {
      reason: 'refund plz'
    }
    req6.filename = __filename
    req6.saveResponse = true
    cachedResponses.returns = await req6.post()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    describe('invalid-chargeid', () => {
      it('missing querystring chargeid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missing
        assert.strictEqual(errorMessage, 'invalid-chargeid')
      })

      it('invalid querystring chargeid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalid
        assert.strictEqual(errorMessage, 'invalid-chargeid')
      })
    })

    describe('invalid-charge', () => {
      it('ineligible querystring charge is refunded', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidCharge
        assert.strictEqual(errorMessage, 'invalid-charge')
      })

      it('ineligible querystring charge has refund request', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidCharge2
        assert.strictEqual(errorMessage, 'invalid-charge')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidAccount
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const charge = cachedResponses.returns
      assert.strictEqual(charge.object, 'charge')
    })
  })
})
