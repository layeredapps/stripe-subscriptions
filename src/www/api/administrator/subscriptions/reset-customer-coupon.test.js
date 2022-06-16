/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/administrator/subscriptions/reset-customer-coupon', function () {
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
    // invalid and missing id
    const req = TestHelper.createRequest('/api/administrator/subscriptions/reset-customer-coupon')
    req.account = administrator.account
    req.session = administrator.session
    try {
      await req.patch(req)
    } catch (error) {
      cachedResponses.missing = error.message
    }
    const req2 = TestHelper.createRequest('/api/administrator/subscriptions/reset-customer-coupon?customerid=invalid')
    req2.account = administrator.account
    req2.session = administrator.session
    try {
      await req2.patch()
    } catch (error) {
      cachedResponses.invalid = error.message
    }
    // invalid customer has no coupon
    const user = await TestHelper.createUser()
    await TestHelper.createCustomer(user, {
      email: user.profile.contactEmail
    })
    const req3 = TestHelper.createRequest(`/api/administrator/subscriptions/reset-customer-coupon?customerid=${user.customer.customerid}`)
    req3.account = administrator.account
    req3.session = administrator.session
    try {
      await req3.patch()
    } catch (error) {
      cachedResponses.invalidCustomer = error.message
    }
    // returns
    await TestHelper.createCoupon(administrator, {
      duration: 'repeating',
      duration_in_months: '3'
    })
    await TestHelper.createCustomerDiscount(administrator, user.customer, administrator.coupon)
    const req4 = TestHelper.createRequest(`/api/administrator/subscriptions/reset-customer-coupon?customerid=${user.customer.customerid}`)
    req4.account = administrator.account
    req4.session = administrator.session
    cachedResponses.returns = await req4.patch()
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
      it('invalid querystring customer has no discount', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidCustomer
        assert.strictEqual(errorMessage, 'invalid-customer')
      })
    })
  })

  describe('receives', () => {
    it('object', async () => {
      const customerNow = cachedResponses.returns
      assert.strictEqual(undefined, customerNow.stripeObject.coupon)
    })
  })
})
