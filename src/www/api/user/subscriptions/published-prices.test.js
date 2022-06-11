/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/subscriptions/published-prices', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  let cachedResponses, cachedPrices
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
      await TestHelper.rotateWebhook(true)
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    cachedPrices = []
    await TestHelper.setupBefore()
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestHelper.createOwner()
    await TestHelper.createProduct(administrator, {
      publishedAt: 'true'
    })
    const user = await TestHelper.createUser()
    for (let i = 0, len = global.pageSize + 2; i < len; i++) {
      await TestHelper.createPrice(administrator, {
        productid: administrator.product.productid,
        currency: 'usd',
        unit_amount: 3000,
        recurring_interval: 'month',
        recurring_interval_count: '1',
        recurring_usage_type: 'licensed',
        publishedAt: 'true',
        tax_behavior: 'inclusive'
      })
      cachedPrices.unshift(administrator.price.priceid)
    }
    const req1 = TestHelper.createRequest('/api/user/subscriptions/published-prices?offset=1')
    req1.account = user.account
    req1.session = user.session
    cachedResponses.offset = await req1.get()
    const req2 = TestHelper.createRequest('/api/user/subscriptions/published-prices?limit=1')
    req2.account = user.account
    req2.session = user.session
    cachedResponses.limit = await req2.get()
    const req3 = TestHelper.createRequest('/api/user/subscriptions/published-prices?all=true')
    req3.account = user.account
    req3.session = user.session
    cachedResponses.all = await req3.get()
    const req4 = TestHelper.createRequest('/api/user/subscriptions/published-prices')
    req4.account = user.account
    req4.session = user.session
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
      const prices = cachedResponses.returns
      assert.strictEqual(prices.length, global.pageSize)
    })
  })

  describe('configuration', () => {
    it('environment PAGE_SIZE', async () => {
      const prices = cachedResponses.pageSize
      assert.strictEqual(prices.length, global.pageSize + 1)
    })
  })
})
