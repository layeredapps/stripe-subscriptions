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
    const administrator = await TestStripeAccounts.createOwnerWithPrice()
    const paidPrice = administrator.price
    const freeTrialPrice = await TestHelper.createPrice(administrator, {
      productid: administrator.product.productid,
      active: 'true',
      currency: 'usd',
      tax_behavior: 'inclusive',
      unit_amount: '100000',
      recurring_interval: 'month',
      recurring_usage_type: 'licensed',
      recurring_interval_count: '1'
    })
    const freePrice = await TestHelper.createPrice(administrator, {
      productid: administrator.product.productid,
      active: 'true',
      currency: 'usd',
      unit_amount: '0',
      tax_behavior: 'inclusive',
      recurring_interval: 'month',
      recurring_interval_count: '1',
      recurring_usage_type: 'licensed'
    })
    const user = await TestStripeAccounts.createUserWithPaidSubscription(paidPrice)
    const paidSubscription1 = user.subscription
    await TestStripeAccounts.createUserWithPaidSubscription(paidPrice, user)
    const paidSubscription2 = user.subscription
    await TestStripeAccounts.createUserWithPaidSubscription(paidPrice, user)
    const paidSubscription3 = user.subscription
    await TestStripeAccounts.createUserWithPaidSubscription(paidPrice, user)
    const paidSubscription4 = user.subscription
    await TestStripeAccounts.createUserWithFreeSubscription(freePrice, user)
    const freeSubscription1 = cachedSubscription = user.subscription
    await TestStripeAccounts.createUserWithFreeSubscription(freePrice, user)
    const freeSubscription2 = user.subscription
    await TestStripeAccounts.createUserWithFreeTrialSubscription(freeTrialPrice, user)
    const trialSubscription1 = user.subscription
    await TestStripeAccounts.createUserWithFreeTrialSubscription(freeTrialPrice, user)
    const trialSubscription2 = user.subscription
    // test before with a missing subscriptionid
    let req = TestHelper.createRequest('/administrator/subscriptions/delete-subscription')
    req.account = administrator.account
    req.session = administrator.session
    await req.route.api.before(req)
    cachedResponses.missingQueryString = req.error
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
    cachedResponses.returnsFreePrice = await req.get()
    req = TestHelper.createRequest(`/administrator/subscriptions/delete-subscription?subscriptionid=${trialSubscription1.subscriptionid}`)
    req.account = administrator.account
    req.session = administrator.session
    cachedResponses.returnsFreeTrial = await req.get()
    req = TestHelper.createRequest(`/administrator/subscriptions/delete-subscription?subscriptionid=${paidSubscription1.subscriptionid}`)
    req.account = administrator.account
    req.session = administrator.session
    cachedResponses.returnsPaidPrice = await req.get()
    // test submit 'delayed'
    req = TestHelper.createRequest(`/administrator/subscriptions/delete-subscription?subscriptionid=${freeSubscription1.subscriptionid}`)
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      cancelation: 'delayed'
    }
    cachedResponses.submitFreeAtPeriodEnd = await req.post()
    req = TestHelper.createRequest(`/administrator/subscriptions/delete-subscription?subscriptionid=${trialSubscription1.subscriptionid}`)
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      cancelation: 'delayed'
    }
    cachedResponses.submitFreeTrialAtPeriodEnd = await req.post()
    req = TestHelper.createRequest(`/administrator/subscriptions/delete-subscription?subscriptionid=${paidSubscription1.subscriptionid}`)
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      cancelation: 'delayed'
    }
    cachedResponses.submitPaidAtPeriodEnd = await req.post()
    // already-deleted error
    req.query = {
      subscriptionid: paidSubscription1.subscriptionid
    }
    await req.route.api.before(req)
    cachedResponses.invalidSubscription = req.error
    // test submit 'immediate'
    req.body = {
      cancelation: 'immediate'
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
      cancelation: 'immediate',
      'csrf-token': ''
    }
    req.puppeteer = false
    cachedResponses.csrf = await req.post()
    delete (req.puppeteer)
    // refund
    req = TestHelper.createRequest(`/administrator/subscriptions/delete-subscription?subscriptionid=${paidSubscription4.subscriptionid}`)
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      cancelation: 'immediate'
    }
    req.filename = __filename
    req.screenshots = [
      { hover: '#administrator-menu-container' },
      { click: '/administrator/subscriptions' },
      { click: '/administrator/subscriptions/subscriptions' },
      { click: `/administrator/subscriptions/subscription?subscriptionid=${paidSubscription4.subscriptionid}` },
      { click: `/administrator/subscriptions/delete-subscription?subscriptionid=${paidSubscription4.subscriptionid}` },
      { fill: '#submit-form' }
    ]
    global.pageSize = 50
    global.packageJSON.dashboard.server.push(ScreenshotData.administratorIndex)
    global.packageJSON.dashboard.server.push(ScreenshotData.administratorSubscriptions)
    cachedResponses.submitPaidRefund = await req.post()
    cachedResponses.finished = true
  }

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
      const result = cachedResponses.returnsFreePrice
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })
  })

  describe('submit', () => {
    it('should cancel free subscription immediately (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submitFreeImmedate
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success-immediate')
    })

    it('should cancel free subscription at period end', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submitFreeAtPeriodEnd
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success-delayed')
    })

    it('should cancel free trial immediately', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submitFreeTrialImmediate
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success-immediate')
    })

    it('should cancel free trial at period end', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submitFreeTrialAtPeriodEnd
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success-delayed')
    })

    it('should cancel paid subscription immediately', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submitPaidImmediate
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success-immediate')
    })

    it('should cancel paid subscription at period end', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submitPaidAtPeriodEnd
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success-delayed')
    })
  })

  describe('errors', () => {
    it('invalid-subscriptionid', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.invalidQuerystring
      assert.strictEqual(errorMessage, 'invalid-subscriptionid')
    })

    it('invalid-subscription', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.invalidSubscription
      assert.strictEqual(errorMessage, 'invalid-subscription')
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
