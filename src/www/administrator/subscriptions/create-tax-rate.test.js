/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const ScreenshotData = require('../../../../screenshot-data.js')

describe('/administrator/subscriptions/create-tax-rate', function () {
  describe('view', () => {
    it('should present the form', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-tax-rate')
      req.account = administrator.account
      req.session = administrator.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should create tax rate (screenshots)', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-tax-rate')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        display_name: 'NY Sales Tax',
        percentage: '11',
        inclusive: 'true',
        active: 'true',
        state: 'NY',
        country: 'US',
        description: 'Sales tax in NY',
        jurisdiction: 'US',
        tax_type: 'sales_tax'
      }
      req.filename = __filename
      req.screenshots = [
        { hover: '#administrator-menu-container' },
        { click: '/administrator/subscriptions' },
        { click: '/administrator/subscriptions/tax-rates' },
        { click: '/administrator/subscriptions/create-tax-rate' },
        { fill: '#submit-form' }
      ]
      global.pageSize = 50
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorIndex)
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorProducts)
      const result = await req.post()
      assert.strictEqual(true, result.redirect.startsWith('/administrator/subscriptions/tax-rate?taxrateid='))
    })
  })

  describe('errors', () => {
    it('invalid-percentage', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-tax-rate')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        display_name: 'NY Sales Tax',
        percentage: '-11',
        inclusive: 'true',
        active: 'true',
        state: 'NY',
        country: 'US',
        description: 'Sales tax in NY',
        jurisdiction: 'US',
        tax_type: 'sales_tax'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-percentage')
    })

    it('invalid-display_name', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-tax-rate')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        display_name: '',
        percentage: '11',
        inclusive: 'true',
        active: 'true',
        state: 'NY',
        country: 'US',
        description: 'Sales tax in NY',
        jurisdiction: 'US',
        tax_type: 'sales_tax'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-display_name')
    })

    it('invalid-inclusive', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-tax-rate')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        display_name: 'NY Sales Tax',
        percentage: '3',
        inclusive: '',
        active: 'true',
        state: 'NY',
        country: 'US',
        description: 'Sales tax in NY',
        jurisdiction: 'US',
        tax_type: 'sales_tax'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-inclusive')
    })

    it('invalid-country', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-tax-rate')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        display_name: 'NY Sales Tax',
        percentage: '3',
        inclusive: 'true',
        active: 'true',
        state: 'NY',
        country: '',
        description: 'Sales tax in NY',
        jurisdiction: 'US',
        tax_type: 'sales_tax'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-country')
    })

    it('invalid-tax_type', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-tax-rate')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        display_name: 'NY Sales Tax',
        percentage: '3',
        inclusive: 'true',
        active: 'true',
        state: 'NY',
        country: 'US',
        description: 'Sales tax in NY',
        jurisdiction: 'US',
        tax_type: ''
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-tax_type')
    })

    it('invalid-xss-input', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-tax-rate')
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        display_name: 'NY Sales Tax',
        percentage: '3',
        inclusive: 'true',
        active: 'true',
        state: 'NY',
        country: 'US',
        description: '<script>',
        jurisdiction: 'US',
        tax_type: 'sales_tax'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-xss-input')
    })

    it('invalid-csrf-token', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/create-tax-rate')
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
