/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/administrator/subscriptions/add-subscription-item-tax-rate', function () {
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
    const taxRate1 = await TestHelper.createTaxRate(administrator)
    const taxRate3 = await TestHelper.createTaxRate(administrator, {
      active: 'false'
    })
    // missing and invalid id
    let req = TestHelper.createRequest('/api/administrator/subscriptions/add-subscription-item-tax-rate')
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      taxrateid: taxRate1.taxrateid
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.missing = error.message
    }
    req = TestHelper.createRequest('/api/administrator/subscriptions/add-subscription-item-tax-rate?subscriptionitemid=invalid')
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      taxrateid: taxRate1.taxrateid
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.invalid = error.message
    }
    // invalid taxrateid
    req = TestHelper.createRequest(`/api/administrator/subscriptions/add-subscription-item-tax-rate?subscriptionitemid=${user.subscription.stripeObject.items.data[0].id}`)
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      taxrateid: ''
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.missingTaxRateId = error.message
    }
    req = TestHelper.createRequest(`/api/administrator/subscriptions/add-subscription-item-tax-rate?subscriptionitemid=${user.subscription.stripeObject.items.data[0].id}`)
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      taxrateid: 'invalid'
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.invalidTaxRateId = error.message
    }
    // invalid tax rate
    req = TestHelper.createRequest(`/api/administrator/subscriptions/add-subscription-item-tax-rate?subscriptionitemid=${user.subscription.stripeObject.items.data[0].id}`)
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      taxrateid: taxRate3.taxrateid
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.invalidTaxRate = error.message
    }
    // returns
    req = TestHelper.createRequest(`/api/administrator/subscriptions/add-subscription-item-tax-rate?subscriptionitemid=${user.subscription.stripeObject.items.data[0].id}`)
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      taxrateid: taxRate1.taxrateid
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

    describe('invalid-taxrateid', () => {
      it('missing posted taxrateid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missingTaxRateId
        assert.strictEqual(errorMessage, 'invalid-taxrateid')
      })

      it('invalid posted taxrateid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidTaxRateId
        assert.strictEqual(errorMessage, 'invalid-taxrateid')
      })
    })

    describe('invalid-tax-rate', () => {
      it('invalid posted tax-rate', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidTaxRate
        assert.strictEqual(errorMessage, 'invalid-tax-rate')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const subscriptionNow = cachedResponses.returns
      assert.strictEqual(subscriptionNow.stripeObject.items.data[0].tax_rates.length, 1)
    })
  })
})
