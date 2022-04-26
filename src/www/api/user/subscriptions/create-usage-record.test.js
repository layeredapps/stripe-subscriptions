/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/subscriptions/create-usage-record', function () {
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
    const administrator = await TestStripeAccounts.createOwnerWithPlan({
      usage_type: 'metered',
      amount: 1000
    })
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
    // invalid / missing subscriptionid
    const req = TestHelper.createRequest('/api/user/subscriptions/create-usage-record')
    req.account = user.account
    req.session = user.session
    req.body = {
      email: user.profile.contactEmail,
      description: 'customer'
    }
    try {
      await req.post()
    } catch (error) {
      cachedResponses.missing = error.message
    }
    const req2 = TestHelper.createRequest('/api/user/subscriptions/create-usage-record?subscriptionid=invalid')
    req2.account = user.account
    req2.session = user.session
    req2.body = {
      email: user.profile.contactEmail,
      description: 'customer'
    }
    try {
      await req2.post()
    } catch (error) {
      cachedResponses.invalid = error.message
    }
    // invalid subscription
    const plan2 = await TestHelper.createPlan(administrator, {
      usage_type: 'licensed',
      amount: '1000',
      productid: administrator.product.productid,
      publishedAt: 'true'
    })
    const user2 = await TestStripeAccounts.createUserWithPaidSubscription(plan2)
    const req3 = TestHelper.createRequest(`/api/user/subscriptions/create-usage-record?subscriptionid=${user2.subscription.subscriptionid}`)
    req3.account = user2.account
    req3.session = user2.session
    req3.body = {
      quantity: '10',
      action: 'set',
      subscriptionitemid: user2.subscription.stripeObject.items.data[0].id
    }
    try {
      await req3.post()
    } catch (error) {
      cachedResponses.invalidSubscription = error.message
    }
    // invalid account
    const req4 = TestHelper.createRequest(`/api/user/subscriptions/create-usage-record?subscriptionid=${user.subscription.subscriptionid}`)
    req4.account = user2.account
    req4.session = user2.session
    try {
      await req4.post()
    } catch (error) {
      cachedResponses.invalidAccount = error.message
    }
    // invalid quantity
    const req5 = TestHelper.createRequest(`/api/user/subscriptions/create-usage-record?subscriptionid=${user.subscription.subscriptionid}`)
    req5.account = user.account
    req5.session = user.session
    req5.body = {
      quantity: 'abcde',
      action: 'set',
      subscriptionitemid: user.subscription.stripeObject.items.data[0].id
    }
    try {
      await req5.post()
    } catch (error) {
      cachedResponses.invalidQuantity = error.message
    }
    const req6 = TestHelper.createRequest(`/api/user/subscriptions/create-usage-record?subscriptionid=${user.subscription.subscriptionid}`)
    req6.account = user.account
    req6.session = user.session
    req6.body = {
      quantity: '-20',
      action: 'set',
      subscriptionitemid: user.subscription.stripeObject.items.data[0].id
    }
    try {
      await req6.post()
    } catch (error) {
      cachedResponses.negativeQuantity = error.message
    }
    // invalid action
    const req7 = TestHelper.createRequest(`/api/user/subscriptions/create-usage-record?subscriptionid=${user.subscription.subscriptionid}`)
    req7.account = user.account
    req7.session = user.session
    req7.body = {
      quantity: '30',
      action: '',
      subscriptionitemid: user.subscription.stripeObject.items.data[0].id
    }
    try {
      await req7.post()
    } catch (error) {
      cachedResponses.missingAction = error.message
    }
    req7.body = {
      quantity: '40',
      action: 'invalid',
      subscriptionitemid: user.subscription.stripeObject.items.data[0].id
    }
    try {
      await req7.post()
    } catch (error) {
      cachedResponses.invalidAction = error.message
    }
    // missing and invalid subscriptionitemid
    req7.body = {
      quantity: '50',
      action: 'set',
      subscriptionitemid: ''
    }
    try {
      await req7.post()
    } catch (error) {
      cachedResponses.missingItem = error.message
    }
    req7.body = {
      quantity: '60',
      action: 'set',
      subscriptionitemid: 'invalid'
    }
    try {
      await req7.post()
    } catch (error) {
      cachedResponses.invalidItem = error.message
    }
    // quantity
    const req8 = TestHelper.createRequest(`/api/user/subscriptions/create-usage-record?subscriptionid=${user.subscription.subscriptionid}`)
    req8.account = user.account
    req8.session = user.session
    req8.body = {
      quantity: '70',
      action: 'set',
      subscriptionitemid: user.subscription.stripeObject.items.data[0].id
    }
    cachedResponses.quantity = await req8.post()
    await TestHelper.wait(1000)
    // action
    req8.body = {
      quantity: '200',
      action: 'set',
      subscriptionitemid: user.subscription.stripeObject.items.data[0].id
    }
    cachedResponses.action = await req8.post()
    await TestHelper.wait(1000)
    // item
    req8.body = {
      quantity: '300',
      action: 'set',
      subscriptionitemid: user.subscription.stripeObject.items.data[0].id
    }
    cachedResponses.item = await req8.post()
    await TestHelper.wait(1000)
    // response
    const req9 = TestHelper.createRequest(`/api/user/subscriptions/create-usage-record?subscriptionid=${user.subscription.subscriptionid}`)
    req9.account = user.account
    req9.session = user.session
    req9.body = {
      quantity: '400',
      action: 'set',
      subscriptionitemid: user.subscription.stripeObject.items.data[0].id
    }
    req9.filename = __filename
    req9.saveResponse = true
    await TestHelper.wait(1000)
    cachedResponses.returns = await req9.post()
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

    describe('invalid-subscription', () => {
      it('invalid querystring subscription is not "metered"', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidSubscription
        assert.strictEqual(errorMessage, 'invalid-subscription')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidAccount
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })

    describe('invalid-quantity', () => {
      it('invalid posted quantity is not integer', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidQuantity
        assert.strictEqual(errorMessage, 'invalid-quantity')
      })

      it('invalid posted quantity is negative', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.negativeQuantity
        assert.strictEqual(errorMessage, 'invalid-quantity')
      })
    })

    describe('invalid-action', () => {
      it('missing posted action', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missingAction
        assert.strictEqual(errorMessage, 'invalid-action')
      })

      it('invalid posted action', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidAction
        assert.strictEqual(errorMessage, 'invalid-action')
      })
    })

    describe('invalid-subscriptionitemid', () => {
      it('missing posted subscriptionitemid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missingItem
        assert.strictEqual(errorMessage, 'invalid-subscriptionitemid')
      })

      it('invalid posted subscriptionitemid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidItem
        assert.strictEqual(errorMessage, 'invalid-subscriptionitemid')
      })
    })
  })

  describe('receives', () => {
    it('required posted quantity', async () => {
      const usageRecord = cachedResponses.quantity
      assert.strictEqual(usageRecord.stripeObject.quantity, 70)
    })

    it('required posted action', async () => {
      const usageRecord = cachedResponses.action
      assert.strictEqual(usageRecord.stripeObject.quantity, 200)
      // TODO: actions can be verified setting/incrementing
      // when the usage record summaries are  available
    })

    it('required posted subscriptionitemid', async () => {
      const usageRecord = cachedResponses.item
      assert.notStrictEqual(usageRecord.subscriptionitemid, null)
      assert.notStrictEqual(usageRecord.subscriptionitemid, undefined)
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const usageRecord = cachedResponses.returns
      assert.strictEqual(usageRecord.object, 'usagerecord')
    })
  })
})
