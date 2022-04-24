/* eslint-env mocha */
const assert = require('assert')
const dashboard = require('@layeredapps/dashboard')
const RequireSubscription = require('./require-subscription.js')
const TestHelper = require('../../test-helper.js')
const TestStripeAccounts = require('../../test-stripe-accounts.js')

describe('server/stripe-subscriptions/require-subscription', function () {
  describe('after', () => {
    it('should ignore guests', async () => {
      global.requireSubscription = true
      const req = TestHelper.createRequest('/')
      const res = {}
      let result
      res.end = (str) => {
        result = str
      }
      await RequireSubscription.after(req, res)
      assert.strictEqual(result, undefined)
    })

    it('should ignore user without subscription requesting account pages', async () => {
      const user = await TestHelper.createUser()
      global.requireSubscription = true
      const req = TestHelper.createRequest('/account/change-password')
      req.account = user.account
      req.session = user.session
      const res = {}
      let result
      res.end = (str) => {
        result = str
      }
      await RequireSubscription.after(req, res)
      assert.strictEqual(result, undefined)
    })

    it('should ignore administrator without subscription requesting administration pages', async () => {
      const administrator = await TestHelper.createOwner()
      global.requireSubscription = true
      const req = TestHelper.createRequest('/administrator/subscriptions')
      req.account = administrator.account
      req.session = administrator.session
      const res = {}
      let result
      res.end = (str) => {
        result = str
      }
      await RequireSubscription.after(req, res)
      assert.strictEqual(result, undefined)
    })

    it('should ignore user with active subscription', async () => {
      const administrator = await TestStripeAccounts.createOwnerWithPlan({
        amount: '1000',
        trial_period_days: '0',
        interval: 'month',
        usage_type: 'licensed'
      })
      const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
      global.requireSubscription = true
      const req = TestHelper.createRequest('/home')
      req.account = user.account
      req.session = user.session
      let ending
      const res = {}
      res.setHeader = () => { }
      res.end = (str) => {
        ending = str
      }
      await RequireSubscription.after(req, res)
      assert.strictEqual(ending, undefined)
    })

    it('should require user create subscription', async () => {
      await TestHelper.createOwner()
      const user = await TestHelper.createUser()
      global.requireSubscription = true
      const req = TestHelper.createRequest('/home')
      req.account = user.account
      req.session = user.session
      let redirectURL
      const res = {}
      res.setHeader = () => {}
      res.end = (str) => {
        const doc = dashboard.HTML.parse(str)
        redirectURL = TestHelper.extractRedirectURL(doc)
      }
      await RequireSubscription.after(req, res)
      assert.strictEqual(redirectURL, '/account/subscriptions/start-subscription?return-url=/home')
    })
  })
})
