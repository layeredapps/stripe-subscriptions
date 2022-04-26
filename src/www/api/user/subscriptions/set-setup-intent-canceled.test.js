/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/subscriptions/set-setup-intent-canceled', function () {
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
    const user = await TestStripeAccounts.createUserWithPaymentMethod()
    // missing or invalid id
    const req2 = TestHelper.createRequest('/api/user/subscriptions/set-setup-intent-canceled')
    req2.account = user.account
    req2.session = user.session
    try {
      await req2.patch()
    } catch (error) {
      cachedResponses.missing = error.message
    }
    const req3 = TestHelper.createRequest('/api/user/subscriptions/set-setup-intent-canceled?setupintentid=invalid')
    req3.account = user.account
    req3.session = user.session
    try {
      await req3.patch()
    } catch (error) {
      cachedResponses.invalid = error.message
    }
    // invalid account
    const user2 = await TestHelper.createUser()
    const req4 = TestHelper.createRequest(`/api/user/subscriptions/set-setup-intent-canceled?setupintentid=${user.setupIntent.stripeObject.id}`)
    req4.account = user2.account
    req4.session = user2.session
    try {
      await req4.patch()
    } catch (error) {
      cachedResponses.invalidAccount = error.message
    }
    // returns
    const req5 = TestHelper.createRequest(`/api/user/subscriptions/set-setup-intent-canceled?setupintentid=${user.setupIntent.stripeObject.id}`)
    req5.account = user.account
    req5.session = user.session
    req5.filename = __filename
    req5.saveResponse = true
    cachedResponses.returns = await req5.patch()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    describe('invalid-setupintentid', () => {
      it('missing querystring setupintentid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missing
        assert.strictEqual(errorMessage, 'invalid-setupintentid')
      })

      it('invalid querystring setupintentid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalid
        assert.strictEqual(errorMessage, 'invalid-setupintentid')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidAccount
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const setupIntentNow = cachedResponses.returns
      assert.strictEqual(setupIntentNow.stripeObject.status, 'canceled')
    })
  })
})
