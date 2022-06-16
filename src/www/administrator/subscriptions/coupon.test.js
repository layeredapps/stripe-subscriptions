/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const ScreenshotData = require('../../../../screenshot-data.js')

describe('/administrator/subscriptions/coupon', function () {
  describe('before', () => {
    it('should bind data to req', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createCoupon(administrator, {
        duration: 'repeating',
        duration_in_months: '3'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/coupon?couponid=${administrator.coupon.couponid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.coupon.id, administrator.coupon.couponid)
    })
  })

  describe('view', () => {
    it('should present the coupon table (screenshots)', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice()
      await TestHelper.createCoupon(administrator, {
        duration: 'repeating',
        duration_in_months: '3'
      })
      for (let i = 0; i < 4; i++) {
        const user = await TestHelper.createUser()
        await TestHelper.createCustomer(user, {
          email: user.profile.contactEmail
        })
        await TestHelper.createCustomerDiscount(administrator, user.customer, administrator.coupon)
      }
      for (let i = 0; i < 3; i++) {
        const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
        await TestHelper.createSubscriptionDiscount(administrator, user.subscription, administrator.coupon)
      }
      const req = TestHelper.createRequest(`/administrator/subscriptions/coupon?couponid=${administrator.coupon.couponid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#administrator-menu-container' },
        { click: '/administrator/subscriptions' },
        { click: '/administrator/subscriptions/coupons' },
        { click: `/administrator/subscriptions/coupon?couponid=${administrator.coupon.couponid}` }
      ]
      global.pageSize = 50
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorIndex)
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorCoupons)
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const tbody = doc.getElementById(administrator.coupon.couponid)
      assert.strictEqual(tbody.tag, 'tbody')
    })
  })

  describe('errors', () => {
    it('should reject invalid coupon', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/coupon?couponid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-couponid')
    })
  })
})
