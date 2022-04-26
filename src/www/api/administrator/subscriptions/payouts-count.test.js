/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/administrator/subscriptions/payouts-count', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  if (!process.env.DISABLE_PAYOUT_TESTS) {
    describe('returns', function () {
      it('integer', async () => {
        const administrator = await TestHelper.createOwner()
        for (let i = 0, len = global.pageSize + 1; i < len; i++) {
          await TestHelper.createPayout(administrator)
        }
        const req = TestHelper.createRequest('/api/administrator/subscriptions/payouts-count')
        req.account = administrator.account
        req.session = administrator.session
        req.filename = __filename
        req.saveResponse = true
        const result = await req.get()
        assert.strictEqual(result, global.pageSize + 1)
      })
    })
  }
})
