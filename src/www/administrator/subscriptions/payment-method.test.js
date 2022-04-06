/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/administrator/subscriptions/payment-method', function () {
  const cachedResponses = {}
  before(async () => {
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestHelper.createOwner()
    const user = await TestStripeAccounts.createUserWithPaymentMethod()
    // before
    const req = TestHelper.createRequest(`/administrator/subscriptions/payment-method?paymentmethodid=${user.paymentMethod.paymentmethodid}`)
    req.account = administrator.account
    req.session = administrator.session
    await req.route.api.before(req)
    cachedResponses.before = req.data
    // get
    req.filename = __filename
    req.screenshots = [
      { hover: '#administrator-menu-container' },
      { click: '/administrator/subscriptions' },
      { click: '/administrator/subscriptions/payment-methods' },
      { click: `/administrator/subscriptions/payment-method?paymentmethodid=${user.paymentMethod.paymentmethodid}` }
    ]
    cachedResponses.get = await req.get()
  })
  describe('before', () => {
    it('should reject invalid paymentmethodid', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/payment-method?paymentmethodid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-paymentmethodid')
    })

    it('should bind data to req', async () => {
      const data = cachedResponses.before
      assert.strictEqual(data.paymentMethod.object, 'payment_method')
    })
  })

  describe('view', () => {
    it('should have row for payment method (screenshots)', async () => {
      const result = cachedResponses.get
      const doc = TestHelper.extractDoc(result.html)
      const table = doc.getElementById('payment_methods-table')
      assert.strictEqual(table.tag, 'table')
    })
  })
})
