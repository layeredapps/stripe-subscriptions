/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/administrator/subscriptions/delete-price', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('exceptions', () => {
    describe('invalid-priceid', () => {
      it('missing querystring priceid', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/delete-price')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.delete()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-priceid')
      })

      it('invalid querystring priceid', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/delete-price?priceid=invalid')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.delete()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-priceid')
      })
    })
  })

  describe('returns', () => {
    it('boolean', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice({
        amount: '1000',
        interval: 'month',
        usage_type: 'licensed'
      })
      const req = TestHelper.createRequest(`/api/administrator/subscriptions/delete-price?priceid=${administrator.price.priceid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.saveResponse = true
      const deleted = await req.delete()
      assert.strictEqual(deleted, true)
    })
  })
})
