/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/administrator/subscriptions/update-price', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('exceptions', () => {
    describe('invalid-priceid', () => {
      it('missing querystring priceid', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/update-price')
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
        const req = TestHelper.createRequest('/api/administrator/subscriptions/update-price?priceid=invalid')
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
      it('ineligible querystring price is unpublished', async () => {
        const administrator = await TestStripeAccounts.createOwnerWithUnpublishedPrice()
        const req = TestHelper.createRequest(`/api/administrator/subscriptions/update-price?priceid=${administrator.price.priceid}`)
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          nickname: 'new nickname'
        }
        let errorMessage
        try {
          await req.patch(req)
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-price')
      })
    })

    describe('invalid-nickname', () => {
      it ('missing posted nickname', async () => {
        const administrator = await TestStripeAccounts.createOwnerWithPrice({
          amount: '1000',
          interval: 'month',
          usage_type: 'licensed'
        })
        const req = TestHelper.createRequest(`/api/administrator/subscriptions/update-price?priceid=${administrator.price.priceid}`)
        req.account = administrator.account
        req.session = administrator.session
        req.body = {
          nickname: ''
        }
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-nickname')
      })
    })
  })

  describe('receives', () => {
    it('required posted nickname (string)', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice({
        amount: '1000',
        interval: 'month',
        usage_type: 'licensed'
      })
      const req = TestHelper.createRequest(`/api/administrator/subscriptions/update-price?priceid=${administrator.price.priceid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        nickname: 'updated'
      }
      await req.patch()
      const req2 = TestHelper.createRequest(`/api/administrator/subscriptions/price?priceid=${administrator.price.priceid}`)
      req2.account = administrator.account
      req2.session = administrator.session
      const price = await req2.get()
      assert.strictEqual(price.stripeObject.nickname, 'updated')
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice({
        amount: '1000',
        interval: 'month',
        usage_type: 'licensed'
      })
      const req = TestHelper.createRequest(`/api/administrator/subscriptions/update-price?priceid=${administrator.price.priceid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        nickname: 'new nickname'
      }
      req.filename = __filename
      req.saveResponse = true
      const price = await req.patch()
      assert.strictEqual(price.stripeObject.nickname, 'new nickname')
    })
  })
})
