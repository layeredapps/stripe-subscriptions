/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/subscriptions/setup-intents', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  let cachedResponses, cachedSetupIntents
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
      await TestHelper.rotateWebhook(true)
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    cachedSetupIntents = []
    await TestHelper.setupBefore()
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestHelper.createOwner()
    await TestHelper.createProduct(administrator, {
      publishedAt: 'true'
    })
    const user = await TestHelper.createUser()
    await TestHelper.createCustomer(user, {
      email: user.profile.contactEmail
    })
    for (let i = 0, len = global.pageSize + 2; i < len; i++) {
      await TestHelper.createPaymentMethod(user, {
        cvc: '111',
        number: '4111111111111111',
        exp_month: '1',
        exp_year: (new Date().getFullYear() + 1).toString().substring(2),
        name: user.profile.fullName,
        line1: '285 Fulton St',
        line2: 'Apt 893',
        city: 'New York',
        state: 'NY',
        postal_code: '90120',
        country: 'US',
        default: 'true'
      })
      cachedSetupIntents.unshift(user.setupIntent.setupintentid)
    }
    const req1 = TestHelper.createRequest(`/api/user/subscriptions/setup-intents?accountid=${user.account.accountid}&offset=1`)
    req1.account = user.account
    req1.session = user.session
    cachedResponses.offset = await req1.get()
    const req2 = TestHelper.createRequest(`/api/user/subscriptions/setup-intents?accountid=${user.account.accountid}&limit=1`)
    req2.account = user.account
    req2.session = user.session
    cachedResponses.limit = await req2.get()
    const req3 = TestHelper.createRequest(`/api/user/subscriptions/setup-intents?accountid=${user.account.accountid}&all=true`)
    req3.account = user.account
    req3.session = user.session
    cachedResponses.all = await req3.get()
    const req4 = TestHelper.createRequest(`/api/user/subscriptions/setup-intents?accountid=${user.account.accountid}`)
    req4.account = user.account
    req4.session = user.session
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
        const req = TestHelper.createRequest('/api/user/subscriptions/setup-intents')
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
        const req = TestHelper.createRequest('/api/user/subscriptions/setup-intents?accountid=invalid')
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
        const req = TestHelper.createRequest(`/api/user/subscriptions/setup-intents?accountid=${user.account.accountid}`)
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
      const setupIntentsNow = cachedResponses.offset
      for (let i = 0, len = global.pageSize; i < len; i++) {
        assert.strictEqual(setupIntentsNow[i].setupintentid, cachedSetupIntents[offset + i])
      }
    })

    it('optional querystring limit (integer)', async function () {
      await bundledData(this.test.currentRetry())
      const limit = 1
      const setupIntentsNow = cachedResponses.limit
      assert.strictEqual(setupIntentsNow.length, limit)
    })

    it('optional querystring all (boolean)', async () => {
      const setupIntentsNow = cachedResponses.all
      assert.strictEqual(setupIntentsNow.length, cachedSetupIntents.length)
    })
  })

  describe('configuration', () => {
    it('environment PAGE_SIZE', async () => {
      const setupIntentsNow = cachedResponses.pageSize
      assert.strictEqual(setupIntentsNow.length, global.pageSize + 1)
    })
  })
})
