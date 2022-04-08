/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/administrator/subscriptions/subscriptions', function () {
  let cachedResponses, cachedSubscriptions
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
      await TestHelper.rotateWebhook(true)
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    cachedSubscriptions = []
    await TestHelper.setupBefore()
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestStripeAccounts.createOwnerWithPlan({
      amount: '1000',
      trial_period_days: '0',
      interval: 'month',
      usage_type: 'licensed'
    })
    for (let i = 0, len = global.pageSize + 2; i < len; i++) {
      const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
      cachedSubscriptions.unshift(user.subscription.subscriptionid)
    }
    const req1 = TestHelper.createRequest('/api/administrator/subscriptions/subscriptions?offset=1')
    req1.account = administrator.account
    req1.session = administrator.session
    cachedResponses.offset = await req1.get()
    const req2 = TestHelper.createRequest('/api/administrator/subscriptions/subscriptions?limit=1')
    req2.account = administrator.account
    req2.session = administrator.session
    cachedResponses.limit = await req2.get()
    const req3 = TestHelper.createRequest('/api/administrator/subscriptions/subscriptions?all=true')
    req3.account = administrator.account
    req3.session = administrator.session
    cachedResponses.all = await req3.get()
    const req4 = TestHelper.createRequest('/api/administrator/subscriptions/subscriptions')
    req4.account = administrator.account
    req4.session = administrator.session
    req4.filename = __filename
    req4.saveResponse = true
    cachedResponses.returns = await req4.get()
    global.pageSize = 3
    cachedResponses.pageSize = await req4.get()
    cachedResponses.finished = true
  }
  describe('receives', () => {
    it('optional querystring offset (integer)', async function () {
      await bundledData(this.test.currentRetry())
      const offset = 1
      const subscriptionsNow = cachedResponses.offset
      for (let i = 0, len = global.pageSize; i < len; i++) {
        assert.strictEqual(subscriptionsNow[i].subscriptionid, cachedSubscriptions[offset + i])
      }
    })

    it('optional querystring limit (integer)', async function () {
      await bundledData(this.test.currentRetry())
      const limit = 1
      const subscriptionsNow = cachedResponses.limit
      assert.strictEqual(subscriptionsNow.length, limit)
    })

    it('optional querystring all (boolean)', async () => {
      const subscriptionsNow = cachedResponses.all
      assert.strictEqual(subscriptionsNow.length, cachedSubscriptions.length)
    })
  })

  describe('returns', () => {
    it('array', async () => {
      const subscriptions = cachedResponses.returns
      assert.strictEqual(subscriptions.length, global.pageSize)
    })
  })

  describe('configuration', () => {
    it('environment PAGE_SIZE', async () => {
      global.pageSize = 3
      const subscriptions = cachedResponses.pageSize
      assert.strictEqual(subscriptions.length, global.pageSize)
    })
  })
})
