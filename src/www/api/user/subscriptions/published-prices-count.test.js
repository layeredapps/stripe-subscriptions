/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/subscriptions/published-prices-count', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('returns', () => {
    it('integer', async () => {
      const administrator = await TestHelper.createOwner()
      const product = await TestHelper.createProduct(administrator, {
        publishedAt: 'true'
      })
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createPrice(administrator, {
          productid: product.productid,
          publishedAt: 'true',
          recurring_usage_type: 'licensed',
          recurring_unit_amount: '2000'
        })
      }
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail
      })
      const req = TestHelper.createRequest('/api/user/subscriptions/published-prices-count')
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.saveResponse = true
      const result = await req.get()
      assert.strictEqual(result, global.pageSize + 1)
    })
  })
})