/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/administrator/subscriptions/set-invoice-uncollectable', function () {
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
    // missing and invalid id
    const req = TestHelper.createRequest('/api/administrator/subscriptions/set-invoice-uncollectible?invoiceid=invalid')
    req.account = administrator.account
    req.session = administrator.session
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.missing = error.message
    }
    const req2 = TestHelper.createRequest('/api/administrator/subscriptions/set-invoice-uncollectible?invoiceid=invalid')
    req2.account = administrator.account
    req2.session = administrator.session
    try {
      await req2.patch()
    } catch (error) {
      cachedResponses.invalid = error.message
    }
    // invalid invoice
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
    const req3 = TestHelper.createRequest(`/api/administrator/subscriptions/set-invoice-uncollectible?invoiceid=${user.invoice.invoiceid}`)
    req3.account = administrator.account
    req3.session = administrator.session
    try {
      await req3.patch()
    } catch (error) {
      cachedResponses.invalidInvoice = error.message
    }
    await TestHelper.createAmountOwed(user)
    await TestHelper.forgiveInvoice(administrator, user.invoice.invoiceid)
    const req4 = TestHelper.createRequest(`/api/administrator/subscriptions/set-invoice-uncollectible?invoiceid=${user.invoice.invoiceid}`)
    req4.account = administrator.account
    req4.session = administrator.session
    try {
      await req4.patch()
    } catch (error) {
      cachedResponses.invalidInvoice2 = error.message
    }
    // returns
    await TestHelper.createAmountOwed(user)
    const req5 = TestHelper.createRequest(`/api/administrator/subscriptions/set-invoice-uncollectible?invoiceid=${user.invoice.invoiceid}`)
    req5.account = administrator.account
    req5.session = administrator.session
    req5.filename = __filename
    req5.saveResponse = true
    cachedResponses.returns = await req5.patch()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    describe('invalid-invoiceid', () => {
      it('missing querystring invoiceid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missing
        assert.strictEqual(errorMessage, 'invalid-invoiceid')
      })

      it('invalid querystring invoiceid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalid
        assert.strictEqual(errorMessage, 'invalid-invoiceid')
      })
    })

    describe('invalid-invoice', () => {
      it('invalid querystring invoice is paid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidInvoice
        assert.strictEqual(errorMessage, 'invalid-invoice')
      })

      it('invalid querystring invoice is marked uncollectable', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidInvoice2
        assert.strictEqual(errorMessage, 'invalid-invoice')
      })
    })
  })
  describe('returns', () => {
    it('object', async () => {
      const invoiceNow = cachedResponses.returns
      assert.strictEqual(invoiceNow.stripeObject.status, 'uncollectible')
    })
  })
})
