/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/administrator/subscriptions/refund-requests-count', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('returns', () => {
    it('integer', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
        await TestHelper.requestRefund(user, user.charge.chargeid)
      }
      const req = TestHelper.createRequest('/api/administrator/subscriptions/refund-requests-count')
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.saveResponse = true
      const refunds = await req.get()
      assert.strictEqual(refunds, global.pageSize + 1)
    })
  })
})
