/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const ScreenshotData = require('../../../../screenshot-data.js')

describe('/administrator/subscriptions/create-coupon', function () {
  describe('view', () => {
    it('should present the form', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-coupon')
      req.account = administrator.account
      req.session = administrator.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should create coupon (screenshots)', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-coupon')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        couponid: 'SAVE100',
        duration: 'once',
        amount_off: '100',
        max_redemptions: '1',
        currency: 'usd'
      }
      req.filename = __filename
      req.screenshots = [
        { hover: '#administrator-menu-container' },
        { click: '/administrator/subscriptions' },
        { click: '/administrator/subscriptions/coupons' },
        { click: '/administrator/subscriptions/create-coupon' },
        { fill: '#submit-form' }
      ]
      global.pageSize = 50
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorIndex)
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorCoupons)
      const result = await req.post()
      assert.strictEqual(true, result.redirect.startsWith('/administrator/subscriptions/coupon?couponid='))
    })
  })

  describe('errors', () => {
    it('invalid-couponid', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-coupon')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        couponid: '',
        duration: 'once',
        amount_off: '100',
        max_redemptions: '1',
        currency: 'usd'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-couponid')
    })

    it('invalid-couponid-length', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-coupon')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        couponid: '1234567890123456789012345678901234567890',
        duration: 'once',
        amount_off: '100',
        max_redemptions: '1',
        currency: 'usd'
      }
      global.maximumCouponLength = 3
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-couponid-length')
    })

    it('invalid-couponid', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createCoupon(administrator, {
        publishedAt: 'true',
        duration: 'repeating',
        duration_in_months: '3'
      })
      const req = TestHelper.createRequest('/administrator/subscriptions/create-coupon')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        couponid: administrator.coupon.couponid,
        duration: 'once',
        amount_off: '100',
        max_redemptions: '1',
        currency: 'usd'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-couponid')
    })

    it('invalid-duration', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-coupon')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        couponid: 'SAVE100',
        duration: '',
        amount_off: '100',
        max_redemptions: '1',
        currency: 'usd'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-duration')
    })

    it('invalid-duration', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-coupon')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        couponid: 'SAVE100',
        duration: 'invalid',
        amount_off: '100',
        max_redemptions: '1',
        currency: 'usd'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-duration')
    })

    it('invalid-amount_off', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-coupon')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        couponid: 'SAVE100',
        duration: 'once',
        amount_off: 'invalid',
        max_redemptions: '1',
        currency: 'usd'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-amount_off')
    })

    it('invalid-percent_off', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-coupon')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        couponid: 'NEGATIVETHREE',
        duration: 'once',
        percent_off: '-3',
        max_redemptions: '1',
        currency: 'usd'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-percent_off')
    })

    it('invalid-max_redemptions', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-coupon')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        couponid: 'MINUSONEREDEMPTIONS',
        duration: 'once',
        percent_off: '30',
        max_redemptions: '-1',
        currency: 'usd'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-max_redemptions')
    })

    it('invalid-discount', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-coupon')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        couponid: 'MISSINGAMOUNT',
        duration: 'once',
        max_redemptions: '1',
        currency: 'usd'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-discount')
    })

    it('invalid-duration_in_months', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-coupon')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        couponid: 'INVALIDDURATION',
        duration: 'repeating',
        duration_in_months: '-1',
        amount_off: '700',
        max_redemptions: '1',
        currency: 'usd'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-duration_in_months')
    })

    it('invalid-redeem_by', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-coupon')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        couponid: 'INVALIDREDEEMBY',
        duration: 'repeating',
        duration_in_months: '10',
        amount_off: '700',
        max_redemptions: '1',
        currency: 'usd',
        redeem_by: new Date(new Date().getFullYear() - 1, 1, 1, 10, 53, 37).toISOString()
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-redeem_by')
    })

    it('invalid-xss-input', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-coupon')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        couponid: '<script>',
        duration: 'once',
        amount_off: '100',
        max_redemptions: '1',
        currency: 'usd'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-xss-input')
    })

    it('invalid-csrf-token', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-coupon')
      req.puppeteer = false
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        couponid: 'SAVE100',
        duration: 'once',
        amount_off: '100',
        max_redemptions: '1',
        currency: 'usd',
        'csrf-token': ''
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-csrf-token')
    })
  })
})
