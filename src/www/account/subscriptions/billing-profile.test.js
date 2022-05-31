/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')

describe('/account/subscriptions/billing-profile', function () {
  describe('before', () => {
    it('should bind data to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail
      })
      const req = TestHelper.createRequest(`/account/subscriptions/billing-profile?customerid=${user.customer.customerid}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.customer.customerid, user.customer.customerid)
    })
  })

  describe('view', () => {
    it('should present the customer table (screenshots)', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail
      })
      const req = TestHelper.createRequest(`/account/subscriptions/billing-profile?customerid=${user.customer.customerid}`)
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/subscriptions' },
        { click: '/account/subscriptions/billing-profiles' },
        { click: `/account/subscriptions/billing-profile?customerid=${user.customer.customerid}` }
      ]
      global.pageSize = 50
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const tbody = doc.getElementById(user.customer.customerid)
      assert.strictEqual(tbody.tag, 'tbody')
    })

    it('should have table for subscriptions', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice({ unit_amount: 0 })
      const user = await TestStripeAccounts.createUserWithFreeSubscription(administrator.price)
      const req = TestHelper.createRequest(`/account/subscriptions/billing-profile?customerid=${user.customer.customerid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const tbody = doc.getElementById(user.subscription.subscriptionid)
      assert.strictEqual(tbody.tag, 'tr')
    })

    it('should have table for invoices', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPrice()
      const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
      const req = TestHelper.createRequest(`/account/subscriptions/billing-profile?customerid=${user.customer.customerid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const tbody = doc.getElementById(user.invoice.invoiceid)
      assert.strictEqual(tbody.tag, 'tr')
    })

    it('should have table for tax ids', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail
      })
      await TestHelper.createTaxId(user, user.customer)
      console.log(user.taxid)
      const req = TestHelper.createRequest(`/account/subscriptions/billing-profile?customerid=${user.customer.customerid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const tbody = doc.getElementById(user.taxid.taxid)
      assert.strictEqual(tbody.tag, 'tr')
    })
  })

  describe('errors', () => {
    it('invalid-customerid', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail
      })
      const req = TestHelper.createRequest('/account/subscriptions/billing-profile?customerid=invalid')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-customerid')
    })

    it('invalid-account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail
      })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/subscriptions/billing-profile?customerid=${user.customer.customerid}`)
      req.account = user2.account
      req.session = user2.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-account')
    })
  })
})
