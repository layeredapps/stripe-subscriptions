/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/subscriptions/published-coupon', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('exceptions', () => {
    describe('invalid-couponid', () => {
      it('missing querystring couponid', async () => {
        const req = TestHelper.createRequest('/api/user/subscriptions/published-coupon')
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-couponid')
      })

      it('invalid querystring couponid', async () => {
        const req = TestHelper.createRequest('/api/user/subscriptions/published-coupon?couponid=invalid')
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-couponid')
      })
    })

    describe('invalid-coupon', () => {
      it('ineligible querystring coupon is not published', async () => {
        const administrator = await TestHelper.createAdministrator()
        await TestHelper.createCoupon(administrator, {})
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/subscriptions/published-coupon?couponid=${administrator.coupon.couponid}`)
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-coupon')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const administrator = await TestHelper.createAdministrator()
      await TestHelper.createCoupon(administrator, {
        publishedAt: 'true'
      })
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/subscriptions/published-coupon?couponid=${administrator.coupon.couponid}`)
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.saveResponse = true
      const coupon = await req.get()
      assert.strictEqual(coupon.couponid, administrator.coupon.couponid)
    })
  })
})
