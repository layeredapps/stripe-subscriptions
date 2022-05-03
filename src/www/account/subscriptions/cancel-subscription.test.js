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
    const administrator = await TestStripeAccounts.createOwnerWithPlan({
      amount: '1000',
      trial_period_days: '0',
      interval: 'month',
      usage_type: 'licensed'
    })
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
    // invalid subscriptionid
    let req = TestHelper.createRequest('/account/subscriptions/cancel-subscription')
    req.account = user.account
    req.session = user.session
    try {
      await req.route.api.before(req)
    } catch (error) {
      cachedResponses.missingSubscription = error.message
    }
    req = TestHelper.createRequest('/account/subscriptions/cancel-subscription?subscriptionid=invalid')
    req.account = user.account
    req.session = user.session
    await req.route.api.before(req)
    cachedResponses.invalidSubscription = req.error
    // invalid account
    const user3 = await TestHelper.createUser()
    req = TestHelper.createRequest(`/account/subscriptions/cancel-subscription?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = user3.account
    req.session = user3.session
    await req.route.api.before(req)
    cachedResponses.invalidAccount = req.error
    // reject canceled subscription
    await TestHelper.cancelSubscription(user)
    req = TestHelper.createRequest(`/account/subscriptions/cancel-subscription?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = user.account
    req.session = user.session
    req.body = {
      refund: 'credit'
    }
    await req.route.api.before(req)
    cachedResponses.canceledSubscription = req.error
    // bind data
    const user2 = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
    req = TestHelper.createRequest(`/account/subscriptions/cancel-subscription?subscriptionid=${user2.subscription.subscriptionid}`)
    req.account = user2.account
    req.session = user2.session
    await req.route.api.before(req)
    cachedResponses.before = req.data
    // view paid
    cachedResponses.viewPaid = await req.get()
    // cancel paid
    req.body = {
      refund: 'credit'
    }
    cachedResponses.submitPaid1 = await req.post()
    await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan, user2)
    req = TestHelper.createRequest(`/account/subscriptions/cancel-subscription?subscriptionid=${user2.subscription.subscriptionid}`)
    req.account = user2.account
    req.session = user2.session
    req.body = {
      refund: 'refund'
    }
    cachedResponses.submitPaid2 = await req.post()
    // cancel free
    const administrator2 = await TestStripeAccounts.createOwnerWithPlan({
      amount: 0,
      publishedAt: 'true'
    })
    await TestStripeAccounts.createUserWithFreeSubscription(administrator2.plan, user)
    req = TestHelper.createRequest(`/account/subscriptions/cancel-subscription?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = user.account
    req.session = user.session
    req.filename = __filename
    cachedResponses.viewFree = await req.get()
    req.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/subscriptions' },
      { click: '/account/subscriptions/subscriptions' },
      { click: `/account/subscriptions/subscription?subscriptionid=${user.subscription.subscriptionid}` },
      { click: `/account/subscriptions/cancel-subscription?subscriptionid=${user.subscription.subscriptionid}` },
      { fill: '#submit-form' }
    ]
    req.body = {
      refund: 'credit'
    }
    global.pageSize = 50
    cachedResponses.submitFree1 = await req.post()
    await TestStripeAccounts.createUserWithFreeSubscription(administrator2.plan, user2)
    req = TestHelper.createRequest(`/account/subscriptions/cancel-subscription?subscriptionid=${user2.subscription.subscriptionid}`)
    req.account = user2.account
    req.session = user2.session
    req.body = {
      refund: 'refund'
    }
    cachedResponses.submitFree2 = await req.post()
    // cancel free trial
    const administrator3 = await TestStripeAccounts.createOwnerWithPlan({
      amount: '1000',
      trial_period_days: 7,
      publishedAt: 'true'
    })
    await TestStripeAccounts.createUserWithFreeTrialSubscription(administrator3.plan, user)
    req = TestHelper.createRequest(`/account/subscriptions/cancel-subscription?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = user.account
    req.session = user.session
    req.body = {
      refund: 'credit'
    }
    cachedResponses.viewFreeTrial = await req.get()
    // xss
    req.body = {
      refund: '<script>'
    }
    cachedResponses.xss = await req.post()
    // csrf
    req.puppeteer = false
    req.body = {
      refund: 'credit',
      'crsf-token': ''
    }
    cachedResponses.csrf = await req.post()
    delete (req.puppeteer)
    // submit
    req.body = {
      refund: 'credit'
    }
    cachedResponses.submitFreeTrial1 = await req.post()
    await TestStripeAccounts.createUserWithFreeTrialSubscription(administrator3.plan, user2)
    req = TestHelper.createRequest(`/account/subscriptions/cancel-subscription?subscriptionid=${user2.subscription.subscriptionid}`)
    req.account = user2.account
    req.session = user2.session
    req.body = {
      refund: 'at_period_end'
    }
    cachedResponses.submitFreeTrial2 = await req.post()

    cachedResponses.finished = true
  }
  describe('exceptions', () => {
    it('should reject missing subscription', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.missingSubscription
      assert.strictEqual(errorMessage, 'invalid-subscriptionid')
    })

    it('should reject invalid subscription', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.invalidSubscription
      assert.strictEqual(errorMessage, 'invalid-subscriptionid')
    })

    it('should reject canceled subscription', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.canceledSubscription
      assert.strictEqual(errorMessage, 'invalid-subscription')
    })

    it('should reject other account\'s subscription', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.invalidAccount
      assert.strictEqual(errorMessage, 'invalid-account')
    })
  })

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
      const result = cachedResponses.viewPaid
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })

    it('should show fields for free plan cancelations', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.viewFree
      const doc = TestHelper.extractDoc(result.html)
      const delay = doc.getElementById('delay-checkbox')
      assert.strictEqual(delay.tag, 'input')
      const immediate = doc.getElementById('immediate-checkbox')
      assert.strictEqual(immediate.tag, 'input')
      const refund = doc.getElementById('refund-checkbox')
      assert.strictEqual(refund, undefined)
      const credit = doc.getElementById('credit-checkbox')
      assert.strictEqual(credit, undefined)
    })

    it('should show fields for free trial cancelations', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.viewFreeTrial
      const doc = TestHelper.extractDoc(result.html)
      const delay = doc.getElementById('delay-checkbox')
      assert.strictEqual(delay.tag, 'input')
      const immediate = doc.getElementById('immediate-checkbox')
      assert.strictEqual(immediate.tag, 'input')
      const refund = doc.getElementById('refund-checkbox')
      assert.strictEqual(refund, undefined)
      const credit = doc.getElementById('credit-checkbox')
      assert.strictEqual(credit, undefined)
    })

    it('should show fields for cancelation with credit or refund', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.viewPaid
      const doc = TestHelper.extractDoc(result.html)
      const delay = doc.getElementById('delay-checkbox')
      assert.strictEqual(delay.tag, 'input')
      const immediate = doc.getElementById('immediate')
      assert.strictEqual(immediate, undefined)
      const refund = doc.getElementById('refund-checkbox')
      assert.strictEqual(refund.tag, 'input')
      const credit = doc.getElementById('credit-checkbox')
      assert.strictEqual(credit.tag, 'input')
    })
  })

  describe('submit', () => {
    it('should cancel free subscription immediately (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submitFree1
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should cancel free subscription at period end', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submitFree2
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should cancel free trial immediately', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submitFreeTrial1
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should cancel free trial at period end', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submitFreeTrial2
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should cancel paid subscription and credit account', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submitPaid1
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success-credit')
    })

    it('should cancel paid subscription and show refund', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submitPaid2
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success-refund')
    })
  })

  describe('errors', () => {
    it('invalid-xss-input', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.xss
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-xss-input')
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
