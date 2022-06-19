/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/subscriptions/set-invoice-paid', function () {
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
    // invalid invoice is paid
    const req5 = TestHelper.createRequest(`/api/user/subscriptions/set-invoice-paid?invoiceid=${user.invoice.invoiceid}`)
    req5.account = user.account
    req5.session = user.session
    req5.body = {
      paymentmethodid: user.paymentMethod.paymentmethodid
    }
    try {
      await req5.patch()
    } catch (error) {
      cachedResponses.invalidInvoice = error.message
    }
    // missing and invalid id
    const req = TestHelper.createRequest('/api/user/subscriptions/set-invoice-paid')
    req.account = user.account
    req.session = user.session
    req.body = {
      paymentmethodid: 'invalid'
    }
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.missing = error.message
    }
    const req2 = TestHelper.createRequest('/api/user/subscriptions/set-invoice-paid?invoiceid=invalid')
    req2.account = user.account
    req2.session = user.session
    req2.body = {
      paymentmethodid: 'invalid'
    }
    try {
      await req2.patch()
    } catch (error) {
      cachedResponses.invalid = error.message
    }
    // invalid account
    await TestHelper.createAmountOwed(user)
    const user2 = await TestStripeAccounts.createUserWithPaymentMethod()
    const req3 = TestHelper.createRequest(`/api/user/subscriptions/set-invoice-paid?invoiceid=${user.invoice.invoiceid}`)
    req3.account = user2.account
    req3.session = user2.session
    req3.body = {
      paymentmethodid: 'invalid'
    }
    try {
      await req3.patch()
    } catch (error) {
      cachedResponses.invalidAccount = error.message
    }
    const req4 = TestHelper.createRequest(`/api/user/subscriptions/set-invoice-paid?invoiceid=${user.invoice.invoiceid}`)
    req4.account = user.account
    req4.session = user.session
    req4.body = {
      paymentmethodid: user2.paymentMethod.paymentmethodid
    }
    try {
      await req4.patch()
    } catch (error) {
      cachedResponses.invalidAccount2 = error.message
    }
    // invalid invoice
    await TestHelper.createAmountOwed(user)
    await TestHelper.forgiveInvoice(administrator, user.invoice.invoiceid)
    const req6 = TestHelper.createRequest(`/api/user/subscriptions/set-invoice-paid?invoiceid=${user.invoice.invoiceid}`)
    req6.account = user.account
    req6.session = user.session
    req6.body = {
      paymentmethodid: user.paymentMethod.paymentmethodid
    }
    try {
      await req6.patch()
    } catch (error) {
      cachedResponses.invalidInvoice2 = error.message
    }
    // invalid payment method
    await TestHelper.createAmountOwed(user)
    const req7 = TestHelper.createRequest(`/api/user/subscriptions/set-invoice-paid?invoiceid=${user.invoice.invoiceid}`)
    req7.account = user.account
    req7.session = user.session
    req7.body = {
      paymentmethodid: ''
    }
    try {
      await req7.patch()
    } catch (error) {
      cachedResponses.missingPaymentMethod = error.message
    }
    const req8 = TestHelper.createRequest(`/api/user/subscriptions/set-invoice-paid?invoiceid=${user.invoice.invoiceid}`)
    req8.account = user.account
    req8.session = user.session
    req8.body = {
      paymentmethodid: 'invalid'
    }
    try {
      await req8.patch()
    } catch (error) {
      cachedResponses.invalidPaymentMethod = error.message
    }
    // returns
    const req9 = TestHelper.createRequest(`/api/user/subscriptions/set-invoice-paid?invoiceid=${user.invoice.invoiceid}`)
    req9.account = user.account
    req9.session = user.session
    req9.body = {
      paymentmethodid: user.paymentMethod.paymentmethodid
    }
    req9.filename = __filename
    req9.saveResponse = true
    cachedResponses.returns = await req9.patch()
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

    describe('invalid-account', () => {
      it('ineligible accessing account', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidAccount
        assert.strictEqual(errorMessage, 'invalid-account')
      })

      it('ineligible posted payment method', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidAccount2
        assert.strictEqual(errorMessage, 'invalid-account')
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

    describe('invalid-paymentmethodid', () => {
      it('missing posted paymentmethodid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.missingPaymentMethod
        assert.strictEqual(errorMessage, 'invalid-paymentmethodid')
      })

      it('invalid posted paymentmethodid', async function () {
        await bundledData(this.test.currentRetry())
        const errorMessage = cachedResponses.invalidPaymentMethod
        assert.strictEqual(errorMessage, 'invalid-paymentmethodid')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const invoice = cachedResponses.returns
      assert.strictEqual(invoice.stripeObject.paid, true)
    })
  })
})
