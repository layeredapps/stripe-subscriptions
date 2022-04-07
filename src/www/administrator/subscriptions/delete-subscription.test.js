/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/administrator/subscriptions/delete-subscription', function () {
  let cachedResponses
  let cachedSubscription
  async function bundledData () {
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
    await TestStripeAccounts.createUserWithPaidSubscription(paidPlan, user)
    const paidSubscription4 = user.subscription
    await TestStripeAccounts.createUserWithFreeSubscription(freePlan, user)
    const freeSubscription1 = cachedSubscription = user.subscription
    await TestStripeAccounts.createUserWithFreeSubscription(freePlan, user)
    const freeSubscription2 = user.subscription
    await TestStripeAccounts.createUserWithFreeTrialSubscription(freeTrialPlan, user)
    const trialSubscription1 = user.subscription
    await TestStripeAccounts.createUserWithFreeTrialSubscription(freeTrialPlan, user)
    const trialSubscription2 = user.subscription
    // test before with a missing subscriptionid
    const req = TestHelper.createRequest('/administrator/subscriptions/delete-subscription')
    req.account = administrator.account
    req.session = administrator.session
    try {
      await req.route.api.before(req)
    } catch (error) {
      cachedResponses.missingQueryString = error.message
    }
    req.url = '/administrator/subscriptions/delete-subscription?subscriptionid=invalid'
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
    delete (req.query)
    // test get
    req.url = `/administrator/subscriptions/delete-subscription?subscriptionid=${freeSubscription1.subscriptionid}`
    cachedResponses.returnsFreePlan = await req.get()
    req.url = `/administrator/subscriptions/delete-subscription?subscriptionid=${trialSubscription1.subscriptionid}`
    cachedResponses.returnsFreeTrial = await req.get()
    req.url = `/administrator/subscriptions/delete-subscription?subscriptionid=${paidSubscription1.subscriptionid}`
    cachedResponses.returnsPaidPlan = await req.get()
    // test submit 'at period end'
    req.url = `/administrator/subscriptions/delete-subscription?subscriptionid=${freeSubscription1.subscriptionid}`
    req.body = {
      refund: 'at_period_end'
    }
    cachedResponses.submitFreeAtPeriodEnd = await req.post()
    req.url = `/administrator/subscriptions/delete-subscription?subscriptionid=${trialSubscription1.subscriptionid}`
    cachedResponses.submitFreeTrialAtPeriodEnd = await req.post()
    req.url = `/administrator/subscriptions/delete-subscription?subscriptionid=${paidSubscription1.subscriptionid}`
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
    req.url = `/administrator/subscriptions/delete-subscription?subscriptionid=${trialSubscription2.subscriptionid}`
    cachedResponses.submitFreeTrialImmediate = await req.post()
    req.url = `/administrator/subscriptions/delete-subscription?subscriptionid=${paidSubscription2.subscriptionid}`
    cachedResponses.submitPaidImmediate = await req.post()
    req.url = `/administrator/subscriptions/delete-subscription?subscriptionid=${freeSubscription2.subscriptionid}`
    cachedResponses.submitFreeImmedate = await req.post()
    // credit
    req.body = {
      refund: 'credit'
    }
    req.url = `/administrator/subscriptions/delete-subscription?subscriptionid=${paidSubscription3.subscriptionid}`
    cachedResponses.submitPaidCredit = await req.post()
    // refund
    req.body = {
      refund: 'refund'
    }
    req.url = `/administrator/subscriptions/delete-subscription?subscriptionid=${paidSubscription4.subscriptionid}`
    req.filename = __filename
    req.screenshots = [
      { hover: '#administrator-menu-container' },
      { click: '/administrator/subscriptions' },
      { click: '/administrator/subscriptions/subscriptions' },
      { click: `/administrator/subscriptions/subscription?subscriptionid=${paidSubscription4.subscriptionid}` },
      { click: `/administrator/subscriptions/delete-subscription?subscriptionid=${paidSubscription4.subscriptionid}` },
      { fill: '#submit-form' }
    ]
    global.pageSize = 10
    cachedResponses.submitPaidRefund = await req.post()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    it('should reject missing subscription', async () => {
      const errorMessage = cachedResponses.missingQueryString
      assert.strictEqual(errorMessage, 'invalid-subscriptionid')
    })
    it('should reject invalid subscription', async () => {
      const errorMessage = cachedResponses.invalidQuerystring
      assert.strictEqual(errorMessage, 'invalid-subscriptionid')
    })
    it('should reject canceled subscription', async () => {
      const errorMessage = cachedResponses.invalidSubscription
      assert.strictEqual(errorMessage, 'invalid-subscription')
    })
  })

  describe('before', () => {
    it('should bind data to req', async () => {
      await bundledData()
      const data = cachedResponses.before
      assert.strictEqual(data.subscription.subscriptionid, cachedSubscription.subscriptionid)
    })
  })

  describe('view', () => {
    it('should present the form', async () => {
      await bundledData()
      const result = cachedResponses.returnsFreePlan
      const doc = TestHelper.extractDoc(result.html)
      assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
    })

    it('should show fields for free plan cancelations', async () => {
      await bundledData()
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

    it('should show fields for free trial cancelations', async () => {
      await bundledData()
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

    it('should show fields for cancelation with credit or refund', async () => {
      await bundledData()
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
    it('should cancel free subscription immediately (screenshots)', async () => {
      await bundledData()
      const result = cachedResponses.submitFreeImmedate
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should cancel free subscription at period end', async () => {
      await bundledData()
      const result = cachedResponses.submitFreeAtPeriodEnd
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should cancel free trial immediately', async () => {
      await bundledData()
      const result = cachedResponses.submitFreeTrialImmediate
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should cancel free trial at period end', async () => {
      await bundledData()
      const result = cachedResponses.submitFreeTrialAtPeriodEnd
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should cancel paid subscription and credit account', async () => {
      await bundledData()
      const result = cachedResponses.submitPaidCredit
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success-credit')
    })

    it('should cancel paid subscription and show refund', async () => {
      await bundledData()
      const result = cachedResponses.submitPaidRefund
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success-refund')
    })
  })
})
