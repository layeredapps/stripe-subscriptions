/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/administrator/subscriptions/prices', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  let cachedResponses, cachedPrices
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    cachedPrices = []
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestHelper.createOwner()
    await TestHelper.createProduct(administrator, {
      active: 'true'
    })
    for (let i = 0, len = global.pageSize + 2; i < len; i++) {
      await TestHelper.createPrice(administrator, {
        productid: administrator.product.productid,
        currency: 'usd',
        recurring_interval: 'month',
        recurring_interval_count: '1',
        recurring_usage_type: 'metered',
        recurring_aggregate_usage: 'sum',
        billing_scheme: 'tiered',
        tax_behavior: 'inclusive',
        tiers_mode: 'volume',
        tier1_up_to: '1000',
        tier1_flat_amount: '9999',
        tier2_up_to: 'inf',
        tier2_flat_amount: '8999',
        active: 'true'
      })
      cachedPrices.unshift(administrator.price.priceid)
    }
    const req1 = TestHelper.createRequest('/api/administrator/subscriptions/prices?offset=1')
    req1.account = administrator.account
    req1.session = administrator.session
    cachedResponses.offset = await req1.get()
    const req2 = TestHelper.createRequest('/api/administrator/subscriptions/prices?limit=1')
    req2.account = administrator.account
    req2.session = administrator.session
    cachedResponses.limit = await req2.get()
    const req3 = TestHelper.createRequest('/api/administrator/subscriptions/prices?all=true')
    req3.account = administrator.account
    req3.session = administrator.session
    cachedResponses.all = await req3.get()
    const req4 = TestHelper.createRequest('/api/administrator/subscriptions/prices')
    req4.account = administrator.account
    req4.session = administrator.session
    req4.filename = __filename
    req4.saveResponse = true
    cachedResponses.returns = await req4.get()
    global.pageSize = 3
    cachedResponses.pageSize = await req4.get()
    global.pageSize = 2
    cachedResponses.finished = true
  }
  describe('receives', () => {
    it('optional querystring offset (integer)', async function () {
      await bundledData(this.test.currentRetry())
      const offset = 1
      const pricesNow = cachedResponses.offset
      for (let i = 0, len = global.pageSize; i < len; i++) {
        assert.strictEqual(pricesNow[i].priceid, cachedPrices[offset + i])
      }
    })

    it('optional querystring limit (integer)', async function () {
      await bundledData(this.test.currentRetry())
      const limit = 1
      const pricesNow = cachedResponses.limit
      assert.strictEqual(pricesNow.length, limit)
    })

    it('optional querystring all (boolean)', async () => {
      const pricesNow = cachedResponses.all
      assert.strictEqual(pricesNow.length, cachedPrices.length)
    })
  })

  describe('returns', () => {
    it('array', async () => {
      const pricesNow = cachedResponses.returns
      assert.strictEqual(pricesNow.length, global.pageSize)
    })
  })

  describe('configuration', () => {
    it('environment PAGE_SIZE', async () => {
      const pricesNow = cachedResponses.pageSize
      assert.strictEqual(pricesNow.length, global.pageSize + 1)
    })
  })
})
