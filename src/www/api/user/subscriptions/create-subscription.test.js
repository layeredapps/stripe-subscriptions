/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/subscriptions/create-subscription', function () {
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
    const administrator = await TestStripeAccounts.createOwnerWithPrice()
    const user = await TestHelper.createUser()
    // invalid customerid
    let req = TestHelper.createRequest('/api/user/subscriptions/create-subscription')
    req.account = user.account
    req.session = user.session
    req.body = {
      priceids: administrator.price.priceid,
      quantities: '1'
    }
    try {
      await req.post()
    } catch (error) {
      cachedResponses.missingCustomer = error.message
    }
    req = TestHelper.createRequest('/api/user/subscriptions/create-subscription?customerid=invalid')
    req.account = user.account
    req.session = user.session
    req.body = {
      priceids: administrator.price.priceid,
      quantities: '1'
    }
    try {
      await req.post()
    } catch (error) {
      cachedResponses.invalidCustomer = error.message
    }
    // missing payment method
    await TestHelper.createCustomer(user, {
      email: user.profile.contactEmail,
      country: 'US'
    })
    req = TestHelper.createRequest(`/api/user/subscriptions/create-subscription?customerid=${user.customer.customerid}`)
    req.account = user.account
    req.session = user.session
    req.body = {
      priceids: administrator.price.priceid,
      quantities: '1'
    }
    try {
      await req.post()
    } catch (error) {
      cachedResponses.invalidPaymentMethod = error.message
    }
    // invalid account
    const user2 = await TestHelper.createUser()
    req = TestHelper.createRequest(`/api/user/subscriptions/create-subscription?customerid=${user.customer.customerid}`)
    req.account = user2.account
    req.session = user2.session
    req.body = {
      priceids: administrator.price.priceid,
      quantities: '1'
    }
    try {
      await req.post()
    } catch (error) {
      cachedResponses.invalidAccount = error.message
    }
    // invalid price
    const user3 = await TestStripeAccounts.createUserWithPaymentMethod()
    req = TestHelper.createRequest(`/api/user/subscriptions/create-subscription?customerid=${user3.customer.customerid}`)
    req.account = user3.account
    req.session = user3.session
    req.body = {
      priceids: '',
      paymentmethodid: user3.paymentMethod.paymentmethodid,
      quantities: '1'
    }
    try {
      await req.post()
    } catch (error) {
      cachedResponses.missingPrice = error.message
    }
    req.body = {
      priceids: 'invalid',
      paymentmethodid: user3.paymentMethod.paymentmethodid,
      quantities: '1'
    }
    try {
      await req.post()
    } catch (error) {
      cachedResponses.invalidPrice = error.message
    }
    // not active price
    const administrator2 = await TestStripeAccounts.createOwnerWithInactivePrice()
    req.body = {
      priceids: administrator2.price.priceid,
      quantities: '1'
    }
    try {
      await req.post()
    } catch (error) {
      cachedResponses.notActivePrice = error.message
    }
    // default tax rates
    const taxRate1 = await TestHelper.createTaxRate(administrator, {
      active: 'false'
    })
    req = TestHelper.createRequest(`/api/user/subscriptions/create-subscription?customerid=${user3.customer.customerid}`)
    req.account = user3.account
    req.session = user3.session
    req.body = {
      priceids: administrator.price.priceid,
      quantities: '1',
      taxrateids: taxRate1.taxrateid
    }
    try {
      await req.post()
    } catch (error) {
      cachedResponses.invalidTaxRate = error.message
    }
    req = TestHelper.createRequest(`/api/user/subscriptions/create-subscription?customerid=${user3.customer.customerid}`)
    req.account = user3.account
    req.session = user3.session
    req.body = {
      priceids: administrator.price.priceid,
      quantities: '1',
      taxrateids: 'invalid'
    }
    try {
      await req.post()
    } catch (error) {
      cachedResponses.invalidTaxRateId = error.message
    }
    // response
    const taxRate2 = await TestHelper.createTaxRate(administrator, {
      active: true
    })
    const taxRate3 = await TestHelper.createTaxRate(administrator, {
      active: true
    })
    req = TestHelper.createRequest(`/api/user/subscriptions/create-subscription?customerid=${user3.customer.customerid}`)
    req.account = user3.account
    req.session = user3.session
    req.body = {
      priceids: administrator.price.priceid,
      quantities: '1',
      paymentmethodid: user3.paymentMethod.paymentmethodid,
      taxrateids: `${taxRate2.taxrateid},${taxRate3.taxrateid}`
    }
    req.filename = __filename
    req.saveResponse = true
    cachedResponses.returns = await req.post()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    describe('invalid-customerid', () => {
      it('missing querystring customerid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missingCustomer
        assert.strictEqual(errorMessage, 'invalid-customerid')
      })

      it('invalid querystring customerid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidCustomer
        assert.strictEqual(errorMessage, 'invalid-customerid')
      })
    })

    describe('invalid-customer', () => {
      it('ineligible querystring customer requires payment method', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidPaymentMethod
        assert.strictEqual(errorMessage, 'invalid-customer')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidAccount
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-priceids', () => {
      it('missing posted priceids', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missingPrice
        assert.strictEqual(errorMessage, 'invalid-priceids')
      })
    })

    describe('invalid-priceid', () => {
      it('invalid posted priceids contains invalid price', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidPrice
        assert.strictEqual(errorMessage, 'invalid-priceid')
      })
    })

    describe('invalid-price', () => {
      it('invalid posted priceids contains not active price', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.notActivePrice
        assert.strictEqual(errorMessage, 'invalid-price')
      })
    })

    describe('invalid-taxrateid', () => {
      it('invalid posted taxrateids contains invalid tax rate', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidTaxRateId
        assert.strictEqual(errorMessage, 'invalid-taxrateid')
      })
    })

    describe('invalid-tax-rate', () => {
      it('invalid posted taxrateids contains inactive tax rate', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidTaxRate
        assert.strictEqual(errorMessage, 'invalid-tax-rate')
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
