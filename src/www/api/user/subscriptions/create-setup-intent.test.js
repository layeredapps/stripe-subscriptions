/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/subscriptions/create-setup-intent', function () {
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
    global.stripeJS = false
    const user = await TestStripeAccounts.createUserWithPaymentMethod()
    const user2 = await TestHelper.createUser()
    // invalid account
    const req = TestHelper.createRequest(`/api/user/subscriptions/create-setup-intent?customerid=${user.customer.customerid}`)
    req.account = user2.account
    req.session = user2.session
    req.body = {
      paymentmethodid: user.paymentMethod.paymentmethodid
    }
    try {
      await req.post()
    } catch (error) {
      cachedResponses.invalidAccount = error.message
    }
    // invalid payment method
    const req2 = TestHelper.createRequest(`/api/user/subscriptions/create-setup-intent?customerid=${user.customer.customerid}`)
    req2.account = user.account
    req2.session = user.session
    req2.body = {
      paymentmethodid: ''
    }
    try {
      await req2.post()
    } catch (error) {
      cachedResponses.missingPaymentMethod = error.message
    }
    req2.body = {
      paymentmethodid: 'invalid'
    }
    try {
      await req2.post()
    } catch (error) {
      cachedResponses.invalidPaymentMethod = error.message
    }
    // returns
    req2.body = {
      paymentmethodid: user.paymentMethod.paymentmethodid
    }
    req2.filename = __filename
    req2.saveResponse = true
    cachedResponses.returns = await req2.post()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    describe('invalid-customerid', () => {
      it('missing querystring customerid', async () => {
        global.stripeJS = false
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/subscriptions/create-setup-intent')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-customerid')
      })

      it('invalid querystring customerid', async () => {
        global.stripeJS = false
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/subscriptions/create-setup-intent?customerid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-customerid')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidAccount
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-paymentmethodid', () => {
      it('missing posted paymentmethodid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missingPaymentMethod
        assert.strictEqual(errorMessage, 'invalid-paymentmethodid')
      })

      it('invalid posted paymentmethodid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidPaymentMethod
        assert.strictEqual(errorMessage, 'invalid-paymentmethodid')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const setupIntent = cachedResponses.returns
      assert.strictEqual(setupIntent.object, 'setupintent')
    })
  })
})
