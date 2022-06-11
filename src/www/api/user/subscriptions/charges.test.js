/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/subscriptions/charges', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  let cachedResponses, cachedCharges
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
      await TestHelper.rotateWebhook(true)
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    cachedCharges = []
    await TestHelper.setupBefore()
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestHelper.createOwner()
    await TestHelper.createProduct(administrator, {
      publishedAt: 'true'
    })
    const user = await TestStripeAccounts.createUserWithPaymentMethod()
    for (let i = 0, len = global.pageSize + 2; i < len; i++) {
      await TestHelper.createPrice(administrator, {
        productid: administrator.product.productid,
        publishedAt: 'true',
        unit_amount: 3000,
        currency: 'usd',
        tax_behavior: 'inclusive',
        recurring_interval: 'month',
        recurring_interval_count: '1',
        recurring_usage_type: 'licensed'
      })
      await TestStripeAccounts.createUserWithPaidSubscription(administrator.price, user)
      cachedCharges.unshift(user.charge.chargeid)
    }
    const req1 = TestHelper.createRequest(`/api/user/subscriptions/charges?accountid=${user.account.accountid}&offset=1`)
    req1.account = user.account
    req1.session = user.session
    cachedResponses.offset = await req1.get()
    const req2 = TestHelper.createRequest(`/api/user/subscriptions/charges?accountid=${user.account.accountid}&limit=1`)
    req2.account = user.account
    req2.session = user.session
    cachedResponses.limit = await req2.get()
    const req3 = TestHelper.createRequest(`/api/user/subscriptions/charges?accountid=${user.account.accountid}&all=true`)
    req3.account = user.account
    req3.session = user.session
    cachedResponses.all = await req3.get()
    const req4 = TestHelper.createRequest(`/api/user/subscriptions/charges?accountid=${user.account.accountid}`)
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
  describe('exceptions', () => {
    describe('invalid-accountid', () => {
      it('missing querystring accountid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/subscriptions/charges')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-accountid')
      })

      it('invalid querystring accountid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/subscriptions/charges?accountid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-accountid')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async function () {
        await bundledData(this.test.currentRetry())
        const user = await TestHelper.createUser()
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/subscriptions/charges?accountid=${user.account.accountid}`)
        req.account = user2.account
        req.session = user2.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })
  })

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
