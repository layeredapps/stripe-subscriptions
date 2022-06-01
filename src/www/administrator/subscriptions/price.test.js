/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const ScreenshotData = require('../../../../screenshot-data.js')

describe('/administrator/subscriptions/price', function () {
  describe('before', () => {
    it('should bind data to req', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice()
      const req = TestHelper.createRequest(`/administrator/subscriptions/price?priceid=${administrator.price.priceid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.price.priceid, administrator.price.priceid)
    })
  })

  describe('view', () => {
    it('should present the price table (screenshots)', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice()
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

    it('should present the pricing tiers', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice({
        currency: 'usd',
        tax_behavior: 'inclusive',
        recurring_interval: 'month',
        recurring_interval_count: '1',
        recurring_usage_type: 'metered',
        recurring_aggregate_usage: 'sum',
        billing_scheme: 'tiered',
        tiers_mode: 'volume',
        tier1_up_to: '1000',
        tier1_unit_amount: '9999',
        tier2_up_to: 'inf',
        tier2_unit_amount: '9999'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/price?priceid=${administrator.price.priceid}`)
      req.account = administrator.account
      req.session = administrator.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const tiersContainer = doc.getElementById('pricing-tiers')
      assert.strictEqual(tiersContainer.tag, 'tr')
      const tiersTable = doc.getElementById('tiers-table')
      assert.strictEqual(tiersTable.tag, 'table')
      const tierRows = tiersTable.getElementsByTagName('tr')
      assert.strictEqual(tierRows.length, 3)
      // 2 tiers
      // 1 heading
    })

    it('should present the quantity transformation', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice({
        unit_amount: '1000',
        currency: 'usd',
        tax_behavior: 'inclusive',
        recurring_interval: 'month',
        recurring_interval_count: '1',
        recurring_usage_type: 'licensed',
        transform_quantity_divide_by: 4,
        transform_quantity_round: 'up'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/price?priceid=${administrator.price.priceid}`)
      req.account = administrator.account
      req.session = administrator.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const transformQuantity = doc.getElementById('transform-quantity')
      assert.strictEqual(transformQuantity.tag, 'tr')
    })

    it('should present the recurring billing information', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice()
      const req = TestHelper.createRequest(`/administrator/subscriptions/price?priceid=${administrator.price.priceid}`)
      req.account = administrator.account
      req.session = administrator.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const recurringBilling = doc.getElementById('recurring-billing')
      assert.strictEqual(recurringBilling.tag, 'tr')
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
