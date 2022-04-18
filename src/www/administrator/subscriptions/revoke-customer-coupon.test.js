/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const ScreenshotData = require('../../../../screenshot-data.js')

describe('/administrator/subscriptions/revoke-customer-coupon', function () {
  describe('exceptions', () => {
    it('should reject invalid customer', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/revoke-customer-coupon?customerid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-customerid')
    })

    it('should reject customer without discount', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPlan({ amount: '1000' })
      await TestHelper.createCoupon(administrator, {
        publishedAt: 'true',
        percent_off: '25',
        duration: 'repeating',
        duration_in_months: '3'
      })
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail,
        description: user.profile.firstName,
        country: 'US'
      })
      const req = TestHelper.createRequest(`/administrator/subscriptions/revoke-customer-coupon?customerid=${user.customer.customerid}`)
      req.account = administrator.account
      req.session = administrator.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-customer')
    })
  })

  describe('before', () => {
    it('should bind data to req', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPlan({
        amount: '1000',
        trial_period_days: '0',
        interval: 'month',
        usage_type: 'licensed'
      })
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail,
        description: user.profile.firstName,
        country: 'US'
      })
      await TestHelper.createCoupon(administrator, {
        publishedAt: 'true',
        percent_off: '25',
        duration: 'repeating',
        duration_in_months: '3'
      })
      await TestHelper.createCustomerDiscount(administrator, user.customer, administrator.coupon)
      const req = TestHelper.createRequest(`/administrator/subscriptions/revoke-customer-coupon?customerid=${user.customer.customerid}`)
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.customer.customerid, user.customer.customerid)
    })
  })

  describe('view', () => {
    it('should present the form', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPlan({
        amount: '1000',
        trial_period_days: '0',
        interval: 'month',
        usage_type: 'licensed'
      })
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail,
        description: user.profile.firstName,
        country: 'US'
      })
      await TestHelper.createCoupon(administrator, {
        publishedAt: 'true',
        percent_off: '25',
        duration: 'repeating',
        duration_in_months: '3'
      })
      await TestHelper.createCustomerDiscount(administrator, user.customer, administrator.coupon)
      const req = TestHelper.createRequest(`/administrator/subscriptions/revoke-customer-coupon?customerid=${user.customer.customerid}`)
      req.account = administrator.account
      req.session = administrator.session
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should remove coupon (screenshots)', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPlan({
        amount: '1000',
        trial_period_days: '0',
        interval: 'month',
        usage_type: 'licensed'
      })
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail,
        description: user.profile.firstName,
        country: 'US'
      })
      await TestHelper.createCoupon(administrator, {
        publishedAt: 'true',
        percent_off: '25',
        duration: 'repeating',
        duration_in_months: '3'
      })
      await TestHelper.createCustomerDiscount(administrator, user.customer, administrator.coupon)
      const req = TestHelper.createRequest(`/administrator/subscriptions/revoke-customer-coupon?customerid=${user.customer.customerid}`)
      req.account = administrator.account
      req.session = administrator.session
      req.body = {
        couponid: administrator.coupon.couponid
      }
      req.filename = __filename
      req.screenshots = [
        { hover: '#administrator-menu-container' },
        { click: '/administrator/subscriptions' },
        { click: '/administrator/subscriptions/customers' },
        { click: `/administrator/subscriptions/customer?customerid=${user.customer.customerid}` },
        { click: `/administrator/subscriptions/revoke-customer-coupon?customerid=${user.customer.customerid}` },
        { fill: '#submit-form' }
      ]
      global.pageSize = 50
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorIndex)
      global.packageJSON.dashboard.server.push(ScreenshotData.administratorCustomers)
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })
})
