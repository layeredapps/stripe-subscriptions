/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const ScreenshotData = require('../../../../screenshot-data.js')

describe('/administrator/subscriptions/edit-product', function () {
  describe('before', () => {
    it('should bind data to req', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        active: 'true'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/edit-product?productid=${administrator.product.productid}`)
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
        active: 'true'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/edit-product?productid=${administrator.product.productid}`)
      req.account = administrator.account
      req.session = administrator.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should update product (screenshots)', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        active: 'true'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/edit-product?productid=${administrator.product.productid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: 'new-product-name',
        statement_descriptor: 'new-descriptor',
        unit_label: 'thing'
      }
      req.filename = __filename
      req.screenshots = [
        { hover: '#administrator-menu-container' },
        { click: '/administrator/subscriptions' },
        { click: '/administrator/subscriptions/products' },
        { click: `/administrator/subscriptions/product?productid=${administrator.product.productid}` },
        { click: `/administrator/subscriptions/edit-product?productid=${administrator.product.productid}` },
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
      const req = TestHelper.createRequest('/administrator/subscriptions/edit-product?productid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-productid')
    })

    it('inactive-product', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        active: 'false'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/edit-product?productid=${administrator.product.productid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'inactive-product')
    })

    it('invalid-name', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        active: 'true'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/edit-product?productid=${administrator.product.productid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: '',
        statement_descriptor: 'description'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-name')
    })

    it('invalid-product-name-length', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        active: 'true'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/edit-product?productid=${administrator.product.productid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: '1234567890123456789012345678901234567890',
        statement_descriptor: 'description'
      }
      global.maximumProductNameLength = 3
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-product-name-length')
    })

    it('invalid-statement_descriptor', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        active: 'true'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/edit-product?productid=${administrator.product.productid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: 'product',
        statement_descriptor: ''
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-statement_descriptor')
    })

    it('invalid-unit_label', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        active: 'true'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/edit-product?productid=${administrator.product.productid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: 'product',
        statement_descriptor: 'new-descriptor',
        unit_label: ''
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-unit_label')
    })

    it('invalid-xss-input', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        active: 'true'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/edit-product?productid=${administrator.product.productid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: 'new-product-name',
        statement_descriptor: 'new-descriptor',
        unit_label: '<script>'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-xss-input')
    })

    it('invalid-csrf-token', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createProduct(administrator, {
        active: 'true'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/edit-product?productid=${administrator.product.productid}`)
      req.puppeteer = false
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: 'new-product-name',
        statement_descriptor: 'new-descriptor',
        unit_label: 'thing',
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
