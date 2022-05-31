/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/administrator/subscriptions/set-customer-coupon', function () {
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
    const coupon = await TestHelper.createCoupon(administrator, {
      publishedAt: 'true',
      duration: 'repeating',
      duration_in_months: '3'
    })
    const notPublishedCoupon = await TestHelper.createCoupon(administrator, {
      duration: 'repeating',
      duration_in_months: '3'
    })
    const unpublishedCoupon = await TestHelper.createCoupon(administrator, {
      publishedAt: 'true',
      unpublishedAt: 'true',
      duration: 'repeating',
      duration_in_months: '3'
    })
    // missing and invalid customer id
    const req = TestHelper.createRequest('/api/administrator/subscriptions/set-customer-coupon')
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      couponid: 'fake'
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.missing = error.message
    }
    const req2 = TestHelper.createRequest('/api/administrator/subscriptions/set-customer-coupon?customerid=invalid')
    req2.account = administrator.account
    req2.session = administrator.session
    req2.body = {
      couponid: 'fake'
    }
    try {
      await req2.patch()
    } catch (error) {
      cachedResponses.invalid = error.message
    }
    // invalid customer
    const user2 = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
    await TestHelper.createCustomerDiscount(administrator, user2.customer, coupon)
    const req3 = TestHelper.createRequest(`/api/administrator/subscriptions/set-customer-coupon?customerid=${user2.customer.customerid}`)
    req3.account = administrator.account
    req3.session = administrator.session
    req3.body = {
      couponid: coupon.couponid
    }
    try {
      await req3.patch()
    } catch (error) {
      cachedResponses.invalidCustomer = error.message
    }
    // invalid coupon
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
    const req4 = TestHelper.createRequest(`/api/administrator/subscriptions/set-customer-coupon?customerid=${user.customer.customerid}`)
    req4.account = administrator.account
    req4.session = administrator.session
    req4.body = {
      couponid: ''
    }
    try {
      await req4.patch()
    } catch (error) {
      cachedResponses.missingCoupon = error.message
    }
    const req5 = TestHelper.createRequest(`/api/administrator/subscriptions/set-customer-coupon?customerid=${user.customer.customerid}`)
    req5.account = administrator.account
    req5.session = administrator.session
    req5.body = {
      couponid: 'fake'
    }
    try {
      await req5.patch()
    } catch (error) {
      cachedResponses.invalidCoupon = error.message
    }
    // not published and unpublished coupon
    const req6 = TestHelper.createRequest(`/api/administrator/subscriptions/set-customer-coupon?customerid=${user.customer.customerid}`)
    req6.account = administrator.account
    req6.session = administrator.session
    req6.body = {
      couponid: notPublishedCoupon.couponid
    }
    try {
      await req6.patch()
    } catch (error) {
      cachedResponses.notPublishedCoupon = error.message
    }
    const req7 = TestHelper.createRequest(`/api/administrator/subscriptions/set-customer-coupon?customerid=${user.customer.customerid}`)
    req7.account = administrator.account
    req7.session = administrator.session
    req7.body = {
      couponid: unpublishedCoupon.couponid
    }
    try {
      await req7.patch()
    } catch (error) {
      cachedResponses.unpublishedAtCoupon = error.message
    }
    // returns
    const req8 = TestHelper.createRequest(`/api/administrator/subscriptions/set-customer-coupon?customerid=${user.customer.customerid}`)
    req8.account = administrator.account
    req8.session = administrator.session
    req8.body = {
      couponid: coupon.couponid
    }
    req8.filename = __filename
    req8.saveResponse = true
    cachedResponses.returns = await req8.patch()
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
      it('ineligible customer has coupon', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidCustomer
        assert.strictEqual(errorMessage, 'invalid-customer')
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

    describe('invalid-coupon', () => {
      it('ineligible posted coupon is not published', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.notPublishedCoupon
        assert.strictEqual(errorMessage, 'invalid-coupon')
      })

      it('ineligible posted coupon is unpublished', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.unpublishedAtCoupon
        assert.strictEqual(errorMessage, 'invalid-coupon')
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
