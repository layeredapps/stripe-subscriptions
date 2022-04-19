/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/account/subscriptions/refund', function () {
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
      usage_type: 'licensed',
      publishedAt: 'true',
      amount: '100000',
      trial_period_days: '0'
    })
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
    const refund = await TestHelper.createRefund(administrator, user.charge.chargeid)
    const req1 = TestHelper.createRequest(`/account/subscriptions/refund?refundid=${refund.refundid}`)
    req1.account = user.account
    req1.session = user.session
    req1.filename = __filename
    req1.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/subscriptions' },
      { click: '/account/subscriptions/refunds' },
      { click: `/account/subscriptions/refund?refundid=${refund.refundid}` }
    ]
    await req1.route.api.before(req1)
    cachedResponses.before = req1.data
    global.pageSize = 50
    cachedResponses.returns = await req1.get()
    cachedResponses.finished = true
  }
  describe('before', () => {
    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const data = cachedResponses.before
      assert.strictEqual(data.refund.object, 'refund')
    })
  })

  describe('view', () => {
    it('should present the refund table (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      const table = doc.getElementById('refunds-table')
      const rows = table.getElementsByTagName('tr')
      assert.strictEqual(rows.length, global.pageSize + 1)
    })
  })
})
