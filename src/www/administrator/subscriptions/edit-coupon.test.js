/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const ScreenshotData = require('../../../../screenshot-data.js')

describe('/administrator/subscriptions/edit-coupon', function () {
  describe('before', () => {
    it('should bind data to req', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createCoupon(administrator, {
        publishedAt: 'true',
        duration: 'repeating',
        duration_in_months: '3'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/edit-coupon?couponid=${administrator.coupon.couponid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.coupon.id, administrator.coupon.couponid)
    })
  })

  describe('view', () => {
    it('should present the form', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createCoupon(administrator, {
        publishedAt: 'true',
        duration: 'repeating',
        duration_in_months: '3'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/edit-coupon?couponid=${administrator.coupon.couponid}`)
      req.account = administrator.account
      req.session = administrator.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should reject missing name', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createCoupon(administrator, {
        publishedAt: 'true',
        duration: 'repeating',
        duration_in_months: '3'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/edit-coupon?couponid=${administrator.coupon.couponid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: ''
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-name')
    })

    it('should update coupon (screenshots)', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createCoupon(administrator, {
        publishedAt: 'true',
        duration: 'repeating',
        duration_in_months: '3'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/edit-coupon?couponid=${administrator.coupon.couponid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: 'new name'
      }
      req.filename = __filename
      req.screenshots = [
        { hover: '#administrator-menu-container' },
        { click: '/administrator/subscriptions' },
        { click: '/administrator/subscriptions/coupons' },
        { click: `/administrator/subscriptions/coupon?couponid=${administrator.coupon.couponid}` },
        { click: `/administrator/subscriptions/edit-coupon?couponid=${administrator.coupon.couponid}` },
        { fill: '#submit-form' }
      ]
      global.pageSize = 50
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorIndex)
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorCoupons)
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })

  describe('errors', () => {
    it('invalid-couponid', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/edit-coupon?planid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-couponid')
    })

    it('invalid-coupon', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createCoupon(administrator, {
        publishedAt: 'true',
        unpublishedAt: 'true',
        duration: 'repeating',
        duration_in_months: '3'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/edit-coupon?couponid=${administrator.coupon.couponid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-coupon')
    })

    it('invalid-xss-input', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createCoupon(administrator, {
        publishedAt: 'true',
        duration: 'repeating',
        duration_in_months: '3'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/edit-coupon?couponid=${administrator.coupon.couponid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: '<script>'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-xss-input')
    })

    it('invalid-csrf-token', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createCoupon(administrator, {
        publishedAt: 'true',
        duration: 'repeating',
        duration_in_months: '3'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/edit-coupon?couponid=${administrator.coupon.couponid}`)
      req.puppeteer = false
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: 'new name',
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
