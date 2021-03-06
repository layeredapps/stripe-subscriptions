/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/account/subscriptions/subscription', function () {
  let cachedResponses
  let cachedSubscription
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestStripeAccounts.createOwnerWithPrice()
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.price)
    cachedSubscription = user.subscription
    const req = TestHelper.createRequest(`/account/subscriptions/subscription?subscriptionid=${user.subscription.subscriptionid}`)
    req.account = user.account
    req.session = user.session
    req.filename = __filename
    req.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/subscriptions' },
      { click: '/account/subscriptions/subscriptions' },
      { click: `/account/subscriptions/subscription?subscriptionid=${user.subscription.subscriptionid}` }
    ]
    await req.route.api.before(req)
    cachedResponses.before = req.data
    global.pageSize = 50
    cachedResponses.returns = await req.get()
    const user2 = await TestHelper.createUser()
    req.account = user2.account
    req.session = user2.session
    await req.route.api.before(req)
    cachedResponses.invalidAccount = req.error
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
    it('should present the subscription table (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      const tbody = doc.getElementById(cachedSubscription.subscriptionid)
      assert.strictEqual(tbody.tag, 'tbody')
    })
  })

  describe('errors', () => {
    it('invalid-subscriptionid', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail,
        country: 'US'
      })
      const req = TestHelper.createRequest('/account/subscriptions/subscription?subscriptionid=invalid')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-subscriptionid')
    })

    it('invalid-account', async function () {
      await bundledData(this.test.currentRetry())
      const errorMessage = cachedResponses.invalidAccount
      assert.strictEqual(errorMessage, 'invalid-account')
    })
  })
})
