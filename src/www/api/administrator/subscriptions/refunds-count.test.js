/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/administrator/subscriptions/refunds-count', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('returns', () => {
    it('integer', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
        await TestHelper.createRefund(administrator, user.charge.chargeid)
      }
      const req = TestHelper.createRequest('/api/administrator/subscriptions/refunds-count')
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.saveResponse = true
      const result = await req.get()
      assert.strictEqual(result, global.pageSize + 1)
    })
  })
})
