/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/administrator/subscriptions/set-subscription-item-quantity', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  let cachedResponses
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
      await TestHelper.rotateWebhook(true)
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    await TestHelper.setupBefore()
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestStripeAccounts.createOwnerWithPrice()
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
    // missing and invalid id
    let req = TestHelper.createRequest('/api/administrator/subscriptions/set-subscription-item-quantity')
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      quantity: '10'
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.missing = error.message
    }
    req = TestHelper.createRequest('/api/administrator/subscriptions/set-subscription-item-quantity?subscriptionitemid=invalid')
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      quantity: '10'
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.invalid = error.message
    }
    // invalid quantity
    req = TestHelper.createRequest(`/api/administrator/subscriptions/set-subscription-item-quantity?subscriptionitemid=${user.subscription.stripeObject.items.data[0].id}`)
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      quantity: 'letters',
      itemid: user.subscription.stripeObject.items.data[0].id
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.invalidQuantity = error.message
    }
    req = TestHelper.createRequest(`/api/administrator/subscriptions/set-subscription-item-quantity?subscriptionitemid=${user.subscription.stripeObject.items.data[0].id}`)
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      quantity: '1',
      itemid: user.subscription.stripeObject.items.data[0].id
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.unchangedQuantity = error.message
    }
    req = TestHelper.createRequest(`/api/administrator/subscriptions/set-subscription-item-quantity?subscriptionitemid=${user.subscription.stripeObject.items.data[0].id}`)
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      quantity: '-1',
      itemid: user.subscription.stripeObject.items.data[0].id
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.negativeQuantity = error.message
    }
    req = TestHelper.createRequest(`/api/administrator/subscriptions/set-subscription-item-quantity?subscriptionitemid=${user.subscription.stripeObject.items.data[0].id}`)
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      quantity: '0',
      itemid: user.subscription.stripeObject.items.data[0].id
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.zeroQuantity = error.message
    }
    // returns
    req = TestHelper.createRequest(`/api/administrator/subscriptions/set-subscription-item-quantity?subscriptionitemid=${user.subscription.stripeObject.items.data[0].id}`)
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      quantity: '2',
      itemid: user.subscription.stripeObject.items.data[0].id
    }
    req.filename = __filename
    req.saveResponse = true
    cachedResponses.returns = await req.patch()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    describe('invalid-subscriptionitemid', () => {
      it('missing querystring subscriptionitemid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missing
        assert.strictEqual(errorMessage, 'invalid-subscriptionitemid')
      })

      it('invalid querystring subscriptionitemid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalid
        assert.strictEqual(errorMessage, 'invalid-subscriptionitemid')
      })
    })

    describe('invalid-quantity', () => {
      it('invalid posted quantity', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidQuantity
        assert.strictEqual(errorMessage, 'invalid-quantity')
      })

      it('invalid posted quantity is unchanged', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.unchangedQuantity
        assert.strictEqual(errorMessage, 'invalid-quantity')
      })

      it('invalid posted quantity is negative', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.negativeQuantity
        assert.strictEqual(errorMessage, 'invalid-quantity')
      })

      it('invalid posted quantity is zero', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.zeroQuantity
        assert.strictEqual(errorMessage, 'invalid-quantity')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const subscriptionItemNow = cachedResponses.returns
      assert.strictEqual(subscriptionItemNow.stripeObject.quantity, 2)
    })
  })
})
