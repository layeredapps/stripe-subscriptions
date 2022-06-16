/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const ScreenshotData = require('../../../../screenshot-data.js')

describe('/administrator/subscriptions/deactivate-price', function () {
  describe('before', () => {
    it('should bind data to req', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice()
      const req = TestHelper.createRequest(`/administrator/subscriptions/deactivate-price?priceid=${administrator.price.priceid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.price.priceid, administrator.price.priceid)
    })
  })

  describe('view', () => {
    it('should present the form', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice()
      const req = TestHelper.createRequest(`/administrator/subscriptions/deactivate-price?priceid=${administrator.price.priceid}`)
      req.account = administrator.account
      req.session = administrator.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should deactivate price (screenshots)', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice()
      const req = TestHelper.createRequest(`/administrator/subscriptions/deactivate-price?priceid=${administrator.price.priceid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#administrator-menu-container' },
        { click: '/administrator/subscriptions' },
        { click: '/administrator/subscriptions/prices' },
        { click: `/administrator/subscriptions/price?priceid=${administrator.price.priceid}` },
        { click: `/administrator/subscriptions/deactivate-price?priceid=${administrator.price.priceid}` },
        { fill: '#submit-form' }
      ]
      global.pageSize = 50
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorIndex)
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorPrices)
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })

  describe('errors', () => {
    it('invalid-priceid', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/deactivate-price?priceid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-priceid')
    })

    it('already-inactive', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithInactivePrice()
      const req = TestHelper.createRequest(`/administrator/subscriptions/deactivate-price?priceid=${administrator.price.priceid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'already-inactive')
    })

    it('invalid-csrf-token', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice()
      const req = TestHelper.createRequest(`/administrator/subscriptions/deactivate-price?priceid=${administrator.price.priceid}`)
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
