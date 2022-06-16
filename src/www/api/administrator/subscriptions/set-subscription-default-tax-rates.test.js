/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/administrator/subscriptions/set-subscription-default-tax-rates', function () {
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
    const taxRate2 = await TestHelper.createTaxRate(administrator)
    const taxRate3 = await TestHelper.createTaxRate(administrator, {
      active: 'false'
    })
    // missing and invalid id
    let req = TestHelper.createRequest('/api/administrator/subscriptions/set-subscription-default-tax-rates')
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      taxrateids: `${taxRate1.taxrateid},${taxRate2.taxrateid}`
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.missing = error.message
    }
    req = TestHelper.createRequest('/api/administrator/subscriptions/set-subscription-default-tax-rates?subscriptionid=invalid')
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      taxrateids: `${taxRate1.taxrateid},${taxRate2.taxrateid}`
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.invalid = error.message
    }
    // invalid taxrateid
    req = TestHelper.createRequest(`/api/administrator/subscriptions/set-subscription-default-tax-rates?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      taxrateids: ''
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.missingTaxRateIds = error.message
    }
    req = TestHelper.createRequest(`/api/administrator/subscriptions/set-subscription-default-tax-rates?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      taxrateids: 'invalid'
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.invalidTaxRateIds = error.message
    }
    // invalid tax rate
    req = TestHelper.createRequest(`/api/administrator/subscriptions/set-subscription-default-tax-rates?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      taxrateids: taxRate3.taxrateid
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.invalidTaxRate = error.message
    }
    // returns
    req = TestHelper.createRequest(`/api/administrator/subscriptions/set-subscription-default-tax-rates?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      taxrateids: `${taxRate1.taxrateid},${taxRate2.taxrateid}`
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

    describe('invalid-taxrateids', () => {
      it('missing posted taxrateids', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missingTaxRateIds
        assert.strictEqual(errorMessage, 'invalid-taxrateids')
      })
    })

    describe('invalid-taxrateid', () => {
      it('invalid posted taxrateid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidTaxRateIds
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
      assert.strictEqual(subscriptionNow.stripeObject.default_tax_rates.length, 2)
    })
  })
})
