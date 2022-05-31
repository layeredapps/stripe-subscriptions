/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const ScreenshotData = require('../../../../screenshot-data.js')

describe('/administrator/subscriptions/create-product', function () {
  describe('view', () => {
    it('should present the form', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-product')
      req.account = administrator.account
      req.session = administrator.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should create product (screenshots)', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-product')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: 'product' + new Date().getTime(),
        statement_descriptor: 'description',
        unit_label: 'thing',
        tax_code: 'txcd_41060003'
      }
      req.filename = __filename
      req.screenshots = [
        { hover: '#administrator-menu-container' },
        { click: '/administrator/subscriptions' },
        { click: '/administrator/subscriptions/products' },
        { click: '/administrator/subscriptions/create-product' },
        { fill: '#submit-form' }
      ]
      global.pageSize = 50
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorIndex)
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorProducts)
      const result = await req.post()
      assert.strictEqual(true, result.redirect.startsWith('/administrator/subscriptions/product?productid='))
    })
  })

  describe('errors', () => {
    it('invalid-name', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-product')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: '',
        statement_descriptor: 'description',
        unit_label: 'thing',
        tax_code: 'txcd_41060003'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-name')
    })

    it('invalid-product-name-length', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-product')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: '1234567890123456789012345678901234567890',
        statement_descriptor: 'description',
        unit_label: 'thing',
        tax_code: 'txcd_41060003'
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
      const req = TestHelper.createRequest('/administrator/subscriptions/create-product')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: 'product',
        statement_descriptor: '',
        unit_label: 'thing',
        tax_code: 'txcd_41060003'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-statement_descriptor')
    })

    it('invalid-tax_code', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-product')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: 'product',
        statement_descriptor: '',
        unit_label: 'thing',
        tax_code: ''
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-statement_descriptor')
    })

    it('invalid-xss-input', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-product')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: 'product' + new Date().getTime(),
        statement_descriptor: 'description',
        unit_label: '<script>',
        tax_code: 'txcd_41060003'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-xss-input')
    })

    it('invalid-csrf-token', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-product')
      req.puppeteer = false
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        name: 'product' + new Date().getTime(),
        statement_descriptor: 'description',
        unit_label: 'thing',
        tax_code: 'txcd_41060003',
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
