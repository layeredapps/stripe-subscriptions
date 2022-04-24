/* eslint-env mocha */
const assert = require('assert')
const RequirePaymentConfirmation = require('./require-payment-confirmation.js')
const TestHelper = require('../../test-helper.js')
const TestStripeAccounts = require('../../test-stripe-accounts.js')

describe('server/stripe-subscriptions/require-payment-confirmation', function () {
  describe('after', () => {
    it('should ignore guests', async () => {
      global.requirePaymentConfirmation = true
      const req = TestHelper.createRequest('/')
      const res = {}
      let result
      res.end = (str) => {
        result = str
      }
      await RequirePaymentConfirmation.after(req, res)
      assert.strictEqual(result, undefined)
    })

    // it('should ignore user with pending confirmations requesting account pages', async () => {
    //   const administrator = await TestStripeAccounts.createOwnerWithPlan({
    //     amount: '1000',
    //     trial_period_days: '0',
    //     interval: 'month',
    //     usage_type: 'licensed'
    //   })
    //   const user = await TestStripeAccounts.createUserWithFreeTrialSubscription(administrator.plan)
    //   global.requirePaymentConfirmation = true
    //   const req = TestHelper.createRequest('/account/change-password')
    //   req.account = user.account
    //   req.session = user.session
    //   const res = {}
    //   let result
    //   res.end = (str) => {
    //     result = str
    //   }
    //   await RequirePaymentConfirmation.after(req, res)
    //   assert.strictEqual(result, undefined)
    // })

    it('should ignore administrators with pending confirmations requesting administration pages', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPlan({
        amount: '1000',
        trial_period_days: '0',
        interval: 'month',
        usage_type: 'licensed'
      })
      await TestHelper.createCustomer(administrator, {
        email: administrator.profile.contactEmail,
        description: administrator.profile.firstName,
        country: 'US'
      })
      await TestHelper.createPaymentMethod(administrator, {
        cvc: '111',
        number: '4111111111111111',
        exp_month: '1',
        exp_year: (new Date().getFullYear() + 1).toString().substring(2),
        name: administrator.profile.firstName + ' ' + administrator.profile.lastName,
        address_line1: '285 Fulton St',
        address_line2: 'Apt 893',
        address_city: 'New York',
        address_state: 'NY',
        address_zip: '10007',
        address_country: 'US',
        default: 'true'
      })
      global.requirePaymentConfirmation = true
      await TestHelper.createSubscription(administrator, administrator.plan.planid)
      const req = TestHelper.createRequest('/administrator/subscriptions')
      req.account = administrator.account
      req.session = administrator.session
      const res = {}
      let result
      res.end = (str) => {
        result = str
      }
      await RequirePaymentConfirmation.after(req, res)
      assert.strictEqual(result, undefined)
    })

    it('should ignore user without pending confirmation', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPlan({
        amount: '0',
        trial_period_days: '0',
        interval: 'month',
        usage_type: 'licensed'
      })
      const user = await TestStripeAccounts.createUserWithFreeSubscription(administrator.plan)
      global.requirePaymentConfirmation = true
      const req = TestHelper.createRequest('/home')
      req.account = user.account
      req.session = user.session
      let result
      const res = {}
      res.end = (str) => {
        result = str
      }
      await RequirePaymentConfirmation.after(req, res)
      assert.strictEqual(result, undefined)
    })

    // TODO: needs a card or state that triggers confirmation, may not be
    // possible as complete data is collected for payment
    // it('should require user confirm payment', async () => {
    //   const administrator = await TestStripeAccounts.createOwnerWithPlan({
    //   amount: '1000',
    //   trial_period_days: '0',
    //   interval: 'month',
    //   usage_type: 'licensed'
    // })
    //   const user = await TestStripeAccounts.createUserWithPaymentMethod()
    //   await TestHelper.createCustomer(user, {
    //     email: user.profile.contactEmail,
    //     description: user.profile.firstName,
    //     country: 'US'
    //   })
    //   await TestHelper.createPaymentMethod(user, {
    //     cvc: '111',
    //     number: '4000000000000119',
    //     exp_month: '1',
    //     exp_year: (new Date().getFullYear() + 1).toString().substring(2),
    //     name: user.profile.firstName + ' ' + user.profile.lastName,
    //     address_line1: '285 Fulton St',
    //     address_line2: 'Apt 893',
    //     address_city: 'New York',
    //     address_state: 'NY',
    //     address_zip: '10007',
    //     address_country: 'US',
    //     default: 'true'
    //   })
    //   global.requirePaymentConfirmation = true
    //   await TestHelper.createSubscription(user, administrator.plan.planid)
    //   const req = TestHelper.createRequest('/home')
    //   req.account = user.account
    //   req.session = user.session
    //   let redirectURL
    //   const res = {}
    //   res.setHeader = () => { }
    //   res.end = (str) => {
    //     const doc = dashboard.HTML.parse(str)
    //     redirectURL = TestHelper.extractRedirectURL(doc)
    //   }
    //   await RequirePaymentConfirmation.after(req, res)
    //   assert.strictEqual(redirectURL, `/account/subscriptions/confirm-payment?invoiceid=${user.invoice.invoiceid}&return-url=/home`)
    // })
  })
})
