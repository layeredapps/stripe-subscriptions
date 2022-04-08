/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/administrator/subscriptions/payouts', function () {
  if (!process.env.DISABLE_PAYOUT_TESTS) {
    let cachedResponses, cachedPayouts
    async function bundledData (retryNumber) {
      if (retryNumber) {
        cachedResponses = {}
      }
      if (cachedResponses && cachedResponses.finished) {
        return
      }
      cachedResponses = {}
      cachedPayouts = []
      await DashboardTestHelper.setupBeforeEach()
      await TestHelper.setupBeforeEach()
      const administrator = await TestHelper.createOwner()
      for (let i = 0, len = global.pageSize + 2; i < len; i++) {
        await TestHelper.createPayout(administrator)
        cachedPayouts.unshift(administrator.payout.id)
      }
      const req1 = TestHelper.createRequest('/api/administrator/subscriptions/payouts?offset=1')
      req1.account = administrator.account
      req1.session = administrator.session
      cachedResponses.offset = await req1.get()
      const req2 = TestHelper.createRequest('/api/administrator/subscriptions/payouts?limit=1')
      req2.account = administrator.account
      req2.session = administrator.session
      cachedResponses.limit = await req2.get()
      const req3 = TestHelper.createRequest('/api/administrator/subscriptions/payouts?all=true')
      req3.account = administrator.account
      req3.session = administrator.session
      cachedResponses.all = await req3.get()
      const req4 = TestHelper.createRequest('/api/administrator/subscriptions/payouts')
      req4.account = administrator.account
      req4.session = administrator.session
      req4.filename = __filename
      req4.saveResponse = true
      cachedResponses.returns = await req4.get()
      global.pageSize = 3
      cachedResponses.pageSize = await req4.get()
    }
    describe('receives', () => {
      it('optional querystring offset (integer)', async function () {
        await bundledData(this.test.currentRetry())
        const offset = 1
        const payoutsNow = cachedResponses.offset
        for (let i = 0, len = payoutsNow.length; i < len; i++) {
          assert.strictEqual(payoutsNow[i].payoutid, cachedPayouts[i + offset])
        }
      })

      it('optional querystring limit (integer)', async function () {
        await bundledData(this.test.currentRetry())
        const limit = 1
        const payoutsNow = cachedResponses.limit
        assert.strictEqual(payoutsNow.length, limit)
      })

      it('optional querystring all (boolean)', async function () {
        await bundledData(this.test.currentRetry())
        const payouts = cachedResponses.all
        assert.strictEqual(payouts.length, cachedPayouts.length)
      })
    })

    describe('returns', () => {
      it('array', async function () {
        await bundledData(this.test.currentRetry())
        const payouts = cachedResponses.returns
        assert.strictEqual(payouts.length, global.pageSize)
      })
    })

    describe('configuration', () => {
      it('environment PAGE_SIZE', async () => {
        const payouts = cachedResponses.pageSize
        assert.strictEqual(payouts.length, global.pageSize + 1)
      })
    })
  }
})
