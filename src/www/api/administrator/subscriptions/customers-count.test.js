/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/administrator/subscriptions/customers-count', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('returns', () => {
    it('integer', async () => {
      const administrator = await TestHelper.createOwner()
      const user1 = await TestHelper.createUser()
      await TestHelper.createCustomer(user1, {
        email: user1.profile.contactEmail
      })
      const user2 = await TestHelper.createUser()
      await TestHelper.createCustomer(user2, {
        email: user2.profile.contactEmail
      })
      const req = TestHelper.createRequest('/api/administrator/subscriptions/customers-count')
      req.account = administrator.account
      req.session = administrator.session
      req.filename = __filename
      req.saveResponse = true
      const result = await req.get()
      assert.strictEqual(result, global.pageSize)
    })
  })
})
