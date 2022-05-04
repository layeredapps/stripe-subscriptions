/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')

describe('/account/subscriptions/billing-profile', function () {
  describe('before', () => {
    it('should bind data to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail
      })
      const req = TestHelper.createRequest(`/account/subscriptions/billing-profile?customerid=${user.customer.customerid}`)
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.customer.customerid, user.customer.customerid)
    })
  })

  describe('view', () => {
    it('should have row for customer (screenshots)', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail
      })
      const req = TestHelper.createRequest(`/account/subscriptions/billing-profile?customerid=${user.customer.customerid}`)
      req.account = user.account
      req.session = user.session
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/subscriptions' },
        { click: '/account/subscriptions/billing-profiles' },
        { click: `/account/subscriptions/billing-profile?customerid=${user.customer.customerid}` }
      ]
      global.pageSize = 50
      const result = await req.get()
      const doc = TestHelper.extractDoc(result.html)
      const tbody = doc.getElementById(user.customer.customerid)
      assert.strictEqual(tbody.tag, 'tbody')
    })
  })

  describe('errors', () => {
    it('invalid-customerid', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail
      })
      const req = TestHelper.createRequest('/account/subscriptions/billing-profile?customerid=invalid')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-customerid')
    })

    it('invalid-account', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createCustomer(user, {
        email: user.profile.contactEmail
      })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/account/subscriptions/billing-profile?customerid=${user.customer.customerid}`)
      req.account = user2.account
      req.session = user2.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-account')
    })
  })
})
