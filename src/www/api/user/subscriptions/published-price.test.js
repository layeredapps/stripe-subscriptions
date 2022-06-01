/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/user/subscriptions/published-price', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('exceptions', () => {
    describe('invalid-priceid', () => {
      it('missing querystring priceid', async () => {
        const req = TestHelper.createRequest('/api/user/subscriptions/published-price')
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-priceid')
      })

      it('invalid querystring priceid', async () => {
        const req = TestHelper.createRequest('/api/user/subscriptions/published-price?priceid=invalid')
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-priceid')
      })
    })

    describe('invalid-price', () => {
      it('ineligible querystring price is not published', async () => {
        const administrator = await TestStripeAccounts.createOwnerWithNotPublishedPrice()
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/subscriptions/published-price?priceid=${administrator.price.priceid}`)
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-price')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice()
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/api/user/subscriptions/published-price?priceid=${administrator.price.priceid}`)
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.saveResponse = true
      const price = await req.get()
      assert.strictEqual(price.priceid, administrator.price.priceid)
    })
  })
})
