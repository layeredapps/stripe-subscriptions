/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const ScreenshotData = require('../../../../screenshot-data.js')

describe('/administrator/subscriptions/deactivate-tax-rate', function () {
  describe('before', () => {
    it('should bind data to req', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createTaxRate(administrator, {
        active: true
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/deactivate-tax-rate?taxrateid=${administrator.taxRate.taxrateid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.taxRate.taxrateid, administrator.taxRate.taxrateid)
    })
  })

  describe('view', () => {
    it('should present the form', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createTaxRate(administrator, {
        active: true
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/deactivate-tax-rate?taxrateid=${administrator.taxRate.taxrateid}`)
      req.account = administrator.account
      req.session = administrator.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should deactivate tax rate (screenshots)', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createTaxRate(administrator, {
        active: true
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/deactivate-tax-rate?taxrateid=${administrator.taxRate.taxrateid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#administrator-menu-container' },
        { click: '/administrator/subscriptions' },
        { click: '/administrator/subscriptions/tax-rates' },
        { click: `/administrator/subscriptions/tax-rate?taxrateid=${administrator.taxRate.taxrateid}` },
        { click: `/administrator/subscriptions/deactivate-tax-rate?taxrateid=${administrator.taxRate.taxrateid}` },
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
      const req = TestHelper.createRequest('/administrator/subscriptions/deactivate-tax-rate?taxrateid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-taxrateid')
    })

    it('already-inactive', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createTaxRate(administrator, {
        active: false
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/deactivate-tax-rate?taxrateid=${administrator.taxRate.taxrateid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'already-inactive')
    })

    it('invalid-csrf-token', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.createTaxRate(administrator, {})
      const req = TestHelper.createRequest(`/administrator/subscriptions/deactivate-tax-rate?taxrateid=${administrator.taxRate.taxrateid}`)
      req.puppeteer = false
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        active: true,
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
