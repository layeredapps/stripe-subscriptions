/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/account/subscriptions', function () {
  let cachedResponses, cachedInvoices, cachedSubscriptions, cachedCustomers
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
      await TestHelper.rotateWebhook(true)
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    cachedInvoices = []
    cachedSubscriptions = []
    cachedCustomers = []
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestStripeAccounts.createOwnerWithPrice()
    let user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
    cachedInvoices.unshift(user.subscription.stripeObject.latest_invoice)
    cachedSubscriptions.unshift(user.subscription.subscriptionid)
    cachedCustomers.unshift(user.customer.customerid)
    await TestHelper.createPrice(administrator, {
      productid: administrator.product.productid,
      currency: 'usd',
      active: 'true',
      unit_amount: '1000',
      recurring_interval: 'month',
      recurring_usage_type: 'licensed',
      recurring_interval_count: '1',
      tax_behavior: 'inclusive'
    })
    await TestHelper.createCustomer(user, {
      email: user.profile.contactEmail,
      description: user.profile.fullName,
      country: 'US'
    })
    await TestHelper.createPaymentMethod(user, {
      cvc: '111',
      number: '4111111111111111',
      exp_month: '1',
      exp_year: (new Date().getFullYear() + 1).toString().substring(2),
      name: user.profile.fullName,
      line1: '285 Fulton St',
      line2: 'Apt 893',
      city: 'New York',
      state: 'NY',
      postal_code: '10007',
      country: 'US',
      default: 'true'
    })
    user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price, user)
    cachedInvoices.unshift(user.invoice.invoiceid)
    cachedSubscriptions.unshift(user.subscription.subscriptionid)
    cachedCustomers.unshift(user.customer.customerid)
    const req1 = TestHelper.createRequest('/account/subscriptions')
    req1.account = user.account
    req1.session = user.session
    req1.filename = __filename
    req1.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/subscriptions' }
    ]
    await req1.route.api.before(req1)
    cachedResponses.before = req1.data
    global.pageSize = 50
    cachedResponses.returns = await req1.get()
    cachedResponses.finished = true
  }
  describe('before', () => {
    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const data = cachedResponses.before
      assert.strictEqual(data.customers.length, cachedCustomers.length)
      assert.strictEqual(data.subscriptions.length, cachedSubscriptions.length)
      assert.strictEqual(data.invoices.length, cachedInvoices.length)
    })
  })

  describe('view', () => {
    it('should have row for each invoice (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      const invoice1Row = doc.getElementById(cachedInvoices[0])
      const invoice2Row = doc.getElementById(cachedInvoices[1])
      assert.strictEqual(invoice1Row.tag, 'tr')
      assert.strictEqual(invoice2Row.tag, 'tr')
    })

    it('should have row for each customer', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      const customer1Row = doc.getElementById(cachedCustomers[0])
      const customer2Row = doc.getElementById(cachedCustomers[1])
      assert.strictEqual(customer1Row.tag, 'tr')
      assert.strictEqual(customer2Row.tag, 'tr')
    })

    it('should have row for each subscription', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      const subscription1Row = doc.getElementById(cachedSubscriptions[0])
      const subscription2Row = doc.getElementById(cachedSubscriptions[1])
      assert.strictEqual(subscription1Row.tag, 'tr')
      assert.strictEqual(subscription2Row.tag, 'tr')
    })
  })
})
