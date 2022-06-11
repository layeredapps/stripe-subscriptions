/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/administrator/subscriptions/delete-subscription-item', function () {
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
    let req = TestHelper.createRequest('/api/administrator/subscriptions/delete-subscription-item')
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      itemid: user.subscription.stripeObject.items.data[0].id
    }
    try {
      await req.delete()
    } catch (error) {
      cachedResponses.missing = error.message
    }
    req = TestHelper.createRequest('/api/administrator/subscriptions/delete-subscription-item?subscriptionitemid=invalid')
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      itemid: user.subscription.stripeObject.items.data[0].id
    }
    try {
      await req.delete()
    } catch (error) {
      cachedResponses.invalid = error.message
    }
    // only items
    req = TestHelper.createRequest(`/api/administrator/subscriptions/delete-subscription-item?subscriptionitemid=${user.subscription.stripeObject.items.data[0].id}`)
    req.account = administrator.account
    req.session = administrator.session
    try {
      await req.delete()
    } catch (error) {
      cachedResponses.onlyItem = error.message
    }
    // returns
    const price2 = await TestHelper.createPrice(administrator)
    await TestHelper.addSubscriptionItem(user, price2.priceid, 1)
    req = TestHelper.createRequest(`/api/administrator/subscriptions/delete-subscription-item?subscriptionitemid=${user.subscription.stripeObject.items.data[0].id}`)
    req.account = administrator.account
    req.session = administrator.session
    req.filename = __filename
    req.saveResponse = true
    cachedResponses.returns = await req.delete()
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

    describe('only-item', () => {
      it('invalid posted itemid is only item', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.onlyItem
        assert.strictEqual(errorMessage, 'only-item')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const deleted = cachedResponses.returns
      assert.strictEqual(deleted, true)
    })
  })
})
