/* eslint-env mocha */
const assert = require('assert')
const RequirePaymentConfirmation = require('./require-payment-confirmation.js')
const TestHelper = require('../../test-helper.js')
const TestStripeAccounts = require('../../test-stripe-accounts.js')

describe('server/stripe-subscriptions/require-payment-confirmation', function () {
  describe('after', () => {
    it('should ignore guests', async () => {
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
    //   const administrator = await TestStripeAccounts.createOwnerWithPrice({
    //     amount: '1000',
    //     trial_period_days: '0',
    //     interval: 'month',
    //     usage_type: 'licensed'
    //   })
    //   const user = await TestStripeAccounts.createUserWithFreeTrialSubscription(administrator.price)
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
      const administrator = await TestStripeAccounts.createOwnerWithPrice()
      await TestHelper.createCustomer(administrator, {
        email: administrator.profile.contactEmail,
        country: 'US'
      })
      await TestHelper.createPaymentMethod(administrator, {
        cvc: '111',
        number: '4111111111111111',
        exp_month: '1',
        exp_year: (new Date().getFullYear() + 1).toString().substring(2),
        name: administrator.profile.fullName,
        line1: '285 Fulton St',
        line2: 'Apt 893',
        city: 'New York',
        state: 'NY',
        postal_code: '10007',
        country: 'US',
        default: 'true'
      })
      await TestHelper.createSubscription(administrator, [administrator.price.priceid])
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
      const administrator = await TestStripeAccounts.createOwnerWithPrice({
        unit_amount: 0,
        currency: 'usd',
        tax_behavior: 'inclusive',
        recurring_interval: 'month',
        recurring_interval_count: '1',
        recurring_usage_type: 'licensed',
        publishedAt: 'true'
      })
      const user = await TestStripeAccounts.createUserWithFreeSubscription(administrator.price)
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
    //   const administrator = await TestStripeAccounts.createOwnerWithPrice({
    //   amount: '1000',
    //   trial_period_days: '0',
    //   interval: 'month',
    //   usage_type: 'licensed'
    // })
    //   const user = await TestStripeAccounts.createUserWithPaymentMethod()
    //   await TestHelper.createCustomer(user, {
    //     email: user.profile.contactEmail,
    //     description: user.profile.fullName,
    //     country: 'US'
    //   })
    //   await TestHelper.createPaymentMethod(user, {
    //     cvc: '111',
    //     number: '4000000000000119',
    //     exp_month: '1',
    //     exp_year: (new Date().getFullYear() + 1).toString().substring(2),
    //     name: user.profile.fullName,
    //     line1: '285 Fulton St',
    //     line2: 'Apt 893',
    //     city: 'New York',
    //     state: 'NY',
    //     postal_code: '10007',
    //     country: 'US',
    //     default: 'true'
    //   })
    //   await TestHelper.createSubscription(user, administrator.price.priceid)
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
