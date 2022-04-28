/* eslint-env mocha */
const assert = require('assert')
const RequirePayment = require('./require-payment.js')
const TestHelper = require('../../test-helper.js')
const TestStripeAccounts = require('../../test-stripe-accounts.js')

describe('server/stripe-subscriptions/require-payment', () => {
  describe('after', function () {
    it('should ignore guests', async () => {
      const req = TestHelper.createRequest('/')
      const res = {}
      let result
      res.end = (str) => {
        result = str
      }
      await RequirePayment.after(req, res)
      assert.strictEqual(result, undefined)
    })

    it('should ignore user with amount owed requesting account pages', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.toggleOverdueInvoiceThreshold(false)
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail,
        country: 'US'
      })
      await TestHelper.createAmountOwed(user)
      const req = TestHelper.createRequest('/account/change-password')
      req.account = user.account
      req.session = user.session
      const res = {}
      let result
      res.end = (str) => {
        result = str
      }
      await RequirePayment.after(req, res)
      assert.strictEqual(result, undefined)
    })

    it('should ignore administrator with amount owed requesting administration pages', async () => {
      const administrator = await TestHelper.createOwner()
      await TestHelper.toggleOverdueInvoiceThreshold(false)
      await TestHelper.createCustomer(administrator, {
        email: administrator.profile.contactEmail,
        country: 'US'
      })
      await TestHelper.createAmountOwed(administrator)
      const req = TestHelper.createRequest('/administrator/subscriptions')
      req.account = administrator.account
      req.session = administrator.session
      const res = {}
      let result
      res.end = (str) => {
        result = str
      }
      await RequirePayment.after(req, res)
      assert.strictEqual(result, undefined)
    })

    it('should ignore user without amount owed', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.toggleOverdueInvoiceThreshold(false)
      const req = TestHelper.createRequest('/home')
      req.account = user.account
      req.session = user.session
      let result
      const res = {}
      res.end = (str) => {
        result = str
      }
      await RequirePayment.after(req, res)
      assert.strictEqual(result, undefined)
    })

    it('should ignore user with open but not overdue invoice', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPlan({ trial_period_days: 1 })
      await TestHelper.toggleOverdueInvoiceThreshold(false)
      const user = await TestStripeAccounts.createUserWithFreeTrialSubscription(administrator.plan)
      await TestHelper.toggleOverdueInvoiceThreshold(true)
      const req = TestHelper.createRequest('/home')
      req.account = user.account
      req.session = user.session
      let result
      const res = {}
      res.setHeader = () => { }
      res.end = (str) => {
        result = str
      }
      await RequirePayment.after(req, res)
      assert.strictEqual(result, undefined)
    })

    // TODO: needs a card or state that triggers a payment issue
    // it('should require user pay overdue invoice', async () => {
    //   const user = await TestStripeAccounts.createUserWithPaymentMethod()
    //   const dueDate = new Date(new Date().getTime() + (4 * 24 * 60 * 60 * 1000))
    //   const invoice = await TestHelper.createAmountOwed(user, dueDate)
    //   console.log('wait1', invoice)
    //   await TestHelper.waitForWebhook('invoice.updated', (stripeEvent) => {
    //     return stripeEvent.data.object.id === user.invoice.invoiceid
    //   })
    //   console.log('wait2', user.invoice)
    //   await TestHelper.waitForWebhook('payment_intent.created', (stripeEvent) => {
    //     console.log(StripeEvent)
    //     return stripeEvent.data.object.invoice === user.invoice.invoiceid
    //   })
    //   console.log('wait3')
    //   await TestHelper.toggleOverdueInvoiceThreshold(false)
    //   const req = TestHelper.createRequest('/home')
    //   req.account = user.account
    //   req.session = user.session
    //   let redirectURL
    //   const res = {}
    //   res.setHeader = () => {
    //   }
    //   res.end = (str) => {
    //     const doc = dashboard.HTML.parse(str)
    //     redirectURL = TestHelper.extractRedirectURL(doc)
    //   }
    //   await RequirePayment.after(req, res)
    //   assert.strictEqual(redirectURL, `/account/subscriptions/pay-invoice?invoiceid=${user.invoice.invoiceid}&return-url=/home`)
    // })
  })
})
