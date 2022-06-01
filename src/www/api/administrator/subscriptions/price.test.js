/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/administrator/subscriptions/price', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('exceptions', () => {
    describe('invalid-priceid', () => {
      it('missing querystring priceid', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/price')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-priceid')
      })

      it('invalid querystring priceid', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/price?priceid=invalid')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-priceid')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice()
      const req = TestHelper.createRequest(`/api/administrator/subscriptions/price?priceid=${administrator.price.priceid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.saveResponse = true
      const price = await req.get()
      assert.strictEqual(price.priceid, administrator.price.priceid)
    })
  })
})
