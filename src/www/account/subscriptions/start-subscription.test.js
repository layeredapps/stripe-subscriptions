/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')

describe('/account/subscriptions/start-subscription', function () {
  let cachedResponses, cachedPlans
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
      await TestHelper.rotateWebhook(true)
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    cachedPlans = []
    const owner = await TestStripeAccounts.createOwnerWithPlan()
    cachedPlans.push(owner.plan.planid)
    const user = await TestStripeAccounts.createUserWithPaymentMethod()
    const req = TestHelper.createRequest('/account/subscriptions/start-subscription')
    req.account = user.account
    req.session = user.session
    req.filename = __filename
    req.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/subscriptions' },
      { click: '/account/subscriptions/start-subscription' }
    ]
    await req.route.api.before(req)
    cachedResponses.before = req.data
    // csrf
    req.body = {
      'csrf-token': ''
    }
    req.puppeteer = false
    cachedResponses.csrf = await req.post()
    delete (req.puppeteer)
    delete (req.body)
    // submit
    global.pageSize = 50
    cachedResponses.returns = await req.get()
    cachedResponses.finished = true
  }
  describe('before', () => {
    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const data = cachedResponses.before
      assert.strictEqual(data.plans.length, 1)
    })
  })

  describe('view', () => {
    it('should have option for each plan (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      const planOption = doc.getElementById(cachedPlans[0])
      assert.strictEqual(planOption.tag, 'option')
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
