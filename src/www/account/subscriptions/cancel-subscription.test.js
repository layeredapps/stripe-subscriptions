/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/account/subscriptions/cancel-subscription', function () {
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
    const paidPrice = administrator.price
    const freePrice = await TestHelper.createPrice(administrator, {
      productid: administrator.product.productid,
      unit_amount: 0,
      currency: 'usd',
      tax_behavior: 'inclusive',
      recurring_interval: 'month',
      recurring_interval_count: '1',
      recurring_usage_type: 'licensed',
      active: 'true'
    })
    const paid1 = await TestStripeAccounts.createUserWithPaidSubscription(paidPrice)
    const paid2 = await TestStripeAccounts.createUserWithPaidSubscription(paidPrice)
    const free1 = await TestStripeAccounts.createUserWithFreeSubscription(freePrice)
    const free2 = await TestStripeAccounts.createUserWithFreeSubscription(freePrice)
    const trial1 = await TestStripeAccounts.createUserWithPaymentMethod()
    await TestHelper.createSubscription(trial1, [paidPrice.priceid], { trial_period_days: 7 })
    const trial2 = await TestStripeAccounts.createUserWithPaymentMethod()
    await TestHelper.createSubscription(trial2, [paidPrice.priceid], { trial_period_days: 7 })
    // invalid subscriptionid
    let req = TestHelper.createRequest('/account/subscriptions/cancel-subscription')
    req.account = paid1.account
    req.session = paid1.session
    await req.route.api.before(req)
    cachedResponses.missingSubscription = req.error
    req = TestHelper.createRequest('/account/subscriptions/cancel-subscription?subscriptionid=invalid')
    req.account = paid1.account
    req.session = paid1.session
    await req.route.api.before(req)
    cachedResponses.invalidSubscription = req.error
    // invalid account
    req = TestHelper.createRequest(`/account/subscriptions/cancel-subscription?subscriptionid=${paid1.subscription.subscriptionid}`)
    req.account = paid2.account
    req.session = paid2.session
    await req.route.api.before(req)
    cachedResponses.invalidAccount = req.error
    // reject canceled subscription
    const canceled = await TestStripeAccounts.createUserWithPaidSubscription(paidPrice)
    await TestHelper.cancelSubscription(canceled)
    req = TestHelper.createRequest(`/account/subscriptions/cancel-subscription?subscriptionid=${canceled.subscription.subscriptionid}`)
    req.account = canceled.account
    req.session = canceled.session
    req.body = {
      cancelation: 'immediate'
    }
    await req.route.api.before(req)
    cachedResponses.canceledSubscription = req.error
    // bind data
    req = TestHelper.createRequest(`/account/subscriptions/cancel-subscription?subscriptionid=${paid1.subscription.subscriptionid}`)
    req.account = paid1.account
    req.session = paid1.session
    await req.route.api.before(req)
    cachedResponses.before = req.data
    cachedResponses.view = await req.get()
    // cancel paid
    req.body = {
      cancelation: 'immediate'
    }
    cachedResponses.submitPaid1 = await req.post()
    req = TestHelper.createRequest(`/account/subscriptions/cancel-subscription?subscriptionid=${paid2.subscription.subscriptionid}`)
    req.account = paid2.account
    req.session = paid2.session
    req.body = {
      cancelation: 'delayed'
    }
    cachedResponses.submitPaid2 = await req.post()
    // cancel free
    req = TestHelper.createRequest(`/account/subscriptions/cancel-subscription?subscriptionid=${free1.subscription.subscriptionid}`)
    req.account = free1.account
    req.session = free1.session
    req.filename = __filename
    req.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/subscriptions' },
      { click: '/account/subscriptions/subscriptions' },
      { click: `/account/subscriptions/subscription?subscriptionid=${free1.subscription.subscriptionid}` },
      { click: `/account/subscriptions/cancel-subscription?subscriptionid=${free1.subscription.subscriptionid}` },
      { fill: '#submit-form' }
    ]
    req.body = {
      cancelation: 'immediate'
    }
    global.pageSize = 50
    cachedResponses.submitFree1 = await req.post()
    req = TestHelper.createRequest(`/account/subscriptions/cancel-subscription?subscriptionid=${free2.subscription.subscriptionid}`)
    req.account = free2.account
    req.session = free2.session
    req.body = {
      cancelation: 'delayed'
    }
    cachedResponses.submitFree2 = await req.post()
    // cancel free trial
    req = TestHelper.createRequest(`/account/subscriptions/cancel-subscription?subscriptionid=${trial1.subscription.subscriptionid}`)
    req.account = trial1.account
    req.session = trial1.session
    req.body = {
      cancelation: 'immediate'
    }
    // csrf
    req.puppeteer = false
    req.body = {
      cancelation: 'immediate',
      'csrf-token': ''
    }
    cachedResponses.csrf = await req.post()
    delete (req.puppeteer)
    // submit
    req.body = {
      cancelation: 'immediate'
    }
    cachedResponses.submitFreeTrial1 = await req.post()
    req = TestHelper.createRequest(`/account/subscriptions/cancel-subscription?subscriptionid=${trial2.subscription.subscriptionid}`)
    req.account = trial2.account
    req.session = trial2.session
    req.body = {
      cancelation: 'delayed'
    }
    cachedResponses.submitFreeTrial2 = await req.post()
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
      const result = cachedResponses.view
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should cancel free subscription immediately (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submitFree1
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success-immediate')
    })

    it('should cancel free subscription at period end', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submitFree2
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success-delayed')
    })

    it('should cancel free trial immediately', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submitFreeTrial1
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success-immediate')
    })

    it('should cancel free trial at period end', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submitFreeTrial2
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success-delayed')
    })

    it('should cancel paid subscription immediately', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submitPaid1
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success-immediate')
    })

    it('should cancel paid subscription at period end', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submitPaid2
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success-delayed')
    })
  })

  describe('errors', () => {
    it('invalid-csrf-token', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.csrf
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-csrf-token')
    })
  })

  describe('error', () => {
    it('invalid-subscriptionid', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.missingSubscription
      assert.strictEqual(errorMessage, 'invalid-subscriptionid')
    })

    it('invalid-subscription', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.canceledSubscription
      assert.strictEqual(errorMessage, 'invalid-subscription')
    })

    it('invalid-account', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.invalidAccount
      assert.strictEqual(errorMessage, 'invalid-account')
    })
  })
})
