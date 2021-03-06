/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/account/subscriptions/billing-profiles', function () {
  let cachedResponses, cachedCustomers
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    cachedCustomers = []
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const user = await TestHelper.createUser()
    for (let i = 0, len = global.pageSize + 2; i < len; i++) {
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail,
        country: 'US'
      })
      cachedCustomers.unshift(user.customer.customerid)
    }
    const req1 = TestHelper.createRequest('/account/subscriptions/billing-profiles')
    req1.account = user.account
    req1.session = user.session
    global.pageSize = 3
    cachedResponses.pageSize = await req1.get()
    global.pageSize = 2
    req1.filename = __filename
    req1.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/subscriptions' },
      { click: '/account/subscriptions/billing-profiles' }
    ]
    global.pageSize = 50
    await req1.route.api.before(req1)
    cachedResponses.before = req1.data
    cachedResponses.returns = await req1.get()
    const req2 = TestHelper.createRequest('/account/subscriptions/billing-profiles?offset=1')
    req2.account = user.account
    req2.session = user.session
    cachedResponses.offset = await req2.get()
    cachedResponses.finished = true
  }
  describe('before', () => {
    it('should bind data to req', async function () {
      await bundledData(this.test.currentRetry())
      const data = cachedResponses.before
      assert.strictEqual(data.customers.length, 4)
      assert.strictEqual(data.customers[0].customerid, cachedCustomers[0])
      assert.strictEqual(data.customers[1].customerid, cachedCustomers[1])
    })
  })

  describe('view', () => {
    it('should return one page (screenshots)', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.returns
      const doc = TestHelper.extractDoc(result.html)
      const table = doc.getElementById('customers-table')
      const rows = table.getElementsByTagName('tr')
      assert.strictEqual(rows.length, 5)
      // 4 created in loop
      // 1 table header
    })

    it('should change page size', async function () {
      await bundledData(this.test.currentRetry())
      const result = cachedResponses.pageSize
      const doc = TestHelper.extractDoc(result.html)
      const table = doc.getElementById('customers-table')
      const rows = table.getElementsByTagName('tr')
      assert.strictEqual(rows.length, global.pageSize + 2)
    })

    it('should change offset', async function () {
      await bundledData(this.test.currentRetry())
      const offset = 1
      const result = cachedResponses.offset
      const doc = TestHelper.extractDoc(result.html)
      for (let i = 0, len = global.pageSize; i < len; i++) {
        assert.strictEqual(doc.getElementById(cachedCustomers[offset + i]).tag, 'tr')
      }
    })
  })
})
