/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/subscriptions/invoice', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  let cachedResponses
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
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
    const user2 = await TestHelper.createUser()
    // invalid account
    const req = TestHelper.createRequest(`/api/user/subscriptions/invoice?invoiceid=${user.invoice.invoiceid}`)
    req.account = user2.account
    req.session = user2.session
    try {
      await req.get()
    } catch (error) {
      cachedResponses.invalidAccount = error.message
    }
    // response
    const req2 = TestHelper.createRequest(`/api/user/subscriptions/invoice?invoiceid=${user.invoice.invoiceid}`)
    req2.account = user.account
    req2.session = user.session
    req2.filename = __filename
    req2.saveResponse = true
    cachedResponses.returns = await req2.get()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    describe('invalid-invoiceid', () => {
      it('missing querystring invoiceid', async function () {
        await bundledData(this.test.currentRetry())
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/subscriptions/invoice')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-invoiceid')
      })

      it('invalid querystring invoiceid', async function () {
        await bundledData(this.test.currentRetry())
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/subscriptions/invoice?invoiceid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-invoiceid')
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
      const invoice = cachedResponses.returns
      assert.strictEqual(invoice.object, 'invoice')
    })
  })
})
