/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/administrator/subscriptions/refund', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('exceptions', () => {
    it('invalid querystring refundid', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/api/administrator/subscriptions/refund')
      req.account = administrator.account
      req.session = administrator.session
      let errorMessage
      try {
        await req.get()
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-refundid')
    })

    it('missing querystring refundid', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/api/administrator/subscriptions/refund?refundid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      let errorMessage
      try {
        await req.get()
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-refundid')
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice({
        publishedAt: 'true',
        unit_amount: 3000,
        currency: 'usd',
        tax_behavior: 'inclusive',
        recurring_interval: 'month',
        recurring_interval_count: '1',
        recurring_usage_type: 'licensed'
      })
      const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
      await TestHelper.createRefund(administrator, user.charge.chargeid)
      const req = TestHelper.createRequest(`/api/administrator/subscriptions/refund?refundid=${administrator.refund.refundid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.saveResponse = true
      const refund = await req.get()
      assert.strictEqual(refund.refundid, administrator.refund.refundid)
    })
  })
})
