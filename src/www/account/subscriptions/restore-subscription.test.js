/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/account/subscriptions/restore-subscription', function () {
  let cachedResponses
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
      await TestHelper.rotateWebhook(true)
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestStripeAccounts.createOwnerWithPrice()
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
    // invalid subscriptionid
    let req = TestHelper.createRequest('/account/subscriptions/restore-subscription')
    req.account = user.account
    req.session = user.session
    await req.route.api.before(req)
    cachedResponses.missingSubscription = req.error
    req = TestHelper.createRequest('/account/subscriptions/restore-subscription?subscriptionid=invalid')
    req.account = user.account
    req.session = user.session
    await req.route.api.before(req)
    cachedResponses.invalidSubscription = req.error
    // invalid account
    const user3 = await TestHelper.createUser()
    req = TestHelper.createRequest(`/account/subscriptions/restore-subscription?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = user3.account
    req.session = user3.session
    await req.route.api.before(req)
    cachedResponses.invalidAccount = req.error
    // reject uncanceled subscription
    req = TestHelper.createRequest(`/account/subscriptions/restore-subscription?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = user.account
    req.session = user.session
    await req.route.api.before(req)
    cachedResponses.uncanceledSubscription = req.error
    // bind data
    const user2 = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
    await TestHelper.cancelSubscription(user2)
    req = TestHelper.createRequest(`/account/subscriptions/restore-subscription?subscriptionid=${user2.subscription.subscriptionid}`)
    req.account = user2.account
    req.session = user2.session
    await req.route.api.before(req)
    cachedResponses.before = req.data
    cachedResponses.returns = await req.get()
    // csrf
    req.body = {
      'csrf-token': ''
    }
    req.puppeteer = false
    cachedResponses.csrf = await req.post()
    delete (req.puppeteer)
    delete (req.body)
    // submit
    cachedResponses.submit = await req.post()
    cachedResponses.finished = true
  }

  describe('before', () => {
    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const before = cachedResponses.before
      assert.strictEqual(before.subscription.object, 'subscription')
    })
  })

  describe('view', () => {
    it('should present the form', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should restore subscription (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submit
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })

  describe('errors', () => {
    it('invalid-subscriptionid', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.invalidSubscription
      assert.strictEqual(errorMessage, 'invalid-subscriptionid')
    })

    it('invalid-subscription', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.uncanceledSubscription
      assert.strictEqual(errorMessage, 'invalid-subscription')
    })

    it('invalid-account', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.invalidAccount
      assert.strictEqual(errorMessage, 'invalid-account')
    })

    it('invalid-csrf-token', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.csrf
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-csrf-token')
    })
  })
})
