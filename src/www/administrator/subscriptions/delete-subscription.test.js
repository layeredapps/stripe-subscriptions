/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')
const ScreenshotData = require('../../../../screenshot-data.js')

describe('/administrator/subscriptions/delete-subscription', function () {
  let cachedResponses
  let cachedSubscription
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
    const paidPlan = administrator.plan
    const freeTrialPlan = await TestHelper.createPlan(administrator, {
      productid: administrator.product.productid,
      publishedAt: 'true',
      amount: '100000',
      trial_period_days: '10'
    })
    const freePlan = await TestHelper.createPlan(administrator, {
      productid: administrator.product.productid,
      publishedAt: 'true',
      amount: '0'
    })
    const user = await TestStripeAccounts.createUserWithPaidSubscription(paidPlan)
    const paidSubscription1 = user.subscription
    await TestStripeAccounts.createUserWithPaidSubscription(paidPlan, user)
    const paidSubscription2 = user.subscription
    await TestStripeAccounts.createUserWithPaidSubscription(paidPlan, user)
    const paidSubscription3 = user.subscription
    await TestStripeAccounts.createUserWithFreeSubscription(freePlan, user)
    const freeSubscription1 = cachedSubscription = user.subscription
    await TestStripeAccounts.createUserWithFreeSubscription(freePlan, user)
    const freeSubscription2 = user.subscription
    await TestStripeAccounts.createUserWithFreeTrialSubscription(freeTrialPlan, user)
    const trialSubscription1 = user.subscription
    await TestStripeAccounts.createUserWithFreeTrialSubscription(freeTrialPlan, user)
    const trialSubscription2 = user.subscription
    // test before with a missing subscriptionid
    let req = TestHelper.createRequest('/administrator/subscriptions/delete-subscription')
    req.account = administrator.account
    req.session = administrator.session
    try {
      await req.route.api.before(req)
    } catch (error) {
      cachedResponses.missingQueryString = error.message
    }
    req = TestHelper.createRequest('/administrator/subscriptions/delete-subscription')
    req.account = administrator.account
    req.session = administrator.session
    req.query = {
      subscriptionid: 'invalid'
    }
    await req.route.api.before(req)
    cachedResponses.invalidQuerystring = req.error
    delete (req.error)
    // test before data bind
    req.query = {
      subscriptionid: freeSubscription1.subscriptionid
    }
    await req.route.api.before(req)
    cachedResponses.before = req.data
    // test get
    req = TestHelper.createRequest(`/administrator/subscriptions/delete-subscription?subscriptionid=${freeSubscription1.subscriptionid}`)
    req.account = administrator.account
    req.session = administrator.session
    cachedResponses.returnsFreePlan = await req.get()
    req = TestHelper.createRequest(`/administrator/subscriptions/delete-subscription?subscriptionid=${trialSubscription1.subscriptionid}`)
    req.account = administrator.account
    req.session = administrator.session
    cachedResponses.returnsFreeTrial = await req.get()
    req = TestHelper.createRequest(`/administrator/subscriptions/delete-subscription?subscriptionid=${paidSubscription1.subscriptionid}`)
    req.account = administrator.account
    req.session = administrator.session
    cachedResponses.returnsPaidPlan = await req.get()
    // test submit 'at period end'
    req = TestHelper.createRequest(`/administrator/subscriptions/delete-subscription?subscriptionid=${freeSubscription1.subscriptionid}`)
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      refund: 'at_period_end'
    }
    cachedResponses.submitFreeAtPeriodEnd = await req.post()
    req = TestHelper.createRequest(`/administrator/subscriptions/delete-subscription?subscriptionid=${trialSubscription1.subscriptionid}`)
    req.account = administrator.account
    req.session = administrator.session
    cachedResponses.submitFreeTrialAtPeriodEnd = await req.post()
    req = TestHelper.createRequest(`/administrator/subscriptions/delete-subscription?subscriptionid=${paidSubscription1.subscriptionid}`)
    req.account = administrator.account
    req.session = administrator.session
    cachedResponses.submitPaidAtPeriodEnd = await req.post()
    // already-deleted error
    req.query = {
      subscriptionid: paidSubscription1.subscriptionid
    }
    await req.route.api.before(req)
    cachedResponses.invalidSubscription = req.error
    // test submit 'immediate'
    req.body = {
      refund: 'immediate'
    }
    req = TestHelper.createRequest(`/administrator/subscriptions/delete-subscription?subscriptionid=${trialSubscription2.subscriptionid}`)
    req.account = administrator.account
    req.session = administrator.session
    cachedResponses.submitFreeTrialImmediate = await req.post()
    req = TestHelper.createRequest(`/administrator/subscriptions/delete-subscription?subscriptionid=${paidSubscription2.subscriptionid}`)
    req.account = administrator.account
    req.session = administrator.session
    cachedResponses.submitPaidImmediate = await req.post()
    // immediate
    req = TestHelper.createRequest(`/administrator/subscriptions/delete-subscription?subscriptionid=${freeSubscription2.subscriptionid}`)
    req.account = administrator.account
    req.session = administrator.session
    cachedResponses.submitFreeImmedate = await req.post()
    // csrf
    req = TestHelper.createRequest(`/administrator/subscriptions/delete-subscription?subscriptionid=${paidSubscription3.subscriptionid}`)
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      refund: 'refund',
      'csrf-token': ''
    }
    req.puppeteer = false
    cachedResponses.csrf = await req.post()
    // credit
    req.body = {
      refund: 'credit'
    }
    cachedResponses.submitPaidCredit = await req.post()
    // refund
    req.body = {
      refund: 'refund'
    }
    req.filename = __filename
    req.screenshots = [
      { hover: '#administrator-menu-container' },
      { click: '/administrator/subscriptions' },
      { click: '/administrator/subscriptions/subscriptions' },
      { click: `/administrator/subscriptions/subscription?subscriptionid=${paidSubscription3.subscriptionid}` },
      { click: `/administrator/subscriptions/delete-subscription?subscriptionid=${paidSubscription3.subscriptionid}` },
      { fill: '#submit-form' }
    ]
    global.pageSize = 50
    global.packageJSON.dashboard.server.push(ScreenshotData.administratorIndex)
    global.packageJSON.dashboard.server.push(ScreenshotData.administratorSubscriptions)
    cachedResponses.submitPaidRefund = await req.post()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    it('should reject missing subscription', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.missingQueryString
      assert.strictEqual(errorMessage, 'invalid-subscriptionid')
    })
    it('should reject invalid subscription', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.invalidQuerystring
      assert.strictEqual(errorMessage, 'invalid-subscriptionid')
    })
    it('should reject canceled subscription', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.invalidSubscription
      assert.strictEqual(errorMessage, 'invalid-subscription')
    })
  })

  describe('before', () => {
    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const data = cachedResponses.before
      assert.strictEqual(data.subscription.subscriptionid, cachedSubscription.subscriptionid)
    })
  })

  describe('view', () => {
    it('should present the form', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.returnsFreePlan
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })

    it('should show fields for free plan cancelations', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.returnsFreePlan
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
      const result = cachedResponses.returnsFreeTrial
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
      const result = cachedResponses.returnsPaidPlan
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
      const result = cachedResponses.submitFreeImmedate
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should cancel free subscription at period end', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submitFreeAtPeriodEnd
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should cancel free trial immediately', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submitFreeTrialImmediate
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should cancel free trial at period end', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submitFreeTrialAtPeriodEnd
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should cancel paid subscription and credit account', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submitPaidCredit
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success-credit')
    })

    it('should cancel paid subscription and show refund', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submitPaidRefund
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success-refund')
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
})
