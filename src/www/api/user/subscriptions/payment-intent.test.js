/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/subscriptions/payment-intent', function () {
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
    await TestHelper.createPaymentIntent(user, {
      amount: '10000',
      currency: 'usd',
      paymentmethodid: user.paymentMethod.paymentmethodid
    })
    const user2 = await TestHelper.createUser()
    // invalid account
    const req = TestHelper.createRequest(`/api/user/subscriptions/payment-intent?paymentintentid=${user.paymentIntent.stripeObject.id}`)
    req.account = user2.account
    req.session = user2.session
    try {
      await req.get()
    } catch (error) {
      cachedResponses.invalidAccount = error.message
    }
    // response
    const req2 = TestHelper.createRequest(`/api/user/subscriptions/payment-intent?paymentintentid=${user.paymentIntent.stripeObject.id}`)
    req2.account = user.account
    req2.session = user.session
    req2.filename = __filename
    req2.saveResponse = true
    cachedResponses.returns = await req2.get()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    describe('invalid-paymentintentid', () => {
      it('missing querystring invalid', async () => {
        await bundledData()
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/subscriptions/payment-intent')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-paymentintentid')
      })

      it('invalid querystring invalid', async () => {
        await bundledData()
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/subscriptions/payment-intent?paymentintentid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-paymentintentid')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async () => {
        await bundledData()
        const errorMessage = cachedResponses.invalidAccount
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const paymentIntent = cachedResponses.returns
      assert.strictEqual(paymentIntent.object, 'paymentintent')
    })
  })
})
