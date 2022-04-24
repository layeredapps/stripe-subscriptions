/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/administrator/subscriptions/create-coupon', () => {
  describe('exceptions', () => {
    describe('invalid-couponid', () => {
      it('missing posted couponid', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-coupon')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          couponid: '',
          amount_off: '',
          percent_off: ''
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-couponid')
      })

      it('invalid posted couponid is not alphanumeric', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-coupon')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          couponid: '#$%@#$%@#$%',
          amount_off: '',
          percent_off: ''
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-couponid')
      })
    })

    describe('duplicate-couponid', () => {
      it('invalid posted couponid is already used', async () => {
        const administrator = await TestHelper.createOwner()
        await TestHelper.createCoupon(administrator, {
          couponid: 'save10percent',
          percent_off: '10',
          duration: 'once'
        })
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-coupon')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          couponid: 'save10percent',
          percent_off: '10',
          duration: 'once'
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'duplicate-couponid')
      })
    })

    describe('invalid-amount_off', () => {
      it('missing posted amount_off', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-coupon')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          couponid: 'coupon' + new Date().getTime() + 'r' + Math.ceil(Math.random() * 1000),
          amount_off: '',
          percent_off: ''
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-amount_off')
      })

      it('invalid posted amount_off', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-coupon')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          couponid: 'coupon' + new Date().getTime() + 'r' + Math.ceil(Math.random() * 1000),
          amount_off: 'invalid',
          percent_off: ''
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-amount_off')
      })
    })

    describe('invalid-currency', () => {
      it('missing posted currency', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-coupon')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          couponid: 'coupon' + new Date().getTime() + 'r' + Math.ceil(Math.random() * 1000),
          amount_off: '1',
          currency: ''
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-currency')
      })

      it('invalid posted currency', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-coupon')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          couponid: 'coupon' + new Date().getTime() + 'r' + Math.ceil(Math.random() * 1000),
          amount_off: '1',
          currency: 'invalid'
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-currency')
      })
    })

    describe('invalid-percent_off', () => {
      it('invalid posted percent_off', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-coupon')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          couponid: 'coupon' + new Date().getTime() + 'r' + Math.ceil(Math.random() * 1000),
          percent_off: 'invalid'
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-percent_off')
        req.body = {
          couponid: 'coupon' + new Date().getTime() + 'r' + Math.ceil(Math.random() * 1000),
          percent_off: '101'
        }
        errorMessage = null
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-percent_off')
      })
    })

    describe('invalid-duration', () => {
      it('invalid posted duration', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-coupon')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          couponid: 'coupon' + new Date().getTime() + 'r' + Math.ceil(Math.random() * 1000),
          amount_off: '10',
          currency: 'usd',
          duration: 'invalid'
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-duration')
      })
    })

    describe('invalid-duration_in_months', () => {
      it('missing posted duration_in_months', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-coupon')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          couponid: 'coupon' + new Date().getTime() + 'r' + Math.ceil(Math.random() * 1000),
          amount_off: '10',
          currency: 'usd',
          duration: 'repeating',
          duration_in_months: ''
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-duration_in_months')
      })

      it('invalid posted duration_in_months', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-coupon')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          couponid: 'coupon' + new Date().getTime() + 'r' + Math.ceil(Math.random() * 1000),
          amount_off: '10',
          currency: 'usd',
          duration: 'repeating',
          duration_in_months: 'invalid'
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-duration_in_months')
      })
    })

    describe('invalid-redeem_by', () => {
      it('invalid posted redeem_by', async () => {
        const administrator = await TestHelper.createOwner()
        const now = new Date()
        const lastYear = new Date(now.getFullYear() - 1, 1, 12, 47, 33)
        const req = TestHelper.createRequest('/api/administrator/subscriptions/create-coupon')
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          couponid: 'coupon' + new Date().getTime() + 'r' + Math.ceil(Math.random() * 1000),
          amount_off: '10',
          currency: 'usd',
          duration: 'repeating',
          duration_in_months: '1',
          redeem_by: lastYear.toISOString()
        }
        let errorMessage
        try {
          await req.post()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-redeem_by')
      })
    })
  })

  describe('receives', () => {
    it('required posted duration', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-coupon')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        couponid: 'coupon' + new Date().getTime() + 'r' + Math.ceil(Math.random() * 1000),
        amount_off: '10',
        currency: 'usd',
        duration: 'repeating',
        duration_in_months: '8'
      }
      req.filename = __filename
      req.saveResponse = true
      const coupon = await req.post()
      assert.strictEqual(coupon.stripeObject.duration, 'repeating')
    })

    it('optionally-required posted amount_off (integer, or percent_off)', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-coupon')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        couponid: 'coupon' + new Date().getTime() + 'r' + Math.ceil(Math.random() * 1000),
        amount_off: '10',
        currency: 'usd',
        duration: 'once'
      }
      req.filename = __filename
      req.saveResponse = true
      const coupon = await req.post()
      assert.strictEqual(coupon.stripeObject.amount_off, 10)
    })

    it('optionally-required posted currency (string, if amount_off)', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-coupon')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        couponid: 'coupon' + new Date().getTime() + 'r' + Math.ceil(Math.random() * 1000),
        amount_off: '10',
        currency: 'aud',
        duration: 'once'
      }
      req.filename = __filename
      req.saveResponse = true
      const coupon = await req.post()
      assert.strictEqual(coupon.stripeObject.currency, 'aud')
    })

    it('optionally-required posted percent_off (integer, or amount_off)', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-coupon')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        couponid: 'coupon' + new Date().getTime() + 'r' + Math.ceil(Math.random() * 1000),
        percent_off: '10',
        currency: 'usd',
        duration: 'once'
      }
      req.filename = __filename
      req.saveResponse = true
      const coupon = await req.post()
      assert.strictEqual(coupon.stripeObject.percent_off, 10)
    })

    it('optionally-required posted redeem_by (date in future)', async () => {
      const administrator = await TestHelper.createOwner()
      const now = new Date()
      const date = new Date(now.getFullYear() + 1, 1, 1, 12, 47, 33)
      const timestamp = Math.floor(date.getTime() / 1000)
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-coupon')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        couponid: 'coupon' + new Date().getTime() + 'r' + Math.ceil(Math.random() * 1000),
        percent_off: '10',
        currency: 'usd',
        duration: 'once',
        redeem_by: date.toISOString()
      }
      req.filename = __filename
      req.saveResponse = true
      const coupon = await req.post()
      assert.strictEqual(coupon.stripeObject.redeem_by, timestamp)
    })

    it('optionally-required posted duration_in_months', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-coupon')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        couponid: 'coupon' + new Date().getTime() + 'r' + Math.ceil(Math.random() * 1000),
        percent_off: '10',
        currency: 'usd',
        duration: 'repeating',
        duration_in_months: '6'
      }
      req.filename = __filename
      req.saveResponse = true
      const coupon = await req.post()
      assert.strictEqual(coupon.stripeObject.duration_in_months, 6)
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/api/administrator/subscriptions/create-coupon')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        couponid: 'coupon' + new Date().getTime() + 'r' + Math.ceil(Math.random() * 1000),
        amount_off: '10',
        currency: 'usd',
        duration: 'once'
      }
      req.filename = __filename
      req.saveResponse = true
      const coupon = await req.post()
      assert.strictEqual(coupon.object, 'coupon')
    })
  })
})
