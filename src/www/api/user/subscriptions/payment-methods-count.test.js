/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')

describe('/api/user/subscriptions/payment-methods-count', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  describe('returns', () => {
    it('integer', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail,
        country: 'US'
      })
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createPaymentMethod(user, {
          cvc: '111',
          number: '4111111111111111',
          exp_month: '1',
          exp_year: (new Date().getFullYear() + 1).toString().substring(2),
          name: user.profile.fullName,
          line1: '285 Fulton St',
          line2: 'Apt 893',
          city: 'New York',
          state: 'NY',
          postal_code: '10007',
          country: 'US',
          default: 'true'
        })
      }
      const req = TestHelper.createRequest(`/api/user/subscriptions/payment-methods-count?accountid=${user.account.accountid}`)
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.saveResponse = true
      const result = await req.get()
      assert.strictEqual(result, global.pageSize + 1)
    })
  })
})
