/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/subscriptions/add-subscription-item', function () {
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
    const price2 = administrator.price
    const price3 = await TestHelper.createPrice(administrator, {
      productid: administrator.product.productid,
      publishedAt: true,
      unpublishedAt: true,
      unit_amount: 2000,
      recurring_interval: 'month',
      recurring_usage_type: 'licensed'
    })
    const price4 = await TestHelper.createPrice(administrator, {
      productid: administrator.product.productid,
      unit_amount: 3000,
      recurring_interval: 'month',
      recurring_usage_type: 'licensed'
    })
    const price5 = await TestHelper.createPrice(administrator, {
      productid: administrator.product.productid,
      publishedAt: true,
      unit_amount: 3000,
      recurring_interval: 'month',
      recurring_usage_type: 'licensed'
    })
    const user = await TestStripeAccounts.createUserWithPaidSubscription(price2)
    const user2 = await TestHelper.createUser()
    // missing and invalid subscription id
    let req = TestHelper.createRequest('/api/user/subscriptions/add-subscription-item')
    req.account = user.account
    req.session = user.session
    req.body = {
      quantity: '10',
      priceid: price2.priceid
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.missing = error.message
    }
    req = TestHelper.createRequest('/api/user/subscriptions/add-subscription-item?subscriptionid=invalid')
    req.account = user.account
    req.session = user.session
    req.body = {
      quantity: '10',
      priceid: price2.priceid
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.invalid = error.message
    }
    // invalid account
    req = TestHelper.createRequest(`/api/user/subscriptions/add-subscription-item?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = user2.account
    req.session = user2.session
    req.body = {
      quantity: '1',
      priceid: price2.priceid
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.account = error.message
    }
    // invalid price id
    req = TestHelper.createRequest(`/api/user/subscriptions/add-subscription-item?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = user.account
    req.session = user.session
    req.body = {
      quantity: '7',
      priceid: ''
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.missingPriceID = error.message
    }
    req = TestHelper.createRequest(`/api/user/subscriptions/add-subscription-item?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = user.account
    req.session = user.session
    req.body = {
      quantity: '7',
      priceid: 'invalid'
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.invalidPriceID = error.message
    }
    // invalid price
    req = TestHelper.createRequest(`/api/user/subscriptions/add-subscription-item?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = user.account
    req.session = user.session
    req.body = {
      quantity: '7',
      priceid: price3.priceid
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.invalidPriceUnpublished = error.message
    }
    req = TestHelper.createRequest(`/api/user/subscriptions/add-subscription-item?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = user.account
    req.session = user.session
    req.body = {
      quantity: '7',
      priceid: price4.priceid
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.invalidPriceNotPublished = error.message
    }
    // invalid quantity
    req = TestHelper.createRequest(`/api/user/subscriptions/add-subscription-item?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = user.account
    req.session = user.session
    req.body = {
      quantity: 'letters',
      priceid: price2.priceid
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.invalidQuantity = error.message
    }
    req = TestHelper.createRequest(`/api/user/subscriptions/add-subscription-item?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = user.account
    req.session = user.session
    req.body = {
      quantity: '-1',
      priceid: price2.priceid
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.negativeQuantity = error.message
    }
    req = TestHelper.createRequest(`/api/user/subscriptions/add-subscription-item?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = user.account
    req.session = user.session
    req.body = {
      quantity: '0',
      priceid: price2.priceid
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.zeroQuantity = error.message
    }
    // returns
    req = TestHelper.createRequest(`/api/user/subscriptions/add-subscription-item?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = user.account
    req.session = user.session
    req.body = {
      quantity: '2',
      priceid: price2.priceid
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.invalidDuplicatePrice = error.message
    }
    req = TestHelper.createRequest(`/api/user/subscriptions/add-subscription-item?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = user.account
    req.session = user.session
    req.body = {
      quantity: '2',
      priceid: price5.priceid
    }
    req.filename = __filename
    req.saveResponse = true
    cachedResponses.returns = await req.patch()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    describe('invalid-subscriptionid', () => {
      it('missing querystring subscriptionid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missing
        assert.strictEqual(errorMessage, 'invalid-subscriptionid')
      })

      it('invalid querystring subscriptionid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalid
        assert.strictEqual(errorMessage, 'invalid-subscriptionid')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.account
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-quantity', () => {
      it('invalid posted quantity', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidQuantity
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

    describe('invalid-priceid', () => {
      it('missing posted priceid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missingPriceID
        assert.strictEqual(errorMessage, 'invalid-priceid')
      })

      it('invalid posted priceid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidPriceID
        assert.strictEqual(errorMessage, 'invalid-priceid')
      })
    })

    describe('invalid-price', () => {
      it('invalid price is not published', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidPriceNotPublished
        assert.strictEqual(errorMessage, 'invalid-price')
      })

      it('invalid price is unpublished', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidPriceUnpublished
        assert.strictEqual(errorMessage, 'invalid-price')
      })
    })

    describe('duplicate-price', () => {
      it('invalid price is already on subscription', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidDuplicatePrice
        assert.strictEqual(errorMessage, 'duplicate-price')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const subscriptionNow = cachedResponses.returns
      assert.strictEqual(subscriptionNow.stripeObject.items.data[1].quantity, 2)
    })
  })
})
