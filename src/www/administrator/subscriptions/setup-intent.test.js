/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/administrator/subscriptions/setup-intent', function () {
  const cachedResponses = {}
  beforeEach(async () => {
    if (Object.keys(cachedResponses).length) {
      return
    }
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestHelper.createOwner()
    const user = await TestStripeAccounts.createUserWithPaymentMethod()
    // before
    const req = TestHelper.createRequest(`/administrator/subscriptions/setup-intent?setupintentid=${user.setupIntent.stripeObject.id}`)
    req.account = administrator.account
    req.session = administrator.session
    await req.route.api.before(req)
    cachedResponses.before = req.data
    // returns
    req.filename = __filename
    req.screenshots = [
      { hover: '#administrator-menu-container' },
      { click: '/administrator/subscriptions' },
      { click: '/administrator/subscriptions/setup-intents' },
      { click: `/administrator/subscriptions/setup-intent?setupintentid=${user.setupIntent.stripeObject.id}` }
    ]
    cachedResponses.returns = await req.get()
  })
  describe('before', () => {
    it('should reject invalid setupintentid', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/setup-intent?setupintentid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-setupintentid')
    })

    it('should bind data to req', async () => {
      const data = cachedResponses.before
      assert.strictEqual(data.setupIntent.object, 'setup_intent')
    })
  })

  describe('view', () => {
    it('should have row for setup intent (screenshots)', async () => {
      const result = cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      const table = doc.getElementById('setup_intents-table')
      assert.strictEqual(table.tag, 'table')
    })
  })
})
