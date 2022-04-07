/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/administrator/subscriptions/payment-intent', function () {
  const cachedResponses = {}
  beforeEach(async () => {
    if (Object.keys(cachedResponses).length) {
      return
    }
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestHelper.createOwner()
    const user = await TestStripeAccounts.createUserWithPaymentMethod()
    const paymentIntent = await TestHelper.createPaymentIntent(user, {
      paymentmethodid: user.paymentMethod.paymentmethodid,
      amount: '10000',
      currency: 'usd'
    })
    // before
    const req = TestHelper.createRequest(`/administrator/subscriptions/payment-intent?paymentintentid=${paymentIntent.paymentintentid}`)
    req.account = administrator.account
    req.session = administrator.session
    await req.route.api.before(req)
    cachedResponses.before = req.data
    // get
    req.filename = __filename
    req.screenshots = [
      { hover: '#administrator-menu-container' },
      { click: '/administrator/subscriptions' },
      { click: '/administrator/subscriptions/payment-intents' },
      { click: `/administrator/subscriptions/payment-intent?paymentintentid=${paymentIntent.paymentintentid}` }
    ]
    cachedResponses.get = await req.get()
  })
  describe('before', () => {
    it('should reject invalid paymentintentid', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/payment-intent?paymentintentid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-paymentintentid')
    })

    it('should bind data to req', async () => {
      const data = cachedResponses.before
      assert.strictEqual(data.paymentIntent.object, 'payment_intent')
    })
  })

  describe('view', () => {
    it('should have row for payment intent (screenshots)', async () => {
      const result = cachedResponses.get
      const doc = TestHelper.extractDoc(result.html)
      const table = doc.getElementById('payment_intents-table')
      assert.strictEqual(table.tag, 'table')
    })
  })
})
