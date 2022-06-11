/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')

describe('/api/administrator/subscriptions/subscription-item', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('exceptions', () => {
    describe('invalid-subscriptionitemid', () => {
      it('missing querystring subscriptionitemid', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/subscription-item')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-subscriptionitemid')
      })

      it('invalid querystring subscriptionitemid', async () => {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/subscription-item?subscriptionitemid=invalid')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-subscriptionitemid')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice()
      const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
      const req = TestHelper.createRequest(`/api/administrator/subscriptions/subscription-item?subscriptionitemid=${user.subscription.stripeObject.items.data[0].id}`)
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.saveResponse = true
      const subscriptionItemNow = await req.get()
      assert.strictEqual(subscriptionItemNow.subscriptionitemid, user.subscription.stripeObject.items.data[0].id)
    })
  })
})
