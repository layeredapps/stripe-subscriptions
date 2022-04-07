/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/administrator/subscriptions/customer', function () {
  let cachedResponses
  async function bundledData () {
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    await TestHelper.setupBefore()
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestHelper.createOwner()
    const user = await TestStripeAccounts.createUserWithPaymentMethod()
    const req = TestHelper.createRequest('/api/administrator/subscriptions/customer')
    req.account = administrator.account
    req.session = administrator.session
    try {
      await req.get()
    } catch (error) {
      cachedResponses.missing = error.message
    }
    const req2 = TestHelper.createRequest('/api/administrator/subscriptions/customer')
    req2.account = administrator.account
    req2.session = administrator.session
    try {
      await req2.get()
    } catch (error) {
      cachedResponses.invalid = error.message
    }
    const req3 = TestHelper.createRequest(`/api/administrator/subscriptions/customer?customerid=${user.customer.customerid}`)
    req3.account = administrator.account
    req3.session = administrator.session
    req3.filename = __filename
    req3.saveResponse = true
    cachedResponses.returns = await req3.get()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    describe('invalid-customerid', () => {
      it('missing querystring customerid', async () => {
        await bundledData()
        const errorMessage = cachedResponses.missing
        assert.strictEqual(errorMessage, 'invalid-customerid')
      })

      it('invalid querystring customerid', async () => {
        await bundledData()
        const errorMessage = cachedResponses.invalid
        assert.strictEqual(errorMessage, 'invalid-customerid')
      })
    })
  })

  describe('returns', () => {
    it('object', async () => {
      const customer = cachedResponses.returns
      assert.strictEqual(customer.object, 'customer')
    })
  })
})
