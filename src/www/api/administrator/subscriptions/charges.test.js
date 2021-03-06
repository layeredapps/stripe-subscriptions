/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/administrator/subscriptions/charges', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  let cachedResponses, cachedCharges
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    cachedCharges = []
    await TestHelper.setupBefore()
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestStripeAccounts.createOwnerWithPrice()
    for (let i = 0, len = global.pageSize + 2; i < len; i++) {
      const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
      cachedCharges.unshift(user.charge.chargeid)
    }
    const req = TestHelper.createRequest('/api/administrator/subscriptions/charges?offset=1')
    req.account = administrator.account
    req.session = administrator.session
    cachedResponses.offset = await req.get()
    const req2 = TestHelper.createRequest('/api/administrator/subscriptions/charges?limit=1')
    req2.account = administrator.account
    req2.session = administrator.session
    cachedResponses.limit = await req2.get()
    const req3 = TestHelper.createRequest('/api/administrator/subscriptions/charges?all=true')
    req3.account = administrator.account
    req3.session = administrator.session
    cachedResponses.all = await req3.get()
    const req4 = TestHelper.createRequest('/api/administrator/subscriptions/charges')
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
      const chargesNow = cachedResponses.offset
      for (let i = 0, len = global.pageSize; i < len; i++) {
        assert.strictEqual(chargesNow[i].chargeid, cachedCharges[offset + i])
      }
    })

    it('optional querystring limit (integer)', async function () {
      await bundledData(this.test.currentRetry())
      const limit = 1
      const chargesNow = cachedResponses.limit
      assert.strictEqual(chargesNow.length, limit)
    })

    it('optional querystring all (boolean)', async () => {
      const chargesNow = cachedResponses.all
      assert.strictEqual(chargesNow.length, cachedCharges.length)
    })
  })

  describe('returns', () => {
    it('array', async () => {
      const chargesNow = cachedResponses.returns
      assert.strictEqual(chargesNow.length, global.pageSize)
    })
  })

  describe('configuration', () => {
    it('environment PAGE_SIZE', async () => {
      const chargesNow = cachedResponses.pageSize
      assert.strictEqual(chargesNow.length, global.pageSize + 1)
    })
  })
})
