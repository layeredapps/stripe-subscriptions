/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/administrator/subscriptions/tax-codes', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  let cachedResponses
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
      await TestHelper.rotateWebhook(true)
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    await TestHelper.setupBefore()
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestHelper.createOwner()
    const req1 = TestHelper.createRequest('/api/administrator/subscriptions/tax-codes?offset=1')
    req1.account = administrator.account
    req1.session = administrator.session
    cachedResponses.offset = await req1.get()
    const req2 = TestHelper.createRequest('/api/administrator/subscriptions/tax-codes?limit=1')
    req2.account = administrator.account
    req2.session = administrator.session
    cachedResponses.limit = await req2.get()
    const req3 = TestHelper.createRequest('/api/administrator/subscriptions/tax-codes?all=true')
    req3.account = administrator.account
    req3.session = administrator.session
    cachedResponses.all = await req3.get()
    const req4 = TestHelper.createRequest('/api/administrator/subscriptions/tax-codes')
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
      const secondTaxCode = cachedResponses.returns[1]
      const taxCodesNow = cachedResponses.offset
      assert.strictEqual(taxCodesNow[0].taxcodeid, secondTaxCode.taxcodeid)
    })

    it('optional querystring limit (integer)', async function () {
      await bundledData(this.test.currentRetry())
      const limit = 1
      const taxCodesNow = cachedResponses.limit
      assert.strictEqual(taxCodesNow.length, limit)
    })

    it('optional querystring all (boolean)', async () => {
      const taxCodesNow = cachedResponses.all
      assert.notStrictEqual(taxCodesNow.length, global.pageSize)
    })
  })

  describe('returns', () => {
    it('array', async () => {
      const taxCodesNow = cachedResponses.returns
      assert.strictEqual(taxCodesNow.length, global.pageSize)
    })
  })

  describe('configuration', () => {
    it('environment PAGE_SIZE', async () => {
      const taxCodesNow = cachedResponses.pageSize
      assert.strictEqual(taxCodesNow.length, global.pageSize + 1)
    })
  })
})
