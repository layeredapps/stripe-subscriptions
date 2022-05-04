/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const ScreenshotData = require('../../../../screenshot-data.js')

describe('/administrator/subscriptions/unpublish-product', function () {
  describe('before', () => {
    it('should bind data to req', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/unpublish-product?productid=${administrator.product.productid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.product.productid, administrator.product.productid)
    })
  })

  describe('view', () => {
    it('should present the form', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/unpublish-product?productid=${administrator.product.productid}`)
      req.account = administrator.account
      req.session = administrator.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should unpublish product (screenshots)', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/unpublish-product?productid=${administrator.product.productid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#administrator-menu-container' },
        { click: '/administrator/subscriptions' },
        { click: '/administrator/subscriptions/products' },
        { click: `/administrator/subscriptions/product?productid=${administrator.product.productid}` },
        { click: `/administrator/subscriptions/unpublish-product?productid=${administrator.product.productid}` },
        { fill: '#submit-form' }
      ]
      global.pageSize = 50
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorIndex)
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorProducts)
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })

  describe('errors', () => {
    it('invalid-productid', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/unpublish-product?productid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-productid')
    })

    it('not-published', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {})
      const req = TestHelper.createRequest(`/administrator/subscriptions/unpublish-product?productid=${administrator.product.productid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'not-published')
    })

    it('already-unpublished', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true',
        unpublishedAt: 'true'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/unpublish-product?productid=${administrator.product.productid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'already-unpublished')
    })

    it('invalid-csrf-token', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/unpublish-product?productid=${administrator.product.productid}`)
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
