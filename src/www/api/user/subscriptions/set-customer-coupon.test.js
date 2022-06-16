/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/subscriptions/set-customer-coupon', function () {
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
    const administrator = await TestHelper.createOwner()
    const coupon1 = await TestHelper.createCoupon(administrator, {
      active: 'true'
    })
    const coupon2 = await TestHelper.createCoupon(administrator, {
      active: 'true'
    })
    const user = await TestStripeAccounts.createUserWithoutPaymentMethod()
    // missing and invalid id
    let req = TestHelper.createRequest('/api/user/subscriptions/set-customer-coupon')
    req.account = user.account
    req.session = user.session
    req.body = {
      couponid: coupon1.couponid
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.missing = error.message
    }
    req = TestHelper.createRequest('/api/user/subscriptions/set-customer-coupon?customerid=invalid')
    req.account = user.account
    req.session = user.session
    req.body = {
      couponid: coupon1.couponid
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.invalid = error.message
    }
    // invalid customer
    await TestHelper.createCustomerDiscount(administrator, user.customer, coupon1)
    req = TestHelper.createRequest(`/api/user/subscriptions/set-customer-coupon?customerid=${user.customer.customerid}`)
    req.account = user.account
    req.session = user.session
    req.body = {
      couponid: coupon2.couponid
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.invalidCustomer = error.message
    }
    // invalid account
    const user2 = await TestStripeAccounts.createUserWithoutPaymentMethod()
    req = TestHelper.createRequest(`/api/user/subscriptions/set-customer-coupon?customerid=${user.customer.customerid}`)
    req.account = user2.account
    req.session = user2.session
    req.body = {
      couponid: coupon1.couponid
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.invalidAccount = error.message
    }
    // invalid and missing coupon
    req = TestHelper.createRequest(`/api/user/subscriptions/set-customer-coupon?customerid=${user2.customer.customerid}`)
    req.account = user2.account
    req.session = user2.session
    req.body = {
      couponid: ''
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.missingCoupon = error.message
    }
    req = TestHelper.createRequest(`/api/user/subscriptions/set-customer-coupon?customerid=${user2.customer.customerid}`)
    req.account = user2.account
    req.session = user2.session
    req.body = {
      couponid: 'invalid'
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.invalidCoupon = error.message
    }
    // returns
    req = TestHelper.createRequest(`/api/user/subscriptions/set-customer-coupon?customerid=${user2.customer.customerid}`)
    req.account = user2.account
    req.session = user2.session
    req.body = {
      couponid: coupon1.couponid
    }
    req.filename = __filename
    req.saveResponse = true
    cachedResponses.returns = await req.patch()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    describe('invalid-customerid', () => {
      it('missing querystring customerid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missing
        assert.strictEqual(errorMessage, 'invalid-customerid')
      })

      it('invalid querystring customerid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalid
        assert.strictEqual(errorMessage, 'invalid-customerid')
      })
    })

    describe('invalid-customer', () => {
      it('invalid querystring customer has coupon', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidCustomer
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

    describe('invalid-couponid', () => {
      it('missing posted couponid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missingCoupon
        assert.strictEqual(errorMessage, 'invalid-couponid')
      })

      it('invalid posted couponid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidCoupon
        assert.strictEqual(errorMessage, 'invalid-couponid')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const customerNow = cachedResponses.returns
      assert.strictEqual(customerNow.stripeObject.discount.coupon.object, 'coupon')
    })
  })
})
