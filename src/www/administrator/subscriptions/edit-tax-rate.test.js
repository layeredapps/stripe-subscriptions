/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const ScreenshotData = require('../../../../screenshot-data.js')

describe('/administrator/subscriptions/edit-tax-rate', function () {
  describe('view', () => {
    it('should present the form', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createTaxRate(administrator)
      const req = TestHelper.createRequest(`/administrator/subscriptions/edit-tax-rate?taxrateid=${administrator.taxRate.taxrateid}`)
      req.account = administrator.account
      req.session = administrator.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should update tax rate (screenshots)', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createTaxRate(administrator)
      const req = TestHelper.createRequest(`/administrator/subscriptions/edit-tax-rate?taxrateid=${administrator.taxRate.taxrateid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        display_name: 'NY Sales Tax',
        active: 'true',
        description: 'Sales tax in NY',
        jurisdiction: 'US',
        inclusive: 'true'
      }
      req.filename = __filename
      req.screenshots = [
        { hover: '#administrator-menu-container' },
        { click: '/administrator/subscriptions' },
        { click: '/administrator/subscriptions/tax-rates' },
        { click: `/administrator/subscriptions/tax-rate?taxrateid=${administrator.taxRate.taxrateid}` },
        { click: `/administrator/subscriptions/edit-tax-rate?taxrateid=${administrator.taxRate.taxrateid}` },
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
    it('invalid-taxrateid', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/edit-tax-rate?taxrateid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-taxrateid')
    })

    it('invalid-display_name', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createTaxRate(administrator)
      const req = TestHelper.createRequest(`/administrator/subscriptions/edit-tax-rate?taxrateid=${administrator.taxRate.taxrateid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        display_name: '',
        active: 'true',
        description: 'Sales tax in NY',
        jurisdiction: 'US',
        inclusive: 'true'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-display_name')
    })

    it('invalid-description', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createTaxRate(administrator)
      const req = TestHelper.createRequest(`/administrator/subscriptions/edit-tax-rate?taxrateid=${administrator.taxRate.taxrateid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        display_name: 'NY Sales Tax',
        active: 'true',
        description: '',
        jurisdiction: 'US',
        inclusive: 'true'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-description')
    })

    it('invalid-jurisdiction', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createTaxRate(administrator)
      const req = TestHelper.createRequest(`/administrator/subscriptions/edit-tax-rate?taxrateid=${administrator.taxRate.taxrateid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        display_name: 'NY Sales Tax',
        active: 'true',
        description: 'Sales tax in NY',
        jurisdiction: '',
        inclusive: 'true'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-jurisdiction')
    })

    it('invalid-active', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createTaxRate(administrator)
      const req = TestHelper.createRequest(`/administrator/subscriptions/edit-tax-rate?taxrateid=${administrator.taxRate.taxrateid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        display_name: 'NY Sales Tax',
        active: '',
        description: 'Sales tax in NY',
        jurisdiction: 'US',
        inclusive: 'true'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-active')
    })

    it('invalid-inclusive', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createTaxRate(administrator)
      const req = TestHelper.createRequest(`/administrator/subscriptions/edit-tax-rate?taxrateid=${administrator.taxRate.taxrateid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        display_name: 'NY Sales Tax',
        active: 'true',
        description: 'Sales tax in NY',
        jurisdiction: 'US',
        inclusive: ''
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-inclusive')
    })

    it('invalid-xss-input', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createTaxRate(administrator)
      const req = TestHelper.createRequest(`/administrator/subscriptions/edit-tax-rate?taxrateid=${administrator.taxRate.taxrateid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        display_name: '<script>',
        active: 'true',
        description: 'Sales tax in NY',
        jurisdiction: 'US',
        inclusive: 'true'
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-xss-input')
    })

    it('invalid-csrf-token', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createTaxRate(administrator)
      const req = TestHelper.createRequest(`/administrator/subscriptions/edit-tax-rate?taxrateid=${administrator.taxRate.taxrateid}`)
      req.puppeteer = false
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        display_name: 'NY Sales Tax',
        active: 'true',
        description: 'Sales tax in NY',
        jurisdiction: 'US',
        inclusive: 'true',
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
