/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/subscriptions/set-payment-method-detached', function () {
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
    const user = await TestStripeAccounts.createUserWithPaymentMethod()
    const user2 = await TestHelper.createUser()
    // invalid account
    const req = TestHelper.createRequest(`/api/user/subscriptions/set-payment-method-detached?paymentmethodid=${user.paymentMethod.paymentmethodid}`)
    req.account = user2.account
    req.session = user2.session
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.invalidAccount = error.message
    }
    // invalid payment method is default
    const req2 = TestHelper.createRequest(`/api/user/subscriptions/set-payment-method-detached?paymentmethodid=${user.paymentMethod.paymentmethodid}`)
    req2.account = user.account
    req2.session = user.session
    try {
      await req2.patch()
    } catch (error) {
      cachedResponses.invalidPaymentMethod = error.message
    }
    // response
    const paymentMethod1 = user.paymentMethod
    await TestHelper.createPaymentMethod(user, {
      cvc: '111',
      number: '4111111111111111',
      exp_month: '1',
      exp_year: (new Date().getFullYear() + 1).toString().substring(2),
      name: user.profile.firstName + ' ' + user.profile.lastName,
      address_line1: '285 Fulton St',
      address_line2: 'Apt 893',
      address_city: 'New York',
      address_state: 'NY',
      address_zip: '10007',
      address_country: 'US',
      default: 'true'
    })
    const req3 = TestHelper.createRequest(`/api/user/subscriptions/set-payment-method-detached?paymentmethodid=${paymentMethod1.paymentmethodid}`)
    req3.account = user.account
    req3.session = user.session
    req3.filename = __filename
    req3.saveResponse = true
    cachedResponses.returns = await req3.patch()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    describe('invalid-paymentmethodid', () => {
      it('missing querystring paymentmethodid', async function () {
        await bundledData(this.test.currentRetry())
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/subscriptions/set-payment-method-detached')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-paymentmethodid')
      })

      it('invalid querystring paymentmethodid', async function () {
        await bundledData(this.test.currentRetry())
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/subscriptions/set-payment-method-detached?paymentmethodid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-paymentmethodid')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidAccount
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-paymentmethod', () => {
      it('invalid querystring payment method is default', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidPaymentMethod
        assert.strictEqual(errorMessage, 'invalid-paymentmethod')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const paymentMethodNow = cachedResponses.returns
      assert.strictEqual(paymentMethodNow.stripeObject.customer, null)
    })
  })
})
