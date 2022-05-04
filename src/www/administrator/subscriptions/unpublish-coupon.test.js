/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const ScreenshotData = require('../../../../screenshot-data.js')

describe('/administrator/subscriptions/unpublish-coupon', function () {
  describe('before', () => {
    it('should bind data to req', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createCoupon(administrator, {
        publishedAt: 'true',
        duration: 'repeating',
        duration_in_months: '3'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/unpublish-coupon?couponid=${administrator.coupon.couponid}`)
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
      const req = TestHelper.createRequest(`/administrator/subscriptions/unpublish-coupon?couponid=${administrator.coupon.couponid}`)
      req.account = administrator.account
      req.session = administrator.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should unpublish coupon (screenshots)', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createCoupon(administrator, {
        publishedAt: 'true',
        duration: 'repeating',
        duration_in_months: '3'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/unpublish-coupon?couponid=${administrator.coupon.couponid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#administrator-menu-container' },
        { click: '/administrator/subscriptions' },
        { click: '/administrator/subscriptions/coupons' },
        { click: `/administrator/subscriptions/coupon?couponid=${administrator.coupon.couponid}` },
        { click: `/administrator/subscriptions/unpublish-coupon?couponid=${administrator.coupon.couponid}` },
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
      const req = TestHelper.createRequest('/administrator/subscriptions/unpublish-coupon?couponid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-couponid')
    })

    it('not-published', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createCoupon(administrator, {
        duration: 'repeating',
        duration_in_months: '3'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/unpublish-coupon?couponid=${administrator.coupon.couponid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'not-published')
    })

    it('already-unpublished', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createCoupon(administrator, {
        publishedAt: 'true',
        unpublishedAt: 'true',
        duration: 'repeating',
        duration_in_months: '3'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/unpublish-coupon?couponid=${administrator.coupon.couponid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'already-unpublished')
    })

    it('invalid-csrf-token', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createCoupon(administrator, {
        publishedAt: 'true',
        duration: 'repeating',
        duration_in_months: '3'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/unpublish-coupon?couponid=${administrator.coupon.couponid}`)
      req.puppeteer = false
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
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
