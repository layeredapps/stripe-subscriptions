/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/user/subscriptions/tax-ids', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  let cachedResponses, cachedTaxIds
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    cachedTaxIds = []
    await TestHelper.setupBefore()
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const user = await TestHelper.createUser()
    await TestHelper.createCustomer(user, {
      email: user.profile.contactEmail
    })
    const values = ['DE123456789', 'DE123456788', 'DE123456787', 'DE123456786', 'DE123456785']
    for (let i = 0, len = global.pageSize + 2; i < len; i++) {
      await TestHelper.createTaxId(user, user.customer, {
        type: 'eu_vat',
        value: values[i]
      })
      cachedTaxIds.unshift(user.taxid.taxid)
    }
    const req1 = TestHelper.createRequest(`/api/user/subscriptions/tax-ids?customerid=${user.customer.customerid}&offset=1`)
    req1.account = user.account
    req1.session = user.session
    cachedResponses.offset = await req1.get()
    const req2 = TestHelper.createRequest(`/api/user/subscriptions/tax-ids?customerid=${user.customer.customerid}&limit=1`)
    req2.account = user.account
    req2.session = user.session
    cachedResponses.limit = await req2.get()
    const req3 = TestHelper.createRequest(`/api/user/subscriptions/tax-ids?customerid=${user.customer.customerid}&all=true`)
    req3.account = user.account
    req3.session = user.session
    cachedResponses.all = await req3.get()
    const req4 = TestHelper.createRequest(`/api/user/subscriptions/tax-ids?customerid=${user.customer.customerid}`)
    req4.account = user.account
    req4.session = user.session
    req4.filename = __filename
    req4.saveResponse = true
    cachedResponses.returns = await req4.get()
    global.pageSize = 3
    cachedResponses.pageSize = await req4.get()
    global.pageSize = 2
    cachedResponses.finished = true
  }
  describe('exceptions', () => {
    describe('invalid-customerid', () => {
      it('missing querystring customerid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/subscriptions/tax-ids')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-customerid')
      })

      it('invalid querystring customerid', async () => {
        const user = await TestHelper.createUser()
        const req = TestHelper.createRequest('/api/user/subscriptions/tax-ids?customerid=invalid')
        req.account = user.account
        req.session = user.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-customerid')
      })
    })

    describe('invalid-account', () => {
      it('ineligible accessing account', async function () {
        await bundledData(this.test.currentRetry())
        const user = await TestHelper.createUser()
        await TestHelper.createCustomer(user, {
          email: user.profile.contactEmail
        })
        await TestHelper.createTaxId(user, user.customer)
        const user2 = await TestHelper.createUser()
        const req = TestHelper.createRequest(`/api/user/subscriptions/tax-ids?customerid=${user.customer.customerid}`)
        req.account = user2.account
        req.session = user2.session
        let errorMessage
        try {
          await req.get()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-account')
      })
    })
  })

  describe('receives', () => {
    it('optional querystring offset (integer)', async function () {
      await bundledData(this.test.currentRetry())
      const offset = 1
      const taxidsNow = cachedResponses.offset
      for (let i = 0, len = global.pageSize; i < len; i++) {
        assert.strictEqual(taxidsNow[i].taxid, cachedTaxIds[offset + i])
      }
    })

    it('optional querystring limit (integer)', async function () {
      await bundledData(this.test.currentRetry())
      const limit = 1
      const taxidsNow = cachedResponses.limit
      assert.strictEqual(taxidsNow.length, limit)
    })

    it('optional querystring all (boolean)', async () => {
      const taxidsNow = cachedResponses.all
      assert.strictEqual(taxidsNow.length, cachedTaxIds.length)
    })
  })

  describe('returns', () => {
    it('array', async () => {
      const taxids = cachedResponses.returns
      assert.strictEqual(taxids.length, global.pageSize)
    })
  })

  describe('configuration', () => {
    it('environment PAGE_SIZE', async () => {
      const taxids = cachedResponses.pageSize
      assert.strictEqual(taxids.length, global.pageSize + 1)
    })
  })
})
