/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const ScreenshotData = require('../../../../screenshot-data.js')

describe('/administrator/subscriptions/price', function () {
  describe('before', () => {
    it('should bind data to req', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice({
        amount: '1000',
        interval: 'month',
        usage_type: 'licensed'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/price?priceid=${administrator.price.priceid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.price.priceid, administrator.price.priceid)
    })
  })

  describe('view', () => {
    it('should present the price table (screenshots)', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice({
        amount: '1000',
        interval: 'month',
        usage_type: 'licensed'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/price?priceid=${administrator.price.priceid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#administrator-menu-container' },
        { click: '/administrator/subscriptions' },
        { click: '/administrator/subscriptions/prices' },
        { click: `/administrator/subscriptions/price?priceid=${administrator.price.priceid}` }
      ]
      global.pageSize = 50
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorIndex)
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorPrices)
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const tbody = doc.getElementById(administrator.price.priceid)
      assert.strictEqual(tbody.tag, 'tbody')
    })
  })

  describe('errors', () => {
    it('invalid-priceid', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/price?priceid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-priceid')
    })
  })
})
