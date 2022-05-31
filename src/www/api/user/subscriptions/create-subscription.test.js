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
    const administrator = await TestStripeAccounts.createOwnerWithPrice({
      unit_amount: 3000,
      recurring_interval: 'month',
      recurring_usage_type: 'licensed'
    })
    const user = await TestHelper.createUser()
    // invalid customerid
    const req = TestHelper.createRequest('/api/user/subscriptions/create-subscription')
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
    const req2 = TestHelper.createRequest('/api/user/subscriptions/create-subscription?customerid=invalid')
    req2.account = user.account
    req2.session = user.session
    req2.body = {
      priceids: administrator.price.priceid,
      quantities: '1'
    }
    try {
      await req2.post()
    } catch (error) {
      cachedResponses.invalidCustomer = error.message
    }
    // missing payment method
    await TestHelper.createCustomer(user, {
      email: user.profile.contactEmail,
      country: 'US'
    })
    const req3 = TestHelper.createRequest(`/api/user/subscriptions/create-subscription?customerid=${user.customer.customerid}`)
    req3.account = user.account
    req3.session = user.session
    req3.body = {
      priceids: administrator.price.priceid,
      quantities: '1'
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
      priceids: administrator.price.priceid,
      quantities: '1'
    }
    try {
      await req4.post()
    } catch (error) {
      cachedResponses.invalidAccount = error.message
    }
    // invalid price
    const user3 = await TestStripeAccounts.createUserWithPaymentMethod()
    const req5 = TestHelper.createRequest(`/api/user/subscriptions/create-subscription?customerid=${user3.customer.customerid}`)
    req5.account = user3.account
    req5.session = user3.session
    req5.body = {
      priceids: '',
      paymentmethodid: user3.paymentMethod.paymentmethodid,
      quantities: '1'
    }
    try {
      await req5.post()
    } catch (error) {
      cachedResponses.missingprice = error.message
    }
    req5.body = {
      priceids: 'invalid',
      paymentmethodid: user3.paymentMethod.paymentmethodid,
      quantities: '1'
    }
    try {
      await req5.post()
    } catch (error) {
      cachedResponses.invalidprice = error.message
    }
    // not published price
    const administrator2 = await TestStripeAccounts.createOwnerWithNotPublishedPrice()
    req5.body = {
      priceids: administrator2.price.priceid,
      quantities: '1'
    }
    try {
      await req5.post()
    } catch (error) {
      cachedResponses.notPublishedprice = error.message
    }
    // unpublished price
    const administrator3 = await TestStripeAccounts.createOwnerWithUnpublishedPrice()
    req5.body = {
      priceids: administrator3.price.priceid,
      quantities: '1'
    }
    try {
      await req5.post()
    } catch (error) {
      cachedResponses.unpublishedprice = error.message
    }
    // response
    const req6 = TestHelper.createRequest(`/api/user/subscriptions/create-subscription?customerid=${user3.customer.customerid}`)
    req6.account = user3.account
    req6.session = user3.session
    req6.body = {
      priceids: administrator.price.priceid,
      quantities: '1',
      paymentmethodid: user3.paymentMethod.paymentmethodid
    }
    req6.filename = __filename
    req6.saveResponse = true
    cachedResponses.returns = await req6.post()
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
        const errorMessage = cachedResponses.missingprice
        assert.strictEqual(errorMessage, 'invalid-priceids')
      })
    })

    describe('invalid-priceid', () => {
      it('invalid posted priceids contains invalid price', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidprice
        assert.strictEqual(errorMessage, 'invalid-priceid')
      })
    })

    describe('invalid-price', () => {
      it('invalid posted priceids contains not published price', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.notPublishedprice
        assert.strictEqual(errorMessage, 'invalid-price')
      })

      it('invalid posted priceids contains unpublished price', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.unpublishedprice
        assert.strictEqual(errorMessage, 'invalid-price')
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
