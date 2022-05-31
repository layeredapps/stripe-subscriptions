/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/administrator/subscriptions/set-price-unpublished', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('exceptions', () => {
    describe('invalid-priceid', () => {
      it('missing querystring priceid', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/set-price-unpublished')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-priceid')
      })

      it('invalid querystring priceid', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/set-price-unpublished?priceid=invalid')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-priceid')
      })
    })

    describe('invalid-price', () => {
      it('ineligible querystring price is not published', async () => {
        const administrator = await TestStripeAccounts.createOwnerWithNotPublishedPrice()
        const req = TestHelper.createRequest(`/api/administrator/subscriptions/set-price-unpublished?priceid=${administrator.price.priceid}`)
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-price')
      })

      it('ineligible querystring price is already unpublished', async () => {
        const administrator = await TestStripeAccounts.createOwnerWithUnpublishedPrice()
        console.log(administrator.pri)
        const req = TestHelper.createRequest(`/api/administrator/subscriptions/set-price-unpublished?priceid=${administrator.price.priceid}`)
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-price')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice({
        amount: '1000',
        interval: 'month',
        usage_type: 'licensed'
      })
      const req = TestHelper.createRequest(`/api/administrator/subscriptions/set-price-unpublished?priceid=${administrator.price.priceid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.saveResponse = true
      const price = await req.patch()
      assert.notStrictEqual(price.unpublishedAt, undefined)
      assert.notStrictEqual(price.unpublishedAt, null)
    })
  })
})
