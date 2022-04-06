/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/administrator/subscriptions/set-customer-coupon', function () {
  const cachedResponses = {}
  before(async () => {
    await TestHelper.setupBefore()
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestStripeAccounts.createOwnerWithPlan({
      amount: '1000',
      trial_period_days: '0',
      interval: 'month',
      usage_type: 'licensed'
    })
    const coupon = await TestHelper.createCoupon(administrator, {
      publishedAt: 'true',
      percent_off: '25',
      duration: 'repeating',
      duration_in_months: '3'
    })
    const notPublishedCoupon = await TestHelper.createCoupon(administrator, {
      percent_off: '25',
      duration: 'repeating',
      duration_in_months: '3'
    })
    const unpublishedCoupon = await TestHelper.createCoupon(administrator, {
      publishedAt: 'true',
      unpublishedAt: 'true',
      percent_off: '25',
      duration: 'repeating',
      duration_in_months: '3'
    })
    // missing and invalid id
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
    const user2 = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
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
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
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
  })
  describe('exceptions', () => {
    describe('invalid-customerid', () => {
      it('missing querystring customerid', async () => {
        const errorMessage = cachedResponses.missing
        assert.strictEqual(errorMessage, 'invalid-customerid')
      })

      it('invalid querystring customerid', async () => {
        const errorMessage = cachedResponses.invalid
        assert.strictEqual(errorMessage, 'invalid-customerid')
      })
    })

    describe('invalid-customer', () => {
      it('ineligible customer has coupon', async () => {
        const errorMessage = cachedResponses.invalidCustomer
        assert.strictEqual(errorMessage, 'invalid-customer')
      })
    })

    describe('invalid-couponid', () => {
      it('missing posted couponid', async () => {
        const errorMessage = cachedResponses.missingCoupon
        assert.strictEqual(errorMessage, 'invalid-couponid')
      })

      it('invalid posted couponid', async () => {
        const errorMessage = cachedResponses.invalidCoupon
        assert.strictEqual(errorMessage, 'invalid-couponid')
      })
    })

    describe('invalid-coupon', () => {
      it('ineligible posted coupon is not published', async () => {
        const errorMessage = cachedResponses.notPublishedCoupon
        assert.strictEqual(errorMessage, 'invalid-coupon')
      })

      it('ineligible posted coupon is unpublished', async () => {
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
