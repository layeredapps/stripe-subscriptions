/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/subscriptions/create-payment-intent', function () {
  let cachedResponses
  async function bundledData () {
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    await TestHelper.setupBefore()
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const user = await TestStripeAccounts.createUserWithPaymentMethod()
    const user2 = await TestHelper.createUser()
    // invalid account
    const req = TestHelper.createRequest(`/api/user/subscriptions/create-payment-intent?customerid=${user.customer.customerid}`)
    req.account = user2.account
    req.session = user2.session
    req.body = {
      paymentmethodid: user.paymentMethod.paymentmethodid,
      amount: '10000',
      currency: 'usd'
    }
    try {
      await req.post()
    } catch (error) {
      cachedResponses.invalidAccount = error.message
    }
    const user3 = await TestStripeAccounts.createUserWithPaymentMethod()
    const req2 = TestHelper.createRequest(`/api/user/subscriptions/create-payment-intent?customerid=${user.customer.customerid}`)
    req2.account = user3.account
    req2.session = user3.session
    req2.body = {
      paymentmethodid: user3.paymentMethod.id,
      amount: '10000',
      currency: 'usd'
    }
    try {
      await req2.post()
    } catch (error) {
      cachedResponses.invalidPaymentMethodAccount = error.message
    }
    // invalid payment method
    const req3 = TestHelper.createRequest(`/api/user/subscriptions/create-payment-intent?customerid=${user.customer.customerid}`)
    req3.account = user.account
    req3.session = user.session
    req3.body = {
      paymentmethodid: ''
    }
    try {
      await req3.post()
    } catch (error) {
      cachedResponses.missingPaymentMethod = error.message
    }
    req3.body = {
      paymentmethodid: 'invalid'
    }
    try {
      await req3.post()
    } catch (error) {
      cachedResponses.invalidPaymentMethod = error.message
    }
    // returns
    req3.body = {
      paymentmethodid: user.paymentMethod.paymentmethodid,
      amount: '10000',
      currency: 'usd'
    }
    cachedResponses.returns = await req3.post()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    describe('invalid-customerid', () => {
      it('missing querystring customerid', async () => {
        global.stripeJS = false
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/subscriptions/create-payment-intent')
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
        const req = TestHelper.createRequest('/api/user/subscriptions/create-payment-intent?customerid=invalid')
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
      it('ineligible accessing account', async () => {
        await bundledData()
        const errorMessage = cachedResponses.invalidAccount
        assert.strictEqual(errorMessage, 'invalid-account')
      })

      it('ineligible posted payment method', async () => {
        await bundledData()
        const errorMessage = cachedResponses.invalidPaymentMethodAccount
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-paymentmethodid', () => {
      it('missing posted paymentmethodid', async () => {
        await bundledData()
        const errorMessage = cachedResponses.missingPaymentMethod
        assert.strictEqual(errorMessage, 'invalid-paymentmethodid')
      })

      it('invalid posted paymentmethodid', async () => {
        await bundledData()
        const errorMessage = cachedResponses.invalidPaymentMethod
        assert.strictEqual(errorMessage, 'invalid-paymentmethodid')
      })
    })
  })

  describe('object', () => {
    it('object', async () => {
      const paymentIntent = cachedResponses.returns
      assert.strictEqual(paymentIntent.object, 'paymentintent')
    })
  })
})
