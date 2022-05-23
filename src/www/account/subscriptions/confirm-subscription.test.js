/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/account/subscriptions/confirm-subscription', function () {
  let cachedResponses
  let publishedPlan
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
      usage_type: 'licensed',
      publishedAt: 'true'
    })
    publishedPlan = administrator.plan
    const notPublishedPlan = await TestHelper.createPlan(administrator, {
      productid: administrator.product.productid
    })
    const unpublishedPlan = await TestHelper.createPlan(administrator, {
      productid: administrator.product.productid,
      publishedAt: 'true',
      unpublishedAt: 'true'
    })
    const user = await TestStripeAccounts.createUserWithPaymentMethod()
    const validCustomer = user.customer
    const req = TestHelper.createRequest('/account/subscriptions/confirm-subscription?planid=invalid')
    req.account = user.account
    req.session = user.session
    await req.route.api.before(req)
    cachedResponses.invalidPlan = req.error
    const req2 = TestHelper.createRequest(`/account/subscriptions/confirm-subscription?planid=${unpublishedPlan.planid}`)
    req2.account = user.account
    req2.session = user.session
    await req2.route.api.before(req2)
    cachedResponses.unpublishedAtPlan = req2.error
    const req3 = TestHelper.createRequest(`/account/subscriptions/confirm-subscription?planid=${notPublishedPlan.planid}`)
    req3.account = user.account
    req3.session = user.session
    await req3.route.api.before(req3)
    cachedResponses.notPublishedPlan = req3.error
    const req4 = TestHelper.createRequest(`/account/subscriptions/confirm-subscription?planid=${publishedPlan.planid}`)
    req4.account = user.account
    req4.session = user.session
    await req4.route.api.before(req4)
    cachedResponses.before = req4.data
    cachedResponses.returns = await req4.get()
    const invalidCustomer = await TestHelper.createCustomer(user, {
      email: user.profile.contactEmail,
      description: 'Chase Visa Debit'
    })
    const req5 = TestHelper.createRequest(`/account/subscriptions/confirm-subscription?planid=${publishedPlan.planid}`)
    req5.account = user.account
    req5.session = user.session
    req5.body = {
      [invalidCustomer.customerid]: true
    }
    cachedResponses.invalidPaymentMethod = await req5.post()
    const req6 = TestHelper.createRequest(`/account/subscriptions/confirm-subscription?planid=${publishedPlan.planid}`)
    req6.account = user.account
    req6.session = user.session
    req6.filename = __filename
    req6.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/subscriptions' },
      { click: '/account/subscriptions/plans' },
      { click: `/account/subscriptions/plan?planid=${publishedPlan.planid}` },
      { click: `/account/subscriptions/confirm-subscription?planid=${publishedPlan.planid}` },
      {
        click: '#submit-button',
        waitAfter: async (page) => {
          while (true) {
            try {
              const location = await page.url()
              if (location.endsWith(`/account/subscriptions/confirm-subscription?planid=${publishedPlan.planid}`)) {
                return
              }
            } catch (error) {
            }
            await TestHelper.wait(100)
          }
        }
      },
      {
        fill: '#submit-form',
        body: {
          planid: publishedPlan.planid,
          [validCustomer.customerid]: true
        }
      }
    ]
    // csrf
    req6.puppeteer = false
    req6.body = {}
    cachedResponses.csrf = await req6.post()
    delete (req6.puppeteer)
    delete (req6.body)
    // submit
    global.pageSize = 50
    cachedResponses.submit = await req6.post()
    cachedResponses.finished = true
  }

  describe('before', () => {
    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const data = cachedResponses.before
      assert.strictEqual(data.plan.planid, publishedPlan.planid)
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
    it('should start subscription (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.submit
      assert.strictEqual(result.redirect, '/home')
    })
  })

  describe('configuration', () => {
    it('environment SKIP_CONFIRM_SUBSCRIPTION', async () => {
      global.skipConfirmSubscription = true
      const administrator = await TestStripeAccounts.createOwnerWithPlan({
        amount: '1000',
        trial_period_days: '0',
        interval: 'month',
        usage_type: 'licensed',
        publishedAt: 'true'
      })
      const user = await TestStripeAccounts.createUserWithPaymentMethod()
      const req = TestHelper.createRequest(`/account/subscriptions/confirm-subscription?planid=${administrator.plan.planid}`)
      req.account = user.account
      req.session = user.session
      const result = await req.get()
      assert.strictEqual(result.redirect, '/home')
    })
  })

  describe('errors', () => {
    it('invalid-paymentmethodid', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.invalidPaymentMethod
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'invalid-paymentmethodid')
    })

    it('invalid-planid', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.invalidPlan
      assert.strictEqual(errorMessage, 'invalid-planid')
    })

    it('invalid-plan', async function () {
      await bundledData(this.test.currentRetry())
      let errorMessage = cachedResponses.unpublishedAtPlan
      assert.strictEqual(errorMessage, 'invalid-plan')
      errorMessage = cachedResponses.notPublishedPlan
      assert.strictEqual(errorMessage, 'invalid-plan')
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
